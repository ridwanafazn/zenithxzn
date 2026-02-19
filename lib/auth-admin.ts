import "server-only"; // Pastikan file ini tidak bocor ke Client Bundle
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Mengambil config dari Environment Variables
// PENTING: Private Key di .env sering bermasalah dengan newline (\n).
// Kita gunakan .replace(/\\n/g, '\n') untuk memperbaikinya.
const firebaseConfig: FirebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

// Singleton Pattern: Mencegah inisialisasi berulang saat hot-reload
function createFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Validasi Config
  if (!firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
    throw new Error(
      "❌ Firebase Admin SDK Error: Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL in .env"
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      clientEmail: firebaseConfig.clientEmail,
      privateKey: firebaseConfig.privateKey,
    }),
  });
}

const firebaseAdmin = createFirebaseAdminApp();

/**
 * Verifikasi ID Token dari Client (Authorization Header / Cookie)
 * @returns Decoded Token atau null jika invalid
 */
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return null;
  }
}

/**
 * (Opsional) Ambil data user full dari Firebase Auth
 */
export async function getUserRecord(uid: string) {
    try {
        return await firebaseAdmin.auth().getUser(uid);
    } catch (error) {
        console.error("Error fetching user record:", error);
        return null;
    }
}