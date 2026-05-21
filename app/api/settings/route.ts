import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Settings from '@/models/Settings'

export async function GET() {
  await connectDB()
  const settings = await Settings.findOne().lean() as { retentionLimit?: number | null } | null
  return NextResponse.json({ retentionLimit: settings?.retentionLimit ?? 10 })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { retentionLimit } = body

  if (
    retentionLimit !== null &&
    (typeof retentionLimit !== 'number' || retentionLimit < 1 || retentionLimit > 50)
  ) {
    return NextResponse.json(
      { error: 'retentionLimit must be null (unlimited) or a number between 1 and 50' },
      { status: 400 }
    )
  }

  await connectDB()
  await Settings.findOneAndUpdate({}, { retentionLimit }, { upsert: true, new: true })
  return NextResponse.json({ retentionLimit })
}
