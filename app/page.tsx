'use client'

import { useEffect, useMemo, useState } from 'react'
import { InventoryTable, type BranchMeta, type MergedProduct } from '@/components/preview/InventoryTable'
import { SearchFilters } from '@/components/preview/SearchFilters'

interface InventoryResponse {
  branches: BranchMeta[]
  products: MergedProduct[]
}

export default function HomePage() {
  const [data, setData] = useState<InventoryResponse>({ branches: [], products: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [hideZero, setHideZero] = useState(false)
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSnapshots, setSelectedSnapshots] = useState<Record<string, string>>({})

  const PAGE_SIZE = 100

  useEffect(() => {
    const selected = Object.entries(selectedSnapshots)
      .filter(([, snapshotId]) => snapshotId)
      .map(([branch, snapshot]) => `${branch}:${snapshot}`)
      .join(',')
    setLoading(true)
    fetch(`/api/inventory${selected ? `?snapshots=${selected}` : ''}`)
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [selectedSnapshots])

  const categories = useMemo(() => {
    const prefixes = new Set<string>()
    for (const product of data.products) {
      const dot = product.code.indexOf('.')
      if (dot > 0) prefixes.add(product.code.slice(0, dot))
    }
    return Array.from(prefixes).sort((a, b) => Number(a) - Number(b))
  }, [data.products])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return data.products.filter((product) => {
      const matchesSearch =
        !needle ||
        product.code.toLowerCase().includes(needle) ||
        product.name.toLowerCase().includes(needle)
      const branchQuantity = branchId ? product.branches[branchId] || 0 : product.total
      const matchesBranch = !branchId || branchQuantity > 0
      const matchesZero = !hideZero || branchQuantity > 0
      const matchesCategory = !category || product.code.startsWith(category + '.')
      return matchesSearch && matchesBranch && matchesZero && matchesCategory
    })
  }, [branchId, category, data.products, hideZero, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const productCount = filtered.length

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold tracking-widest text-[#A88554] uppercase">الأرصدة الموحدة</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1E2229]">معاينة مخزون الفروع</h1>
        <p className="mt-1 text-sm text-[#78726A] font-medium">متابعة فورية ومقارنة كميات المنتجات عبر جميع منافذ البيع والنشاط.</p>
      </div>
      <SearchFilters
        search={search}
        branchId={branchId}
        hideZero={hideZero}
        category={category}
        branches={data.branches}
        categories={categories}
        onSearchChange={(v) => { setSearch(v); resetPage() }}
        onBranchChange={(v) => { setBranchId(v); resetPage() }}
        onHideZeroChange={(v) => { setHideZero(v); resetPage() }}
        onCategoryChange={(v) => { setCategory(v); resetPage() }}
      />
      {!loading && (
        <div className="flex items-center gap-2 text-xs font-bold text-[#78726A] px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A88554]" />
          <span>{productCount.toLocaleString('ar-EG')} صنف نشط حالياً</span>
        </div>
      )}
      {loading ? (
        <InventorySkeleton />
      ) : (
        <>
          <InventoryTable
            branches={data.branches}
            products={paginated}
            selectedSnapshots={selectedSnapshots}
            onSnapshotChange={(branch, snapshot) =>
              setSelectedSnapshots((current) => ({ ...current, [branch]: snapshot }))
            }
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E0D9] bg-white px-4 py-2 text-sm font-medium text-[#78726A] hover:border-[#A88554] hover:text-[#A88554] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                السابق
              </button>
              <span className="text-xs font-semibold text-[#78726A]">
                صفحة {safePage.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-1.5 rounded-lg border border-[#E2E0D9] bg-white px-4 py-2 text-sm font-medium text-[#78726A] hover:border-[#A88554] hover:text-[#A88554] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                التالي
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#EAE8E4] bg-white">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex gap-6 border-b border-[#EAE8E4] bg-[#FAF8F5] px-6 py-4">
          <div className="h-4 w-24 rounded bg-[#EAE8E4]" />
          <div className="h-4 w-60 rounded bg-[#EAE8E4]" />
          <div className="h-4 w-28 rounded bg-[#EAE8E4]" />
          <div className="h-4 w-28 rounded bg-[#EAE8E4]" />
          <div className="h-4 w-28 rounded bg-[#EAE8E4]" />
          <div className="h-4 w-20 rounded bg-[#EAE8E4]" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-6 border-b border-[#F2EFEA] px-6 py-4 items-center"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <div className="h-3.5 w-16 rounded bg-[#F2EFEA]" />
            <div className="h-3.5 rounded bg-[#F2EFEA]" style={{ width: `${180 + (i % 3) * 50}px` }} />
            <div className="h-3.5 w-14 rounded bg-[#F2EFEA]" />
            <div className="h-3.5 w-14 rounded bg-[#F2EFEA]" />
            <div className="h-3.5 w-14 rounded bg-[#F2EFEA]" />
            <div className="h-3.5 w-12 rounded bg-[#F2EFEA]" />
          </div>
        ))}
      </div>
    </div>
  )
}

