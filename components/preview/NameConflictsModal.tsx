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
    <span className="font-bold text-slate-800">
      {name.slice(0, diffStart)}
      {hasDiff && (
        <mark className="bg-rose-50 text-rose-700 rounded-md px-1.5 py-0.5 font-black not-italic border border-rose-200/50 shadow-sm mx-0.5">
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
            <h2 className="text-lg font-black text-slate-900">أصناف بأسماء متعارضة بين الفروع</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">
              العثور على <span className="text-sm font-black text-[#1E6FBF]">{filtered.length.toLocaleString('en-US')}</span> من أصل <span className="text-sm font-black text-[#1E6FBF]">{conflicts.length.toLocaleString('en-US')}</span> منتج متعارض الاسم
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالكود أو اسم الصنف المتعارض..."
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
            const names = product.nameVariants.map((v) => v.name)
            const ranges = findDiffRanges(names)
            return (
              <div
                key={product.code}
                className="rounded-2xl border border-slate-200/50 bg-slate-50/40 p-5 hover:border-[#1E6FBF] transition-all duration-300 shadow-sm"
              >
                <div className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-mono font-black text-[#1E6FBF] border border-blue-100/30 mb-4">
                  كود الصنف: {product.code}
                </div>
                
                <ul className="space-y-3.5 border-t border-slate-100 pt-3.5">
                  {product.nameVariants.map((variant, i) => {
                    const key = `${product.code}-${variant.branchId}`
                    const wasCopied = copiedKey === key
                    const [diffStart, diffEnd] = ranges[i]
                    return (
                      <li key={variant.branchId} className="flex items-center gap-3 text-sm">
                        <span className="font-extrabold text-slate-400 min-w-32 shrink-0">
                          {variant.branchName}
                        </span>
                        <span className="text-slate-300">←</span>
                        <span className="flex-1 text-slate-700">
                          <DiffName name={variant.name} diffStart={diffStart} diffEnd={diffEnd} />
                        </span>
                        <button
                          onClick={() => copyName(variant.name, key)}
                          title="نسخ الاسم المعتمد"
                          className="shrink-0 rounded-lg p-2 text-slate-400 hover:text-[#1E6FBF] hover:bg-blue-50/50 border border-transparent hover:border-blue-100/50 transition-all duration-300 active:scale-90"
                        >
                          {wasCopied ? (
                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

