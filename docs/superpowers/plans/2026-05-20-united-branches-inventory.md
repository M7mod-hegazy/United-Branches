# United Branches Inventory System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js inventory system that parses Excel branch reports, merges them by product code, and displays a unified RTL Arabic view with drag-and-drop upload and admin branch management.

**Architecture:** Next.js 15 App Router with API routes as the backend, MongoDB (via Mongoose) for persistence, Tailwind CSS for RTL Arabic UI. Excel files are parsed server-side on upload, normalized into product snapshots (last 10 kept per branch), and merged on the preview page across all branches.

**Tech Stack:** Next.js 15 (App Router), TypeScript, MongoDB + Mongoose, xlsx (Excel parsing), iron-session (cookie auth), react-dropzone, Tailwind CSS

---

## File Map

```
app/
  layout.tsx                          # Root layout — dir="rtl", Arabic font, global nav
  page.tsx                            # Preview page (default, public)
  upload/page.tsx                     # Upload page (public)
  admin/
    page.tsx                          # Admin branch manager (protected)
    login/page.tsx                    # Admin login form
  api/
    branches/
      route.ts                        # GET list, POST create
      [id]/route.ts                   # PUT update, DELETE branch
    upload/route.ts                   # POST — receive file + branchId, parse, save snapshot
    snapshots/route.ts                # GET last 10 snapshots for a branch
    inventory/route.ts                # GET merged inventory (latest or selected snapshots)
    auth/
      login/route.ts                  # POST — validate credentials, set session
      logout/route.ts                 # POST — destroy session
      me/route.ts                     # GET — check if logged in
lib/
  mongodb.ts                          # Mongoose connection singleton
  excel-parser.ts                     # Smart column detection + parse + deduplicate by code
  inventory-merger.ts                 # Merge snapshots from multiple branches
  session.ts                          # iron-session config
models/
  Branch.ts                           # { name, createdAt }
  Snapshot.ts                         # { branchId, uploadedAt, products: [{code,name,qty}] }
components/
  preview/
    InventoryTable.tsx                # Full merged table with branch columns + total
    BranchColumnHeader.tsx            # Branch name + last-update date subtitle
    SearchFilters.tsx                 # Text search + branch filter + category filter + zero-stock toggle
    SnapshotDropdown.tsx              # Per-branch dropdown to switch between last 10 snapshots
  upload/
    BranchSelector.tsx                # Branch select dropdown
    DropZone.tsx                      # react-dropzone drag & drop UI
    ProgressBar.tsx                   # Animated upload progress bar
  admin/
    BranchManager.tsx                 # List + add + edit + delete branches
    LoginForm.tsx                     # Email/password form
middleware.ts                         # Protect /admin/* routes
next.config.ts
tailwind.config.ts
.env.local.example
__tests__/
  excel-parser.test.ts
  inventory-merger.test.ts
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "D:\code\United-branches"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected output: `Success! Created Next.js app`

- [ ] **Step 2: Install dependencies**

```bash
npm install mongoose xlsx iron-session react-dropzone
npm install -D jest @types/jest ts-jest jest-environment-node
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```ts
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathPattern: '__tests__',
}

export default config
```

Add to `package.json` scripts:
```json
"test": "jest"
```

- [ ] **Step 4: Create `.env.local`**

```env
MONGODB_URI=mongodb+srv://m7mod:275757@united-branches.duzabq5.mongodb.net/?appName=united-branches
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=change-this-to-a-random-32-char-string-minimum
```

- [ ] **Step 5: Create `.env.local.example`**

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=at-least-32-random-characters-here
```

- [ ] **Step 6: Update `.gitignore`** — ensure `.env.local` is listed (create-next-app adds it by default, verify it's there)

- [ ] **Step 7: Connect GitHub remote and push bootstrap**

```bash
git init
git remote add origin https://github.com/M7mod-hegazy/United-Branches.git
git add .
git commit -m "chore: bootstrap Next.js project"
git branch -M main
git push -u origin main
```

---

## Task 2: MongoDB Connection & Models

**Files:**
- Create: `lib/mongodb.ts`, `models/Branch.ts`, `models/Snapshot.ts`

- [ ] **Step 1: Write `lib/mongodb.ts`**

```ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI env var is required')

declare global {
  var _mongooseConn: typeof mongoose | null
  var _mongoosePromise: Promise<typeof mongoose> | null
}

let cached = global._mongooseConn
let cachedPromise = global._mongoosePromise

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGODB_URI)
  }

  cached = await cachedPromise
  global._mongooseConn = cached
  global._mongoosePromise = cachedPromise
  return cached
}
```

- [ ] **Step 2: Write `models/Branch.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IBranch extends Document {
  name: string
  createdAt: Date
  updatedAt: Date
}

const BranchSchema = new Schema<IBranch>(
  { name: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true }
)

export default mongoose.models.Branch ||
  mongoose.model<IBranch>('Branch', BranchSchema)
```

- [ ] **Step 3: Write `models/Snapshot.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct {
  code: string
  name: string
  quantity: number
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
  },
  { _id: false }
)

const SnapshotSchema = new Schema<ISnapshot>({
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  uploadedAt: { type: Date, default: Date.now },
  products: [ProductSchema],
})

SnapshotSchema.index({ branchId: 1, uploadedAt: -1 })

