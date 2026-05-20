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
      <div className="rounded-xl border border-dashed border-[#E2E0D9] bg-white p-12 text-center text-[#78726A] flex flex-col items-center justify-center gap-3">
        <svg className="h-10 w-10 text-[#A88554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="font-semibold text-[#1E2229] text-base">لا توجد بيانات متوفرة</span>
        <span className="text-xs text-[#A19D95] max-w-sm">يرجى تسجيل فرع جديد أولاً، ثم رفع تقرير مخزون Excel للبدء في معاينة الأرصدة الموحدة.</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#EAE8E4] bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-[#FAF8F5] text-[#78726A] border-b border-[#EAE8E4]">
          <tr>
            <th className="sticky right-0 z-10 min-w-32 bg-[#FAF8F5] border-l border-[#EAE8E4] px-5 py-4 text-right font-bold text-xs uppercase tracking-wider">الكود</th>
            <th className="sticky right-32 z-10 min-w-64 bg-[#FAF8F5] border-l border-[#EAE8E4] px-5 py-4 text-right font-bold text-xs uppercase tracking-wider">الصنف</th>
            {branches.map((branch) => (
              <th key={branch.id} className="min-w-48 px-5 py-4 text-right align-top font-bold text-xs uppercase tracking-wider">
                <BranchColumnHeader
                  branch={branch}
                  selectedSnapshotId={selectedSnapshots[branch.id]}
                  onSnapshotChange={onSnapshotChange}
                />
              </th>
            ))}
            <th className="min-w-32 px-5 py-4 text-right font-bold text-xs uppercase tracking-wider bg-[#FAF8F5]/50 border-r border-[#EAE8E4]">الإجمالي</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F2EFEA]">
          {products.map((product, idx) => (
            <tr key={product.code} className={`group hover:bg-[#FDFBF9] transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FCFAF7]/30'}`}>
              <td className="sticky right-0 bg-white group-hover:bg-[#FDFBF9] border-l border-[#EAE8E4] px-5 py-3.5 font-mono text-xs text-[#78726A] font-semibold">{product.code}</td>
              <td className="sticky right-32 bg-white group-hover:bg-[#FDFBF9] border-l border-[#EAE8E4] px-5 py-3.5 font-bold text-[#1E2229] text-[13px]">{product.name}</td>
              {branches.map((branch) => {
                const qty = product.branches[branch.id] ?? 0
                return (
                  <td key={branch.id} className={`px-5 py-3.5 font-semibold tabular-nums text-sm ${qty === 0 ? 'text-[#C7C3BB]/70 font-normal' : 'text-[#1E2229]'}`}>
                    {qty === 0 ? '٠' : qty.toLocaleString('ar-EG')}
                  </td>
                )
              })}
              <td className="px-5 py-3.5 font-bold tabular-nums text-sm text-[#A88554] bg-[#FAF8F5]/30 border-r border-[#EAE8E4] group-hover:bg-[#FAF6F0]">
                {product.total.toLocaleString('ar-EG')}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={branches.length + 3} className="py-16 text-center text-[#A19D95] font-semibold text-sm">
                لا توجد أصناف تطابق معايير البحث والفرز الحالية
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

