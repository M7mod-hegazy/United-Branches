# Prices & Admin Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selling/buying price support throughout the stack — parser, DB, merger, table, price-conflicts modal — plus admin snapshot retention settings and per-snapshot delete.

**Architecture:** Extend `ParsedProduct` and `IProduct` with optional price fields; add `priceVariants` to `MergedProduct`; add a `Settings` model for retention; new `PriceConflictsModal` mirrors `NameConflictsModal`; `InventoryTable` gains two toggle buttons for price columns; admin gains `SnapshotManager` with per-snapshot delete.

**Tech Stack:** Next.js 15 App Router, React 19, Mongoose/MongoDB, xlsx, Tailwind CSS, TypeScript

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `lib/excel-parser.ts` | Detect `Price` + `AVGPriceOfBuying` columns; return `ParseResult` |
| Modify | `models/Snapshot.ts` | Add optional `sellingPrice?` / `buyingPrice?` to `IProduct` |
| Create | `models/Settings.ts` | Global settings doc: `retentionLimit: number \| null` |
| Modify | `lib/inventory-merger.ts` | Add `PriceVariant` + `priceVariants` to `MergedProduct` |
| Create | `app/api/settings/route.ts` | GET/PUT retention setting |
| Create | `app/api/snapshots/[id]/route.ts` | DELETE single snapshot |
| Modify | `app/api/snapshots/route.ts` | GET includes `hasPrices` + no limit; remove old DELETE |
| Modify | `app/api/upload/route.ts` | Use settings retention limit; return `detectedColumns` |
| Create | `components/admin/SnapshotManager.tsx` | Expandable per-branch snapshot list + retention input |
| Modify | `components/admin/BranchManager.tsx` | Integrate `SnapshotManager` + delegate all-delete |
| Modify | `app/upload/page.tsx` | Show detected columns in success screen |
| Modify | `components/preview/InventoryTable.tsx` | Price columns + toggle buttons |
| Create | `components/preview/PriceConflictsModal.tsx` | Price conflict modal w/ diff highlight + copy |
| Modify | `app/page.tsx` | Price conflicts state + `PriceConflictsModal` |
| Modify | `__tests__/excel-parser.test.ts` | Tests for price detection |
| Modify | `__tests__/inventory-merger.test.ts` | Tests for price merging + conflict detection |

---

## Task 1: Extend IProduct schema + create Settings model

**Files:**
- Modify: `models/Snapshot.ts`
- Create: `models/Settings.ts`

- [ ] **Step 1: Update `IProduct` interface and `ProductSchema` in `models/Snapshot.ts`**

Replace the existing content with:

```typescript
import mongoose, { Document, Schema } from 'mongoose'

export interface IProduct {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
}

export interface ISnapshot extends Document {
  branchId: mongoose.Types.ObjectId
  uploadedAt: Date
  products: IProduct[]
}

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: false },
    buyingPrice: { type: Number, required: false },
  },
  { _id: false }
)

const SnapshotSchema = new Schema<ISnapshot>({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  },
  uploadedAt: { type: Date, default: Date.now, index: true },
  products: { type: [ProductSchema], required: true, default: [] },
})

export default mongoose.models.Snapshot ||
  mongoose.model<ISnapshot>('Snapshot', SnapshotSchema)
```

- [ ] **Step 2: Create `models/Settings.ts`**

```typescript
import mongoose, { Document, Schema } from 'mongoose'

export interface ISettings extends Document {
  retentionLimit: number | null
}

const SettingsSchema = new Schema<ISettings>({
  retentionLimit: { type: Number, default: 10 },
})

export default mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema)
```

- [ ] **Step 3: Commit**

```bash
git add models/Snapshot.ts models/Settings.ts
git commit -m "feat: add sellingPrice/buyingPrice to IProduct; add Settings model"
```

---

## Task 2: Excel parser — detect price columns + ParseResult

**Files:**
- Modify: `lib/excel-parser.ts`

- [ ] **Step 1: Extend `ParsedProduct`, add term lists, add `ParseResult`**

Replace the top section of `lib/excel-parser.ts` (through the constant declarations) with:

