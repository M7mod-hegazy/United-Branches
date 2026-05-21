import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
  await connectDB()
  const settings = await Settings.findOne().lean() as { retentionLimit?: number | null; dominantBranchId?: mongoose.Types.ObjectId | null } | null
  return NextResponse.json({
    retentionLimit: settings?.retentionLimit ?? 10,
    dominantBranchId: settings?.dominantBranchId ?? null,
  })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { retentionLimit, dominantBranchId } = body

  if (
    retentionLimit !== undefined &&
    retentionLimit !== null &&
    (typeof retentionLimit !== 'number' || retentionLimit < 1 || retentionLimit > 50)
  ) {
    return NextResponse.json(
      { error: 'retentionLimit must be null (unlimited) or a number between 1 and 50' },
      { status: 400 }
    )
  }

  if (
    dominantBranchId !== undefined &&
    dominantBranchId !== null &&
    dominantBranchId !== '' &&
    !mongoose.Types.ObjectId.isValid(dominantBranchId)
  ) {
    return NextResponse.json(
      { error: 'dominantBranchId must be a valid branch ID or null' },
      { status: 400 }
    )
  }

  await connectDB()
  
  const updateData: Record<string, any> = {}
  if (retentionLimit !== undefined) updateData.retentionLimit = retentionLimit
  if (dominantBranchId !== undefined) updateData.dominantBranchId = dominantBranchId || null

  const settings = await Settings.findOneAndUpdate({}, updateData, { upsert: true, new: true })
  
  return NextResponse.json({
    retentionLimit: settings.retentionLimit,
    dominantBranchId: settings.dominantBranchId,
  })
}
