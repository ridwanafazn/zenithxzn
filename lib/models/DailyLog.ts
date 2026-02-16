import mongoose, { Schema, Document, Model } from "mongoose";

// Interface TypeScript untuk type safety di kodingan
export interface IDailyLog extends Document {
  userId: string;
  date: string;       // Format: "YYYY-MM-DD"
  hijriDate?: string; // Opsional: "1 Ramadhan 1447"
  
  // Array string berisi ID amalan yang 'checked' (done)
  // Contoh: ["sholat_subuh", "dzikir_pagi"]
  checklists: string[]; 

  // Map untuk menyimpan nilai counter
  // Contoh: { "istighfar_sahur": 50, "tilawah_target": 10 }
  counters: Map<string, number>; 

  // Catatan syukur / refleksi harian
  notes?: string;

  // Penanda khusus
  isMenstruating: boolean; // Jika true, statistik sholat wajib tidak dihitung drop
  isPuasa: boolean;        // Apakah hari ini puasa?
  
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { type: String, required: true, index: true }, // Index agar pencarian user cepat
    date: { type: String, required: true }, // Disimpan sebagai String YYYY-MM-DD agar timezone safe
    hijriDate: { type: String },
    
    // Kita pakai Array of Strings, lebih hemat daripada bikin 50 kolom boolean (subuh: true, zuhur: false...)
    checklists: { 
      type: [String], 
      default: [] 
    },

    // Menggunakan Map untuk fleksibilitas counter
    counters: {
      type: Map,
      of: Number,
      default: {}
    },

    notes: { type: String, maxlength: 500 }, // Batasi 500 karakter biar database gak meledak
    
    isMenstruating: { type: Boolean, default: false },
    isPuasa: { type: Boolean, default: false },
  },
  { 
    timestamps: true 
  }
);

// Compound Index: Satu user hanya boleh punya SATU log per TANGGAL.
// Ini mencegah duplikasi data harian.
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Prevent Overwrite Model saat Hot Reload Next.js
const DailyLog: Model<IDailyLog> = mongoose.models.DailyLog || mongoose.model<IDailyLog>("DailyLog", DailyLogSchema);

export default DailyLog;