```typescript
import * as XLSX from 'xlsx'
import { decode } from 'iconv-lite'

// Register cptable for SheetJS to resolve Arabic encoding issues in Next.js.
try {
  // @ts-ignore
  const cptable = require('xlsx/dist/cpexcel.js')
  // @ts-ignore
  if (typeof XLSX.set_cptable === 'function') {
    // @ts-ignore
    XLSX.set_cptable(cptable)
  } else {
    // @ts-ignore
    const xlsxModule = require('xlsx')
    if (xlsxModule && typeof xlsxModule.set_cptable === 'function') {
      xlsxModule.set_cptable(cptable)
    }
  }
} catch (e) {}

// Fixes garbled Arabic text that occurs when xlsx reads Windows-1256 bytes as Latin-1.
function fixArabicMojibake(text: string): string {
  if (!text) return text
  if (/[؀-ۿ]/.test(text)) return text
  if (!/[-ÿ]/.test(text)) return text
  const bytes = Buffer.alloc(text.length)
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xFF
  const decoded = decode(bytes, 'cp1256')
  return /[؀-ۿ]/.test(decoded) ? decoded : text
}

export interface ParsedProduct {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
}

export interface ParseResult {
  products: ParsedProduct[]
  detectedColumns: string[]
}

const codeTerms = ['code', 'item code', 'product code', 'codeofmodel', 'sku', 'كود', 'الكود', 'كود الصنف', 'رقم الصنف', 'باركود']
const nameTerms = ['name', 'item name', 'product name', 'description', 'desc', 'الصنف', 'اسم الصنف', 'الاسم', 'بيان']
const quantityTerms = ['qty', 'quantity', 'stock', 'finalstock', 'balance', 'on hand', 'كمية', 'الكميه', 'الكمية', 'الرصيد', 'رصيد']
const sellingPriceTerms = ['price', 'selling price', 'sell price', 'unit price', 'sale price', 'سعر البيع', 'سعر بيع', 'السعر', 'سعر']
const buyingPriceTerms = ['avgpriceofbuying', 'avg price of buying', 'buying price', 'buy price', 'cost price', 'purchase price', 'سعر الشراء', 'سعر شراء', 'تكلفة']
```

- [ ] **Step 2: Add `findOptionalPriceColumns` function after `repairEmptyColumns`**

Insert this function before `findHeader`:

```typescript
function findOptionalPriceColumns(
  rows: unknown[][],
  header: { rowIndex: number; codeIndex: number; nameIndex: number; quantityIndex: number }
): { sellingPriceIndex: number | null; buyingPriceIndex: number | null } {
  const headerRow = rows[header.rowIndex] ?? []
  const dataRows = rows.slice(header.rowIndex + 1)
  const reserved = new Set([header.codeIndex, header.nameIndex, header.quantityIndex])

  let bestSelling = { index: -1, score: 0 }
  let bestBuying = { index: -1, score: 0 }

  headerRow.forEach((cell, index) => {
    if (reserved.has(index)) return
    const headerScore = scoreHeader(cell, sellingPriceTerms)
    if (headerScore > 0) {
      const dataScore = scoreDataColumn(dataRows, index, 'quantity')
      const total = headerScore * 3 + dataScore
      if (total > bestSelling.score) bestSelling = { index, score: total }
    }
  })

  headerRow.forEach((cell, index) => {
    if (reserved.has(index) || index === bestSelling.index) return
    const headerScore = scoreHeader(cell, buyingPriceTerms)
    if (headerScore > 0) {
      const dataScore = scoreDataColumn(dataRows, index, 'quantity')
      const total = headerScore * 3 + dataScore
      if (total > bestBuying.score) bestBuying = { index, score: total }
    }
  })

  return {
    sellingPriceIndex: bestSelling.index >= 0 ? bestSelling.index : null,
    buyingPriceIndex: bestBuying.index >= 0 ? bestBuying.index : null,
  }
}
```

- [ ] **Step 3: Update `parseExcelBuffer` to return `ParseResult`**

Replace the entire `parseExcelBuffer` function:

```typescript
export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 1256 })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return { products: [], detectedColumns: [] }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: '',
    raw: false,
  })
  const header = findHeader(rows)
  const priceColumns = findOptionalPriceColumns(rows, header)
  const byCode = new Map<string, ParsedProduct>()

  rows.slice(header.rowIndex + 1).forEach((row) => {
    const code = normalize(row[header.codeIndex])
    const name = String(row[header.nameIndex] ?? '').trim()
    if (!code || !name) return

    const quantity = toQuantity(row[header.quantityIndex])
    const fixedName = fixArabicMojibake(name)

    const sellingPrice =
      priceColumns.sellingPriceIndex !== null
        ? (firstNumber(row[priceColumns.sellingPriceIndex]) ?? undefined)
        : undefined
    const buyingPrice =
      priceColumns.buyingPriceIndex !== null
        ? (firstNumber(row[priceColumns.buyingPriceIndex]) ?? undefined)
        : undefined

    const existing = byCode.get(code)
    if (existing) {
      existing.quantity += quantity
      if (!existing.name && fixedName) existing.name = fixedName
      if (existing.sellingPrice === undefined && sellingPrice !== undefined) existing.sellingPrice = sellingPrice
      if (existing.buyingPrice === undefined && buyingPrice !== undefined) existing.buyingPrice = buyingPrice
    } else {
      byCode.set(code, { code, name: fixedName, quantity, sellingPrice, buyingPrice })
    }
  })

  const detectedColumns = ['code', 'name', 'quantity']
  if (priceColumns.sellingPriceIndex !== null) detectedColumns.push('sellingPrice')
  if (priceColumns.buyingPriceIndex !== null) detectedColumns.push('buyingPrice')

  return { products: Array.from(byCode.values()), detectedColumns }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/excel-parser.ts
git commit -m "feat: detect selling/buying price columns in excel parser"
```

---

## Task 3: Inventory merger — priceVariants

**Files:**
- Modify: `lib/inventory-merger.ts`

