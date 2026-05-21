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
      <div className="rounded-xl border border-dashed border-[#C8D9EC] bg-white p-12 text-center text-[#5A7A9A] flex flex-col items-center justify-center gap-3">
        <svg className="h-10 w-10 text-[#1E6FBF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="font-bold text-[#1A202C] text-base">لا توجد بيانات متوفرة</span>
        <span className="text-xs font-semibold text-[#8AAAC8] max-w-sm">يرجى تسجيل فرع جديد أولاً، ثم رفع تقرير مخزون Excel للبدء في معاينة الأرصدة الموحدة.</span>
      </div>
    )
  }

  const extraCols = (showSellingPrice || showBuyingPrice) ? branches.length : 0

  return (
    <div className="rounded-xl border border-[#C8D9EC] bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-[#EEF4FB] text-[#5A7A9A] sticky top-16 z-20">
          <tr>
            <th className="sticky right-0 z-30 min-w-32 bg-[#EEF4FB] border-b-2 border-l border-b-[#1E6FBF] border-l-[#C8D9EC] px-5 py-4 text-right font-extrabold text-xs uppercase tracking-wider">الكود</th>
            <th className="sticky right-32 z-30 min-w-64 bg-[#EEF4FB] border-b-2 border-l border-b-[#1E6FBF] border-l-[#C8D9EC] px-5 py-4 text-right font-extrabold text-xs uppercase tracking-wider">الصنف</th>
            {branches.map((branch) => (
              <th key={branch.id} className="min-w-48 px-5 py-4 text-right align-top font-extrabold text-xs uppercase tracking-wider border-b-2 border-b-[#1E6FBF] border-l border-l-[#C8D9EC]">
                <BranchColumnHeader
                  branch={branch}
                  selectedSnapshotId={selectedSnapshots[branch.id]}
                  onSnapshotChange={onSnapshotChange}
                />
              </th>
            ))}
            {(showSellingPrice || showBuyingPrice) && branches.map((branch) => (
              <th key={`price-${branch.id}`} className="w-28 px-3 py-4 text-right font-extrabold text-xs uppercase tracking-wider border-b-2 border-b-[#1E6FBF] border-l border-l-[#C8D9EC] bg-gradient-to-b from-amber-50/60 to-green-50/30">
                <div className="text-[#4A4540] font-bold truncate mb-1.5">{branch.name}</div>
                <div className="flex flex-col gap-1">
                  {showSellingPrice && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 normal-case tracking-normal w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      سعر البيع
                    </span>
                  )}
                  {showBuyingPrice && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-100 border border-green-300 px-1.5 py-0.5 text-[10px] font-bold text-green-800 normal-case tracking-normal w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      سعر الشراء
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th className="min-w-32 px-5 py-4 text-right font-extrabold text-xs uppercase tracking-wider bg-[#EEF4FB] border-b-2 border-r border-b-[#1E6FBF] border-r-[#C8D9EC]">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => (
            <tr key={product.code} className={`group hover:bg-[#EBF3FC] transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F0F6FF]/40'}`}>
              <td className="sticky right-0 z-10 bg-white group-hover:bg-[#EBF3FC] border border-[#C8D9EC] px-5 py-3.5 font-mono text-xs text-[#5A7A9A] font-bold">{product.code}</td>
              <td className="sticky right-32 z-10 bg-white group-hover:bg-[#EBF3FC] border border-[#C8D9EC] px-5 py-3 font-bold text-[#1A202C] text-[13px]">
                <div>{product.name}</div>
                {(() => {
                  const firstVariant = product.nameVariants[0]
                  if (!firstVariant) return null
                  const sourceBranch = branches.find((b) => b.id === firstVariant.branchId)
                  if (!sourceBranch) return null
                  return (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-[#EEF4FB] text-[#1E6FBF] border border-[#C8D9EC] leading-none whitespace-nowrap">
                        <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {sourceBranch.name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200 leading-none whitespace-nowrap">
                        <svg className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(sourceBranch.uploadedAt).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                      </span>
                    </div>
                  )
                })()}
              </td>
              {branches.map((branch) => {
                const qty = product.branches[branch.id] ?? 0
                return (
                  <td key={branch.id} className={`border border-[#C8D9EC] px-5 py-3.5 tabular-nums text-base ${qty === 0 ? 'text-[#8AAAC8]/70 font-medium' : 'text-[#1A202C] font-bold'}`}>
                    {qty === 0 ? '٠' : qty.toLocaleString('ar-EG')}
                  </td>
                )
              })}
              {(showSellingPrice || showBuyingPrice) && branches.map((branch) => {
                const variant = product.priceVariants.find((v) => v.branchId === branch.id)
                return (
                  <td key={`price-${branch.id}`} className="w-28 border border-[#C8D9EC] px-2.5 py-2 bg-gradient-to-b from-amber-50/20 to-green-50/10 align-top">
                    {showSellingPrice && (
                      <div className="flex items-center gap-1">
                        <span className="shrink-0 rounded bg-amber-100 px-1 py-px text-[9px] font-bold text-amber-700 leading-tight border border-amber-200">بيع</span>
                        <span className="tabular-nums text-xs font-bold text-amber-900">
                          {variant?.sellingPrice != null ? variant.sellingPrice.toLocaleString('ar-EG') : <span className="text-[#C8D9EC]">—</span>}
                        </span>
                      </div>
                    )}
                    {showBuyingPrice && (
                      <div className={`flex items-center gap-1 ${showSellingPrice ? 'mt-1 pt-1 border-t border-dashed border-[#D0E8D0]' : ''}`}>
                        <span className="shrink-0 rounded bg-green-100 px-1 py-px text-[9px] font-bold text-green-700 leading-tight border border-green-200">شراء</span>
                        <span className="tabular-nums text-xs font-semibold text-green-900">
                          {variant?.buyingPrice != null ? variant.buyingPrice.toLocaleString('ar-EG') : <span className="text-[#C8D9EC]">—</span>}
                        </span>
                      </div>
                    )}
                  </td>
                )
              })}
              <td className="border border-[#C8D9EC] px-5 py-3.5 font-extrabold tabular-nums text-base text-[#1E6FBF] bg-[#EEF4FB]/50 group-hover:bg-[#DCEEFB]">
                {product.total.toLocaleString('ar-EG')}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={branches.length + 3 + extraCols} className="py-16 text-center text-[#8AAAC8] font-bold text-sm">
                لا توجد أصناف تطابق معايير البحث والفرز الحالية
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
