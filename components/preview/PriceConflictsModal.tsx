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

// Copy icon (default)
function IconCopy() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

// Check icon (after copy)
function IconCheck() {
  return (
    <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
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

  function copyValue(value: number, key: string) {
    navigator.clipboard.writeText(String(value))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900">أصناف بأسعار بيع/شراء متعارضة</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">
              العثور على {filtered.length.toLocaleString('ar-EG')} من أصل {conflicts.length.toLocaleString('ar-EG')} منتج متعارض السعر
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNames((v) => !v)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-500 hover:text-slate-800 transition-all duration-300 hover:shadow-sm"
            >
              {showNames ? 'إخفاء أسماء الأصناف' : 'إظهار أسماء الأصناف'}
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالكود أو اسم الصنف..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-5 pl-11 text-sm font-bold text-slate-800 placeholder-slate-400 focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <span className="absolute left-4 top-3 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <span className="text-sm font-bold text-slate-400">لا توجد نتائج تطابق البحث</span>
            </div>
          )}

          {filtered.map((product) => {
            const allSelling = product.priceVariants.map((v) => v.sellingPrice)
            const allBuying  = product.priceVariants.map((v) => v.buyingPrice)

            return (
              <div key={product.code} className="rounded-2xl border border-slate-200/50 bg-slate-50/40 p-5 hover:border-violet-300 transition-all duration-300 shadow-sm">
                {/* Product header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {showNames && (
                      <div className="text-sm font-extrabold text-slate-800 leading-snug">{product.name}</div>
                    )}
                  </div>
                  <div className="inline-flex shrink-0 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-mono font-black text-violet-600 border border-violet-100/30">
                    كود: {product.code}
                  </div>
                </div>

                {/* Branch rows */}
                <ul className="space-y-2 border-t border-slate-100 pt-3">
                  {product.priceVariants.map((variant) => {
                    const sellingDiff = isDiffValue(variant.sellingPrice, allSelling)
                    const buyingDiff  = isDiffValue(variant.buyingPrice, allBuying)

                    return (
                      <li key={variant.branchId} className="flex items-center gap-2 text-sm">

                        {/* Branch name */}
                        <span className="font-extrabold text-slate-500 min-w-[100px] shrink-0 text-right text-xs">
                          {variant.branchName}
                        </span>

                        <span className="text-slate-300 shrink-0">←</span>

                        {/* Selling price + copy */}
                        {variant.sellingPrice != null ? (
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">بيع:</span>
                            {sellingDiff ? (
                              <mark className="bg-rose-50 text-rose-700 rounded-lg px-2 py-0.5 font-black not-italic border border-rose-200/60 shadow-sm text-xs">
                                {variant.sellingPrice.toLocaleString('ar-EG')}
                              </mark>
                            ) : (
                              <span className="bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200/50 text-xs font-bold">
                                {variant.sellingPrice.toLocaleString('ar-EG')}
                              </span>
                            )}
                            <button
                              onClick={() => copyValue(variant.sellingPrice!, `${product.code}-${variant.branchId}-sell`)}
                              title="نسخ سعر البيع"
                              className="rounded-md p-1 text-slate-350 hover:text-[#1E6FBF] hover:bg-blue-50 border border-transparent hover:border-blue-100/50 transition-all duration-200 active:scale-90"
                            >
                              {copiedKey === `${product.code}-${variant.branchId}-sell` ? <IconCheck /> : <IconCopy />}
                            </button>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">لا يوجد</span>
                        )}

                        <span className="text-slate-200 shrink-0">|</span>

                        {/* Buying price + copy */}
                        {variant.buyingPrice != null ? (
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">شراء:</span>
                            {buyingDiff ? (
                              <mark className="bg-amber-50 text-amber-800 rounded-lg px-2 py-0.5 font-black not-italic border border-amber-200/60 shadow-sm text-xs">
                                {variant.buyingPrice.toLocaleString('ar-EG')}
                              </mark>
                            ) : (
                              <span className="bg-slate-100/80 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200/50 text-xs font-bold">
                                {variant.buyingPrice.toLocaleString('ar-EG')}
                              </span>
                            )}
                            <button
                              onClick={() => copyValue(variant.buyingPrice!, `${product.code}-${variant.branchId}-buy`)}
                              title="نسخ سعر الشراء"
                              className="rounded-md p-1 text-slate-350 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100/50 transition-all duration-200 active:scale-90"
                            >
                              {copiedKey === `${product.code}-${variant.branchId}-buy` ? <IconCheck /> : <IconCopy />}
                            </button>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">لا يوجد</span>
                        )}

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
