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
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-blue-50 p-4.5 text-[#1E6FBF]">
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

  const extraCols = (showSellingPrice || showBuyingPrice) ? branches.length : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-premium">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-right">
          <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 sticky top-16 z-20 backdrop-blur-md">
            <tr>
              <th className="sticky right-0 z-30 min-w-32 bg-slate-50/90 border-l border-slate-200/60 px-6 py-4.5 text-right font-black text-xs uppercase tracking-wider">
                كود الصنف
              </th>
              <th className="sticky right-32 z-30 min-w-72 bg-slate-50/90 border-l border-slate-200/60 px-6 py-4.5 text-right font-black text-xs uppercase tracking-wider">
                اسم الصنف
              </th>
              {branches.map((branch) => (
                <th key={branch.id} className="min-w-56 px-6 py-4.5 text-right align-top font-black text-xs uppercase tracking-wider border-l border-slate-200/60">
                  <BranchColumnHeader
                    branch={branch}
                    selectedSnapshotId={selectedSnapshots[branch.id]}
                    onSnapshotChange={onSnapshotChange}
                  />
                </th>
              ))}
              {(showSellingPrice || showBuyingPrice) && branches.map((branch) => (
                <th key={`price-${branch.id}`} className="w-32 px-4 py-4.5 text-right font-black text-xs uppercase tracking-wider border-l border-slate-200/60 bg-gradient-to-b from-amber-50/20 to-green-50/10">
                  <div className="text-slate-700 font-extrabold truncate mb-2">{branch.name}</div>
                  <div className="flex flex-col gap-1.5">
                    {showSellingPrice && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800 tracking-wide w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        سعر البيع
                      </span>
                    )}
                    {showBuyingPrice && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-black text-green-800 tracking-wide w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                        سعر الشراء
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="min-w-36 px-6 py-4.5 text-right font-black text-xs uppercase tracking-wider bg-slate-50/80 border-r border-slate-200/60">
                إجمالي المخزون
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {products.map((product, idx) => (
              <tr key={product.code} className="group hover:bg-blue-50/30 transition-colors duration-200">
                
                {/* Product Code */}
                <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50/80 border-l border-slate-100 px-6 py-4.5 font-mono text-xs text-[#1E6FBF] font-extrabold">
                  <span className="rounded-lg bg-blue-50/50 px-2.5 py-1 border border-blue-100/30">
                    {product.code}
                  </span>
                </td>
                
                {/* Product Name */}
                <td className="sticky right-32 z-10 bg-white group-hover:bg-slate-50/80 border-l border-slate-100 px-6 py-4.5 font-extrabold text-slate-900 text-sm leading-relaxed max-w-xs sm:max-w-md">
                  <div>{product.name}</div>
                  {(() => {
                    const firstVariant = product.nameVariants[0]
                    if (!firstVariant) return null
                    const sourceBranch = branches.find((b) => b.id === firstVariant.branchId)
                    if (!sourceBranch) return null
                    return (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[10px] font-black bg-blue-50/50 text-[#1E6FBF] border border-blue-100/50 leading-none whitespace-nowrap">
                          <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {sourceBranch.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200/55 leading-none whitespace-nowrap">
                          <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(sourceBranch.uploadedAt).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                        </span>
                      </div>
                    )
                  })()}
                </td>
                
                {/* Branch Quantities */}
                {branches.map((branch) => {
                  const qty = product.branches[branch.id] ?? 0
                  return (
                    <td key={branch.id} className={`border-l border-slate-100 px-6 py-4.5 tabular-nums text-base ${qty === 0 ? 'text-slate-300 font-semibold' : 'text-slate-900 font-black'}`}>
                      {qty === 0 ? '٠' : qty.toLocaleString('ar-EG')}
                    </td>
                  )
                })}
                
                {/* Price Variant Columns */}
                {(showSellingPrice || showBuyingPrice) && branches.map((branch) => {
                  const variant = product.priceVariants.find((v) => v.branchId === branch.id)
                  return (
                    <td key={`price-${branch.id}`} className="w-32 border-l border-slate-100 px-3 py-3.5 bg-gradient-to-b from-amber-50/5 to-green-50/5 align-top">
                      <div className="flex flex-col gap-1.5">
                        {showSellingPrice && (
                          <div className="flex items-center gap-1.5">
                            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700 leading-tight border border-amber-200/50">بيع</span>
                            <span className="tabular-nums text-xs font-extrabold text-amber-900">
                              {variant?.sellingPrice != null ? variant.sellingPrice.toLocaleString('ar-EG') : <span className="text-slate-200">—</span>}
                            </span>
                          </div>
                        )}
                        {showBuyingPrice && (
                          <div className={`flex items-center gap-1.5 ${showSellingPrice ? 'mt-1.5 pt-1.5 border-t border-dashed border-slate-200/50' : ''}`}>
                            <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-black text-green-700 leading-tight border border-green-200/50">شراء</span>
                            <span className="tabular-nums text-xs font-bold text-green-800">
                              {variant?.buyingPrice != null ? variant.buyingPrice.toLocaleString('ar-EG') : <span className="text-slate-200">—</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
                
                {/* Total Quantity */}
                <td className="border-r border-slate-100 px-6 py-4.5 font-black tabular-nums text-base text-[#1E6FBF] bg-slate-50/30 group-hover:bg-blue-50/50 transition-colors">
                  {product.total.toLocaleString('ar-EG')}
                </td>
              </tr>
            ))}
            
            {products.length === 0 && (
              <tr>
                <td colSpan={branches.length + 3 + extraCols} className="py-24 text-center text-slate-400 font-extrabold text-sm">
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