- [ ] **Step 1: Update `lib/inventory-merger.ts` with `PriceVariant` and extended `MergedProduct`**

Replace the entire file:

```typescript
import type { IProduct } from '@/models/Snapshot'

export interface SnapshotInput {
  branchId: string
  branchName: string
  uploadedAt: Date | string
  products: IProduct[]
}

export interface NameVariant {
  branchId: string
  branchName: string
  name: string
}

export interface PriceVariant {
  branchId: string
  branchName: string
  sellingPrice?: number
  buyingPrice?: number
}

export interface MergedProduct {
  code: string
  name: string
  total: number
  branches: Record<string, number>
  nameVariants: NameVariant[]
  priceVariants: PriceVariant[]
}

export interface BranchMeta {
  id: string
  name: string
  uploadedAt: string
}

export interface MergedInventory {
  branches: BranchMeta[]
  products: MergedProduct[]
}

export function mergeInventory(snapshots: SnapshotInput[]): MergedInventory {
  const branches: BranchMeta[] = snapshots.map((snapshot) => ({
    id: snapshot.branchId,
    name: snapshot.branchName,
    uploadedAt: new Date(snapshot.uploadedAt).toISOString(),
  }))
  const products = new Map<string, MergedProduct>()

  snapshots.forEach((snapshot) => {
    snapshot.products.forEach((product) => {
      const code = product.code.trim().toLowerCase()
      if (!code) return

      const existing =
        products.get(code) ||
        ({
          code,
          name: product.name,
          total: 0,
          branches: {},
          nameVariants: [],
          priceVariants: [],
        } satisfies MergedProduct)

      existing.name = existing.name || product.name
      existing.branches[snapshot.branchId] =
        (existing.branches[snapshot.branchId] || 0) + product.quantity
      existing.total += product.quantity
      existing.nameVariants.push({
        branchId: snapshot.branchId,
        branchName: snapshot.branchName,
        name: product.name,
      })
      if (product.sellingPrice !== undefined || product.buyingPrice !== undefined) {
        existing.priceVariants.push({
          branchId: snapshot.branchId,
          branchName: snapshot.branchName,
          sellingPrice: product.sellingPrice,
          buyingPrice: product.buyingPrice,
        })
      }
      products.set(code, existing)
    })
  })

  return {
    branches,
    products: Array.from(products.values()).sort((a, b) => a.code.localeCompare(b.code)),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/inventory-merger.ts
git commit -m "feat: add priceVariants to MergedProduct in inventory merger"
```

---

## Task 4: Settings API

**Files:**
- Create: `app/api/settings/route.ts`

- [ ] **Step 1: Create `app/api/settings/route.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/settings/route.ts
git commit -m "feat: add settings API for retention limit"
```

---

## Task 5: Per-snapshot APIs

**Files:**
- Create: `app/api/snapshots/[id]/route.ts`
- Modify: `app/api/snapshots/route.ts`

- [ ] **Step 1: Create `app/api/snapshots/[id]/route.ts`**

```typescript
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Snapshot from '@/models/Snapshot'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid snapshot id' }, { status: 400 })
  }
  await connectDB()
  const result = await Snapshot.deleteOne({ _id: id })
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
  }
  return NextResponse.json({ deleted: 1 })
}
```

- [ ] **Step 2: Update `app/api/snapshots/route.ts`**

Replace the entire file:

```typescript
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Snapshot from '@/models/Snapshot'

export async function DELETE() {
  await connectDB()
  const result = await Snapshot.deleteMany({})
  return NextResponse.json({ deleted: result.deletedCount })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')

  if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
    return NextResponse.json({ error: 'Valid branchId is required' }, { status: 400 })
  }

  await connectDB()
  const snapshots = await Snapshot.find({ branchId })
    .sort({ uploadedAt: -1 })
    .lean()

  return NextResponse.json(
    snapshots.map((s) => ({
      _id: s._id,
      uploadedAt: s.uploadedAt,
      productsCount: s.products.length,
      hasPrices: s.products.some(
        (p) => p.sellingPrice != null || p.buyingPrice != null
      ),
    }))
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/snapshots/route.ts app/api/snapshots/[id]/route.ts
git commit -m "feat: per-snapshot DELETE API and hasPrices in snapshot list"
```

---

## Task 6: Upload API — settings retention + detectedColumns

**Files:**
- Modify: `app/api/upload/route.ts`

- [ ] **Step 1: Update `app/api/upload/route.ts`**

Replace the entire file:

```typescript
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

  const bytes = Buffer.from(await file.arrayBuffer())
  const { products, detectedColumns } = parseExcelBuffer(bytes)
  if (products.length === 0) {
    return NextResponse.json(
      {
        error:
          'No products were found in this Excel file. Check that it contains product code, product name, and quantity columns.',
      },
      { status: 422 }
    )
  }

  const snapshot = await Snapshot.create({ branchId, products })

  const settingsDoc = await Settings.findOne().lean() as { retentionLimit?: number | null } | null
  const retentionLimit = settingsDoc?.retentionLimit ?? 10

  if (retentionLimit !== null) {
    const staleSnapshots = await Snapshot.find({ branchId })
      .sort({ uploadedAt: -1 })
      .skip(retentionLimit)
      .select('_id')
    if (staleSnapshots.length) {
      await Snapshot.deleteMany({ _id: { $in: staleSnapshots.map((s) => s._id) } })
    }
  }

  return NextResponse.json({
    snapshotId: snapshot._id,
    productsCount: products.length,
    uploadedAt: snapshot.uploadedAt,
    detectedColumns,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: upload API uses settings retention limit and returns detectedColumns"
```

