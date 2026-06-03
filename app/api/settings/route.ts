import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
  await connectDB()
  const settings = await Settings.findOne().lean() as { retentionLimit?: number | null; dominantBranchIds?: mongoose.Types.ObjectId[] } | null
  return NextResponse.json({
    retentionLimit: settings ? (settings.retentionLimit === undefined ? 10 : settings.retentionLimit) : 10,
    dominantBranchIds: settings?.dominantBranchIds ?? [],
  })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { retentionLimit, dominantBranchIds } = body

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

  if (dominantBranchIds !== undefined) {
    if (!Array.isArray(dominantBranchIds)) {
      return NextResponse.json(
        { error: 'dominantBranchIds must be an array of branch IDs' },
        { status: 400 }
      )
    }
    for (const id of dominantBranchIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: `Invalid branch ID: ${id}` },
          { status: 400 }
        )
      }
    }
  }

  await connectDB()
  
  const updateData: Record<string, any> = {}
  if (retentionLimit !== undefined) updateData.retentionLimit = retentionLimit
  if (dominantBranchIds !== undefined) updateData.dominantBranchIds = dominantBranchIds

  const settings = await Settings.findOneAndUpdate({}, updateData, { upsert: true, new: true })
  
  return NextResponse.json({
    retentionLimit: settings.retentionLimit,
    dominantBranchIds: settings.dominantBranchIds,
  })
}
