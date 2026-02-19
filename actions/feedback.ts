"use server";

import connectDB from "@/lib/db";
import Feedback from "@/lib/models/Feedback";
import { revalidatePath } from "next/cache";

// 1. KIRIM FEEDBACK
export async function submitFeedback(data: {
  userId: string;
  userEmail?: string;
  category: string;
  rating: number;
  message: string;
}) {
  try {
    await connectDB();
    await Feedback.create(data);
    return { success: true };
  } catch (error) {
    console.error("Gagal submit feedback:", error);
    return { success: false, error: "Gagal menyimpan masukan." };
  }
}

// 2. AMBIL SEMUA LIST (Untuk Admin)
export async function getAllFeedbacks() {
  try {
    await connectDB();
    // Urutkan dari yang terbaru (descending)
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(feedbacks));
  } catch (error) {
    console.error("Gagal ambil feedback:", error);
    return [];
  }
}