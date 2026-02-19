import { MASTER_HABITS, HabitDef } from "./constants";
import { getPrayerTimes, isAfterMaghrib } from "./prayer-times";
import { getSmartHijriDate } from "./utils"; // Asumsi fungsi ini return { day, month, year }

interface EngineParams {
  date: Date;          // Tanggal Masehi (Gregorian)
  userPreferences: any; // Data User (Haid, Sunnah Preferences)
  location: { lat: number; lng: number };
  hijriOffset: number;
}

export function generateDailyHabits({ 
  date, 
  userPreferences, 
  location, 
  hijriOffset 
}: EngineParams): HabitDef[] {
  
  // 1. Tentukan Status Waktu
  const hasMaghribPassed = isAfterMaghrib(date, location);
  const dayOfWeek = date.getDay(); // 0-6
  
  // 2. Hitung Dua Versi Tanggal Hijriyah
  // Hijriyah Reguler (Untuk Amalan Siang: Puasa, Dhuha)
  const regularHijri = getSmartHijriDate(date, hijriOffset); 
  
  // Hijriyah "Next" (Untuk Amalan Malam: Tarawih, Witir) -> Karena malam ini milik tanggal besok
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  const nextHijri = getSmartHijriDate(nextDate, hijriOffset);

  // 3. Filtering Logic
  return MASTER_HABITS.filter((habit) => {
    
    // --- A. Logic Haid (Strict) ---
    if (userPreferences.isMenstruating && habit.isPhysical) {
      return false; 
    }

    // --- B. Logic Waktu (Time Context) ---
    // Apakah amalan ini amalan MALAM (setelah maghrib)?
    const isNightHabit = ['maghrib_isya', 'malam_tidur'].includes(habit.timeBlock);
    
    // Tentukan Hijriyah mana yang dipakai sebagai acuan
    // Jika habit malam & maghrib sudah lewat -> Pakai Next Hijri (Malam 1 Ramadhan)
    // Jika habit malam & belum maghrib -> Pakai Regular Hijri (Malam 30 Sya'ban)
    // Jika habit siang -> Selalu pakai Regular Hijri
    
    let effectiveHijriDate = regularHijri;

    if (isNightHabit && hasMaghribPassed) {
       effectiveHijriDate = nextHijri;
    }

    // --- C. Filter Hari (Weekly) ---
    // Khusus hari mingguan (Senin/Kamis), kita pakai Masehi standard saja agar tidak bingung
    if (habit.availableDays && !habit.availableDays.includes(dayOfWeek)) {
      return false;
    }

    // --- D. Filter Tanggal Hijriyah (Ayyamul Bidh / Spesifik) ---
    if (habit.hijriDates && !habit.hijriDates.includes(effectiveHijriDate.day)) {
      return false;
    }

    // --- E. Filter Bulan Hijriyah (Ramadhan Only) ---
    // Contoh: Tarawih (habit.hijriMonth = 9).
    // Jika skenario 18 Feb (Malam), effectiveHijriDate.month sudah 9 -> TRUE. Muncul!
    if (habit.hijriMonth && habit.hijriMonth !== effectiveHijriDate.month) {
      return false;
    }

    // --- F. Logic Sunnah (User Preference) ---
    if (habit.category === "sunnah") {
      // Cek apakah user mengaktifkan habit sunnah ini di settings
      if (!userPreferences.activeHabits?.[habit.id]) return false;
    }

    return true;
  });
}