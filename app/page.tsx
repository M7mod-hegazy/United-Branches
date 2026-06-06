'use client'

import { useEffect, useMemo, useState } from 'react'
import { InventoryTable, type BranchMeta, type MergedProduct } from '@/components/preview/InventoryTable'
import { SearchFilters } from '@/components/preview/SearchFilters'
import { NameConflictsModal } from '@/components/preview/NameConflictsModal'
import { PriceConflictsModal } from '@/components/preview/PriceConflictsModal'
import { SharedUpdatesModal } from '@/components/preview/SharedUpdatesModal'
import { exportToExcel } from '@/lib/export-report'

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

  const [updatesCount, setUpdatesCount] = useState(0)
  const [showUpdatesModal, setShowUpdatesModal] = useState(false)

  const PAGE_SIZE = 100

  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/shared-updates?t=' + Date.now())
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUpdatesCount(data.length)
          }
        })
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30_000)
    return () => clearInterval(interval)
  }, [])

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
    <div className="mx-auto w-full max-w-[1600px] space-y-8">
      {/* Premium Elegant Header & Info Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/40 bg-white/60 p-8 backdrop-blur-md shadow-premium">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-[#1E6FBF] border border-blue-100/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
              الأرصدة الموحدة للفروع
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              معاينة وحركة مخزون الفروع
            </h1>
            <p className="mt-3 text-sm text-slate-500 font-extrabold leading-relaxed">
              متابعة فورية ومقارنة كميات المنتجات والأسعار عبر جميع منافذ البيع والنشاط، مع كشف فوري لتعارض الأسماء وتحديثات التسعير المعتمدة.
            </p>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="grid grid-cols-2 gap-4 sm:min-w-[320px] flex-1">
              <div className="rounded-2xl border border-slate-200/40 bg-white/80 p-5 shadow-sm hover:border-[#1E6FBF] hover:-translate-y-[2px] transition-all duration-300">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide">المنتجات النشطة</div>
                <div className="mt-2 text-5xl font-black text-slate-900 tabular-nums">
                  {loading ? '…' : productCount.toLocaleString('en-US')}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/40 bg-white/80 p-5 shadow-sm hover:border-indigo-400 hover:-translate-y-[2px] transition-all duration-300">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide">الفروع النشطة</div>
                <div className="mt-2 text-5xl font-black text-[#1E6FBF] tabular-nums">
                  {loading ? '…' : data.branches.length.toLocaleString('en-US')}
                </div>
              </div>
            </div>
            {!loading && (
              <button
                onClick={() =>
                  exportToExcel({
                    branches: data.branches,
                    products: data.products,
                    showSellingPrice,
                    showBuyingPrice,
                  })
                }
                className="rounded-2xl border border-slate-200/40 bg-white/80 p-5 shadow-sm hover:border-green-400 hover:bg-green-50/20 hover:-translate-y-[2px] transition-all duration-300 group shrink-0"
                title="تصدير التقرير إلى Excel"
              >
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide group-hover:text-green-700 transition-colors">تصدير</div>
                <div className="mt-1 flex items-center gap-1.5 text-[#1E6FBF] group-hover:text-green-600 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span className="text-xs font-black">Excel</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications & Alerts — Price Updates always visible, conflicts conditional */}
      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Always-visible price updates button */}
          <button
            onClick={() => setShowUpdatesModal(true)}
            className={`relative flex items-center gap-4 rounded-2xl border p-5 text-right transition-all duration-300 group ${
              updatesCount > 0
                ? 'border-amber-200/60 bg-gradient-to-r from-amber-50/50 to-amber-100/10 hover:scale-[1.01] hover:shadow-premium'
                : 'border-slate-200/40 bg-white/60 hover:border-slate-300 hover:bg-white/80'
            }`}
          >
            {updatesCount > 0 && (
              <span className="absolute left-4 top-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
            <div className={`rounded-xl p-2.5 text-white shadow-sm group-hover:scale-105 transition-transform duration-200 ${
              updatesCount > 0 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-300'
            }`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-black ${ updatesCount > 0 ? 'text-amber-900' : 'text-slate-500'}`}>
                تحديثات أسعار معممة
              </div>
              <div className={`mt-1 text-[11px] font-bold truncate ${ updatesCount > 0 ? 'text-amber-700/80' : 'text-slate-400'}`}>
                {updatesCount > 0
                  ? `${updatesCount.toLocaleString('en-US')} قائمة أسعار جديدة جاهزة للمطابقة`
                  : 'لا توجد تحديثات أسعار معممة حالياً'}
              </div>
            </div>
          </button>

          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflicts(true)}
              className="relative flex items-center gap-4 rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50/50 to-rose-100/10 p-5 text-right transition-all duration-300 hover:scale-[1.01] hover:shadow-premium group"
            >
              <div className="rounded-xl bg-red-500 p-2.5 text-white shadow-sm shadow-red-500/20 group-hover:scale-105 transition-transform duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-rose-900">تعارض أسماء المنتجات</div>
                <div className="mt-1 text-[11px] font-bold text-rose-700/80 truncate">
                  كشف {conflicts.length.toLocaleString('en-US')} أصناف تختلف أسماؤها بين الفروع
                </div>
              </div>
            </button>
          )}

          {priceConflicts.length > 0 && (
            <button
              onClick={() => setShowPriceConflicts(true)}
              className="relative flex items-center gap-4 rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-50/50 to-violet-100/10 p-5 text-right transition-all duration-300 hover:scale-[1.01] hover:shadow-premium group"
            >
              <div className="rounded-xl bg-violet-600 p-2.5 text-white shadow-sm shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-violet-900">تعارض أسعار البيع/الشراء</div>
                <div className="mt-1 text-[11px] font-bold text-violet-700/80 truncate">
                  كشف {priceConflicts.length.toLocaleString('en-US')} أصناف تختلف أسعارها بين الفروع
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Panel */}
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

      {/* Pricing Toggles & Results Counter */}
      {!loading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#1E6FBF]" />
            <span>العثور على {productCount.toLocaleString('en-US')} صنف نشط</span>
          </div>
          
          {data.products.some((p) => p.priceVariants.length > 0) && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 shrink-0">تضمين قوائم الأسعار:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/40">
                <button
                  onClick={() => setShowSellingPrice((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
                    showSellingPrice
                      ? 'bg-white text-amber-700 shadow-sm border border-amber-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${showSellingPrice ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  سعر البيع
                </button>
                <button
                  onClick={() => setShowBuyingPrice((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
                    showBuyingPrice
                      ? 'bg-white text-green-700 shadow-sm border border-green-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${showBuyingPrice ? 'bg-green-500' : 'bg-slate-300'}`} />
                  سعر الشراء
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Inventory Display Grid */}
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
          
          {/* Beautiful Modern Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:border-[#1E6FBF] hover:text-[#1E6FBF] disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 hover:shadow-sm"
              >
                <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
                السابق
              </button>
              
              <div className="rounded-xl bg-slate-100 border border-slate-200/40 px-4 py-2 text-xs font-black text-slate-500 tracking-wider">
                صفحة {safePage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
              </div>
              
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:border-[#1E6FBF] hover:text-[#1E6FBF] disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 hover:shadow-sm"
              >
                التالي
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
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
      {showUpdatesModal && (
        <SharedUpdatesModal
          onClose={() => setShowUpdatesModal(false)}
        />
      )}
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-premium">
      <div className="animate-pulse">
        <div className="flex gap-6 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-4 w-60 rounded bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-6 border-b border-slate-100 px-6 py-5 items-center"
            style={{ opacity: 1 - i * 0.1 }}
          >
            <div className="h-4 w-16 rounded bg-slate-100" />
            <div className="h-4 rounded bg-slate-100" style={{ width: `${180 + (i % 3) * 50}px` }} />
            <div className="h-4 w-14 rounded bg-slate-100" />
            <div className="h-4 w-14 rounded bg-slate-100" />
            <div className="h-4 w-14 rounded bg-slate-100" />
            <div className="h-4 w-12 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

