"use server";

import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function syncUser(userData: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  try {
    await connectDB();

    // Upsert: Update jika ada, Create jika belum ada
    const user = await User.findOneAndUpdate(
      { uid: userData.uid },
      {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        // Kita tidak update 'preferences' di sini agar settingan user tidak kereset tiap login
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Kita kembalikan objek user sederhana (tanpa method Mongoose) agar bisa dibaca Client Component
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Gagal sync user ke MongoDB:", error);
    return null;
  }
}