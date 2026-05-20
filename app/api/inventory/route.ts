import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { mergeInventory, type SnapshotInput } from '@/lib/inventory-merger'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot, { type ISnapshot } from '@/models/Snapshot'

type LeanSnapshot = ISnapshot & { _id: mongoose.Types.ObjectId }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const selected = searchParams.get('snapshots')
  const selectedByBranch = new Map<string, string>()

  selected?.split(',').forEach((pair) => {
    const [branchId, snapshotId] = pair.split(':')
    if (
      mongoose.Types.ObjectId.isValid(branchId) &&
      mongoose.Types.ObjectId.isValid(snapshotId)
    ) {
      selectedByBranch.set(branchId, snapshotId)
    }
  })

  await connectDB()
  const branches = await Branch.find().sort({ name: 1 }).lean()
  const snapshots: SnapshotInput[] = []

  for (const branch of branches) {
    const id = String(branch._id)
    const selectedSnapshotId = selectedByBranch.get(id)
    const snapshot = selectedSnapshotId
      ? await Snapshot.findOne({ _id: selectedSnapshotId, branchId: id }).lean<LeanSnapshot>()
      : await Snapshot.findOne({ branchId: id }).sort({ uploadedAt: -1 }).lean<LeanSnapshot>()

    if (snapshot) {
      snapshots.push({
        branchId: id,
        branchName: branch.name,
        uploadedAt: snapshot.uploadedAt,
        products: snapshot.products,
      })
    }
  }

  return NextResponse.json(mergeInventory(snapshots))
}