---

## Task 7: Tests — parser + merger

**Files:**
- Modify: `__tests__/excel-parser.test.ts`
- Modify: `__tests__/inventory-merger.test.ts`

- [ ] **Step 1: Add price tests to `__tests__/excel-parser.test.ts`**

Append these tests to the existing `describe` block:

```typescript
  it('detects selling and buying price columns from new format', () => {
    const buffer = workbookBuffer([
      ['Text55', 'Text69', 'NameOfStore', 'TotalSelling', 'TotalBuying', 'FinalStock', 'Price', 'AVGPriceOfBuying', 'Text64', 'CodeNumberOfMode', 'Text62'],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '1680', '1400', '28 قطعة', 60, 50, 'كابولي لماسورة', '1.23', 1],
      ['', '', '', '1485', '1320', '33 قطعة', 45, 40, 'كابولي 10 بليه', '1.2', 2],
    ])

    const result = parseExcelBuffer(buffer)
    expect(result.detectedColumns).toContain('sellingPrice')
    expect(result.detectedColumns).toContain('buyingPrice')
    expect(result.products[0]).toMatchObject({ sellingPrice: 60, buyingPrice: 50 })
    expect(result.products[1]).toMatchObject({ sellingPrice: 45, buyingPrice: 40 })
  })

  it('returns detectedColumns without prices for old format', () => {
    const buffer = workbookBuffer([
      ['كود الصنف', 'اسم الصنف', 'الرصيد'],
      ['A-1', 'صنف أول', 2],
    ])

    const result = parseExcelBuffer(buffer)
    expect(result.detectedColumns).toEqual(['code', 'name', 'quantity'])
    expect(result.products[0].sellingPrice).toBeUndefined()
    expect(result.products[0].buyingPrice).toBeUndefined()
  })
```

Also update the existing tests since `parseExcelBuffer` now returns `ParseResult` instead of `ParsedProduct[]`. In each existing test, change `parseExcelBuffer(buffer)` to `parseExcelBuffer(buffer).products`.

- [ ] **Step 2: Run parser tests**

```bash
npx jest __tests__/excel-parser.test.ts --no-coverage
```

Expected: all pass.

- [ ] **Step 3: Add price merger tests to `__tests__/inventory-merger.test.ts`**

Append to the existing `describe` block:

```typescript
  it('populates priceVariants for products with price data', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع أ',
        uploadedAt: '2026-05-21T10:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 4, sellingPrice: 60, buyingPrice: 50 }],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع ب',
        uploadedAt: '2026-05-21T11:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 6, sellingPrice: 55, buyingPrice: 50 }],
      },
    ])

    const p1 = result.products.find((p) => p.code === 'p1')!
    expect(p1.priceVariants).toHaveLength(2)
    expect(p1.priceVariants[0]).toMatchObject({ branchId: 'branch-a', sellingPrice: 60, buyingPrice: 50 })
    expect(p1.priceVariants[1]).toMatchObject({ branchId: 'branch-b', sellingPrice: 55, buyingPrice: 50 })
  })

  it('excludes branches with no price data from priceVariants', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع أ',
        uploadedAt: '2026-05-21T10:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 4 }],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع ب',
        uploadedAt: '2026-05-21T11:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 6, sellingPrice: 55 }],
      },
    ])

    const p1 = result.products.find((p) => p.code === 'p1')!
    expect(p1.priceVariants).toHaveLength(1)
    expect(p1.priceVariants[0].branchId).toBe('branch-b')
  })
```

- [ ] **Step 4: Run merger tests**

```bash
npx jest __tests__/inventory-merger.test.ts --no-coverage
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add __tests__/excel-parser.test.ts __tests__/inventory-merger.test.ts
git commit -m "test: add price detection and price variant merger tests"
```

---

## Task 8: Admin SnapshotManager + BranchManager update

**Files:**
- Create: `components/admin/SnapshotManager.tsx`
- Modify: `components/admin/BranchManager.tsx`

