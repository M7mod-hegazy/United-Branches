import mongoose, { Document, Schema } from 'mongoose'

export interface IBranch extends Document {
  name: string
  createdAt: Date
  updatedAt: Date
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
)

export default mongoose.models.Branch ||
  mongoose.model<IBranch>('Branch', BranchSchema)
