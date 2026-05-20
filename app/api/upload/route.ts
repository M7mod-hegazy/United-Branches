import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { parseExcelBuffer } from '@/lib/excel-parser'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'

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
  const products = parseExcelBuffer(bytes)
  const snapshot = await Snapshot.create({ branchId, products })

  const staleSnapshots = await Snapshot.find({ branchId })
    .sort({ uploadedAt: -1 })
    .skip(10)
    .select('_id')
  if (staleSnapshots.length) {
    await Snapshot.deleteMany({ _id: { $in: staleSnapshots.map((item) => item._id) } })
  }

  return NextResponse.json({
    snapshotId: snapshot._id,
    productsCount: products.length,
    uploadedAt: snapshot.uploadedAt,
  })
}
