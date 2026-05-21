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
              <th key={`price-${branch.id}`} className="min-w-28 px-3 py-4 text-right font-extrabold text-xs uppercase tracking-wider border-b-2 border-b-[#1E6FBF] border-l border-l-[#C8D9EC] bg-amber-50/30">
                <div className="text-[#78726A]">{branch.name}</div>
                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                  {showSellingPrice && <span className="text-amber-600 font-bold normal-case tracking-normal">بيع</span>}
                  {showBuyingPrice && <span className="text-green-600 font-bold normal-case tracking-normal">شراء</span>}
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
              <td className="sticky right-32 z-10 bg-white group-hover:bg-[#EBF3FC] border border-[#C8D9EC] px-5 py-3.5 font-bold text-[#1A202C] text-[13px]">{product.name}</td>
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
                  <td key={`price-${branch.id}`} className="border border-[#C8D9EC] px-3 py-2.5 bg-amber-50/20 align-top">
                    {showSellingPrice && (
                      <div className="tabular-nums text-xs font-bold text-amber-800">
                        {variant?.sellingPrice != null ? variant.sellingPrice.toLocaleString('ar-EG') : <span className="text-[#C8D9EC]">—</span>}
                      </div>
                    )}
                    {showBuyingPrice && (
                      <div className="tabular-nums text-xs font-semibold text-green-800 mt-0.5">
                        {variant?.buyingPrice != null ? variant.buyingPrice.toLocaleString('ar-EG') : <span className="text-[#C8D9EC]">—</span>}
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
