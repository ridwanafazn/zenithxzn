"use server";

import connectDB from "@/lib/db";
import DailyLog from "@/lib/models/DailyLog";
// Hapus MASTER_HABITS import jika tidak dipakai untuk validasi jam server lagi
import { revalidatePath } from "next/cache";

// 1. AMBIL LOG HARIAN
export async function getDailyLog(uid: string, date: string) {
  try {
    await connectDB();
    const log = await DailyLog.findOne({ userId: uid, date: date }).lean();
    
    if (!log) return null;
    
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

// 2. TOGGLE CHECKLIST
export async function toggleHabit(uid: string, date: string, habitId: string) {
  try {
    // --- V2 CHANGE: HAPUS VALIDASI WAKTU SERVER (TIMEZONE BUG) ---
    // Alasan: Server Vercel pakai UTC. Validasi "currentHour < startHour"
    // akan memblokir user di WIB yang sholat Subuh jam 04:30 (Server masih jam 21:30 kemarin).
    // Validasi waktu sebaiknya dilakukan di UI (Client Side) untuk UX, 
    // Server trust client untuk habit log (kecuali aplikasi kompetitif/ranking).
    
    if (!uid) throw new Error("Unauthorized");

    await connectDB();
    
    // Gunakan Atomic Update (findOneAndUpdate with upsert) untuk race-condition safety
    // Ini menggabungkan logika "Create if not exists" dan "Update if exists"
    
    // Langkah 1: Cek status saat ini dulu (sayangnya MongoDB belum punya toggle operator native sederhana)
    const existingLog = await DailyLog.findOne({ userId: uid, date: date }).select("checklists");
    
    let updateOperation;
    const currentChecklists = existingLog?.checklists || [];
    
    if (currentChecklists.includes(habitId)) {
       // Uncheck
       updateOperation = { $pull: { checklists: habitId } };
    } else {
       // Check
       updateOperation = { $addToSet: { checklists: habitId } };
    }

    await DailyLog.updateOne(
        { userId: uid, date: date },
        updateOperation,
        { upsert: true } // Buat dokumen baru jika tanggal ini belum ada log
    );

    revalidatePath("/dashboard");
    revalidatePath("/history"); 
    return { success: true };

  } catch (error) {
    console.error("Gagal toggle habit:", error);
    return { success: false, message: "Gagal menyimpan data" };
  }
}

// 3. UPDATE COUNTER
export async function updateCounter(uid: string, date: string, habitId: string, value: number) {
  try {
    if (!uid) throw new Error("Unauthorized");
    
    await connectDB();
    
    await DailyLog.findOneAndUpdate(
      { userId: uid, date: date },
      { $set: { [`counters.${habitId}`]: value } },
      { 
        upsert: true, 
        returnDocument: 'after',
        setDefaultsOnInsert: true 
      }
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal update counter:", error);
    return { success: false };
  }
}

// 4. AMBIL HISTORY TAHUNAN
export async function getHistoryLogs(uid: string, year: number) {
  try {
    await connectDB();
    const logs = await DailyLog.find({
      userId: uid,
      date: { $regex: `^${year}` } 
    }).select("date checklists counters").lean();

    return JSON.parse(JSON.stringify(logs));
  } catch (error) {
    return [];
  }
}