import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Snapshot from '@/models/Snapshot'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid snapshot id' }, { status: 400 })
  }
  await connectDB()
  const result = await Snapshot.deleteOne({ _id: id })
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
  }
  return NextResponse.json({ deleted: 1 })
}
