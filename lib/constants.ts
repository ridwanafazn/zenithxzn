export type HabitCategory = "wajib" | "sunnah" | "custom";
export type HabitType = "checkbox" | "counter";
export type TimeBlock = "sepertiga_malam" | "subuh" | "pagi_siang" | "sore" | "maghrib_isya" | "malam_tidur" | "weekly" | "monthly" | "yearly";

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
  // Metadata baru untuk analisa cerdas
  isPhysical: boolean; // true untuk sholat/puasa (haram saat haid)
  isVerbal: boolean;   // true untuk dzikir/bacaan (tetap dianjurkan saat haid)
}

export const MASTER_HABITS: HabitDefinition[] = [
  // SEPERTIGA MALAM
  { id: "tahajjud", title: "Sholat Tahajjud", category: "sunnah", type: "checkbox", timeBlock: "sepertiga_malam", startHour: 2, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "istighfar_sahur", title: "Istighfar Sahur", category: "sunnah", type: "counter", target: 100, unit: "kali", timeBlock: "sepertiga_malam", startHour: 2, isRemovable: true, isPhysical: false, isVerbal: true },
  { id: "sahur", title: "Makan Sahur", category: "sunnah", type: "checkbox", timeBlock: "sepertiga_malam", startHour: 3, isRemovable: true, isPhysical: true, isVerbal: false },

  // SUBUH
  { id: "qobliyah_subuh", title: "Qobliyah Subuh (2 Rakaat)", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_subuh", title: "Sholat Subuh", category: "wajib", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: false, isPhysical: true, isVerbal: false },
  { id: "dzikir_pagi", title: "Dzikir Pagi", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: false, isVerbal: true },
  { id: "sedekah_subuh", title: "Sedekah Subuh", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: false, isVerbal: false },
  { id: "baca_waqiah", title: "Membaca QS Al-Waqiah", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 4, isRemovable: true, isPhysical: false, isVerbal: true },
  { id: "syuruq", title: "Sholat Syuruq", category: "sunnah", type: "checkbox", timeBlock: "subuh", startHour: 6, isRemovable: true, isPhysical: true, isVerbal: false },

  // PAGI-SIANG
  { id: "sholat_dhuha", title: "Sholat Dhuha", category: "sunnah", type: "counter", target: 4, unit: "rakaat", timeBlock: "pagi_siang", startHour: 7, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "qobliyah_zuhur", title: "Qobliyah Zuhur", category: "sunnah", type: "checkbox", timeBlock: "pagi_siang", startHour: 11, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_zuhur", title: "Sholat Zuhur", category: "wajib", type: "checkbox", timeBlock: "pagi_siang", startHour: 11, isRemovable: false, isPhysical: true, isVerbal: false },
  { id: "badiyah_zuhur", title: "Ba'diyah Zuhur", category: "sunnah", type: "checkbox", timeBlock: "pagi_siang", startHour: 12, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "baca_arrahman", title: "Membaca QS Ar-Rahman", category: "sunnah", type: "checkbox", timeBlock: "pagi_siang", startHour: 7, isRemovable: true, isPhysical: false, isVerbal: true },

  // SORE
  { id: "qobliyah_asar", title: "Qobliyah Asar", category: "sunnah", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_asar", title: "Sholat Asar", category: "wajib", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: false, isPhysical: true, isVerbal: false },
  { id: "baca_assajdah", title: "Membaca QS As-Sajdah", category: "sunnah", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: true, isPhysical: false, isVerbal: true },
  { id: "dzikir_petang", title: "Dzikir Petang", category: "sunnah", type: "checkbox", timeBlock: "sore", startHour: 15, isRemovable: true, isPhysical: false, isVerbal: true },

  // MAGHRIB-ISYA
  { id: "buka_puasa", title: "Menyegerakan Berbuka", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 17, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "qobliyah_maghrib", title: "Qobliyah Maghrib", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 17, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_maghrib", title: "Sholat Maghrib", category: "wajib", type: "checkbox", timeBlock: "maghrib_isya", startHour: 17, isRemovable: false, isPhysical: true, isVerbal: false },
  { id: "badiyah_maghrib", title: "Ba'diyah Maghrib", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 18, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "baca_yasin", title: "Membaca QS Yasin", category: "sunnah", type: "checkbox", timeBlock: "maghrib_isya", startHour: 18, isRemovable: true, isPhysical: false, isVerbal: true },

  // MALAM-TIDUR
  { id: "qobliyah_isya", title: "Qobliyah Isya", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_isya", title: "Sholat Isya", category: "wajib", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: false, isPhysical: true, isVerbal: false },
  { id: "badiyah_isya", title: "Ba'diyah Isya", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_tarawih", title: "Sholat Tarawih", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "sholat_witir", title: "Sholat Witir", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 19, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "baca_almulk", title: "Membaca QS Al-Mulk", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 20, isRemovable: true, isPhysical: false, isVerbal: true },
  { id: "wudhu_tidur", title: "Wudhu Sebelum Tidur", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 20, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "muhasabah", title: "Muhasabah / Maafkan Orang", category: "sunnah", type: "checkbox", timeBlock: "malam_tidur", startHour: 20, isRemovable: true, isPhysical: false, isVerbal: false },

  { id: "tilawah_target", title: "Target Tilawah", category: "sunnah", type: "counter", unit: "halaman", timeBlock: "malam_tidur", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: true },
  { id: "shalawat_target", title: "Shalawat Nabi", category: "sunnah", type: "counter", target: 1000, unit: "kali", timeBlock: "malam_tidur", startHour: 0, isRemovable: true, isPhysical: false, isVerbal: true },

  // PERIODIC
  { id: "puasa_senin", title: "Puasa Senin", category: "sunnah", type: "checkbox", timeBlock: "weekly", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "puasa_kamis", title: "Puasa Kamis", category: "sunnah", type: "checkbox", timeBlock: "weekly", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: false },
  { id: "jumat_alkahfi", title: "Baca Al-Kahfi", category: "sunnah", type: "checkbox", timeBlock: "weekly", startHour: 0, isRemovable: true, isPhysical: false, isVerbal: true },
  { id: "puasa_ayyamul_bidh", title: "Puasa Ayyamul Bidh", category: "sunnah", type: "checkbox", timeBlock: "monthly", startHour: 0, isRemovable: true, isPhysical: true, isVerbal: false },
];