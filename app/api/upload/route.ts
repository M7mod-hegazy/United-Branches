import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { parseExcelBuffer } from '@/lib/excel-parser'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'
import Settings from '@/models/Settings'

export async function POST(request: Request) {
  const form = await request.formData()
  const branchId = String(form.get('branchId') ?? '')
  const file = form.get('file')

  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    return NextResponse.json({ error: 'Valid branchId is required' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })
  }

  await connectDB()
  const branch = await Branch.findById(branchId)
  if (!branch) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const { products, detectedColumns } = parseExcelBuffer(bytes)
  if (products.length === 0) {
    return NextResponse.json(
      {
        error:
          'No products were found in this Excel file. Check that it contains product code, product name, and quantity columns.',
      },
      { status: 422 }
    )
  }

  const snapshot = await Snapshot.create({ branchId, products })

  const settingsDoc = await Settings.findOne().lean() as { retentionLimit?: number | null } | null
  const retentionLimit = settingsDoc?.retentionLimit ?? 10

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
    snapshotId: snapshot._id,
    productsCount: products.length,
    uploadedAt: snapshot.uploadedAt,
    detectedColumns,
  })
}