- [ ] **Step 1: Create `components/admin/SnapshotManager.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'

interface Branch {
  _id: string
  name: string
}

interface SnapshotInfo {
  _id: string
  uploadedAt: string
  productsCount: number
  hasPrices: boolean
}

interface SnapshotManagerProps {
  branches: Branch[]
  onDeleted: () => void
}

export function SnapshotManager({ branches, onDeleted }: SnapshotManagerProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotInfo[]>>({})
  const [retentionLimit, setRetentionLimit] = useState<number | null>(10)
  const [retentionInput, setRetentionInput] = useState('10')
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const limit = data.retentionLimit
        if (limit === null) {
          setIsUnlimited(true)
          setRetentionLimit(null)
          setRetentionInput('')
        } else {
          setRetentionLimit(limit)
          setRetentionInput(String(limit))
        }
      })
  }, [])

  async function loadSnapshots(branchId: string) {
    const response = await fetch(`/api/snapshots?branchId=${branchId}`)
    const data = await response.json()
    setSnapshots((prev) => ({ ...prev, [branchId]: data }))
  }

  function toggleBranch(branchId: string) {
    if (expanded === branchId) {
      setExpanded(null)
    } else {
      setExpanded(branchId)
      if (!snapshots[branchId]) loadSnapshots(branchId)
    }
  }

  async function deleteSnapshot(snapshotId: string, branchId: string) {
    if (!window.confirm('حذف هذا الرفع؟')) return
    const response = await fetch(`/api/snapshots/${snapshotId}`, { method: 'DELETE' })
    if (!response.ok) {
      setMessage('تعذر حذف اللقطة')
      return
    }
    setMessage('تم الحذف')
    loadSnapshots(branchId)
    onDeleted()
  }

  async function saveRetention() {
    const limit = isUnlimited ? null : Number(retentionInput)
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retentionLimit: limit }),
    })
    if (!response.ok) {
      setMessage('تعذر حفظ الإعداد')
      return
    }
    setRetentionLimit(limit)
    setMessage('تم حفظ إعداد الاحتفاظ')
  }

  return (
    <div className="space-y-4">
      {/* Retention setting */}
      <div className="rounded-xl border border-[#EAE8E4] bg-white p-4 space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#A88554]">إعداد الاحتفاظ بالرفعات</div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#78726A] cursor-pointer">
            <input
              type="checkbox"
              checked={isUnlimited}
              onChange={(e) => {
                setIsUnlimited(e.target.checked)
                if (e.target.checked) setRetentionInput('')
              }}
              className="rounded"
            />
            بلا حد (غير محدود)
          </label>
          {!isUnlimited && (
            <input
              type="number"
              min={1}
              max={50}
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              className="h-9 w-20 rounded-lg border border-[#E2E0D9] px-3 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] focus:ring-1 focus:ring-[#A88554] outline-none"
            />
          )}
          <button
            onClick={saveRetention}
            className="rounded-lg bg-[#1E2229] hover:bg-[#2e343f] px-4 py-2 text-xs font-bold text-white transition-all duration-200 active:scale-95"
          >
            حفظ
          </button>
        </div>
        {!isUnlimited && (
          <p className="text-xs text-[#A19D95]">
            الاحتفاظ بأحدث {retentionInput || '…'} رفعة لكل فرع (النطاق: ١–٥٠)
          </p>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-[#A88554]/20 bg-[#FAF6F0] px-4 py-3 text-xs font-bold text-[#A88554] flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A88554]" />
          {message}
        </div>
      )}

      {/* Per-branch snapshot list */}
      <div className="space-y-2">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#A88554]">رفعات الفروع</div>
        {branches.map((branch) => (
          <div key={branch._id} className="rounded-xl border border-[#EAE8E4] bg-white overflow-hidden">
            <button
              onClick={() => toggleBranch(branch._id)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-[#1E2229] hover:bg-[#FCFAF7]/40 transition-colors"
            >
              <span>{branch.name}</span>
              <svg
                className={`h-4 w-4 text-[#A19D95] transition-transform ${expanded === branch._id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === branch._id && (
              <div className="border-t border-[#EAE8E4] divide-y divide-[#EAE8E4]">
                {!snapshots[branch._id] ? (
                  <div className="px-4 py-3 text-xs text-[#A19D95] font-semibold">جاري التحميل…</div>
                ) : snapshots[branch._id].length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#A19D95] font-semibold">لا توجد رفعات</div>
                ) : (
                  snapshots[branch._id].map((snap) => (
                    <div key={snap._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1E2229]">
                          {new Date(snap.uploadedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#78726A] font-semibold">{snap.productsCount.toLocaleString('ar-EG')} صنف</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${snap.hasPrices ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F0] text-[#A19D95]'}`}>
                            {snap.hasPrices ? 'كميات وأسعار' : 'كميات فقط'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSnapshot(snap._id, branch._id)}
                        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200 shrink-0"
                      >
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `components/admin/BranchManager.tsx` to integrate SnapshotManager**

Add the import at the top:
```typescript
import { SnapshotManager } from '@/components/admin/SnapshotManager'
```

After the closing `</div>` of the branches list (before the final closing `</div>` of the `return`), add:

```typescript
      <SnapshotManager branches={branches} onDeleted={loadBranches} />
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/SnapshotManager.tsx components/admin/BranchManager.tsx
git commit -m "feat: admin snapshot manager with per-snapshot delete and retention setting"
```

---

## Task 9: Upload page — detected columns banner

**Files:**
- Modify: `app/upload/page.tsx`

- [ ] **Step 1: Add `detectedColumns` to `SuccessData` and display it**

In `app/upload/page.tsx`:

1. Update the `SuccessData` interface:
```typescript
interface SuccessData {
  count: number
  uploadedAt: string
  branchName: string
  detectedColumns: string[]
}
```

2. In `handleSave`, update `setSuccessData` call to include `detectedColumns`:
```typescript
setSuccessData({
  count: result.productsCount,
  uploadedAt: result.uploadedAt,
  branchName,
  detectedColumns: result.detectedColumns ?? [],
})
```

3. In the success UI, add a row after the "الأصناف المستوردة" row:
```tsx
<div className="flex justify-between py-3">
  <span className="text-[#A19D95]">الأعمدة المكتشفة</span>
  <span className="flex gap-1 flex-wrap justify-end">
    {successData.detectedColumns.map((col) => {
      const labels: Record<string, string> = {
        code: 'الكود',
        name: 'الاسم',
        quantity: 'الكمية',
        sellingPrice: 'سعر البيع',
        buyingPrice: 'سعر الشراء',
      }
      return (
        <span key={col} className="rounded px-1.5 py-0.5 text-xs font-bold bg-[#EAE8E4] text-[#1E2229]">
          {labels[col] ?? col}
        </span>
      )
    })}
  </span>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add app/upload/page.tsx
git commit -m "feat: show detected columns in upload success screen"
```

---

## Task 10: InventoryTable — price toggle columns

**Files:**
- Modify: `components/preview/InventoryTable.tsx`

- [ ] **Step 1: Update `MergedProduct` interface in `InventoryTable.tsx`**

Replace the `MergedProduct` interface:

```typescript
export interface MergedProduct {
  code: string
  name: string
  total: number
  branches: Record<string, number>
  nameVariants: { branchId: string; branchName: string; name: string }[]
  priceVariants: { branchId: string; branchName: string; sellingPrice?: number; buyingPrice?: number }[]
}
```

- [ ] **Step 2: Add price toggle props to `InventoryTableProps`**

```typescript
interface InventoryTableProps {
  branches: BranchMeta[]
  products: MergedProduct[]
  selectedSnapshots: Record<string, string>
  onSnapshotChange: (branchId: string, snapshotId: string) => void
  showSellingPrice: boolean
  showBuyingPrice: boolean
}
```

Update the function signature:
```typescript
export function InventoryTable({
  branches,
  products,
  selectedSnapshots,
  onSnapshotChange,
  showSellingPrice,
  showBuyingPrice,
}: InventoryTableProps) {
```

- [ ] **Step 3: Add price columns to thead and tbody**

In the `<thead>` row, after the branch quantity columns and before the total column, add:

```tsx
{branches.map((branch) => (
  showSellingPrice && (
    <th key={`sp-${branch.id}`} className="min-w-32 px-5 py-4 text-right font-extrabold text-xs uppercase tracking-wider border-b-2 border-b-[#1E6FBF] border-l border-l-[#C8D9EC] bg-amber-50/50 text-amber-700">
      {branch.name} (بيع)
    </th>
  )
))}
{branches.map((branch) => (
  showBuyingPrice && (
    <th key={`bp-${branch.id}`} className="min-w-32 px-5 py-4 text-right font-extrabold text-xs uppercase tracking-wider border-b-2 border-b-[#1E6FBF] border-l border-l-[#C8D9EC] bg-green-50/50 text-green-700">
      {branch.name} (شراء)
    </th>
  )
))}
```

In the `<tbody>` rows, after the branch quantity cells and before the total cell, add:

```tsx
{branches.map((branch) => {
  if (!showSellingPrice) return null
  const variant = product.priceVariants.find((v) => v.branchId === branch.id)
  const price = variant?.sellingPrice
  return (
    <td key={`sp-${branch.id}`} className="border border-[#C8D9EC] px-5 py-3.5 tabular-nums text-sm bg-amber-50/30 text-amber-800 font-semibold">
      {price != null ? price.toLocaleString('ar-EG') : '—'}
    </td>
  )
})}
{branches.map((branch) => {
  if (!showBuyingPrice) return null
  const variant = product.priceVariants.find((v) => v.branchId === branch.id)
  const price = variant?.buyingPrice
  return (
    <td key={`bp-${branch.id}`} className="border border-[#C8D9EC] px-5 py-3.5 tabular-nums text-sm bg-green-50/30 text-green-800 font-semibold">
      {price != null ? price.toLocaleString('ar-EG') : '—'}
    </td>
  )
})}
```

Also update the `colSpan` in the empty state row from `branches.length + 3` to:
```tsx
colSpan={branches.length + 3 + (showSellingPrice ? branches.length : 0) + (showBuyingPrice ? branches.length : 0)}
```

- [ ] **Step 4: Commit**

```bash
git add components/preview/InventoryTable.tsx
git commit -m "feat: price toggle columns in inventory table"
```

---

## Task 11: PriceConflictsModal

**Files:**
- Create: `components/preview/PriceConflictsModal.tsx`

- [ ] **Step 1: Create `components/preview/PriceConflictsModal.tsx`**

```typescript
'use client'

import { useEffect, useMemo, useState } from 'react'

interface PriceVariant {
  branchId: string
  branchName: string
  sellingPrice?: number
  buyingPrice?: number
}

interface PriceConflictProduct {
  code: string
  name: string
  priceVariants: PriceVariant[]
}

interface PriceConflictsModalProps {
  conflicts: PriceConflictProduct[]
  onClose: () => void
}

function isDiffValue(value: number | undefined, allValues: (number | undefined)[]): boolean {
  const defined = allValues.filter((v) => v !== undefined)
  if (defined.length < 2) return false
  return value !== defined[0]
}

export function PriceConflictsModal({ conflicts, onClose }: PriceConflictsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showNames, setShowNames] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return conflicts
    return conflicts.filter(
      (p) =>
        p.code.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle)
    )
  }, [conflicts, query])

  function copyPrices(variant: PriceVariant, key: string) {
    const parts: string[] = []
    if (variant.sellingPrice != null) parts.push(`سعر البيع: ${variant.sellingPrice}`)
    if (variant.buyingPrice != null) parts.push(`سعر الشراء: ${variant.buyingPrice}`)
    navigator.clipboard.writeText(parts.join(' | '))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C8D9EC] px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1A202C]">أصناف بأسعار متعارضة</h2>
            <p className="text-xs font-semibold text-[#5A7A9A] mt-0.5">
              {filtered.length.toLocaleString('ar-EG')} من {conflicts.length.toLocaleString('ar-EG')} صنف
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNames((v) => !v)}
              className="rounded-lg border border-[#C8D9EC] px-3 py-1.5 text-xs font-bold text-[#5A7A9A] hover:border-[#1E6FBF] hover:text-[#1E6FBF] transition-colors"
            >
              {showNames ? 'إخفاء الأسماء' : 'إظهار الأسماء'}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A9A] hover:bg-[#EEF4FB] hover:text-[#1A202C] transition-colors text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#C8D9EC] shrink-0">
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالكود أو الاسم..."
              className="h-10 w-full rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] px-4 pl-10 text-sm font-medium placeholder-[#8AAAC8] focus:border-[#1E6FBF] focus:bg-white focus:ring-1 focus:ring-[#1E6FBF]"
            />
            <span className="absolute left-3 top-3 text-[#5A7A9A]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm font-semibold text-[#8AAAC8]">لا توجد نتائج</p>
          )}
          {filtered.map((product) => {
            const allSelling = product.priceVariants.map((v) => v.sellingPrice)
            const allBuying = product.priceVariants.map((v) => v.buyingPrice)
            return (
              <div key={product.code} className="rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] p-4">
                <div className="text-xs font-mono font-bold text-[#1E6FBF] mb-1">
                  كود: {product.code}
                </div>
                {showNames && (
                  <div className="text-xs font-semibold text-[#5A7A9A] mb-3">{product.name}</div>
                )}
                <ul className="space-y-1.5">
                  {product.priceVariants.map((variant) => {
                    const key = `${product.code}-${variant.branchId}`
                    const wasCopied = copiedKey === key
                    const sellingDiff = isDiffValue(variant.sellingPrice, allSelling)
                    const buyingDiff = isDiffValue(variant.buyingPrice, allBuying)
                    return (
                      <li key={variant.branchId} className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-[#5A7A9A] min-w-32 shrink-0">
                          {variant.branchName}
                        </span>
                        <span className="text-[#8AAAC8]">←</span>
                        <span className="flex-1 flex gap-3 flex-wrap">
                          {variant.sellingPrice != null && (
                            <span className="font-semibold text-[#1A202C]">
                              بيع:{' '}
                              {sellingDiff ? (
                                <mark className="bg-amber-100 text-amber-800 rounded px-0.5 font-extrabold not-italic">
                                  {variant.sellingPrice.toLocaleString('ar-EG')}
                                </mark>
                              ) : (
                                variant.sellingPrice.toLocaleString('ar-EG')
                              )}
                            </span>
                          )}
                          {variant.buyingPrice != null && (
                            <span className="font-semibold text-[#1A202C]">
                              شراء:{' '}
                              {buyingDiff ? (
                                <mark className="bg-amber-100 text-amber-800 rounded px-0.5 font-extrabold not-italic">
                                  {variant.buyingPrice.toLocaleString('ar-EG')}
                                </mark>
                              ) : (
                                variant.buyingPrice.toLocaleString('ar-EG')
                              )}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => copyPrices(variant, key)}
                          title="نسخ الأسعار"
                          className="shrink-0 rounded-md p-1.5 text-[#8AAAC8] hover:text-[#1E6FBF] hover:bg-[#EEF4FB] transition-colors"
                        >
                          {wasCopied ? (
                            <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/preview/PriceConflictsModal.tsx
git commit -m "feat: price conflicts modal with diff highlight and copy"
```

---

## Task 12: page.tsx — wire everything together

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update imports and state in `app/page.tsx`**

Add imports at the top:
```typescript
import { PriceConflictsModal } from '@/components/preview/PriceConflictsModal'
```

Add new state variables after `const [showConflicts, setShowConflicts] = useState(false)`:
```typescript
const [showPriceConflicts, setShowPriceConflicts] = useState(false)
const [showSellingPrice, setShowSellingPrice] = useState(false)
const [showBuyingPrice, setShowBuyingPrice] = useState(false)
```

- [ ] **Step 2: Add `priceConflicts` computed value**

After the `conflicts` useMemo, add:
```typescript
const priceConflicts = useMemo(
  () =>
    data.products.filter((p) => {
      const withPrices = p.priceVariants.filter(
        (v) => v.sellingPrice != null || v.buyingPrice != null
      )
      if (withPrices.length < 2) return false
      const uniqueSelling = new Set(withPrices.map((v) => v.sellingPrice).filter((v) => v != null))
      const uniqueBuying = new Set(withPrices.map((v) => v.buyingPrice).filter((v) => v != null))
      return uniqueSelling.size > 1 || uniqueBuying.size > 1
    }),
  [data.products]
)
```

- [ ] **Step 3: Add price toggle buttons and price conflicts button to the toolbar**

Replace the existing conflicts button block with:
```tsx
{!loading && (conflicts.length > 0 || priceConflicts.length > 0) && (
  <div className="flex items-center gap-3 flex-wrap">
    {conflicts.length > 0 && (
      <button
        onClick={() => setShowConflicts(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#1E6FBF] px-4 py-2 text-sm font-semibold text-[#1E6FBF] hover:bg-[#EEF4FB] transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        {conflicts.length.toLocaleString('ar-EG')} أصناف بأسماء متعارضة
      </button>
    )}
    {priceConflicts.length > 0 && (
      <button
        onClick={() => setShowPriceConflicts(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        {priceConflicts.length.toLocaleString('ar-EG')} أصناف بأسعار متعارضة
      </button>
    )}
    <button
      onClick={() => setShowSellingPrice((v) => !v)}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${showSellingPrice ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-[#E2E0D9] text-[#78726A] hover:border-amber-400 hover:text-amber-700'}`}
    >
      سعر البيع
    </button>
    <button
      onClick={() => setShowBuyingPrice((v) => !v)}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${showBuyingPrice ? 'border-green-500 bg-green-50 text-green-700' : 'border-[#E2E0D9] text-[#78726A] hover:border-green-400 hover:text-green-700'}`}
    >
      سعر الشراء
    </button>
  </div>
)}
```

- [ ] **Step 4: Pass price toggle props to `InventoryTable`**

Update the `<InventoryTable>` call:
```tsx
<InventoryTable
  branches={data.branches}
  products={paginated}
  selectedSnapshots={selectedSnapshots}
  onSnapshotChange={(branch, snapshot) =>
    setSelectedSnapshots((current) => ({ ...current, [branch]: snapshot }))
  }
  showSellingPrice={showSellingPrice}
  showBuyingPrice={showBuyingPrice}
/>
```

- [ ] **Step 5: Update the `MergedProduct` type import and local interface in `page.tsx`**

The `InventoryResponse` interface should use the updated `MergedProduct` from `InventoryTable`. Since `page.tsx` imports `MergedProduct` from `InventoryTable`, no change needed there — but verify the `InventoryResponse` uses it:
```typescript
interface InventoryResponse {
  branches: BranchMeta[]
  products: MergedProduct[]
}
```

- [ ] **Step 6: Add `PriceConflictsModal` to JSX**

After the `NameConflictsModal` usage, add:
```tsx
{showPriceConflicts && (
  <PriceConflictsModal
    conflicts={priceConflicts}
    onClose={() => setShowPriceConflicts(false)}
  />
)}
```

- [ ] **Step 7: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "feat: price conflicts detection, toggle buttons, and PriceConflictsModal integration"
```

---

## Self-Review Checklist

- [x] **Excel parser** — detects `Price` + `AVGPriceOfBuying`; returns `ParseResult`; old tests updated ✓
- [x] **DB schema** — `IProduct` has optional `sellingPrice`/`buyingPrice` ✓
- [x] **Settings model** — `retentionLimit: number | null` ✓
- [x] **Merger** — `priceVariants` populated; branches without prices excluded ✓
- [x] **Upload API** — uses settings retention; returns `detectedColumns` ✓
- [x] **Settings API** — GET/PUT with null=unlimited, 1-50 range ✓
- [x] **Per-snapshot DELETE** — `/api/snapshots/[id]` ✓
- [x] **Snapshots GET** — returns `hasPrices` per snapshot ✓
- [x] **SnapshotManager** — expandable per-branch, date+format, delete, retention input ✓
- [x] **Upload page** — shows detected columns as chips in success screen ✓
- [x] **InventoryTable** — `showSellingPrice`/`showBuyingPrice` props; amber/green columns ✓
- [x] **PriceConflictsModal** — diff highlight on differing price values, copy, name toggle, search ✓
- [x] **page.tsx** — `priceConflicts` computed, two toggle buttons, amber button for price conflicts ✓
- [x] **Tests** — parser price tests + merger price variant tests ✓
