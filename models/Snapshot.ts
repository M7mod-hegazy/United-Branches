import mongoose, { Document, Schema } from 'mongoose'

export interface IProduct {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
}

export interface ISnapshot extends Document {
  branchId: mongoose.Types.ObjectId
  uploadedAt: Date
  products: IProduct[]
}

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: false },
    buyingPrice: { type: Number, required: false },
  },
  { _id: false }
)

const SnapshotSchema = new Schema<ISnapshot>({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  },
  uploadedAt: { type: Date, default: Date.now, index: true },
  products: { type: [ProductSchema], required: true, default: [] },
})

export default mongoose.models.Snapshot ||
  mongoose.model<ISnapshot>('Snapshot', SnapshotSchema)
