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

    // Explicitly reference models to prevent Next.js tree-shaking / compilation omission
    const _forceShared = SharedUpdate.modelName
    const _forceBranch = Branch.modelName

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

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid update ID' }, { status: 400 })
    }

    await connectDB()
    const deleted = await SharedUpdate.findByIdAndDelete(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(`[API/SHARED-UPDATES/[ID]/DELETE] Error for id ${context.params}:`, err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid update ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, changes } = body

    const updateData: any = {}
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (changes !== undefined) {
      if (!Array.isArray(changes)) {
        return NextResponse.json({ error: 'Changes must be an array' }, { status: 400 })
      }
      updateData.changes = changes
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }

    await connectDB()
    const updated = await SharedUpdate.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )

    if (!updated) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error(`[API/SHARED-UPDATES/[ID]/PATCH] Error for id ${context.params}:`, err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}


