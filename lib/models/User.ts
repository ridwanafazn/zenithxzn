import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  username?: string; // Field Baru
  photoURL?: string;
  gender?: "male" | "female";
  onboardingCompleted: boolean;
  preferences: {
    isMenstruating: boolean;
    activeHabits: Record<string, any>; 
  };
  hijriOffset?: number; // Tambahan untuk kalibrasi waktu
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    displayName: { type: String },
    
    // USN CONFIG: Unik, Lowercase, dan Trim spasi
    username: { 
        type: String, 
        unique: true, 
        lowercase: true, 
        trim: true,
        sparse: true // Penting: Mengizinkan nilai null/undefined untuk user lama
    },

    photoURL: { type: String },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    onboardingCompleted: { type: Boolean, default: false },

    preferences: {
      isMenstruating: { type: Boolean, default: false },
      activeHabits: {
        type: Schema.Types.Mixed, 
        default: {}
      },
    },
    
    hijriOffset: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    strict: false, 
    minimize: false 
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;