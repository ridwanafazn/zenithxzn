import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

export type PrayerTimeBlock = 
  | 'sepertiga_malam' 
  | 'subuh' 
  | 'pagi_siang' 
  | 'sore' 
  | 'maghrib_isya' 
  | 'malam_tidur';

interface UserLocation {
  lat: number;
  lng: number;
}

export interface DailyPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

// Helper: Mengubah string jam dari API ("12:04") menjadi objek Date hari ini
function parseApiTimeToDate(timeStr: string, baseDate: Date): Date {
  const cleanTime = timeStr.split(' ')[0]; // Bersihkan timezone string jika ada
  const [hours, minutes] = cleanTime.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Mendapatkan Objek Waktu Sholat
 * PRIORITAS: Data API Kemenag -> FALLBACK: Kalkulasi Lokal (Library)
 */
export function getPrayerTimes(date: Date, location: UserLocation, apiTimings?: any): DailyPrayerTimes {
  // 1. Jika data API berhasil di-fetch
  if (apiTimings && apiTimings.Fajr) {
     return {
        fajr: parseApiTimeToDate(apiTimings.Fajr, date),
        sunrise: parseApiTimeToDate(apiTimings.Sunrise, date),
        dhuhr: parseApiTimeToDate(apiTimings.Dhuhr, date),
        asr: parseApiTimeToDate(apiTimings.Asr, date),
        maghrib: parseApiTimeToDate(apiTimings.Maghrib, date),
        isha: parseApiTimeToDate(apiTimings.Isha, date),
     };
  }

  // 2. Jika API gagal/loading, gunakan kalkulasi lokal sebagai fallback
  const coordinates = new Coordinates(location.lat, location.lng);
  const params = CalculationMethod.Singapore();
  params.madhab = Madhab.Shafi; 
  
  const pt = new PrayerTimes(coordinates, date, params);
  
  return {
      fajr: pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha
  };
}

/**
 * Cek apakah sudah masuk waktu Maghrib? (Pivot point Hijriyah)
 */
export function isAfterMaghrib(date: Date, location: UserLocation, apiTimings?: any): boolean {
  const prayers = getPrayerTimes(date, location, apiTimings);
  const now = new Date().getTime(); 
  return now >= prayers.maghrib.getTime();
}