import mongoose, { Document, Schema } from 'mongoose'

export interface ISharedChange {
  code: string
  type: 'price_update' | 'name_update' | 'new_product'
  name: string
  oldName?: string
  sellingPrice?: number
  oldSellingPrice?: number
  buyingPrice?: number
  oldBuyingPrice?: number
}

export interface ISharedUpdate extends Document {
  name: string
  branchId: mongoose.Types.ObjectId
  uploadedAt: Date
  createdAt: Date
  changes: ISharedChange[]
}

const SharedChangeSchema = new Schema<ISharedChange>(
  {
    code: { type: String, required: true },
    type: { type: String, enum: ['price_update', 'name_update', 'new_product'], required: true },
    name: { type: String, required: true },
    oldName: { type: String, required: false },
    sellingPrice: { type: Number, required: false },
    oldSellingPrice: { type: Number, required: false },
    buyingPrice: { type: Number, required: false },
    oldBuyingPrice: { type: Number, required: false },
  },
  { _id: false }
)

const SharedUpdateSchema = new Schema<ISharedUpdate>({
  name: { type: String, required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  uploadedAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  changes: { type: [SharedChangeSchema], required: true, default: [] },
})

export default mongoose.models.SharedUpdate ||
  mongoose.model<ISharedUpdate>('SharedUpdate', SharedUpdateSchema)
