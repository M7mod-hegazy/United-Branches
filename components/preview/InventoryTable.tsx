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
        <span className="font-bold text-[#1A202C] text-base">لا توجد بيانات متوفرة</span>
        <span className="text-xs font-semibold text-[#8AAAC8] max-w-sm">يرجى تسجيل فرع جديد أولاً، ثم رفع تقرير مخزون Excel للبدء في معاينة الأرصدة الموحدة.</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#C8D9EC] bg-white">
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
              <td className="border border-[#C8D9EC] px-5 py-3.5 font-extrabold tabular-nums text-base text-[#1E6FBF] bg-[#EEF4FB]/50 group-hover:bg-[#DCEEFB]">
                {product.total.toLocaleString('ar-EG')}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={branches.length + 3} className="py-16 text-center text-[#8AAAC8] font-bold text-sm">
                لا توجد أصناف تطابق معايير البحث والفرز الحالية
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
