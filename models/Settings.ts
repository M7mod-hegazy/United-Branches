import mongoose, { Document, Schema } from 'mongoose'

export interface ISettings extends Document {
  retentionLimit: number | null
  dominantBranchIds: mongoose.Types.ObjectId[]
}

const SettingsSchema = new Schema<ISettings>({
  retentionLimit: { type: Number, default: 10 },
  dominantBranchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
})

export default mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema)
