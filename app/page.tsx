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
  const [selectedSnapshots, setSelectedSnapshots] = useState<Record<string, string>>({})

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
      return matchesSearch && matchesBranch && matchesZero
    })
  }, [branchId, data.products, hideZero, search])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">نظام مخزون الفروع</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">معاينة موحدة للأرصدة</h1>
      </div>
      <SearchFilters
        search={search}
        branchId={branchId}
        hideZero={hideZero}
        branches={data.branches}
        onSearchChange={setSearch}
        onBranchChange={setBranchId}
        onHideZeroChange={setHideZero}
      />
      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          جاري تحميل البيانات...
        </div>
      ) : (
        <InventoryTable
          branches={data.branches}
          products={filtered}
          selectedSnapshots={selectedSnapshots}
          onSnapshotChange={(branch, snapshot) =>
            setSelectedSnapshots((current) => ({ ...current, [branch]: snapshot }))
          }
        />
      )}
    </div>
  )
}
