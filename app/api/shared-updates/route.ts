import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import SharedUpdate from '@/models/SharedUpdate'
import Branch from '@/models/Branch'

export async function GET() {
  try {
    await connectDB()
    const updates = await SharedUpdate.find()
      .sort({ createdAt: -1 })
      .populate('branchId', 'name')
      .lean()

    return NextResponse.json(
      updates.map((up: any) => ({
        _id: up._id,
        name: up.name,
        branchName: up.branchId?.name ?? 'غير معروف',
        uploadedAt: up.uploadedAt,
        createdAt: up.createdAt,
        changesCount: up.changes.length,
        newProductsCount: up.changes.filter((c: any) => c.type === 'new_product').length,
        priceUpdatesCount: up.changes.filter((c: any) => c.type === 'price_update').length,
        nameUpdatesCount: up.changes.filter((c: any) => c.type === 'name_update').length,
      }))
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
