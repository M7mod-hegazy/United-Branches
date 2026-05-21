# Blue Theme Redesign + Name Conflict Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap the warm beige/gold palette for a clean corporate blue theme, and add a top-of-page button on the preview page that shows how many products share a code but have different names across branches, with a modal listing them.

**Architecture:** The data layer change (Task 1) extends `MergedProduct` in `lib/inventory-merger.ts` to carry `nameVariants[]`, which flows through the API automatically. The UI feature (Tasks 2–3) adds a `NameConflictsModal` component and wires a conflict button into `app/page.tsx`. Theme changes (Tasks 4–8) are mechanical color-token swaps across all preview/layout files — no logic changes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS (arbitrary values), Jest + ts-jest, Cairo Arabic font, RTL layout.

---

## File Map

| File | Change |
|---|---|
| `lib/inventory-merger.ts` | Add `NameVariant` interface, add `nameVariants` field to `MergedProduct`, populate during merge |
| `__tests__/inventory-merger.test.ts` | Update existing test + add conflict detection test |
| `components/preview/InventoryTable.tsx` | Add `nameVariants` to local `MergedProduct` type + theme tokens |
| `components/preview/NameConflictsModal.tsx` | **New** — modal listing conflicted products |
| `app/page.tsx` | Add conflict useMemo, conflict button, modal state + theme tokens |
| `app/globals.css` | Body background token |
| `app/layout.tsx` | Header, nav, login button theme tokens |
| `components/preview/SearchFilters.tsx` | All input/select/checkbox theme tokens |
| `components/preview/BranchColumnHeader.tsx` | Date dot + text theme tokens |
| `components/preview/SnapshotDropdown.tsx` | Select border/focus theme tokens |

---

## Task 1: Extend inventory-merger with nameVariants

**Files:**
- Modify: `lib/inventory-merger.ts`
- Modify: `__tests__/inventory-merger.test.ts`

- [ ] **Step 1: Update the test to expect nameVariants (it will fail)**

Replace the full contents of `__tests__/inventory-merger.test.ts` with:

```ts
import { mergeInventory } from '@/lib/inventory-merger'

describe('mergeInventory', () => {
  it('merges products across branches and calculates totals', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع أ',
        uploadedAt: '2026-05-20T10:00:00.000Z',
        products: [
          { code: 'P1', name: 'منتج 1', quantity: 4 },
          { code: 'P2', name: 'منتج 2', quantity: 1 },
        ],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع ب',
        uploadedAt: '2026-05-20T11:00:00.000Z',
        products: [
          { code: 'p1', name: 'منتج 1', quantity: 6 },
          { code: 'P3', name: 'منتج 3', quantity: 2 },
        ],
      },
    ])

    expect(result.branches).toHaveLength(2)
    expect(result.products).toEqual([
      {
        code: 'p1',
        name: 'منتج 1',
        total: 10,
        branches: { 'branch-a': 4, 'branch-b': 6 },
        nameVariants: [
          { branchId: 'branch-a', branchName: 'فرع أ', name: 'منتج 1' },
          { branchId: 'branch-b', branchName: 'فرع ب', name: 'منتج 1' },
        ],
      },
      {
        code: 'p2',
        name: 'منتج 2',
        total: 1,
        branches: { 'branch-a': 1 },
        nameVariants: [{ branchId: 'branch-a', branchName: 'فرع أ', name: 'منتج 2' }],
      },
      {
        code: 'p3',
        name: 'منتج 3',
        total: 2,
        branches: { 'branch-b': 2 },
        nameVariants: [{ branchId: 'branch-b', branchName: 'فرع ب', name: 'منتج 3' }],
      },
    ])
  })

  it('collects all name variants when branches use different names for the same code', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع الرياض',
        uploadedAt: '2026-05-21T10:00:00.000Z',
        products: [{ code: 'P1', name: 'قلم أحمر', quantity: 3 }],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع جدة',
        uploadedAt: '2026-05-21T11:00:00.000Z',
        products: [{ code: 'p1', name: 'قلم رصاص', quantity: 5 }],
      },
    ])

    const product = result.products[0]
    expect(product.code).toBe('p1')
    expect(product.nameVariants).toEqual([
      { branchId: 'branch-a', branchName: 'فرع الرياض', name: 'قلم أحمر' },
      { branchId: 'branch-b', branchName: 'فرع جدة', name: 'قلم رصاص' },
    ])
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/inventory-merger.test.ts --no-coverage
```

