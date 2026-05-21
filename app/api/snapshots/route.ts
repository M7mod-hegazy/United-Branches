import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Snapshot from '@/models/Snapshot'

export async function DELETE() {
  await connectDB()
  const result = await Snapshot.deleteMany({})
  return NextResponse.json({ deleted: result.deletedCount })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')

  if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
    return NextResponse.json({ error: 'Valid branchId is required' }, { status: 400 })
  }

  await connectDB()
  const snapshots = await Snapshot.find({ branchId })
    .sort({ uploadedAt: -1 })
    .lean()

  return NextResponse.json(
    snapshots.map((s) => ({
      _id: s._id,
      uploadedAt: s.uploadedAt,
      productsCount: s.products.length,
      hasPrices: s.products.some(
        (p) => p.sellingPrice != null || p.buyingPrice != null
      ),
    }))
  )
}
