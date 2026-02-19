"use server";

import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { cookies } from "next/headers";

// 1. ACTION BARU: Create Session (Mencetak Cookie)
export async function createSession(idToken: string) {
  // PENTING: Di Next.js 15+, cookies() me-return Promise.
  // Kita wajib menggunakan 'await cookies()' sebelum melakukan set/get/delete.
  const cookieStore = await cookies();

  // Set cookie '__session' (Nama standar agar kompatibel)
  // HttpOnly: Tidak bisa dibaca JS browser (Aman dari XSS)
  // Secure: Hanya jalan di HTTPS (Localhost otomatis dikecualikan)
  cookieStore.set("__session", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 5, // 5 Hari
    path: "/",
  });

  return { success: true };
}

// 2. ACTION BARU: Logout (Hapus Cookie)
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("__session");
}

// 3. Sync User (Kode Lama, tetap dipertahankan & aman)
export async function syncUser(userData: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  try {
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { photoURL, ...userDataWithoutPhoto } = userData;

    // Upsert: Update jika ada, Create jika belum ada
    const user = await User.findOneAndUpdate(
      { uid: userData.uid },
      {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        // photoURL: userData.photoURL,  <-- INI DIHAPUS AGAR TIDAK MENIMPA AVATAR DICEBEAR
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