Expected: both tests FAIL — `nameVariants` does not exist yet.

- [ ] **Step 3: Update inventory-merger.ts**

Replace the full contents of `lib/inventory-merger.ts` with:

```ts
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

export interface MergedProduct {
  code: string
  name: string
  total: number
  branches: Record<string, number>
  nameVariants: NameVariant[]
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
      products.set(code, existing)
    })
  })

  return {
    branches,
    products: Array.from(products.values()).sort((a, b) => a.code.localeCompare(b.code)),
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/inventory-merger.test.ts --no-coverage
```

Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/inventory-merger.ts __tests__/inventory-merger.test.ts
git commit -m "feat: track nameVariants per product in inventory merger"
```

---

## Task 2: Propagate nameVariants to frontend type + create NameConflictsModal

**Files:**
- Modify: `components/preview/InventoryTable.tsx` (type only)
- Create: `components/preview/NameConflictsModal.tsx`

- [ ] **Step 1: Add nameVariants to InventoryTable's MergedProduct interface**

In `components/preview/InventoryTable.tsx`, replace the `MergedProduct` interface (lines 11–16):

```ts
export interface MergedProduct {
  code: string
  name: string
  total: number
  branches: Record<string, number>
  nameVariants: { branchId: string; branchName: string; name: string }[]
}
```

- [ ] **Step 2: Create NameConflictsModal component**

Create `components/preview/NameConflictsModal.tsx` with this content:

```tsx
'use client'

import { useEffect } from 'react'

interface NameVariant {
  branchId: string
  branchName: string
  name: string
}

interface ConflictProduct {
  code: string
  nameVariants: NameVariant[]
}

interface NameConflictsModalProps {
  conflicts: ConflictProduct[]
  onClose: () => void
}

