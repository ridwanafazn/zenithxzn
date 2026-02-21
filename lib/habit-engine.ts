import { MASTER_HABITS, HabitDefinition } from "./constants";
import { getPrayerTimes, isAfterMaghrib } from "./prayer-times";
import { getSmartHijriDate } from "./utils";

interface EngineParams {
  date: Date;           
  userPreferences: any; 
  location: { lat: number; lng: number };
  hijriOffset: number;
  apiTimings?: any; // NEW: Menerima injeksi jadwal dari API
}

export interface DynamicHabit extends HabitDefinition {
  unlockTime?: Date; 
}

export function generateDailyHabits({ 
  date, 
  userPreferences, 
  location, 
  hijriOffset,
  apiTimings // Injeksi dari TrackerList
}: EngineParams): DynamicHabit[] { 
  
  // Kirim apiTimings ke fungsi waktu
  const hasMaghribPassed = isAfterMaghrib(date, location, apiTimings);
  const dayOfWeek = date.getDay(); 
  
  const prayers = getPrayerTimes(date, location, apiTimings);
  
  const regularHijri = getSmartHijriDate(date, hijriOffset); 
  
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  const nextHijri = getSmartHijriDate(nextDate, hijriOffset);

  const filteredHabits = MASTER_HABITS.filter((habit: HabitDefinition) => {
    if (userPreferences.isMenstruating && habit.isPhysical) return false; 

    const isNightHabit = ['maghrib_isya', 'malam_tidur'].includes(habit.timeBlock);
    
    let effectiveHijriDate = regularHijri;
    if (isNightHabit && hasMaghribPassed) {
       effectiveHijriDate = nextHijri;
    }

    if (habit.availableDays && !habit.availableDays.includes(dayOfWeek)) return false;
    if (habit.hijriDates && !habit.hijriDates.includes(effectiveHijriDate.day)) return false;
    if (habit.hijriMonth && habit.hijriMonth !== effectiveHijriDate.month) return false;

    if (habit.category === "sunnah") {
      if (!userPreferences.activeHabits?.[habit.id]) return false;
    }

    return true;
  });

  return filteredHabits.map((habit) => {
    let unlockTime: Date | undefined = undefined;
    const id = habit.id;

    if (id.includes('subuh') || id === 'dzikir_pagi') {
      unlockTime = prayers.fajr;
    } 
    else if (id === 'syuruq' || id === 'sholat_dhuha') {
      unlockTime = prayers.sunrise;
    } 
    else if (id.includes('zuhur')) {
      unlockTime = prayers.dhuhr;
    } 
    else if (id.includes('asar') || id === 'dzikir_petang') {
      unlockTime = prayers.asr;
    } 
    else if (id.includes('maghrib') || id === 'buka_puasa') {
      unlockTime = prayers.maghrib;
    } 
    else if (id.includes('isya') || id === 'sholat_tarawih' || id === 'sholat_witir') {
      unlockTime = prayers.isha;
    }

    return {
      ...habit,
      unlockTime 
    };
  });
}