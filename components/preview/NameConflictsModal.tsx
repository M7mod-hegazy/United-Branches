'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
            <p className="text-xs text-[#5A7A9A] mt-0.5">{conflicts.length.toLocaleString('ar-EG')} صنف</p>
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
                {product.nameVariants.map((variant) => (
                  <li key={variant.branchId} className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-[#5A7A9A] min-w-32 shrink-0">
                      {variant.branchName}
                    </span>
                    <span className="text-[#8AAAC8]">←</span>
                    <span className="font-medium text-[#1A202C]">{variant.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