export function NameConflictsModal({ conflicts, onClose }: NameConflictsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between bg-white border-b border-[#C8D9EC] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1A202C]">أصناف بأسماء متعارضة</h2>
            <p className="text-xs text-[#5A7A9A] mt-0.5">{conflicts.length.toLocaleString('ar-EG')} صنف</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A9A] hover:bg-[#EEF4FB] hover:text-[#1A202C] transition-colors text-lg font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-3">
          {conflicts.map((product) => (
            <div
              key={product.code}
              className="rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] p-4"
            >
              <div className="text-xs font-mono font-bold text-[#1E6FBF] mb-3">
                كود: {product.code}
              </div>
              <ul className="space-y-1.5">
                {product.nameVariants.map((variant) => (
                  <li key={variant.branchId} className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-[#5A7A9A] min-w-32 shrink-0">
                      {variant.branchName}
                    </span>
                    <span className="text-[#8AAAC8]">←</span>
                    <span className="font-medium text-[#1A202C]">{variant.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/preview/InventoryTable.tsx components/preview/NameConflictsModal.tsx
git commit -m "feat: add NameConflictsModal and extend MergedProduct type"
```

---

## Task 3: Wire conflict button and modal into page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add import and state for the modal**

At the top of `app/page.tsx`, add the import after the existing imports:

```ts
import { NameConflictsModal } from '@/components/preview/NameConflictsModal'
```

Inside `HomePage`, after the existing `useState` declarations (after line with `selectedSnapshots`), add:

```ts
const [showConflicts, setShowConflicts] = useState(false)
```

- [ ] **Step 2: Add the conflicts useMemo**

After the `categories` useMemo block (after the block ending around line 43), add:

```ts
const conflicts = useMemo(
  () =>
    data.products.filter((p) => {
      const uniqueNames = new Set(p.nameVariants.map((v) => v.name.trim().toLowerCase()))
      return uniqueNames.size > 1
    }),
  [data.products]
)
```

- [ ] **Step 3: Add conflict button between title and SearchFilters**

In the JSX, between the closing `</div>` of the title block and the `<SearchFilters` component, add:

```tsx
{!loading && conflicts.length > 0 && (
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
```

- [ ] **Step 4: Render the modal at the bottom of the returned JSX**

Just before the closing `</div>` of the component's return, add:

```tsx
{showConflicts && (
  <NameConflictsModal
    conflicts={conflicts}
    onClose={() => setShowConflicts(false)}
  />
)}
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add name conflict button and modal to preview page"
```

---

## Task 4: Apply blue theme to globals.css and layout.tsx

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update globals.css**

Replace the body rule in `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased select-none bg-[#F5F8FC] text-[#1A202C];
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  button, input, select, textarea {
    @apply transition-all duration-200 ease-out focus:outline-none;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}
```

- [ ] **Step 2: Update layout.tsx**

Replace the full contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'الفروع المتحدة — إدارة المخزون الموحد',
  description: 'نظام إدارة ومتابعة مخزون الفروع الموحد بتقارير ذكية ومرونة فائقة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} font-sans`}>
      <body
        suppressHydrationWarning
        className="bg-[#F5F8FC] text-[#1A202C] antialiased"
      >
        <header className="border-b border-[#C8D9EC] bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-tight text-[#1A202C] transition-colors group-hover:text-[#1E6FBF]">
                الفروع المتحدة
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold">
              <Link className="text-[#5A7A9A] hover:text-[#1A202C] transition-colors relative py-1" href="/">
                المعاينة
              </Link>
              <Link className="text-[#5A7A9A] hover:text-[#1A202C] transition-colors relative py-1" href="/upload">
                رفع ملف
              </Link>
              <Link className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E6FBF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1557A0] transition-colors" href="/admin">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                تسجيل الدخول
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: apply corporate blue theme to globals and layout"
```

---

## Task 5: Apply blue theme to page.tsx (title, skeleton, pagination)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update title accent and count indicator**

In the JSX title block, change:
- `text-[#A88554]` → `text-[#1E6FBF]` (the "الأرصدة الموحدة" label)
- `text-[#1E2229]` → `text-[#1A202C]` (h1 color)
- `text-[#78726A]` → `text-[#5A7A9A]` (subtitle)

In the count line (`{productCount} صنف نشط`):
- `text-[#78726A]` → `text-[#5A7A9A]`
- `bg-[#A88554]` → `bg-[#1E6FBF]`

- [ ] **Step 2: Update InventorySkeleton function**

Replace the `InventorySkeleton` function at the bottom of `app/page.tsx` with:

```tsx
function InventorySkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#C8D9EC] bg-white">
      <div className="animate-pulse">
        <div className="flex gap-6 border-b border-[#C8D9EC] bg-[#EEF4FB] px-6 py-4">
          <div className="h-4 w-24 rounded bg-[#C8D9EC]" />
          <div className="h-4 w-60 rounded bg-[#C8D9EC]" />
          <div className="h-4 w-28 rounded bg-[#C8D9EC]" />
          <div className="h-4 w-28 rounded bg-[#C8D9EC]" />
          <div className="h-4 w-28 rounded bg-[#C8D9EC]" />
          <div className="h-4 w-20 rounded bg-[#C8D9EC]" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-6 border-b border-[#D0E3F5] px-6 py-4 items-center"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <div className="h-3.5 w-16 rounded bg-[#D0E3F5]" />
            <div className="h-3.5 rounded bg-[#D0E3F5]" style={{ width: `${180 + (i % 3) * 50}px` }} />
            <div className="h-3.5 w-14 rounded bg-[#D0E3F5]" />
            <div className="h-3.5 w-14 rounded bg-[#D0E3F5]" />
            <div className="h-3.5 w-14 rounded bg-[#D0E3F5]" />
            <div className="h-3.5 w-12 rounded bg-[#D0E3F5]" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update pagination buttons**

Replace both `<button>` elements in the pagination section with the same logic but new tokens:

Previous button:
```tsx
<button
  onClick={() => setPage((p) => Math.max(1, p - 1))}
  disabled={safePage === 1}
  className="flex items-center gap-1.5 rounded-lg border border-[#C8D9EC] bg-white px-4 py-2 text-sm font-medium text-[#5A7A9A] hover:border-[#1E6FBF] hover:text-[#1E6FBF] disabled:opacity-40 disabled:pointer-events-none transition-colors"
>
  <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
  السابق
</button>
```

Page count span:
```tsx
<span className="text-xs font-semibold text-[#5A7A9A]">
  صفحة {safePage.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
</span>
```

Next button:
```tsx
<button
  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
  disabled={safePage === totalPages}
  className="flex items-center gap-1.5 rounded-lg border border-[#C8D9EC] bg-white px-4 py-2 text-sm font-medium text-[#5A7A9A] hover:border-[#1E6FBF] hover:text-[#1E6FBF] disabled:opacity-40 disabled:pointer-events-none transition-colors"
>
  التالي
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
</button>
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "style: apply blue theme to page title, skeleton, pagination"
```

---

## Task 6: Apply blue theme to InventoryTable.tsx

**Files:**
- Modify: `components/preview/InventoryTable.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
'use client'

import { BranchColumnHeader } from './BranchColumnHeader'

export interface BranchMeta {
  id: string
  name: string
  uploadedAt: string
}

export interface MergedProduct {
  code: string
  name: string
  total: number
  branches: Record<string, number>
  nameVariants: { branchId: string; branchName: string; name: string }[]
}

interface InventoryTableProps {
  branches: BranchMeta[]
  products: MergedProduct[]
  selectedSnapshots: Record<string, string>
  onSnapshotChange: (branchId: string, snapshotId: string) => void
}

export function InventoryTable({
  branches,
  products,
  selectedSnapshots,
  onSnapshotChange,
}: InventoryTableProps) {
  if (!branches.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#C8D9EC] bg-white p-12 text-center text-[#5A7A9A] flex flex-col items-center justify-center gap-3">
        <svg className="h-10 w-10 text-[#1E6FBF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="font-semibold text-[#1A202C] text-base">لا توجد بيانات متوفرة</span>
        <span className="text-xs text-[#8AAAC8] max-w-sm">يرجى تسجيل فرع جديد أولاً، ثم رفع تقرير مخزون Excel للبدء في معاينة الأرصدة الموحدة.</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#C8D9EC] bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-[#EEF4FB] text-[#5A7A9A] border-b border-[#C8D9EC]">
          <tr>
            <th className="sticky right-0 z-10 min-w-32 bg-[#EEF4FB] border-l border-[#C8D9EC] px-5 py-4 text-right font-bold text-xs uppercase tracking-wider">الكود</th>
            <th className="sticky right-32 z-10 min-w-64 bg-[#EEF4FB] border-l border-[#C8D9EC] px-5 py-4 text-right font-bold text-xs uppercase tracking-wider">الصنف</th>
            {branches.map((branch) => (
              <th key={branch.id} className="min-w-48 px-5 py-4 text-right align-top font-bold text-xs uppercase tracking-wider">
                <BranchColumnHeader
                  branch={branch}
                  selectedSnapshotId={selectedSnapshots[branch.id]}
                  onSnapshotChange={onSnapshotChange}
                />
              </th>
            ))}
            <th className="min-w-32 px-5 py-4 text-right font-bold text-xs uppercase tracking-wider bg-[#EEF4FB]/50 border-r border-[#C8D9EC]">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D0E3F5]">
          {products.map((product, idx) => (
            <tr key={product.code} className={`group hover:bg-[#EBF3FC] transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F0F6FF]/40'}`}>
              <td className="sticky right-0 bg-white group-hover:bg-[#EBF3FC] border-l border-[#C8D9EC] px-5 py-3.5 font-mono text-xs text-[#5A7A9A] font-semibold">{product.code}</td>
              <td className="sticky right-32 bg-white group-hover:bg-[#EBF3FC] border-l border-[#C8D9EC] px-5 py-3.5 font-bold text-[#1A202C] text-[13px]">{product.name}</td>
              {branches.map((branch) => {
                const qty = product.branches[branch.id] ?? 0
                return (
                  <td key={branch.id} className={`px-5 py-3.5 tabular-nums text-base ${qty === 0 ? 'text-[#8AAAC8]/70 font-normal' : 'text-[#1A202C] font-bold'}`}>
                    {qty === 0 ? '٠' : qty.toLocaleString('ar-EG')}
                  </td>
                )
              })}
              <td className="px-5 py-3.5 font-bold tabular-nums text-base text-[#1E6FBF] bg-[#EEF4FB]/50 border-r border-[#C8D9EC] group-hover:bg-[#DCEEfB]">
                {product.total.toLocaleString('ar-EG')}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={branches.length + 3} className="py-16 text-center text-[#8AAAC8] font-semibold text-sm">
                لا توجد أصناف تطابق معايير البحث والفرز الحالية
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/preview/InventoryTable.tsx
git commit -m "style: apply blue theme to InventoryTable"
```

---

## Task 7: Apply blue theme to SearchFilters.tsx

**Files:**
- Modify: `components/preview/SearchFilters.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
'use client'

interface SearchFiltersProps {
  search: string
  branchId: string
  hideZero: boolean
  category: string
  branches: { id: string; name: string }[]
  categories: string[]
  onSearchChange: (value: string) => void
  onBranchChange: (value: string) => void
  onHideZeroChange: (value: boolean) => void
  onCategoryChange: (value: string) => void
}

export function SearchFilters({
  search,
  branchId,
  hideZero,
  category,
  branches,
  categories,
  onSearchChange,
  onBranchChange,
  onHideZeroChange,
  onCategoryChange,
}: SearchFiltersProps) {
  return (
    <section className="grid gap-4 rounded-xl border border-[#C8D9EC] bg-white p-5 md:grid-cols-[1fr_220px_220px_auto] items-center">
      <div className="relative">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث بالكود أو اسم الصنف..."
          className="h-11 w-full rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] px-4 pl-10 text-sm placeholder-[#8AAAC8] focus:border-[#1E6FBF] focus:bg-white focus:ring-1 focus:ring-[#1E6FBF]"
        />
        <span className="absolute left-3 top-3.5 text-[#5A7A9A]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>
      <div className="relative">
        <select
          value={branchId}
          onChange={(event) => onBranchChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] px-4 text-sm text-[#1A202C] appearance-none focus:border-[#1E6FBF] focus:bg-white focus:ring-1 focus:ring-[#1E6FBF]"
        >
          <option value="">جميع الفروع</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <span className="absolute left-3 top-4 pointer-events-none text-[#5A7A9A]">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      <div className="relative">
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] px-4 text-sm text-[#1A202C] appearance-none focus:border-[#1E6FBF] focus:bg-white focus:ring-1 focus:ring-[#1E6FBF]"
        >
          <option value="">جميع الفئات</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              الفئة {cat}
            </option>
          ))}
        </select>
        <span className="absolute left-3 top-4 pointer-events-none text-[#5A7A9A]">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      <label className="flex h-11 items-center gap-3 rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] px-4 cursor-pointer select-none hover:border-[#1E6FBF] hover:bg-white">
        <input
          type="checkbox"
          checked={hideZero}
          onChange={(event) => onHideZeroChange(event.target.checked)}
          className="h-4 w-4 rounded border-[#C8D9EC] text-[#1E6FBF] focus:ring-[#1E6FBF] accent-[#1E6FBF]"
        />
        <span className="whitespace-nowrap text-sm font-medium text-[#5A7A9A]">إخفاء الأرصدة الصفرية</span>
      </label>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/preview/SearchFilters.tsx
git commit -m "style: apply blue theme to SearchFilters"
```

---

## Task 8: Apply blue theme to BranchColumnHeader and SnapshotDropdown

**Files:**
- Modify: `components/preview/BranchColumnHeader.tsx`
- Modify: `components/preview/SnapshotDropdown.tsx`

- [ ] **Step 1: Update BranchColumnHeader.tsx**

Replace the full contents of `components/preview/BranchColumnHeader.tsx` with:

```tsx
'use client'

import { SnapshotDropdown } from './SnapshotDropdown'

interface BranchColumnHeaderProps {
  branch: { id: string; name: string; uploadedAt: string }
  selectedSnapshotId?: string
  onSnapshotChange: (branchId: string, snapshotId: string) => void
}

export function BranchColumnHeader({
  branch,
  selectedSnapshotId,
  onSnapshotChange,
}: BranchColumnHeaderProps) {
  return (
    <div className="min-w-44 text-right py-1">
      <div className="font-bold text-sm text-[#1A202C]">{branch.name}</div>
      <div className="text-[10px] font-semibold text-[#8AAAC8] mt-1 flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-[#1E6FBF]/60" />
        {new Date(branch.uploadedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
      </div>
      <SnapshotDropdown
        branchId={branch.id}
        selectedSnapshotId={selectedSnapshotId}
        onChange={onSnapshotChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update SnapshotDropdown.tsx**

Replace the full contents of `components/preview/SnapshotDropdown.tsx` with:

```tsx
'use client'

import { useEffect, useState } from 'react'

interface SnapshotOption {
  _id: string
  uploadedAt: string
}

interface SnapshotDropdownProps {
  branchId: string
  selectedSnapshotId?: string
  onChange: (branchId: string, snapshotId: string) => void
}

export function SnapshotDropdown({ branchId, selectedSnapshotId, onChange }: SnapshotDropdownProps) {
  const [snapshots, setSnapshots] = useState<SnapshotOption[]>([])

  useEffect(() => {
    fetch(`/api/snapshots?branchId=${branchId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setSnapshots)
      .catch(() => setSnapshots([]))
  }, [branchId])

  return (
    <div className="relative mt-2">
      <select
        value={selectedSnapshotId || ''}
        onChange={(event) => onChange(branchId, event.target.value)}
        className="w-full rounded-lg border border-[#C8D9EC] bg-white pl-7 pr-3 py-1.5 text-xs font-medium text-[#5A7A9A] appearance-none focus:border-[#1E6FBF] focus:ring-1 focus:ring-[#1E6FBF]"
      >
        <option value="">آخر تقرير رفع</option>
        {snapshots.map((snapshot) => (
          <option key={snapshot._id} value={snapshot._id}>
            {new Date(snapshot.uploadedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </option>
        ))}
      </select>
      <span className="absolute left-2.5 top-2.5 pointer-events-none text-[#5A7A9A]">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/preview/BranchColumnHeader.tsx components/preview/SnapshotDropdown.tsx
git commit -m "style: apply blue theme to BranchColumnHeader and SnapshotDropdown"
```

---

## Done

All tasks complete. The app now has:
- Clean corporate blue theme across all preview and layout components
- A conflict button at the top of the preview page showing count of products with mismatched names across branches
- A modal listing each conflicted product with every branch's name for it
