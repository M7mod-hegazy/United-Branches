import mongoose, { Document, Schema } from 'mongoose'

export interface ISettings extends Document {
  retentionLimit: number | null
}

const SettingsSchema = new Schema<ISettings>({
  retentionLimit: { type: Number, default: 10 },
})

export default mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema)
