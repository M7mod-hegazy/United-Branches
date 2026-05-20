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
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
        لا توجد بيانات بعد. أضف فرعا وارفع ملف Excel للبدء.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="sticky right-0 z-10 min-w-32 bg-slate-100 px-4 py-3 text-right">الكود</th>
            <th className="sticky right-32 z-10 min-w-64 bg-slate-100 px-4 py-3 text-right">الصنف</th>
            {branches.map((branch) => (
              <th key={branch.id} className="min-w-40 px-4 py-3 text-right align-top">
                <BranchColumnHeader
                  branch={branch}
                  selectedSnapshotId={selectedSnapshots[branch.id]}
                  onSnapshotChange={onSnapshotChange}
                />
              </th>
            ))}
            <th className="min-w-28 px-4 py-3 text-right">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.code} className="border-t border-slate-100 hover:bg-emerald-50/50">
              <td className="sticky right-0 bg-white px-4 py-3 font-mono text-xs">{product.code}</td>
              <td className="sticky right-32 bg-white px-4 py-3 font-medium">{product.name}</td>
              {branches.map((branch) => (
                <td key={branch.id} className="px-4 py-3 tabular-nums">
                  {product.branches[branch.id] ?? 0}
                </td>
              ))}
              <td className="px-4 py-3 font-bold tabular-nums text-emerald-800">{product.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
