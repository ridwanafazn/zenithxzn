import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

// Mapping TimeBlock Zenith ke Logic Waktu
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

/**
 * Mendapatkan Objek Waktu Sholat Adhan
 */
export function getPrayerTimes(date: Date, location: UserLocation) {
  const coordinates = new Coordinates(location.lat, location.lng);
  
  // Konfigurasi Standar Kemenag RI (Singapore method mirip dengan Indonesia)
  // Atau bisa kustomisasi degree sesuai kebutuhan
  const params = CalculationMethod.Singapore();
  params.madhab = Madhab.Shafi; // Mayoritas Indonesia
  
  return new PrayerTimes(coordinates, date, params);
}

/**
 * Cek apakah sudah masuk waktu Maghrib?
 * Ini adalah PIVOT POINT pergantian tanggal Hijriyah.
 */
export function isAfterMaghrib(date: Date, location: UserLocation): boolean {
  const prayers = getPrayerTimes(date, location);
  const now = new Date().getTime(); // Waktu Server/Client saat ini
  // Kita pakai waktu maghrib + buffer 2 menit biar aman
  return now >= prayers.maghrib.getTime();
}

/**
 * Menentukan Blok Waktu saat ini untuk UI Filtering
 */
export function getCurrentTimeBlock(date: Date, location: UserLocation): PrayerTimeBlock {
  const prayers = getPrayerTimes(date, location);
  const now = date.getTime();

  // 1. Sepertiga Malam (Anggap 00:00 - Subuh)
  // Idealnya hitung : Maghrib + ((Subuh - Maghrib) * 2/3), tapi ini simplifikasi
  if (now < prayers.fajr.getTime()) {
    return 'sepertiga_malam';
  }

  // 2. Waktu Subuh (Subuh - Terbit Matahari)
  if (now >= prayers.fajr.getTime() && now < prayers.sunrise.getTime()) {
    return 'subuh';
  }

  // 3. Pagi & Siang (Dhuha & Zuhur) -> Terbit - Ashar
  if (now >= prayers.sunrise.getTime() && now < prayers.asr.getTime()) {
    return 'pagi_siang';
  }

  // 4. Sore (Ashar - Maghrib)
  if (now >= prayers.asr.getTime() && now < prayers.maghrib.getTime()) {
    return 'sore';
  }

  // 5. Maghrib & Isya (Maghrib - Isya + 1 jam buffer?)
  // Kita set batas sampai jam 21:00 atau 22:00 malam
  // Tapi Zenith mendefinisikan 'malam_tidur' terpisah.
  
  // Kita anggap Maghrib_Isya sampai jam 21:00
  const limitMalam = new Date(date);
  limitMalam.setHours(21, 0, 0);

  if (now >= prayers.maghrib.getTime() && now < limitMalam.getTime()) {
    return 'maghrib_isya';
  }

  // 6. Sisanya Malam Tidur
  return 'malam_tidur';
}