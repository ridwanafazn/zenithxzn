import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Interface untuk cache mongoose di global object
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Memperluas tipe NodeJS.Global agar TypeScript tidak protes
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Inisialisasi variabel cached
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // 1. Jika koneksi sudah ada dan siap (readyState === 1), langsung gunakan.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. Jika koneksi tidak ada, buat promise koneksi baru
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Opsi modern Mongoose (opsional tapi disarankan untuk kestabilan)
      maxPoolSize: 10, // Batasi jumlah koneksi pool agar tidak overload di Vercel Free Tier
      serverSelectionTimeoutMS: 5000, // Timeout lebih cepat jika DB down (default 30s kelamaan)
      socketTimeoutMS: 45000, // Close socket after 45 seconds of inactivity
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ New MongoDB Connection Established");
      return mongoose;
    });
  }

  // 3. Tunggu promise selesai dan simpan ke cache
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise jika gagal agar bisa coba lagi next request
    console.error("❌ MongoDB Connection Error:", e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;