export default mongoose.models.Snapshot ||
  mongoose.model<ISnapshot>('Snapshot', SnapshotSchema)
```

- [ ] **Step 4: Commit**

```bash
git add lib/mongodb.ts models/Branch.ts models/Snapshot.ts
git commit -m "feat: add MongoDB connection and Mongoose models"
```

---

## Task 3: Branches API (CRUD)

**Files:**
- Create: `app/api/branches/route.ts`, `app/api/branches/[id]/route.ts`

- [ ] **Step 1: Write `app/api/branches/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'

export async function GET() {
  await connectDB()
  const branches = await Branch.find().sort({ createdAt: 1 })
  return NextResponse.json(branches)
}

export async function POST(request: Request) {
  await connectDB()
  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
  }
  const existing = await Branch.findOne({ name: name.trim() })
  if (existing) {
    return NextResponse.json({ error: 'الفرع موجود بالفعل' }, { status: 409 })
  }
  const branch = await Branch.create({ name: name.trim() })
  return NextResponse.json(branch, { status: 201 })
}
```

- [ ] **Step 2: Write `app/api/branches/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'
import mongoose from 'mongoose'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const { id } = await params
  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
  }
  const branch = await Branch.findByIdAndUpdate(
    id,
    { name: name.trim() },
    { new: true }
  )
  if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })
  return NextResponse.json(branch)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })
  }
  await Branch.findByIdAndDelete(id)
  await Snapshot.deleteMany({ branchId: new mongoose.Types.ObjectId(id) })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/branches/
git commit -m "feat: add branches CRUD API"
```

---

## Task 4: Excel Parser (with Tests)

**Files:**
- Create: `lib/excel-parser.ts`, `__tests__/excel-parser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/excel-parser.test.ts`:
```ts
import * as XLSX from 'xlsx'
import { parseExcelBuffer } from '@/lib/excel-parser'

