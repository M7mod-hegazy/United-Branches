import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { parseExcelBuffer } from '@/lib/excel-parser'
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

  // Check if it is the dominant branch
  const settingsDoc = await Settings.findOne().lean() as { dominantBranchId?: mongoose.Types.ObjectId | null } | null
  const isDominant = settingsDoc?.dominantBranchId && String(settingsDoc.dominantBranchId) === branchId

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

  const oldProductsMap = new Map<string, any>()
  if (lastSnapshot && lastSnapshot.products) {
    lastSnapshot.products.forEach((p) => {
      const codeKey = p.code.trim().toLowerCase()
      oldProductsMap.set(codeKey, p)
    })
  }

  const changes: any[] = []

  uploadedProducts.forEach((newProd) => {
    const codeKey = newProd.code.trim().toLowerCase()
    const oldProd = oldProductsMap.get(codeKey)

    if (!oldProd) {
      // New product creation
      changes.push({
        code: newProd.code,
        type: 'new_product',
        name: newProd.name,
        sellingPrice: newProd.sellingPrice,
        buyingPrice: newProd.buyingPrice,
      })
    } else {
      const nameChanged = newProd.name.trim() !== oldProd.name.trim()
      const sellingChanged = newProd.sellingPrice !== oldProd.sellingPrice
      const buyingChanged = newProd.buyingPrice !== oldProd.buyingPrice

      if (nameChanged) {
        changes.push({
          code: newProd.code,
          type: 'name_update',
          name: newProd.name,
          oldName: oldProd.name,
          sellingPrice: newProd.sellingPrice,
          buyingPrice: newProd.buyingPrice,
        })
      }

      if (sellingChanged || buyingChanged) {
        changes.push({
          code: newProd.code,
          type: 'price_update',
          name: newProd.name,
          sellingPrice: newProd.sellingPrice,
          oldSellingPrice: oldProd.sellingPrice,
          buyingPrice: newProd.buyingPrice,
          oldBuyingPrice: oldProd.buyingPrice,
        })
      }
    }
  })

  // Suggested default name for the update list
  const formattedDate = new Date().toLocaleDateString('ar-EG', {
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
