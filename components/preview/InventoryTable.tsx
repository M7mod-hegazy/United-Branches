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
  priceVariants: { branchId: string; branchName: string; sellingPrice?: number; buyingPrice?: number }[]
}

interface InventoryTableProps {
  branches: BranchMeta[]
  products: MergedProduct[]
  selectedSnapshots: Record<string, string>
  onSnapshotChange: (branchId: string, snapshotId: string) => void
  showSellingPrice: boolean
  showBuyingPrice: boolean
}

export function InventoryTable({
  branches,
  products,
  selectedSnapshots,
  onSnapshotChange,
  showSellingPrice,
  showBuyingPrice,
}: InventoryTableProps) {
  if (!branches.length) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-premium flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-blue-50 p-4 text-[#1E6FBF]">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span className="font-extrabold text-slate-800 text-lg">لا توجد بيانات متوفرة حالياً</span>
        <span className="text-sm font-semibold text-slate-400 max-w-sm leading-relaxed">
          يرجى تسجيل فرع جديد أولاً من لوحة التحكم، ثم رفع تقرير مخزون Excel للبدء في معاينة الأرصدة الموحدة.
        </span>
      </div>
    )
  }

  // Right-offset for sticky columns (RTL layout)
  // Code col: right-0, min-w-[128px] → 128px
  // Name col: right-[128px], min-w-[288px] → 128+288=416px
  const CODE_COL_W = 128
  const NAME_COL_W = 288

  return (
    <div className="rounded-3xl border border-slate-200/40 bg-white shadow-premium">
      {/*
        KEY FIX: This div is the ONLY scroll container.
        overflow: auto on both axes + max-height makes `sticky` on thead work correctly.
        When overflow-x is set on a parent, sticky in the Y direction breaks — so we need
        ONE container that scrolls both directions.
      */}
      <div
        className="overflow-auto rounded-3xl"
        style={{ maxHeight: 'calc(100vh - var(--header-h) - 5rem)' }}
      >
        <table className="min-w-full border-collapse text-right">
          {/* ───── STICKY HEADER ───── */}
          <thead className="sticky top-0 z-30">
            <tr className="border-b border-slate-200/60">
              {/* Code column header — sticky right */}
              <th
                className="sticky right-0 z-40 bg-slate-50 border-l border-slate-200/40 px-5 py-4 text-right font-black text-[11px] uppercase tracking-wider whitespace-nowrap"
                style={{ minWidth: `${CODE_COL_W}px` }}
              >
                <span className="text-slate-500">كود الصنف</span>
              </th>

              {/* Name column header — sticky right after code */}
              <th
                className="sticky z-40 bg-slate-50 border-l border-slate-200/40 px-5 py-4 text-right font-black text-[11px] uppercase tracking-wider"
                style={{ right: `${CODE_COL_W}px`, minWidth: `${NAME_COL_W}px` }}
              >
                <span className="text-slate-500">اسم الصنف</span>
              </th>

              {/* Branch columns */}
              {branches.map((branch) => (
                <th
                  key={branch.id}
                  className="bg-slate-50 px-5 py-3 text-right align-top font-black text-[11px] uppercase tracking-wider border-l border-slate-200/40"
                  style={{ minWidth: '220px' }}
                >
                  <BranchColumnHeader
                    branch={branch}
                    selectedSnapshotId={selectedSnapshots[branch.id]}
                    onSnapshotChange={onSnapshotChange}
                  />
                </th>
              ))}

              {/* Total column header — sticky left */}
              <th className="sticky left-0 z-40 bg-slate-50 border-r border-slate-200/40 px-5 py-4 text-right font-black text-[11px] uppercase tracking-wider whitespace-nowrap">
                <span className="text-slate-500">إجمالي المخزون</span>
              </th>
            </tr>
          </thead>

          {/* ───── BODY ───── */}
          <tbody className="divide-y divide-slate-100/80">
            {products.map((product) => (
              <tr key={product.code} className="group hover:bg-blue-50/20 transition-colors duration-150">

                {/* Product Code */}
                <td
                  className="sticky right-0 z-20 bg-white group-hover:bg-blue-50/30 border-l border-slate-100 px-5 py-4 font-mono text-xs text-[#1E6FBF] font-black transition-colors"
                  style={{ minWidth: `${CODE_COL_W}px` }}
                >
                  <span className="rounded-lg bg-blue-50/60 px-2.5 py-1 border border-blue-100/40">
                    {product.code}
                  </span>
                </td>

                {/* Product Name */}
                <td
                  className="sticky z-20 bg-white group-hover:bg-blue-50/30 border-l border-slate-100 px-5 py-4 font-extrabold text-slate-900 text-sm leading-snug transition-colors"
                  style={{ right: `${CODE_COL_W}px`, minWidth: `${NAME_COL_W}px`, maxWidth: '340px' }}
                >
                  <div className="truncate">{product.name}</div>
                  {(() => {
                    const firstVariant = product.nameVariants[0]
                    if (!firstVariant) return null
                    const sourceBranch = branches.find((b) => b.id === firstVariant.branchId)
                    if (!sourceBranch) return null
                    return (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {/* Branch name badge */}
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black bg-blue-50/70 text-[#1E6FBF] border border-blue-100/50 leading-none whitespace-nowrap">
                          <svg className="h-2 w-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {sourceBranch.name}
                        </span>
                        {/* Upload date badge */}
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-200/60 leading-none whitespace-nowrap">
                          <svg className="h-2 w-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(sourceBranch.uploadedAt).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                        </span>
                      </div>
                    )
                  })()}
                </td>


                {/* Branch Quantities & Prices */}
                {branches.map((branch) => {
                  const qty = product.branches[branch.id] ?? 0
                  const variant = product.priceVariants.find((v) => v.branchId === branch.id)
                  return (
                    <td key={branch.id} className="border-l border-slate-100 px-5 py-4 tabular-nums align-middle">
                      <div className="flex flex-col gap-1">
                        {/* Quantity */}
                        <div className={`text-sm font-extrabold ${qty === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
                          {qty === 0 ? '—' : qty.toLocaleString('ar-EG')}
                        </div>

                        {/* Prices */}
                        {(showSellingPrice || showBuyingPrice) && variant && (
                          <div className="flex flex-col gap-0.5 border-t border-dashed border-slate-100 pt-1 mt-0.5 text-[10px]">
                            {showSellingPrice && variant.sellingPrice != null && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 font-semibold">بيع</span>
                                <span className="font-black text-amber-600">
                                  {variant.sellingPrice.toLocaleString('ar-EG')}
                                </span>
                              </div>
                            )}
                            {showBuyingPrice && variant.buyingPrice != null && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 font-semibold">شراء</span>
                                <span className="font-black text-emerald-600">
                                  {variant.buyingPrice.toLocaleString('ar-EG')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}

                {/* Total Quantity */}
                <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-50/30 border-r border-slate-100 px-5 py-4 font-black tabular-nums text-sm text-[#1E6FBF] transition-colors">
                  {product.total.toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td
                  colSpan={branches.length + 3}
                  className="py-24 text-center text-slate-400 font-extrabold text-sm"
                >
                  لا توجد أصناف تطابق معايير البحث والفرز الحالية
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
