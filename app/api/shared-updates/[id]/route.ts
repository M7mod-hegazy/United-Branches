import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import SharedUpdate from '@/models/SharedUpdate'
import Branch from '@/models/Branch'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

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

    // Resilient fallback just in case
    const safeUpdate = {
      ...update,
      changes: Array.isArray(update.changes) ? update.changes : []
    }

    return NextResponse.json(safeUpdate)
  } catch (err: any) {
    console.error(`[API/SHARED-UPDATES/[ID]] Error for id ${context.params}:`, err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

