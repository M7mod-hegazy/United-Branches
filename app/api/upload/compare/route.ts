import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { parseExcelBuffer } from '@/lib/excel-parser'
import { computeChanges } from '@/lib/compare-changes'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'
import Settings from '@/models/Settings'

export async function POST(request: Request) {
  const form = await request.formData()
  const branchId = String(form.get('branchId') ?? '')
  const file = form.get('file')

  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    return NextResponse.json({ error: 'Valid branchId is required' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })
  }

  await connectDB()
  const branch = await Branch.findById(branchId)
  if (!branch) {
    return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
  }

  // Check if it is a dominant branch
  const settingsDoc = await Settings.findOne().lean() as { dominantBranchIds?: mongoose.Types.ObjectId[] } | null
  const dominantIds = (settingsDoc?.dominantBranchIds ?? []).map((id) => String(id))
  const isDominant = dominantIds.includes(branchId)

  const bytes = Buffer.from(await file.arrayBuffer())
  const { products: uploadedProducts, detectedColumns } = parseExcelBuffer(bytes)
  if (uploadedProducts.length === 0) {
    return NextResponse.json(
      {
        error:
          'No products were found in this Excel file. Check that it contains product code, product name, and quantity columns.',
      },
      { status: 422 }
    )
  }

  if (!isDominant) {
    // If not dominant branch, return isDominant: false so frontend knows to save directly
    return NextResponse.json({
      isDominant: false,
      productsCount: uploadedProducts.length,
      detectedColumns,
    })
  }

  // It IS the dominant branch! Compare with the last snapshot of this branch
  const lastSnapshot = await Snapshot.findOne({ branchId })
    .sort({ uploadedAt: -1 })
    .lean() as { products: { code: string; name: string; quantity: number; sellingPrice?: number; buyingPrice?: number }[] } | null

  console.log(`[API/UPLOAD/COMPARE] Dominant branch upload initiated:`);
  console.log(`- Uploaded Products count: ${uploadedProducts.length}`);
  console.log(`- Detected Columns:`, detectedColumns);
  console.log(`- Last Snapshot found: ${lastSnapshot ? 'YES' : 'NO'} (${lastSnapshot?.products?.length ?? 0} products)`);

  const changes = computeChanges(lastSnapshot?.products ?? [], uploadedProducts)

  console.log(`[API/UPLOAD/COMPARE] Total changes detected: ${changes.length}`);

  // Suggested default name for the update list
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const defaultUpdateName = `تحديث أسعار - ${branch.name} - ${formattedDate}`

  return NextResponse.json({
    isDominant: true,
    changes,
    allProducts: uploadedProducts,
    defaultUpdateName,
    detectedColumns,
  })
}

