import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  gender?: "male" | "female";
  onboardingCompleted: boolean;
  
  // --- BARU: Lokasi untuk kalkulasi Maghrib ---
  location?: {
    lat: number;
    lng: number;
    city?: string; // Opsional, untuk display di UI
  };

  preferences: {
    isMenstruating: boolean;
    activeHabits: Record<string, any>; 
  };
  
  hijriOffset?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    displayName: { type: String },
    
    username: { 
        type: String, 
        unique: true, 
        lowercase: true, 
        trim: true,
        sparse: true
    },

    photoURL: { type: String },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    onboardingCompleted: { type: Boolean, default: false },

    // --- STRUKTUR BARU ---
    location: {
      lat: { type: Number },
      lng: { type: Number },
      city: { type: String }
    },

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

// Prevent Overwrite Model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;