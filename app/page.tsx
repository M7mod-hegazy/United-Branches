'use client'

import { useEffect, useMemo, useState } from 'react'
import { InventoryTable, type BranchMeta, type MergedProduct } from '@/components/preview/InventoryTable'
import { SearchFilters } from '@/components/preview/SearchFilters'
import { NameConflictsModal } from '@/components/preview/NameConflictsModal'
import { PriceConflictsModal } from '@/components/preview/PriceConflictsModal'

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
  const [showConflicts, setShowConflicts] = useState(false)
  const [showPriceConflicts, setShowPriceConflicts] = useState(false)
  const [showSellingPrice, setShowSellingPrice] = useState(false)
  const [showBuyingPrice, setShowBuyingPrice] = useState(false)

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

  const conflicts = useMemo(
    () =>
      data.products.filter((p) => {
        const uniqueNames = new Set(p.nameVariants.map((v) => v.name.trim().toLowerCase()))
        return uniqueNames.size > 1
      }),
    [data.products]
  )

  const priceConflicts = useMemo(
    () =>
      data.products.filter((p) => {
        const withPrices = p.priceVariants.filter(
          (v) => v.sellingPrice != null || v.buyingPrice != null
        )
        if (withPrices.length < 2) return false
        const uniqueSelling = new Set(
          withPrices.map((v) => v.sellingPrice).filter((v) => v != null)
        )
        const uniqueBuying = new Set(
          withPrices.map((v) => v.buyingPrice).filter((v) => v != null)
        )
        return uniqueSelling.size > 1 || uniqueBuying.size > 1
      }),
    [data.products]
  )

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
        <p className="text-xs font-bold tracking-widest text-[#1E6FBF] uppercase">الأرصدة الموحدة</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1A202C]">معاينة مخزون الفروع</h1>
        <p className="mt-1 text-sm text-[#5A7A9A] font-medium">متابعة فورية ومقارنة كميات المنتجات عبر جميع منافذ البيع والنشاط.</p>
      </div>
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
        </div>
      )}
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
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5A7A9A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
            <span>{productCount.toLocaleString('ar-EG')} صنف نشط حالياً</span>
          </div>
          {data.products.some((p) => p.priceVariants.length > 0) && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#A19D95] shrink-0">عرض الأسعار:</span>
              <button
                onClick={() => setShowSellingPrice((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                  showSellingPrice
                    ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-[#E2E0D9] bg-white text-[#78726A] hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${showSellingPrice ? 'bg-amber-500' : 'bg-[#D0CCC8]'}`} />
                سعر البيع
              </button>
              <button
                onClick={() => setShowBuyingPrice((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                  showBuyingPrice
                    ? 'border-green-400 bg-green-50 text-green-700 shadow-sm'
                    : 'border-[#E2E0D9] bg-white text-[#78726A] hover:border-green-300 hover:text-green-600'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${showBuyingPrice ? 'bg-green-500' : 'bg-[#D0CCC8]'}`} />
                سعر الشراء
              </button>
            </div>
          )}
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
            showSellingPrice={showSellingPrice}
            showBuyingPrice={showBuyingPrice}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
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
              <span className="text-xs font-semibold text-[#5A7A9A]">
                صفحة {safePage.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
              </span>
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
            </div>
          )}
        </>
      )}
      {showConflicts && (
        <NameConflictsModal
          conflicts={conflicts}
          onClose={() => setShowConflicts(false)}
        />
      )}
      {showPriceConflicts && (
        <PriceConflictsModal
          conflicts={priceConflicts}
          onClose={() => setShowPriceConflicts(false)}
        />
      )}
    </div>
  )
}

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
