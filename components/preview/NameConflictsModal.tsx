'use client'

import { useEffect, useState } from 'react'

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

export function NameConflictsModal({ conflicts, onClose }: NameConflictsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
        className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between bg-white border-b border-[#C8D9EC] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1A202C]">أصناف بأسماء متعارضة</h2>
            <p className="text-xs font-semibold text-[#5A7A9A] mt-0.5">{conflicts.length.toLocaleString('ar-EG')} صنف</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5A7A9A] hover:bg-[#EEF4FB] hover:text-[#1A202C] transition-colors text-lg font-bold"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-3">
          {conflicts.map((product) => (
            <div
              key={product.code}
              className="rounded-lg border border-[#C8D9EC] bg-[#F5F8FC] p-4"
            >
              <div className="text-xs font-mono font-bold text-[#1E6FBF] mb-3">
                كود: {product.code}
              </div>
              <ul className="space-y-1.5">
                {product.nameVariants.map((variant) => {
                  const key = `${product.code}-${variant.branchId}`
                  const wasCopied = copiedKey === key
                  return (
                    <li key={variant.branchId} className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-[#5A7A9A] min-w-32 shrink-0">
                        {variant.branchName}
                      </span>
                      <span className="text-[#8AAAC8]">←</span>
                      <span className="font-semibold text-[#1A202C] flex-1">{variant.name}</span>
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
          ))}
        </div>
      </div>
    </div>
  )
}
