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

    // LOGIKA BARU: DICEBEAR ONLY POLICY
    // Kita hapus photoURL dari payload update agar tidak menimpa avatar Dicebear yang sudah ada.
    // Jika user baru, photoURL akan di-generate nanti saat ONBOARDING.
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photoURL, ...userDataWithoutPhoto } = userData;

    // Upsert: Update jika ada, Create jika belum ada
    const user = await User.findOneAndUpdate(
      { uid: userData.uid },
      {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        // photoURL: userData.photoURL,  <-- INI DIHAPUS AGAR TIDAK MENIMPA
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