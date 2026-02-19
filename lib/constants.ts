export type HabitCategory = "wajib" | "sunnah" | "custom";
export type HabitType = "checkbox" | "counter";
export type TimeBlock = "sepertiga_malam" | "subuh" | "pagi_siang" | "sore" | "maghrib_isya" | "malam_tidur" | "weekly" | "monthly" | "yearly";

// --- NEW: Kategori Lensa Insight ---
export type InsightScope = "global" | "wajib" | "rawatib" | "qiyam" | "duha" | "quran" | "puasa";

export interface HabitDefinition {
  id: string;
  title: string;
  category: HabitCategory;
  type: HabitType;
  timeBlock: TimeBlock;
  startHour?: number;
  target?: number;
  unit?: string;
  isRemovable: boolean;
  
  // Metadata Analisis Cerdas
  isPhysical: boolean; 
  isVerbal: boolean;   
  
  // Sistem Pembobotan Kualitas
  weight: number;      
  tags?: string[];      

  // Aturan Waktu Dinamis
  availableDays?: number[]; 
  hijriDates?: number[];    
  hijriMonth?: number;      
}

export const MASTER_HABITS: HabitDefinition[] = [
  // SEPERTIGA MALAM
  { id: "tahajjud", title: "Sholat Tahajjud", category: "sunnah", type: "checkbox", timeBlock: "sepertiga_malam", startHour: 2, isRemovable: true, isPhysical: true, isVerbal: false, weight: 5, tags: ['qiyam'] },
  { id: "istighfar_sahur", title: "Istighfar Sahur", category: "sunnah", type: "counter", target: 100, unit: "kali", timeBlock: "sepertiga_malam", startHour: 2, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['dzikir'] },
  { id: "sahur", title: "Makan Sahur", category: "sunnah", type: "checkbox", timeBlock: "sepertiga_malam", startHour: 3, isRemovable: true, isPhysical: true, isVerbal: false, weight: 1, tags: ['sunnah_puasa'] },

  // SUBUH
  { id: "qobliyah_subuh", title: "Qobliyah Subuh", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: true, isVerbal: false, weight: 3, tags: ['rawatib', 'muakkad'] },
  { id: "sholat_subuh", title: "Sholat Subuh", category: "wajib", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: false, isPhysical: true, isVerbal: false, weight: 10, tags: ['wajib'] },
  { id: "dzikir_pagi", title: "Dzikir Pagi", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['dzikir'] },
  { id: "sedekah_subuh", title: "Sedekah Subuh", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: false, isVerbal: false, weight: 2, tags: ['sedekah'] },
  { id: "baca_waqiah", title: "Membaca QS Al-Waqiah", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['quran'] },
  { id: "syuruq", title: "Sholat Syuruq", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 6, isRemovable: true, isPhysical: true, isVerbal: false, weight: 2, tags: ['duha'] },

  // PAGI-SIANG
  { id: "sholat_dhuha", title: "Sholat Dhuha", category: "sunnah", type: "counter", target: 4, unit: "rakaat", timeBlock: "pagi_siang", startHour: 7, isRemovable: true, isPhysical: true, isVerbal: false, weight: 2, tags: ['duha'] },
  { id: "qobliyah_zuhur", title: "Qobliyah Zuhur", category: "sunnah", type: "checkbox", timeBlock: "pagi_siang", startHour: 11, isRemovable: true, isPhysical: true, isVerbal: false, weight: 3, tags: ['rawatib', 'muakkad'] },
  { id: "sholat_zuhur", title: "Sholat Zuhur", category: "wajib", type: "checkbox", timeBlock: "pagi_siang", startHour: 11, isRemovable: false, isPhysical: true, isVerbal: false, weight: 10, tags: ['wajib'] },
  { id: "badiyah_zuhur", title: "Ba'diyah Zuhur", category: "sunnah", type: "checkbox", timeBlock: "pagi_siang", startHour: 12, isRemovable: true, isPhysical: true, isVerbal: false, weight: 3, tags: ['rawatib', 'muakkad'] },
  { id: "baca_arrahman", title: "Membaca QS Ar-Rahman", category: "sunnah", type: "checkbox", timeBlock: "pagi_siang", startHour: 7, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['quran'] },

  // SORE
  { id: "qobliyah_asar", title: "Qobliyah Asar", category: "sunnah", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: true, isPhysical: true, isVerbal: false, weight: 1, tags: ['rawatib'] },
  { id: "sholat_asar", title: "Sholat Asar", category: "wajib", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: false, isPhysical: true, isVerbal: false, weight: 10, tags: ['wajib'] },
  { id: "baca_assajdah", title: "Membaca QS As-Sajdah", category: "sunnah", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['quran'] },
  { id: "dzikir_petang", title: "Dzikir Petang", category: "sunnah", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['dzikir'] },

  // MAGHRIB-ISYA
  { id: "buka_puasa", title: "Menyegerakan Berbuka", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 17, isRemovable: true, isPhysical: true, isVerbal: false, weight: 2, tags: ['puasa'] },
  { id: "qobliyah_maghrib", title: "Qobliyah Maghrib", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 17, isRemovable: true, isPhysical: true, isVerbal: false, weight: 1, tags: ['rawatib'] },
  { id: "sholat_maghrib", title: "Sholat Maghrib", category: "wajib", type: "checkbox", timeBlock: "maghrib_isya", startHour: 17, isRemovable: false, isPhysical: true, isVerbal: false, weight: 10, tags: ['wajib'] },
  { id: "badiyah_maghrib", title: "Ba'diyah Maghrib", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 18, isRemovable: true, isPhysical: true, isVerbal: false, weight: 3, tags: ['rawatib', 'muakkad'] },
  { id: "baca_yasin", title: "Membaca QS Yasin", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 18, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['quran'] },

  // MALAM-TIDUR
  { id: "qobliyah_isya", title: "Qobliyah Isya", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false, weight: 1, tags: ['rawatib'] },
  { id: "sholat_isya", title: "Sholat Isya", category: "wajib", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: false, isPhysical: true, isVerbal: false, weight: 10, tags: ['wajib'] },
  { id: "badiyah_isya", title: "Ba'diyah Isya", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false, weight: 3, tags: ['rawatib', 'muakkad'] },
  
  // TARAWIH & WITIR
  { id: "sholat_tarawih", title: "Sholat Tarawih", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false, weight: 5, tags: ['qiyam'], hijriMonth: 9 },
  { id: "sholat_witir", title: "Sholat Witir", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false, weight: 5, tags: ['qiyam'] },
  
  { id: "baca_almulk", title: "Membaca QS Al-Mulk", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 20, isRemovable: true, isPhysical: false, isVerbal: true, weight: 1, tags: ['quran'] },
  { id: "wudhu_tidur", title: "Wudhu Sebelum Tidur", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 20, isRemovable: true, isPhysical: true, isVerbal: false, weight: 1, tags: ['thaharah'] },
  { id: "muhasabah", title: "Muhasabah / Maafkan Orang", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 20, isRemovable: true, isPhysical: false, isVerbal: false, weight: 2, tags: ['tazkiyah'] },

  { id: "tilawah_target", title: "Target Tilawah", category: "sunnah", type: "counter", unit: "halaman", timeBlock: "malam_tidur", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: true, weight: 3, tags: ['quran'] },
  { id: "shalawat_target", title: "Shalawat Nabi", category: "sunnah", type: "counter", target: 1000, unit: "kali", timeBlock: "malam_tidur", startHour: 0, isRemovable: true, isPhysical: false, isVerbal: true, weight: 2, tags: ['dzikir'] },

  // PERIODIC
  { id: "puasa_senin", title: "Puasa Senin", category: "sunnah", type: "checkbox", timeBlock: "weekly", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: false, weight: 5, tags: ['puasa'], availableDays: [1] },
  { id: "puasa_kamis", title: "Puasa Kamis", category: "sunnah", type: "checkbox", timeBlock: "weekly", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: false, weight: 5, tags: ['puasa'], availableDays: [4] },
  { id: "jumat_alkahfi", title: "Baca Al-Kahfi", category: "sunnah", type: "checkbox", timeBlock: "weekly", startHour: 0, isRemovable: true, isPhysical: false, isVerbal: true, weight: 3, tags: ['quran'], availableDays: [5] }, 
  { id: "puasa_ayyamul_bidh", title: "Puasa Ayyamul Bidh", category: "sunnah", type: "checkbox", timeBlock: "monthly", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: false, weight: 5, tags: ['puasa'], hijriDates: [13, 14, 15] },
];

export const HIJRI_MONTH_NAMES = [
  "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
];

// --- NEW: MAPPING KATEGORI UNTUK FILTER HISTORY ---
export const INSIGHT_GROUPS: Record<InsightScope, string[]> = {
    global: [], // Kosong = Semua
    wajib: ["sholat_subuh", "sholat_zuhur", "sholat_asar", "sholat_maghrib", "sholat_isya"],
    rawatib: ["qobliyah_subuh", "qobliyah_zuhur", "badiyah_zuhur", "qobliyah_asar", "qobliyah_maghrib", "badiyah_maghrib", "qobliyah_isya", "badiyah_isya"],
    qiyam: ["tahajjud", "sholat_witir", "sholat_tarawih"],
    duha: ["sholat_dhuha", "syuruq"],
    quran: ["baca_waqiah", "baca_arrahman", "baca_assajdah", "baca_yasin", "baca_almulk", "jumat_alkahfi", "tilawah_target"],
    puasa: ["sahur", "buka_puasa", "puasa_senin", "puasa_kamis", "puasa_ayyamul_bidh"]
};