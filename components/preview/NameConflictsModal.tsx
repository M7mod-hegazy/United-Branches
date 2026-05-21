'use client'

import { useEffect, useMemo, useState } from 'react'

interface NameVariant {
  branchId: string
  branchName: string
  name: string
}

interface ConflictProduct {
  code: string
  nameVariants: NameVariant[]
}

interface NameConflictsModalProps {
  conflicts: ConflictProduct[]
  onClose: () => void
}

/**
 * Returns [diffStart, diffEnd] indices for each name in the array.
 * Characters outside that range are identical across all variants.
 */
function findDiffRanges(names: string[]): Array<[number, number]> {
  if (names.length < 2) return names.map((n) => [n.length, n.length])

  const minLen = Math.min(...names.map((n) => n.length))

  let prefixLen = 0
  for (let i = 0; i < minLen; i++) {
    if (names.every((n) => n[i] === names[0][i])) prefixLen++
    else break
  }

  let suffixLen = 0
  for (let i = 1; i <= minLen - prefixLen; i++) {
    if (names.every((n) => n[n.length - i] === names[0][names[0].length - i])) suffixLen++
    else break
  }

  return names.map((name) => [prefixLen, Math.max(prefixLen, name.length - suffixLen)])
}

function DiffName({ name, diffStart, diffEnd }: { name: string; diffStart: number; diffEnd: number }) {
  const hasDiff = diffStart < diffEnd
  return (
    <span className="font-semibold text-[#1A202C]">
      {name.slice(0, diffStart)}
      {hasDiff && (
        <mark className="bg-amber-100 text-amber-800 rounded px-0.5 font-extrabold not-italic">
          {name.slice(diffStart, diffEnd)}
        </mark>
      )}
      {name.slice(diffEnd)}
    </span>
  )
}

export function NameConflictsModal({ conflicts, onClose }: NameConflictsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')

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
        p.nameVariants.some((v) => v.name.toLowerCase().includes(needle))
    )
  }, [conflicts, query])

  const copyName = (name: string, key: string) => {
    navigator.clipboard.writeText(name)
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
            <h2 className="text-base font-bold text-[#1A202C]">أصناف بأسماء متعارضة</h2>
            <p className="text-xs font-semibold text-[#5A7A9A] mt-0.5">
              {filtered.length.toLocaleString('ar-EG')} من {conflicts.length.toLocaleString('ar-EG')} صنف
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A9A] hover:bg-[#EEF4FB] hover:text-[#1A202C] transition-colors text-lg font-bold"
          >
            ×
          </button>
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
            const names = product.nameVariants.map((v) => v.name)
            const ranges = findDiffRanges(names)
            return (
              <div
                key={product.code}
                className="rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] p-4"
              >
                <div className="text-xs font-mono font-bold text-[#1E6FBF] mb-3">
                  كود: {product.code}
                </div>
                <ul className="space-y-1.5">
                  {product.nameVariants.map((variant, i) => {
                    const key = `${product.code}-${variant.branchId}`
                    const wasCopied = copiedKey === key
                    const [diffStart, diffEnd] = ranges[i]
                    return (
                      <li key={variant.branchId} className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-[#5A7A9A] min-w-32 shrink-0">
                          {variant.branchName}
                        </span>
                        <span className="text-[#8AAAC8]">←</span>
                        <span className="flex-1">
                          <DiffName name={variant.name} diffStart={diffStart} diffEnd={diffEnd} />
                        </span>
                        <button
                          onClick={() => copyName(variant.name, key)}
                          title="نسخ الاسم"
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
