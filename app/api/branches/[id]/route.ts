import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid branch id' }, { status: 400 })
  }

  await connectDB()
  const { name } = await request.json()
  const trimmed = String(name ?? '').trim()
  if (!trimmed) {
    return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
  }

  const branch = await Branch.findByIdAndUpdate(id, { name: trimmed }, { new: true })
  if (!branch) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
  }

  return NextResponse.json(branch)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid branch id' }, { status: 400 })
  }

  await connectDB()
  const branch = await Branch.findByIdAndDelete(id)
  if (!branch) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
  }

  await Snapshot.deleteMany({ branchId: id })
  return NextResponse.json({ ok: true })
}
