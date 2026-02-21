"use server";

import connectDB from "@/lib/db";
import SystemSetting from "@/lib/models/SystemSetting";
import { revalidatePath } from "next/cache";

const HIJRI_OFFSET_KEY = "global_hijri_offset";

export async function getGlobalHijriOffset(): Promise<number> {
  try {
    await connectDB();
    const setting = await SystemSetting.findOne({ key: HIJRI_OFFSET_KEY }).lean();
    if (!setting) return 0;
    return typeof setting.value === 'number' ? setting.value : 0;
  } catch (error) {
    console.error("Gagal mengambil offset hijriyah:", error);
    return 0; 
  }
}

export async function updateGlobalHijriOffset(offset: number) {
  try {
    if (offset < -3 || offset > 3) {
        return { success: false, message: "Offset tidak valid (Max +/- 3 hari)" };
    }
    await connectDB();
    await SystemSetting.findOneAndUpdate(
      { key: HIJRI_OFFSET_KEY },
      { value: offset },
      { upsert: true, returnDocument: 'after' } 
    );
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal update offset:", error);
    return { success: false, message: "Internal Server Error" };
  }
}

// --- NEW: FETCH JADWAL DARI API KEMENAG ---
export async function fetchKemenagPrayerTimes(lat: number, lng: number, dateISO: string) {
  try {
    const d = new Date(dateISO);
    // Format Aladhan API: DD-MM-YYYY
    const dateStr = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
    
    // Method 20 adalah standar Kementerian Agama RI
    const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=20`, {
        cache: 'no-store' // Pastikan selalu dapat data segar
    });
    
    const data = await res.json();
    
    if (data.code === 200) {
       return data.data.timings; // Output: { Fajr: "04:35", Dhuhr: "12:04", ... }
    }
    return null;
  } catch (error) {
    console.error("Gagal fetch API Aladhan:", error);
    return null;
  }
}