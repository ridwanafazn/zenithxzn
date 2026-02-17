"use server";

import connectDB from "@/lib/db";
import SystemSetting from "@/lib/models/SystemSetting";
import { revalidatePath } from "next/cache";

// Kunci untuk offset hijriyah global
const HIJRI_OFFSET_KEY = "global_hijri_offset";

/**
 * Mengambil Offset Hijriyah Global (Cached)
 * Default: 0
 */
export async function getGlobalHijriOffset(): Promise<number> {
  try {
    await connectDB();
    const setting = await SystemSetting.findOne({ key: HIJRI_OFFSET_KEY }).lean();
    
    if (!setting) return 0;
    
    // Pastikan value adalah number
    return typeof setting.value === 'number' ? setting.value : 0;
  } catch (error) {
    console.error("Gagal mengambil offset hijriyah:", error);
    return 0; // Fail-safe default
  }
}

/**
 * Update Offset Hijriyah Global (Admin Only)
 * Hanya panggil ini dari halaman admin rahasia
 */
export async function updateGlobalHijriOffset(offset: number) {
  try {
    // Validasi sederhana: offset tidak boleh terlalu jauh (max +/- 3 hari)
    if (offset < -3 || offset > 3) {
        return { success: false, message: "Offset tidak valid (Max +/- 3 hari)" };
    }

    await connectDB();
    
    await SystemSetting.findOneAndUpdate(
      { key: HIJRI_OFFSET_KEY },
      { value: offset },
      { upsert: true, returnDocument: 'after' } 
    );

    // Revalidate semua path yang menggunakan tanggal
    revalidatePath("/");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Gagal update offset:", error);
    return { success: false, message: "Internal Server Error" };
  }
}