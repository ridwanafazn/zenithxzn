"use server";

import connectDB from "@/lib/db";
import DailyLog from "@/lib/models/DailyLog";
import { MASTER_HABITS } from "@/lib/constants";
import { revalidatePath } from "next/cache";

// 1. AMBIL LOG HARIAN (Untuk Dashboard)
export async function getDailyLog(uid: string, date: string) {
  try {
    await connectDB();
    const log = await DailyLog.findOne({ userId: uid, date: date }).lean();
    
    if (!log) return null;
    
    // Safety check: pastikan checklists dan counters ada
    return JSON.parse(JSON.stringify({
        ...log,
        checklists: log.checklists || [],
        counters: log.counters || {}
    }));
  } catch (error) {
    console.error("Gagal getDailyLog:", error);
    return null;
  }
}

// 2. TOGGLE CHECKLIST (Untuk Habit Checkbox)
export async function toggleHabit(uid: string, date: string, habitId: string) {
  try {
    // Validasi Waktu Server (Mencegah kecurangan waktu/sholat sebelum waktunya)
    const habitDef = MASTER_HABITS.find(h => h.id === habitId);
    if (habitDef?.startHour !== undefined) {
      const currentHour = new Date().getHours();
      // Pastikan format date sama dengan server (YYYY-MM-DD)
      const serverDate = new Date().toISOString().split('T')[0];
      
      if (date === serverDate && currentHour < habitDef.startHour) {
         return { success: false, message: "Belum masuk waktunya" };
      }
    }

    await connectDB();
    
    // Cari log yang ada
    const existingLog = await DailyLog.findOne({ userId: uid, date: date });

    if (!existingLog) {
      // Skenario 1: Log belum ada, BUAT BARU
      await DailyLog.create({
        userId: uid,
        date: date,
        checklists: [habitId],
        counters: {},
      });
    } else {
      // Skenario 2: Log ada, UPDATE
      // Safety: Pastikan array checklists terinisialisasi
      const currentChecklists = existingLog.checklists || [];
      const isChecked = currentChecklists.includes(habitId);

      if (isChecked) {
        // Uncheck: Hapus dari array
        await DailyLog.updateOne(
            { _id: existingLog._id }, 
            { $pull: { checklists: habitId } }
        );
      } else {
        // Check: Tambahkan ke array (hindari duplikat dengan addToSet)
        await DailyLog.updateOne(
            { _id: existingLog._id }, 
            { $addToSet: { checklists: habitId } }
        );
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/history"); 
    return { success: true };

  } catch (error) {
    console.error("Gagal toggle habit:", error);
    return { success: false, message: "Gagal menyimpan data" };
  }
}

// 3. UPDATE COUNTER (Untuk Dzikir/Target Angka)
export async function updateCounter(uid: string, date: string, habitId: string, value: number) {
  try {
    await connectDB();
    
    // PERBAIKAN UTAMA: Ganti 'new: true' dengan 'returnDocument: after'
    await DailyLog.findOneAndUpdate(
      { userId: uid, date: date },
      { $set: { [`counters.${habitId}`]: value } },
      { 
        upsert: true, 
        returnDocument: 'after', // <-- Syntax Mongoose Terbaru (Fix Deprecation Warning)
        setDefaultsOnInsert: true 
      }
    );

    revalidatePath("/dashboard");
    revalidatePath("/history");
    return { success: true };
  } catch (error) {
    console.error("Gagal update counter:", error);
    return { success: false };
  }
}

// 4. AMBIL HISTORY TAHUNAN (Untuk Halaman History/Heatmap)
export async function getHistoryLogs(uid: string, year: number) {
  try {
    await connectDB();
    
    const logs = await DailyLog.find({
      userId: uid,
      date: { $regex: `^${year}` } 
    }).select("date checklists counters").lean();

    return JSON.parse(JSON.stringify(logs));
  } catch (error) {
    console.error("Gagal ambil history:", error);
    return [];
  }
}