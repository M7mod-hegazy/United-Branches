import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import SharedUpdate from '@/models/SharedUpdate'
import Branch from '@/models/Branch'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()

    // Explicitly reference models to prevent Next.js tree-shaking / compilation omission
    const _forceShared = SharedUpdate.modelName
    const _forceBranch = Branch.modelName

    const updates = await SharedUpdate.find()
      .sort({ createdAt: -1 })
      .populate('branchId', 'name')
      .lean()

    return NextResponse.json(
      updates.map((up: any) => {
        const changes = Array.isArray(up.changes) ? up.changes : []
        return {
          _id: up._id,
          name: up.name,
          branchName: up.branchId?.name ?? 'غير معروف',
          uploadedAt: up.uploadedAt,
          createdAt: up.createdAt,
          changesCount: changes.length,
          newProductsCount: changes.filter((c: any) => c.type === 'new_product').length,
          priceUpdatesCount: changes.filter((c: any) => c.type === 'price_update').length,
          nameUpdatesCount: changes.filter((c: any) => c.type === 'name_update').length,
        }
      })
    )
  } catch (err: any) {
    console.error('[API/SHARED-UPDATES/GET] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

