"use server";

import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- 1. Cek Status User (Untuk Dashboard & Auth) ---
export async function checkUserStatus(uid: string) {
  await connectDB();
  // Penting: Kita sertakan 'uid' dan 'gender' dalam select
  const user = await User.findOne({ uid })
    .select("uid onboardingCompleted preferences displayName photoURL gender") 
    .lean();
  
  if (!user) return null;
  return JSON.parse(JSON.stringify(user));
}

// --- 2. Submit Onboarding ---
// Fungsi ini dipanggil saat user baru mengisi nama & gender
export async function submitOnboarding(formData: FormData) {
  const uid = formData.get("uid") as string;
  const nickname = formData.get("nickname") as string;
  const gender = formData.get("gender") as string;

  if (!uid || !nickname || !gender) {
    throw new Error("Data tidak lengkap");
  }

  await connectDB();

  await User.findOneAndUpdate(
    { uid },
    {
      displayName: nickname,
      gender: gender, 
      onboardingCompleted: true,
      preferences: {
        isMenstruating: false,
        activeHabits: {} // Default kosong
      }
    },
    { upsert: true, new: true }
  );

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- 3. Simpan Habit & Preferences (Untuk Settings) ---
export async function saveAllHabits(uid: string, data: any) {
  try {
    await connectDB();
    
    // Pisahkan isMenstruating dari activeHabits jika ada (Logic dari page settings)
    const { _isMenstruating, ...realHabits } = data;
    
    // Siapkan object update
    const updateQuery: any = {
      "preferences.activeHabits": realHabits
    };

    // Jika ada flag isMenstruating (khusus wanita), update juga field database-nya
    if (typeof _isMenstruating === "boolean") {
        updateQuery["preferences.isMenstruating"] = _isMenstruating;
    }

    await User.updateOne(
      { uid: uid },
      { $set: updateQuery },
      { upsert: true }
    );

    revalidatePath("/dashboard");
    revalidatePath("/settings/habits");
    return { success: true };
  } catch (error) {
    console.error("❌ [SERVER] GAGAL SIMPAN:", error);
    return { success: false };
  }

  
}
// ... kode import sebelumnya ...

// === 4. UPDATE USER PROFILE (Edit PFP, Gender, Username) ===
export async function updateUserProfile(uid: string, data: {
    displayName: string;
    username: string;
    gender: string;
    photoURL: string;
}) {
    try {
        await connectDB();

        // 1. Validasi Username Format (Lowercase, a-z, 0-9, underscore, dot)
        const cleanUsn = data.username.toLowerCase().replace(/[^a-z0-9_.]/g, "");
        
        if (cleanUsn.length < 3) {
            return { success: false, error: "Username minimal 3 karakter." };
        }

        // 2. Cek Ketersediaan Username (Kecuali milik sendiri)
        const existingUser = await User.findOne({ 
            username: cleanUsn, 
            uid: { $ne: uid } // $ne = Not Equal (Cari user LAIN yang punya username ini)
        });

        if (existingUser) {
            return { success: false, error: "Username sudah dipakai orang lain." };
        }

        // 3. Update Data
        await User.findOneAndUpdate(
            { uid },
            {
                displayName: data.displayName,
                username: cleanUsn,
                gender: data.gender,
                photoURL: data.photoURL
            }
        );

        revalidatePath("/dashboard");
        return { success: true };

    } catch (error) {
        console.error("Gagal update profil:", error);
        return { success: false, error: "Terjadi kesalahan server." };
    }
}