function makeBuffer(rows: any[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

describe('parseExcelBuffer', () => {
  it('parses rows with known header names', () => {
    const rows = [
      ['Text55', 'Text69', 'NameOfStore', 'FinalStock', 'Text64', 'CodeOfModel', 'Text63', 'Text62'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '28 قطعة', 'كابولي لماسورة', '', '1.23', '1.0'],
      ['', '', '', '10 قطعة', 'حامل رف', '', '2.1', '1.0'],
    ]
    const result = parseExcelBuffer(makeBuffer(rows))
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ code: '1.23', name: 'كابولي لماسورة', quantity: 28 })
    expect(result[1]).toEqual({ code: '2.1', name: 'حامل رف', quantity: 10 })
  })

  it('sums duplicate product codes (multiple storage rows)', () => {
    const rows = [
      ['Text55', 'Text69', 'NameOfStore', 'FinalStock', 'Text64', 'CodeOfModel', 'Text63', 'Text62'],
      ['', '', 'مخزن 1', '20 قطعة', 'كابولي لماسورة', '', '1.23', '1.0'],
      ['', '', 'مخزن 2', '15 قطعة', 'كابولي لماسورة', '', '1.23', '1.0'],
    ]
    const result = parseExcelBuffer(makeBuffer(rows))
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(35)
  })

  it('skips empty rows', () => {
    const rows = [
      ['Text55', 'Text69', 'NameOfStore', 'FinalStock', 'Text64', 'CodeOfModel', 'Text63', 'Text62'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '5 قطعة', 'منتج', '', '1.1', '1.0'],
      ['', '', '', '', '', '', '', ''],
    ]
    const result = parseExcelBuffer(makeBuffer(rows))
    expect(result).toHaveLength(1)
  })

  it('detects columns by content when header is unknown', () => {
    const rows = [
      ['col_a', 'col_b', 'col_c', 'col_d'],
      ['', '30 قطعة', 'منتج اختبار', '5.10'],
      ['', '12 قطعة', 'منتج آخر', '5.11'],
    ]
    const result = parseExcelBuffer(makeBuffer(rows))
    expect(result).toHaveLength(2)
    expect(result[0].code).toBe('5.10')
    expect(result[0].quantity).toBe(30)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest __tests__/excel-parser.test.ts
```

Expected: `Cannot find module '@/lib/excel-parser'`

- [ ] **Step 3: Write `lib/excel-parser.ts`**

```ts
import * as XLSX from 'xlsx'

export interface ParsedProduct {
  code: string
  name: string
  quantity: number
}

export function parseExcelBuffer(buffer: Buffer): ParsedProduct[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  const { codeCol, nameCol, qtyCol } = detectColumns(rows)
  const productMap = new Map<string, { name: string; quantity: number }>()

  for (const row of rows) {
    const code = String(row[codeCol] ?? '').trim()
    const name = String(row[nameCol] ?? '').trim()
    const qtyRaw = String(row[qtyCol] ?? '').trim()

    if (!isProductCode(code) || !name) continue

    const quantity = parseQuantity(qtyRaw)
    if (productMap.has(code)) {
      productMap.get(code)!.quantity += quantity
    } else {
      productMap.set(code, { name, quantity })
    }
  }

  return Array.from(productMap.entries()).map(([code, { name, quantity }]) => ({
    code,
    name,
    quantity,
  }))
}

function detectColumns(rows: any[][]): {
  codeCol: number
  nameCol: number
  qtyCol: number
} {
  // Try header row first (check first 5 rows)
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map((c: any) => String(c).toLowerCase())
    const codeIdx = row.findIndex(
      (c: string) => c.includes('codeofmodel') || c === 'code'
    )
    const qtyIdx = row.findIndex(
      (c: string) => c.includes('finalstock') || c.includes('stock')
    )
    const nameIdx = row.findIndex(
      (c: string) => c.includes('text64') || c.includes('name')
    )
    if (codeIdx >= 0 && qtyIdx >= 0 && nameIdx >= 0) {
      return { codeCol: codeIdx, nameCol: nameIdx, qtyCol: qtyIdx }
    }
  }

  // Fallback: score columns by content pattern
  const codeScores = new Map<number, number>()
  const qtyScores = new Map<number, number>()
  const nameScores = new Map<number, number>()

  for (const row of rows.slice(0, 100)) {
    for (let col = 0; col < row.length; col++) {
      const val = String(row[col] ?? '').trim()
      if (isProductCode(val)) codeScores.set(col, (codeScores.get(col) ?? 0) + 1)
      if (val.includes('قطعة')) qtyScores.set(col, (qtyScores.get(col) ?? 0) + 1)
      if (/[؀-ۿ]{4,}/.test(val) && !val.includes('قطعة'))
        nameScores.set(col, (nameScores.get(col) ?? 0) + 1)
    }
  }

  const topCode = topCol(codeScores) ?? 6
  const topQty = topCol(qtyScores) ?? 3
  const topName = topCol(nameScores) ?? 4

  return { codeCol: topCode, nameCol: topName, qtyCol: topQty }
}

function topCol(scores: Map<number, number>): number | undefined {
  if (scores.size === 0) return undefined
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

function isProductCode(val: string): boolean {
  return /^\d+\.\d+$/.test(val)
}

function parseQuantity(raw: string): number {
  const match = raw.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest __tests__/excel-parser.test.ts
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/excel-parser.ts __tests__/excel-parser.test.ts jest.config.ts
git commit -m "feat: add smart Excel parser with tests"
```

---

## Task 5: Inventory Merger (with Tests)

**Files:**
- Create: `lib/inventory-merger.ts`, `__tests__/inventory-merger.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/inventory-merger.test.ts`:
```ts
import { mergeSnapshots } from '@/lib/inventory-merger'

const branchA = { _id: 'aaa', name: 'فرع أ' } as any
const branchB = { _id: 'bbb', name: 'فرع ب' } as any

const snapA = {
  branchId: 'aaa',
  uploadedAt: new Date('2026-05-15'),
  products: [
    { code: '1.1', name: 'منتج واحد', quantity: 10 },
    { code: '1.2', name: 'منتج اثنان', quantity: 5 },
  ],
} as any

const snapB = {
  branchId: 'bbb',
  uploadedAt: new Date('2026-05-18'),
  products: [
    { code: '1.1', name: 'منتج واحد', quantity: 20 },
    { code: '1.3', name: 'منتج ثلاثة', quantity: 8 },
  ],
} as any

describe('mergeSnapshots', () => {
  it('merges products from two branches', () => {
    const result = mergeSnapshots([branchA, branchB], [snapA, snapB])
    expect(result).toHaveLength(3)
  })

  it('shows null for missing branch quantities', () => {
    const result = mergeSnapshots([branchA, branchB], [snapA, snapB])
    const product12 = result.find(p => p.code === '1.2')!
    expect(product12.branches['aaa']).toBe(5)
    expect(product12.branches['bbb']).toBeNull()
  })

  it('calculates correct total (null branches excluded)', () => {
    const result = mergeSnapshots([branchA, branchB], [snapA, snapB])
    const product11 = result.find(p => p.code === '1.1')!
    expect(product11.total).toBe(30)
    const product12 = result.find(p => p.code === '1.2')!
    expect(product12.total).toBe(5)
  })

  it('sorts products by code numerically', () => {
    const result = mergeSnapshots([branchA, branchB], [snapA, snapB])
    expect(result[0].code).toBe('1.1')
    expect(result[1].code).toBe('1.2')
    expect(result[2].code).toBe('1.3')
  })

  it('handles branch with no snapshot gracefully', () => {
    const result = mergeSnapshots([branchA, branchB], [snapA])
    const product11 = result.find(p => p.code === '1.1')!
    expect(product11.branches['bbb']).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx jest __tests__/inventory-merger.test.ts
```

Expected: `Cannot find module '@/lib/inventory-merger'`

- [ ] **Step 3: Write `lib/inventory-merger.ts`**

```ts
import type { ISnapshot } from '@/models/Snapshot'
import type { IBranch } from '@/models/Branch'

export interface MergedProduct {
  code: string
  name: string
  categoryCode: string
  branches: Record<string, number | null>
  total: number
}

export function mergeSnapshots(
  branches: IBranch[],
  snapshots: ISnapshot[]
): MergedProduct[] {
  const snapshotByBranch = new Map<string, ISnapshot>()
  for (const snap of snapshots) {
    snapshotByBranch.set(snap.branchId.toString(), snap)
  }

  const productMap = new Map<string, MergedProduct>()

  for (const branch of branches) {
    const branchId = (branch._id as any).toString()
    const snapshot = snapshotByBranch.get(branchId)
    if (!snapshot) continue

    for (const product of snapshot.products) {
      if (!productMap.has(product.code)) {
        productMap.set(product.code, {
          code: product.code,
          name: product.name,
          categoryCode: product.code.split('.')[0],
          branches: {},
          total: 0,
        })
      }
      const merged = productMap.get(product.code)!
      merged.branches[branchId] = product.quantity
      merged.total += product.quantity
    }
  }

  // Fill null for branches missing a product
  for (const product of productMap.values()) {
    for (const branch of branches) {
      const branchId = (branch._id as any).toString()
      if (!(branchId in product.branches)) {
        product.branches[branchId] = null
      }
    }
  }

  return Array.from(productMap.values()).sort((a, b) => {
    const [aCat, aItem] = a.code.split('.').map(Number)
    const [bCat, bItem] = b.code.split('.').map(Number)
    return aCat !== bCat ? aCat - bCat : aItem - bItem
  })
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npx jest __tests__/inventory-merger.test.ts
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/inventory-merger.ts __tests__/inventory-merger.test.ts
git commit -m "feat: add inventory merger with tests"
```

---

## Task 6: Upload & Snapshots API

**Files:**
- Create: `app/api/upload/route.ts`, `app/api/snapshots/route.ts`, `app/api/inventory/route.ts`

- [ ] **Step 1: Write `app/api/upload/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'
import { parseExcelBuffer } from '@/lib/excel-parser'
import mongoose from 'mongoose'

export async function POST(request: Request) {
  await connectDB()

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const branchId = formData.get('branchId') as string | null

  if (!file || !branchId) {
    return NextResponse.json({ error: 'الملف ومعرف الفرع مطلوبان' }, { status: 400 })
  }

  if (!mongoose.isValidObjectId(branchId)) {
    return NextResponse.json({ error: 'معرف الفرع غير صالح' }, { status: 400 })
  }

  const branch = await Branch.findById(branchId)
  if (!branch) {
    return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let products: { code: string; name: string; quantity: number }[]

  try {
    products = parseExcelBuffer(buffer)
  } catch {
    return NextResponse.json({ error: 'فشل تحليل الملف — تأكد من صحة صيغة Excel' }, { status: 422 })
  }

  if (products.length === 0) {
    return NextResponse.json({ error: 'لم يتم العثور على منتجات في الملف' }, { status: 422 })
  }

  const snapshot = await Snapshot.create({ branchId, products })

  // Keep only last 10 snapshots per branch
  const allSnapshots = await Snapshot.find({ branchId })
    .sort({ uploadedAt: -1 })
    .select('_id')

  if (allSnapshots.length > 10) {
    const toDelete = allSnapshots.slice(10).map(s => s._id)
    await Snapshot.deleteMany({ _id: { $in: toDelete } })
  }

  return NextResponse.json({
    snapshotId: snapshot._id,
    productCount: products.length,
    uploadedAt: snapshot.uploadedAt,
  })
}
```

- [ ] **Step 2: Write `app/api/snapshots/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Snapshot from '@/models/Snapshot'

export async function GET(request: Request) {
  await connectDB()
  const { searchParams } = new URL(request.url)
  const branchId = searchParams.get('branchId')

  if (!branchId) {
    return NextResponse.json({ error: 'branchId مطلوب' }, { status: 400 })
  }

  const snapshots = await Snapshot.find({ branchId })
    .sort({ uploadedAt: -1 })
    .limit(10)
    .select('_id uploadedAt')

  return NextResponse.json(snapshots)
}
```

- [ ] **Step 3: Write `app/api/inventory/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Branch from '@/models/Branch'
import Snapshot from '@/models/Snapshot'
import { mergeSnapshots } from '@/lib/inventory-merger'

export async function GET(request: Request) {
  await connectDB()
  const { searchParams } = new URL(request.url)

  // Optional: ?snapshots=branchId1:snapshotId1,branchId2:snapshotId2
  const snapshotParam = searchParams.get('snapshots') ?? ''
  const selectedMap = new Map<string, string>()
  if (snapshotParam) {
    for (const pair of snapshotParam.split(',')) {
      const [branchId, snapshotId] = pair.split(':')
      if (branchId && snapshotId) selectedMap.set(branchId, snapshotId)
    }
  }

  const branches = await Branch.find().sort({ createdAt: 1 })
  const snapshots = await Promise.all(
    branches.map(async branch => {
      const branchId = (branch._id as any).toString()
      const selectedId = selectedMap.get(branchId)
      if (selectedId) {
        return Snapshot.findById(selectedId)
      }
      return Snapshot.findOne({ branchId }).sort({ uploadedAt: -1 })
    })
  )

  const validSnapshots = snapshots.filter(Boolean) as any[]
  const merged = mergeSnapshots(branches as any[], validSnapshots)

  return NextResponse.json({
    branches: branches.map(b => ({
      _id: (b._id as any).toString(),
      name: b.name,
    })),
    products: merged,
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/upload/ app/api/snapshots/ app/api/inventory/
git commit -m "feat: add upload, snapshots, and inventory API routes"
```

---

## Task 7: Auth System

**Files:**
- Create: `lib/session.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`, `middleware.ts`

- [ ] **Step 1: Write `lib/session.ts`**

```ts
import type { IronSessionOptions } from 'iron-session'

export interface SessionData {
  isAdmin: boolean
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'united-branches-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}
```

- [ ] **Step 2: Write `app/api/auth/login/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Write `app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  session.destroy()
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Write `app/api/auth/me/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  return NextResponse.json({ isAdmin: session.isAdmin ?? false })
}
```

- [ ] **Step 5: Write `middleware.ts`**

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.next()
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    if (!session.isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/session.ts app/api/auth/ middleware.ts
git commit -m "feat: add iron-session auth with admin middleware"
```

---

## Task 8: Root Layout (RTL Arabic)

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'الفروع المتحدة — إدارة المخزون',
  description: 'نظام متابعة مخزون الفروع',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 text-gray-900 min-h-screen font-sans antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 text-sm font-medium">
          <span className="text-blue-700 font-bold text-base">الفروع المتحدة</span>
          <a href="/" className="text-gray-600 hover:text-blue-700 transition-colors">عرض المخزون</a>
          <a href="/upload" className="text-gray-600 hover:text-blue-700 transition-colors">رفع ملف</a>
        </nav>
        <main className="max-w-screen-xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update `app/globals.css`** — keep Tailwind directives, remove boilerplate Next.js CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add RTL Arabic root layout with nav"
```

---

## Task 9: Preview Page

**Files:**
- Create: `components/preview/SearchFilters.tsx`, `components/preview/SnapshotDropdown.tsx`, `components/preview/BranchColumnHeader.tsx`, `components/preview/InventoryTable.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write `components/preview/SearchFilters.tsx`**

```tsx
'use client'

interface SearchFiltersProps {
  searchText: string
  onSearchChange: (val: string) => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (val: string) => void
  hideZeroStock: boolean
  onHideZeroChange: (val: boolean) => void
  branches: { _id: string; name: string }[]
  selectedBranch: string
  onBranchChange: (val: string) => void
}

export default function SearchFilters({
  searchText, onSearchChange,
  categories, selectedCategory, onCategoryChange,
  hideZeroStock, onHideZeroChange,
  branches, selectedBranch, onBranchChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center bg-white p-4 rounded-lg border border-gray-200">
      <input
        type="text"
        placeholder="ابحث باسم المنتج أو الكود..."
        value={searchText}
        onChange={e => onSearchChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">كل الفئات</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>فئة {cat}</option>
        ))}
      </select>
      <select
        value={selectedBranch}
        onChange={e => onBranchChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">كل الفروع</option>
        {branches.map(b => (
          <option key={b._id} value={b._id}>{b.name}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={hideZeroStock}
          onChange={e => onHideZeroChange(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        إخفاء الكميات الصفرية
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/preview/SnapshotDropdown.tsx`**

```tsx
'use client'

interface Snapshot {
  _id: string
  uploadedAt: string
}

interface SnapshotDropdownProps {
  branchId: string
  snapshots: Snapshot[]
  selectedId: string
  onChange: (branchId: string, snapshotId: string) => void
}

export default function SnapshotDropdown({
  branchId, snapshots, selectedId, onChange
}: SnapshotDropdownProps) {
  if (snapshots.length <= 1) return null
  return (
    <select
      value={selectedId}
      onChange={e => onChange(branchId, e.target.value)}
      className="text-xs border border-gray-200 rounded px-1 py-0.5 mt-1 w-full focus:outline-none"
    >
      {snapshots.map((s, i) => (
        <option key={s._id} value={s._id}>
          {i === 0 ? 'الأحدث — ' : ''}{new Date(s.uploadedAt).toLocaleDateString('ar-EG')}
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Write `components/preview/BranchColumnHeader.tsx`**

```tsx
interface BranchColumnHeaderProps {
  name: string
  uploadedAt?: string
}

export default function BranchColumnHeader({ name, uploadedAt }: BranchColumnHeaderProps) {
  return (
    <div>
      <div className="font-semibold">{name}</div>
      {uploadedAt && (
        <div className="text-xs font-normal text-gray-400 mt-0.5">
          {new Date(uploadedAt).toLocaleDateString('ar-EG')}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `components/preview/InventoryTable.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import SearchFilters from './SearchFilters'
import BranchColumnHeader from './BranchColumnHeader'
import SnapshotDropdown from './SnapshotDropdown'

interface Branch { _id: string; name: string }
interface MergedProduct {
  code: string; name: string; categoryCode: string
  branches: Record<string, number | null>; total: number
}
interface Snapshot { _id: string; uploadedAt: string }

interface Props {
  branches: Branch[]
  products: MergedProduct[]
  snapshotsByBranch: Record<string, Snapshot[]>
  latestByBranch: Record<string, Snapshot>
}

export default function InventoryTable({ branches, products, snapshotsByBranch, latestByBranch }: Props) {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [hideZero, setHideZero] = useState(false)
  const [selectedSnapshots, setSelectedSnapshots] = useState<Record<string, string>>({})

  const categories = useMemo(
    () => [...new Set(products.map(p => p.categoryCode))].sort((a, b) => Number(a) - Number(b)),
    [products]
  )

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (searchText && !p.name.includes(searchText) && !p.code.includes(searchText)) return false
      if (selectedCategory && p.categoryCode !== selectedCategory) return false
      if (selectedBranch && p.branches[selectedBranch] === null) return false
      if (hideZero && p.total === 0) return false
      return true
    })
  }, [products, searchText, selectedCategory, selectedBranch, hideZero])

  function handleSnapshotChange(branchId: string, snapshotId: string) {
    setSelectedSnapshots(prev => ({ ...prev, [branchId]: snapshotId }))
    // Reload data with new snapshot selection
    const params = new URLSearchParams()
    const merged = { ...selectedSnapshots, [branchId]: snapshotId }
    const pairs = branches.map(b => `${b._id}:${merged[b._id] ?? latestByBranch[b._id]?._id ?? ''}`).filter(p => p.includes(':'))
    if (pairs.length) params.set('snapshots', pairs.join(','))
    window.location.href = '/?' + params.toString()
  }

  return (
    <div>
      <SearchFilters
        searchText={searchText} onSearchChange={setSearchText}
        categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory}
        hideZeroStock={hideZero} onHideZeroChange={setHideZero}
        branches={branches} selectedBranch={selectedBranch} onBranchChange={setSelectedBranch}
      />

      <div className="text-sm text-gray-500 mb-2">{filtered.length} منتج</div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border-b border-gray-200 px-4 py-3 text-right font-semibold w-24">الكود</th>
              <th className="border-b border-gray-200 px-4 py-3 text-right font-semibold">اسم المنتج</th>
              {branches.map(branch => (
                <th key={branch._id} className="border-b border-gray-200 px-4 py-3 text-center font-semibold min-w-36">
                  <BranchColumnHeader
                    name={branch.name}
                    uploadedAt={latestByBranch[branch._id]?.uploadedAt}
                  />
                  <SnapshotDropdown
                    branchId={branch._id}
                    snapshots={snapshotsByBranch[branch._id] ?? []}
                    selectedId={selectedSnapshots[branch._id] ?? latestByBranch[branch._id]?._id ?? ''}
                    onChange={handleSnapshotChange}
                  />
                </th>
              ))}
              <th className="border-b border-gray-200 px-4 py-3 text-center font-semibold w-24 bg-blue-50">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product, idx) => (
              <tr key={product.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="border-b border-gray-100 px-4 py-2.5 font-mono text-xs text-gray-500">{product.code}</td>
                <td className="border-b border-gray-100 px-4 py-2.5">{product.name}</td>
                {branches.map(branch => {
                  const qty = product.branches[branch._id]
                  return (
                    <td key={branch._id} className="border-b border-gray-100 px-4 py-2.5 text-center">
                      {qty === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className={qty === 0 ? 'text-gray-400' : 'text-gray-800 font-medium'}>{qty}</span>
                      )}
                    </td>
                  )
                })}
                <td className="border-b border-gray-100 px-4 py-2.5 text-center font-bold text-blue-700 bg-blue-50/30">{product.total}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={branches.length + 3} className="py-12 text-center text-gray-400">لا توجد منتجات مطابقة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `app/page.tsx`**

```tsx
import InventoryTable from '@/components/preview/InventoryTable'

interface PageProps {
  searchParams: Promise<{ snapshots?: string }>
}

export const dynamic = 'force-dynamic'

async function getInventory(snapshotsParam?: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const url = snapshotsParam
    ? `${base}/api/inventory?snapshots=${snapshotsParam}`
    : `${base}/api/inventory`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return { branches: [], products: [] }
  return res.json()
}

async function getSnapshotsByBranch(branchIds: string[]) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const results = await Promise.all(
    branchIds.map(id =>
      fetch(`${base}/api/snapshots?branchId=${id}`, { cache: 'no-store' }).then(r => r.json())
    )
  )
  const byBranch: Record<string, any[]> = {}
  branchIds.forEach((id, i) => { byBranch[id] = results[i] ?? [] })
  return byBranch
}

export default async function PreviewPage({ searchParams }: PageProps) {
  const { snapshots: snapshotsParam } = await searchParams
  const { branches, products } = await getInventory(snapshotsParam)

  const snapshotsByBranch = branches.length
    ? await getSnapshotsByBranch(branches.map((b: any) => b._id))
    : {}

  const latestByBranch: Record<string, any> = {}
  for (const [branchId, snaps] of Object.entries(snapshotsByBranch)) {
    if ((snaps as any[]).length > 0) latestByBranch[branchId] = (snaps as any[])[0]
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-gray-800">عرض المخزون الموحد</h1>
      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">لا توجد فروع مسجلة بعد</p>
          <p className="text-sm">أضف فروعاً من <a href="/admin" className="text-blue-600 underline">صفحة الإدارة</a></p>
        </div>
      ) : (
        <InventoryTable
          branches={branches}
          products={products}
          snapshotsByBranch={snapshotsByBranch}
          latestByBranch={latestByBranch}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/preview/ app/page.tsx
git commit -m "feat: add preview page with merged inventory table and filters"
```

---

## Task 10: Upload Page

**Files:**
- Create: `components/upload/BranchSelector.tsx`, `components/upload/DropZone.tsx`, `components/upload/ProgressBar.tsx`
- Modify: `app/upload/page.tsx`

- [ ] **Step 1: Write `components/upload/BranchSelector.tsx`**

```tsx
interface Branch { _id: string; name: string }

interface Props {
  branches: Branch[]
  selectedId: string
  onChange: (id: string) => void
}

export default function BranchSelector({ branches, selectedId, onChange }: Props) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">اختر الفرع</label>
      <div className="flex flex-wrap gap-3">
        {branches.map(branch => (
          <button
            key={branch._id}
            onClick={() => onChange(branch._id)}
            className={`px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
              selectedId === branch._id
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400'
            }`}
          >
            {branch.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/upload/ProgressBar.tsx`**

```tsx
interface Props { progress: number; status: 'idle' | 'uploading' | 'success' | 'error'; message?: string }

export default function ProgressBar({ progress, status, message }: Props) {
  if (status === 'idle') return null

  const barColor =
    status === 'success' ? 'bg-green-500' :
    status === 'error' ? 'bg-red-500' : 'bg-blue-500'

  return (
    <div className="mt-4">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {message && (
        <p className={`mt-2 text-sm font-medium ${
          status === 'success' ? 'text-green-600' :
          status === 'error' ? 'text-red-600' : 'text-blue-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `components/upload/DropZone.tsx`**

```tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import ProgressBar from './ProgressBar'

interface Props {
  branchId: string
  branchName: string
  onSuccess: () => void
}

export default function DropZone({ branchId, branchName, onSuccess }: Props) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const uploadFile = useCallback(async (file: File) => {
    setStatus('uploading')
    setProgress(10)
    setMessage('جاري رفع الملف...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('branchId', branchId)

    setProgress(40)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      setProgress(80)
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'حدث خطأ أثناء الرفع')
        return
      }

      setProgress(100)
      setStatus('success')
      setMessage(`تم رفع ${data.productCount} منتج بنجاح لفرع ${branchName}`)
      onSuccess()
    } catch {
      setStatus('error')
      setMessage('فشل الاتصال — تأكد من اتصالك بالإنترنت')
    }
  }, [branchId, branchName, onSuccess])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) uploadFile(acceptedFiles[0])
  }, [uploadFile])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    disabled: status === 'uploading',
  })

  const borderColor = isDragReject
    ? 'border-red-400 bg-red-50'
    : isDragActive
    ? 'border-blue-500 bg-blue-50'
    : status === 'success'
    ? 'border-green-400 bg-green-50'
    : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${borderColor}`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">
          {status === 'success' ? '✅' : isDragActive ? '📂' : '📊'}
        </div>
        <p className="text-gray-600 font-medium">
          {isDragActive
            ? 'أفلت الملف هنا...'
            : status === 'uploading'
            ? 'جاري المعالجة...'
            : 'اسحب وأفلت ملف Excel هنا، أو انقر للاختيار'}
        </p>
        <p className="text-xs text-gray-400 mt-1">يدعم .xls و .xlsx</p>
      </div>
      <ProgressBar progress={progress} status={status} message={message} />
    </div>
  )
}
```

- [ ] **Step 4: Write `app/upload/page.tsx`**

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import BranchSelector from '@/components/upload/BranchSelector'
import DropZone from '@/components/upload/DropZone'

interface Branch { _id: string; name: string }

export default function UploadPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [uploadKey, setUploadKey] = useState(0)

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(data => {
      setBranches(data)
      if (data.length > 0) setSelectedBranchId(data[0]._id)
    })
  }, [])

  const handleSuccess = useCallback(() => {
    setUploadKey(k => k + 1)
  }, [])

  const selectedBranch = branches.find(b => b._id === selectedBranchId)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6 text-gray-800">رفع تقرير مخزون</h1>

      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>لا توجد فروع — أضف فرعاً من <a href="/admin" className="text-blue-600 underline">صفحة الإدارة</a> أولاً</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <BranchSelector
            branches={branches}
            selectedId={selectedBranchId}
            onChange={setSelectedBranchId}
          />
          {selectedBranch && (
            <DropZone
              key={uploadKey}
              branchId={selectedBranchId}
              branchName={selectedBranch.name}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        ملاحظة: يتم الكشف التلقائي عن الأعمدة — يستخدم النظام كود المنتج كمفتاح أساسي؛ قد تختلف أسماء المنتجات قليلاً بين الفروع وهذا طبيعي.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/upload/ app/upload/
git commit -m "feat: add upload page with drag-and-drop and progress bar"
```

---

## Task 11: Admin Login & Branch Manager

**Files:**
- Create: `components/admin/LoginForm.tsx`, `components/admin/BranchManager.tsx`
- Modify: `app/admin/login/page.tsx`, `app/admin/page.tsx`

- [ ] **Step 1: Write `components/admin/LoginForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'خطأ في تسجيل الدخول')
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 max-w-sm mx-auto mt-16 shadow-sm">
      <h2 className="text-lg font-bold mb-6 text-center text-gray-800">دخول الإدارة</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
        <input
          type="text" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required autoFocus
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {loading ? 'جاري الدخول...' : 'دخول'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Write `app/admin/login/page.tsx`**

```tsx
import LoginForm from '@/components/admin/LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Step 3: Write `components/admin/BranchManager.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Branch { _id: string; name: string }

export default function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function load() {
    const res = await fetch('/api/branches')
    setBranches(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    setError('')
    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setNewName('')
    await load()
  }

  async function handleEdit(id: string) {
    setError('')
    const res = await fetch(`/api/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setEditId(null)
    await load()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل تريد حذف فرع "${name}"؟ سيتم حذف جميع بياناته.`)) return
    await fetch(`/api/branches/${id}`, { method: 'DELETE' })
    await load()
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">إدارة الفروع</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          تسجيل الخروج
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">إضافة فرع جديد</label>
        <div className="flex gap-2">
          <input
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="اسم الفرع..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={e => e.key === 'Enter' && newName.trim() && handleAdd()}
          />
          <button
            onClick={handleAdd} disabled={!newName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            إضافة
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-2">
        {branches.map(branch => (
          <div key={branch._id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
            {editId === branch._id ? (
              <>
                <input
                  type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleEdit(branch._id)}
                />
                <button onClick={() => handleEdit(branch._id)} className="text-blue-600 text-sm font-medium hover:underline">حفظ</button>
                <button onClick={() => setEditId(null)} className="text-gray-400 text-sm hover:underline">إلغاء</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-gray-800 font-medium">{branch.name}</span>
                <button onClick={() => { setEditId(branch._id); setEditName(branch.name) }} className="text-gray-400 hover:text-blue-600 text-sm transition-colors">تعديل</button>
                <button onClick={() => handleDelete(branch._id, branch.name)} className="text-gray-400 hover:text-red-600 text-sm transition-colors">حذف</button>
              </>
            )}
          </div>
        ))}
        {branches.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">لا توجد فروع بعد — أضف فرعاً أعلاه</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write `app/admin/page.tsx`**

```tsx
import BranchManager from '@/components/admin/BranchManager'

export default function AdminPage() {
  return <BranchManager />
}
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/ app/admin/
git commit -m "feat: add admin login and branch manager page"
```

---

## Task 12: Run All Tests & Local Verify

- [ ] **Step 1: Run full test suite**

```bash
npx jest
```

Expected: all tests pass

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual test checklist**

| Action | Expected |
|---|---|
| Visit `http://localhost:3000` | Preview page loads (empty state if no branches) |
| Visit `/admin/login` | Login form appears |
| Log in with `admin` / `admin123` | Redirects to `/admin` |
| Add 3 branches from admin | Branches appear in list |
| Visit `/upload`, select a branch | Branch buttons appear, drop zone shows |
| Drop the sample `.xls` file | Progress bar animates, success message shows product count |
| Visit `/` | Table shows products with branch column |
| Use search filter | Table filters correctly |
| Visit `/admin` without login (private tab) | Redirected to `/admin/login` |

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: verify full flow locally"
```

---

## Task 13: Vercel Deploy

- [ ] **Step 1: Install Vercel CLI (if not installed)**

```bash
npm i -g vercel
```

- [ ] **Step 2: Add `NEXT_PUBLIC_BASE_URL` for production**

In `app/page.tsx`, the `base` URL uses `process.env.NEXT_PUBLIC_BASE_URL`. On Vercel, set this to your production domain. Update the env variable approach:

```bash
# In .env.local add:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

On Vercel dashboard, set:
```
NEXT_PUBLIC_BASE_URL=https://your-vercel-domain.vercel.app
MONGODB_URI=mongodb+srv://m7mod:275757@united-branches.duzabq5.mongodb.net/?appName=united-branches
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=<generate a random 32+ character string>
```

- [ ] **Step 3: Push final code**

```bash
git add .
git commit -m "chore: ready for Vercel deployment"
git push origin main
```

- [ ] **Step 4: Deploy to Vercel**

Either connect GitHub repo at vercel.com/new, or run:
```bash
vercel --prod
```

- [ ] **Step 5: Set env vars on Vercel**

Go to Vercel dashboard → Project → Settings → Environment Variables → add all 5 vars from Step 2.

- [ ] **Step 6: Redeploy after env vars**

```bash
vercel --prod
```

- [ ] **Step 7: Verify production**

Visit your Vercel URL. Test upload and preview with the sample `.xls` file.

---

## Self-Review Checklist

| Requirement | Covered by |
|---|---|
| 3 pages: Preview, Upload, Admin | Tasks 9, 10, 11 |
| Smart Excel column detection | Task 4 (parser with heuristics + header detection) |
| Duplicate product code → sum | Task 4 (productMap aggregation) |
| Last 10 snapshots per branch | Task 6 (upload API prunes to 10) |
| Snapshot dropdown in preview | Task 9 (SnapshotDropdown component) |
| Merge by product code (anchor) | Task 5 (merger uses code as key) |
| Missing branch = `—` | Task 5 (fills null for missing branches) |
| Total column per row | Task 9 (InventoryTable) |
| Upload date in branch header | Task 9 (BranchColumnHeader) |
| Arabic RTL UI | Task 8 (layout.tsx `dir="rtl"`) |
| Drag & drop with progress bar | Task 10 (DropZone + ProgressBar) |
| Advanced search & filters | Task 9 (SearchFilters — text, category, branch, zero-stock) |
| Admin auth protecting /admin | Task 7 (middleware + iron-session) |
| Dynamic branches (add/edit/delete) | Tasks 3, 11 |
| MongoDB + Vercel deploy | Tasks 2, 13 |
| Note about name differences | Task 10 (footer note in upload page) |
| Public upload, protected admin only | Task 7 (middleware matches `/admin/:path*` only) |
