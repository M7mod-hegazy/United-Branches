'use client'

import { useEffect, useMemo, useState } from 'react'

interface PriceVariant {
  branchId: string
  branchName: string
  sellingPrice?: number
  buyingPrice?: number
}

interface PriceConflictProduct {
  code: string
  name: string
  priceVariants: PriceVariant[]
}

interface PriceConflictsModalProps {
  conflicts: PriceConflictProduct[]
  onClose: () => void
}

function isDiffValue(value: number | undefined, allValues: (number | undefined)[]): boolean {
  const defined = allValues.filter((v) => v !== undefined) as number[]
  if (defined.length < 2) return false
  return value !== defined[0]
}

export function PriceConflictsModal({ conflicts, onClose }: PriceConflictsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showNames, setShowNames] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return conflicts
    return conflicts.filter(
      (p) =>
        p.code.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle)
    )
  }, [conflicts, query])

  function copyPrices(variant: PriceVariant, key: string) {
    const parts: string[] = []
    if (variant.sellingPrice != null) parts.push(`سعر البيع: ${variant.sellingPrice}`)
    if (variant.buyingPrice != null) parts.push(`سعر الشراء: ${variant.buyingPrice}`)
    navigator.clipboard.writeText(parts.join(' | '))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C8D9EC] px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1A202C]">أصناف بأسعار متعارضة</h2>
            <p className="text-xs font-semibold text-[#5A7A9A] mt-0.5">
              {filtered.length.toLocaleString('ar-EG')} من {conflicts.length.toLocaleString('ar-EG')} صنف
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNames((v) => !v)}
              className="rounded-lg border border-[#C8D9EC] px-3 py-1.5 text-xs font-bold text-[#5A7A9A] hover:border-[#1E6FBF] hover:text-[#1E6FBF] transition-colors"
            >
              {showNames ? 'إخفاء الأسماء' : 'إظهار الأسماء'}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A9A] hover:bg-[#EEF4FB] hover:text-[#1A202C] transition-colors text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-[#C8D9EC] shrink-0">
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالكود أو الاسم..."
              className="h-10 w-full rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] px-4 pl-10 text-sm font-medium placeholder-[#8AAAC8] focus:border-[#1E6FBF] focus:bg-white focus:ring-1 focus:ring-[#1E6FBF]"
            />
            <span className="absolute left-3 top-3 text-[#5A7A9A]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm font-semibold text-[#8AAAC8]">لا توجد نتائج</p>
          )}
          {filtered.map((product) => {
            const allSelling = product.priceVariants.map((v) => v.sellingPrice)
            const allBuying = product.priceVariants.map((v) => v.buyingPrice)
            return (
              <div key={product.code} className="rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] p-4">
                <div className="text-xs font-mono font-bold text-[#1E6FBF] mb-1">
                  كود: {product.code}
                </div>
                {showNames && (
                  <div className="text-xs font-semibold text-[#5A7A9A] mb-3">{product.name}</div>
                )}
                <ul className="space-y-1.5">
                  {product.priceVariants.map((variant) => {
                    const key = `${product.code}-${variant.branchId}`
                    const wasCopied = copiedKey === key
                    const sellingDiff = isDiffValue(variant.sellingPrice, allSelling)
                    const buyingDiff = isDiffValue(variant.buyingPrice, allBuying)
                    return (
                      <li key={variant.branchId} className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-[#5A7A9A] min-w-32 shrink-0">
                          {variant.branchName}
                        </span>
                        <span className="text-[#8AAAC8]">←</span>
                        <span className="flex-1 flex gap-3 flex-wrap">
                          {variant.sellingPrice != null && (
                            <span className="font-semibold text-[#1A202C]">
                              بيع:{' '}
                              {sellingDiff ? (
                                <mark className="bg-amber-100 text-amber-800 rounded px-0.5 font-extrabold not-italic">
                                  {variant.sellingPrice.toLocaleString('ar-EG')}
                                </mark>
                              ) : (
                                variant.sellingPrice.toLocaleString('ar-EG')
                              )}
                            </span>
                          )}
                          {variant.buyingPrice != null && (
                            <span className="font-semibold text-[#1A202C]">
                              شراء:{' '}
                              {buyingDiff ? (
                                <mark className="bg-amber-100 text-amber-800 rounded px-0.5 font-extrabold not-italic">
                                  {variant.buyingPrice.toLocaleString('ar-EG')}
                                </mark>
                              ) : (
                                variant.buyingPrice.toLocaleString('ar-EG')
                              )}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => copyPrices(variant, key)}
                          title="نسخ الأسعار"
                          className="shrink-0 rounded-md p-1.5 text-[#8AAAC8] hover:text-[#1E6FBF] hover:bg-[#EEF4FB] transition-colors"
                        >
                          {wasCopied ? (
                            <svg className="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
