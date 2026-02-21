"use server";

import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- 1. Cek Status User (Untuk Dashboard & Auth) ---
export async function checkUserStatus(uid: string) {
  try {
    await connectDB();
    const user = await User.findOne({ uid })
      .select("uid onboardingCompleted preferences displayName username photoURL gender hijriOffset location") 
      .lean();
    
    if (!user) return null;
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error checking user status:", error);
    return null;
  }
}

// --- 2. Create or Update User (Untuk Google Login) ---
export async function createOrUpdateUser(userData: any) {
  try {
    await connectDB();
    const existingUser = await User.findOne({ uid: userData.uid });
    
    if (!existingUser) {
      await User.create(userData);
    } else {
      await User.updateOne({ uid: userData.uid }, { updatedAt: new Date() });
    }
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to sync user" };
  }
}

// --- 3. Submit Onboarding (UPDATED: Location Support) ---
export async function submitOnboarding(formData: FormData) {
  const uid = formData.get("uid") as string;
  const nickname = formData.get("nickname") as string;
  const gender = formData.get("gender") as string;
  
  // Ambil Data Lokasi dari Hidden Input
  const lat = formData.get("lat");
  const lng = formData.get("lng");
  const city = formData.get("city");

  if (!uid || !nickname || !gender) {
    throw new Error("Data tidak lengkap");
  }

  // Generate Avatar Dicebear
  const randomSeed = Math.random().toString(36).substring(7);
  const avatarStyle = gender === 'female' ? 'adventurer-neutral' : 'adventurer'; 
  const bgColors = gender === 'female' ? 'ffdfbf,ffd5dc,d1d4f9' : 'b6e3f4,c0aede,d1d4f9';
  const generatedPhotoURL = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${randomSeed}&backgroundColor=${bgColors}`;

  await connectDB();

  // Siapkan Objek Lokasi jika ada
  let locationData = undefined;
  if (lat && lng) {
    locationData = {
        lat: parseFloat(lat.toString()),
        lng: parseFloat(lng.toString()),
        city: city ? city.toString() : "Lokasi Terpilih"
    };
  }

  await User.findOneAndUpdate(
    { uid },
    {
      displayName: nickname,
      gender: gender, 
      photoURL: generatedPhotoURL,
      onboardingCompleted: true,
      
      // Update Lokasi User
      location: locationData,

      preferences: {
        isMenstruating: false,
        activeHabits: {} 
      }
    },
    { upsert: true, new: true }
  );

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- 4. Simpan Habit & Preferences (Untuk Settings) ---
export async function saveAllHabits(uid: string, data: any) {
  try {
    await connectDB();
    const { _isMenstruating, ...realHabits } = data;
    
    const updateQuery: any = {
      "preferences.activeHabits": realHabits
    };

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

// === 5. UPDATE USER PROFILE ===
export async function updateUserProfile(uid: string, data: {
    displayName: string;
    username: string;
    gender: string;
    photoURL: string;
}) {
    try {
        await connectDB();

        const cleanUsn = data.username ? data.username.toLowerCase().replace(/[^a-z0-9_.]/g, "") : "";
        
        if (data.username && cleanUsn.length < 3) {
            return { success: false, error: "Username minimal 3 karakter." };
        }

        if (cleanUsn) {
            const existingUser = await User.findOne({ 
                username: cleanUsn, 
                uid: { $ne: uid } 
            });

            if (existingUser) {
                return { success: false, error: "Username sudah dipakai orang lain." };
            }
        }

        const updateData: any = {
            displayName: data.displayName,
            gender: data.gender,
            photoURL: data.photoURL
        };

        if (cleanUsn) {
            updateData.username = cleanUsn;
        }
        
        if (data.gender === "male") {
            updateData["preferences.isMenstruating"] = false;
        }

        await User.findOneAndUpdate(
            { uid },
            { $set: updateData },
            { new: true } 
        );

        revalidatePath("/dashboard");
        return { success: true };

    } catch (error) {
        console.error("Gagal update profil:", error);
        return { success: false, error: "Terjadi kesalahan server." };
    }
}