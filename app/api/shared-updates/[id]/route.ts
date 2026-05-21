import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import SharedUpdate from '@/models/SharedUpdate'
import Branch from '@/models/Branch'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid update ID' }, { status: 400 })
    }

    await connectDB()
    const update = await SharedUpdate.findById(id)
      .populate('branchId', 'name')
      .lean()

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    return NextResponse.json(update)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
