"use server";

import connectDB from "@/lib/db";
import DailyLog from "@/lib/models/DailyLog";
import { MASTER_HABITS } from "@/lib/constants";
import { revalidatePath } from "next/cache";

// 1. AMBIL LOG HARIAN (Untuk Dashboard)
export async function getDailyLog(uid: string, date: string) {
  await connectDB();
  const log = await DailyLog.findOne({ userId: uid, date: date }).lean();
  if (!log) return null;
  return JSON.parse(JSON.stringify(log));
}

// 2. TOGGLE CHECKLIST (Untuk Habit Checkbox)
export async function toggleHabit(uid: string, date: string, habitId: string) {
  try {
    // Validasi Waktu Server (Mencegah kecurangan waktu)
    const habitDef = MASTER_HABITS.find(h => h.id === habitId);
    if (habitDef?.startHour !== undefined) {
      const currentHour = new Date().getHours();
      const serverDate = new Date().toISOString().split('T')[0];
      
      if (date === serverDate && currentHour < habitDef.startHour) {
         return { success: false, message: "Belum masuk waktunya" };
      }
    }

    await connectDB();
    const existingLog = await DailyLog.findOne({ userId: uid, date: date });

    if (!existingLog) {
      await DailyLog.create({
        userId: uid,
        date: date,
        checklists: [habitId],
        counters: {},
      });
    } else {
      const isChecked = existingLog.checklists.includes(habitId);
      if (isChecked) {
        await DailyLog.updateOne({ _id: existingLog._id }, { $pull: { checklists: habitId } });
      } else {
        await DailyLog.updateOne({ _id: existingLog._id }, { $addToSet: { checklists: habitId } });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/history"); 
    return { success: true };

  } catch (error) {
    console.error("Gagal toggle:", error);
    return { success: false };
  }
}

// 3. UPDATE COUNTER (Untuk Dzikir/Target Angka)
export async function updateCounter(uid: string, date: string, habitId: string, value: number) {
  try {
    await connectDB();
    await DailyLog.findOneAndUpdate(
      { userId: uid, date: date },
      { $set: { [`counters.${habitId}`]: value } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
    
    // Ambil data berdasarkan regex tahun (misal: "2025-")
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