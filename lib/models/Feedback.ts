import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  userId: string;
  userEmail?: string;
  category: "bug" | "feature" | "ui" | "other";
  rating: number; // 1 - 5
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: String, required: true },
    userEmail: { type: String }, // Opsional, buat follow up
    category: { type: String, enum: ["bug", "feature", "ui", "other"], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false }, // Penanda admin sudah baca/belum
  },
  { timestamps: true }
);

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;