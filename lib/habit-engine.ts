import { MASTER_HABITS, HabitDefinition } from "./constants"; // FIX: Gunakan HabitDefinition
import { getPrayerTimes, isAfterMaghrib } from "./prayer-times";
import { getSmartHijriDate } from "./utils";

interface EngineParams {
  date: Date;           // Tanggal Masehi (Gregorian)
  userPreferences: any; // Data User (Haid, Sunnah Preferences)
  location: { lat: number; lng: number };
  hijriOffset: number;
}

/**
 * THE ZENITH ENGINE V2 (Refined)
 * Logika cerdas untuk menentukan ibadah apa yang harus muncul hari ini.
 */
export function generateDailyHabits({ 
  date, 
  userPreferences, 
  location, 
  hijriOffset 
}: EngineParams): HabitDefinition[] { // FIX: Return type HabitDefinition[]
  
  // 1. Tentukan Status Waktu
  // Pastikan isAfterMaghrib di prayer-times.ts menerima parameter (date, location)
  const hasMaghribPassed = isAfterMaghrib(date, location);
  const dayOfWeek = date.getDay(); // 0 (Ahad) - 6 (Sabtu)
  
  // 2. Hitung Dua Versi Tanggal Hijriyah
  // Hijriyah Reguler (Untuk Amalan Siang: Puasa, Dhuha)
  const regularHijri = getSmartHijriDate(date, hijriOffset); 
  
  // Hijriyah "Next" (Untuk Amalan Malam: Tarawih, Witir)
  // Karena dalam Islam, malam ini adalah milik tanggal esok
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  const nextHijri = getSmartHijriDate(nextDate, hijriOffset);

  // 3. Filtering Logic
  return MASTER_HABITS.filter((habit: HabitDefinition) => { // Tambahkan type di sini agar aman
    
    // --- A. Logic Haid (Fikih Privacy) ---
    if (userPreferences.isMenstruating && habit.isPhysical) {
      return false; 
    }

    // --- B. Logic Waktu Dinamis (Transisi Maghrib) ---
    const isNightHabit = ['maghrib_isya', 'malam_tidur'].includes(habit.timeBlock);
    
    // Tentukan Hijriyah mana yang dipakai sebagai acuan:
    // Jika amalan malam & sudah lewat maghrib -> Pakai tanggal besok (Malam 1 Ramadhan)
    // Jika selain itu -> Pakai tanggal hari ini
    let effectiveHijriDate = regularHijri;
    if (isNightHabit && hasMaghribPassed) {
       effectiveHijriDate = nextHijri;
    }

    // --- C. Filter Hari Masehi (Weekly) ---
    if (habit.availableDays && !habit.availableDays.includes(dayOfWeek)) {
      return false;
    }

    // --- D. Filter Tanggal Hijriyah (Ayyamul Bidh / Spesifik) ---
    if (habit.hijriDates && !habit.hijriDates.includes(effectiveHijriDate.day)) {
      return false;
    }

    // --- E. Filter Bulan Hijriyah (Ramadhan / Spesifik) ---
    if (habit.hijriMonth && habit.hijriMonth !== effectiveHijriDate.month) {
      return false;
    }

    // --- F. Logic Sunnah (User Preference) ---
    if (habit.category === "sunnah") {
      if (!userPreferences.activeHabits?.[habit.id]) return false;
    }

    return true;
  });
}