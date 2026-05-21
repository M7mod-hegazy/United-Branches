import mongoose, { Document, Schema } from 'mongoose'

export interface ISettings extends Document {
  retentionLimit: number | null
  dominantBranchId: mongoose.Types.ObjectId | null
}

const SettingsSchema = new Schema<ISettings>({
  retentionLimit: { type: Number, default: 10 },
  dominantBranchId: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
})

export default mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema)
