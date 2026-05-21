import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'
import Settings from '@/models/Settings'
import SharedUpdate from '@/models/SharedUpdate'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { branchId, products, changes, name } = body

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return NextResponse.json({ error: 'Valid branchId is required' }, { status: 400 })
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Products array is required and cannot be empty' }, { status: 400 })
    }

    await connectDB()
    const branch = await Branch.findById(branchId)
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    // Create Snapshot
    const snapshot = await Snapshot.create({ branchId, products })

    // If there are confirmed changes, create a SharedUpdate list
    let sharedUpdateId = null
    if (changes && Array.isArray(changes) && changes.length > 0) {
      const finalName = String(name ?? '').trim() || `تحديث أسعار - ${branch.name}`
      const sharedUpdate = await SharedUpdate.create({
        name: finalName,
        branchId,
        uploadedAt: snapshot.uploadedAt,
        changes: changes.map((c) => ({
          code: c.code,
          type: c.type,
          name: c.name,
          oldName: c.oldName,
          sellingPrice: c.sellingPrice,
          oldSellingPrice: c.oldSellingPrice,
          buyingPrice: c.buyingPrice,
          oldBuyingPrice: c.oldBuyingPrice,
        })),
      })
      sharedUpdateId = sharedUpdate._id
    }

    // Clean retention
    const settingsDoc = await Settings.findOne().lean() as { retentionLimit?: number | null } | null
    const retentionLimit = settingsDoc ? (settingsDoc.retentionLimit === undefined ? 10 : settingsDoc.retentionLimit) : 10

    if (retentionLimit !== null) {
      const staleSnapshots = await Snapshot.find({ branchId })
        .sort({ uploadedAt: -1 })
        .skip(retentionLimit)
        .select('_id')
      if (staleSnapshots.length) {
        await Snapshot.deleteMany({ _id: { $in: staleSnapshots.map((s) => s._id) } })
      }
    }

    return NextResponse.json({
      success: true,
      snapshotId: snapshot._id,
      sharedUpdateId,
      productsCount: products.length,
      uploadedAt: snapshot.uploadedAt,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
