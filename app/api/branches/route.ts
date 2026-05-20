import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'

export async function GET() {
  await connectDB()
  const branches = await Branch.find().sort({ name: 1 }).lean()
  return NextResponse.json(branches)
}

export async function POST(request: Request) {
  await connectDB()
  const { name } = await request.json()
  const trimmed = String(name ?? '').trim()

  if (!trimmed) {
    return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
  }

  try {
    const branch = await Branch.create({ name: trimmed })
    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Branch already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
  }
}
