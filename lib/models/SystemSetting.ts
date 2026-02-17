import mongoose, { Schema, Document, Model } from "mongoose";

// Interface TypeScript
export interface ISystemSetting extends Document {
  key: string;
  value: any;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true }, // Mixed agar fleksibel (bisa number, string, object)
  },
  { 
    timestamps: true 
  }
);

// Prevent Overwrite saat Hot Reload
const SystemSetting: Model<ISystemSetting> = mongoose.models.SystemSetting || mongoose.model<ISystemSetting>("SystemSetting", SystemSettingSchema);

export default SystemSetting;