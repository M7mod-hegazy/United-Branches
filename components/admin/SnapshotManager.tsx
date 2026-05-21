'use client'

import { useEffect, useState } from 'react'

interface Branch {
  _id: string
  name: string
}

interface SnapshotInfo {
  _id: string
  uploadedAt: string
  productsCount: number
  hasPrices: boolean
}

interface SnapshotManagerProps {
  branches: Branch[]
  onDeleted: () => void
}

export function SnapshotManager({ branches, onDeleted }: SnapshotManagerProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotInfo[]>>({})
  const [retentionLimit, setRetentionLimit] = useState<number | null>(10)
  const [retentionInput, setRetentionInput] = useState('10')
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const limit = data.retentionLimit
        if (limit === null) {
          setIsUnlimited(true)
          setRetentionLimit(null)
          setRetentionInput('')
        } else {
          setRetentionLimit(limit)
          setRetentionInput(String(limit))
        }
      })
  }, [])

  async function loadSnapshots(branchId: string) {
    const response = await fetch(`/api/snapshots?branchId=${branchId}`)
    const data = await response.json()
    setSnapshots((prev) => ({ ...prev, [branchId]: data }))
  }

  function toggleBranch(branchId: string) {
    if (expanded === branchId) {
      setExpanded(null)
    } else {
      setExpanded(branchId)
      if (!snapshots[branchId]) loadSnapshots(branchId)
    }
  }

  async function deleteSnapshot(snapshotId: string, branchId: string) {
    if (!window.confirm('حذف هذا الرفع؟')) return
    const response = await fetch(`/api/snapshots/${snapshotId}`, { method: 'DELETE' })
    if (!response.ok) {
      setMessage('تعذر حذف اللقطة')
      return
    }
    setMessage('تم الحذف')
    loadSnapshots(branchId)
    onDeleted()
  }

  async function saveRetention() {
    const limit = isUnlimited ? null : Number(retentionInput)
    if (limit !== null && (isNaN(limit) || limit < 1 || limit > 50)) {
      setMessage('يجب أن يكون عدد الرفعات رقماً بين ١ و ٥٠')
      return
    }
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retentionLimit: limit }),
    })
    if (!response.ok) {
      setMessage('تعذر حفظ الإعداد')
      return
    }
    setRetentionLimit(limit)
    setMessage('تم حفظ إعداد الاحتفاظ بنجاح')
  }

  return (
    <div className="space-y-4">
      {/* Retention setting */}
      <div className="rounded-xl border border-[#EAE8E4] bg-white p-4 space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#A88554]">إعداد الاحتفاظ بالرفعات</div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#78726A] cursor-pointer">
            <input
              type="checkbox"
              checked={isUnlimited}
              onChange={(e) => {
                const checked = e.target.checked
                setIsUnlimited(checked)
                if (checked) {
                  setRetentionInput('')
                } else {
                  setRetentionInput(String(retentionLimit || 10))
                }
              }}
              className="rounded animate-pulse"
            />
            بلا حد (غير محدود)
          </label>
          {!isUnlimited && (
            <input
              type="number"
              min={1}
              max={50}
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              className="h-9 w-20 rounded-lg border border-[#E2E0D9] px-3 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] focus:ring-1 focus:ring-[#A88554] outline-none"
            />
          )}
          <button
            onClick={saveRetention}
            className="rounded-lg bg-[#1E2229] hover:bg-[#2e343f] px-4 py-2 text-xs font-bold text-white transition-all duration-200 active:scale-95"
          >
            حفظ
          </button>
        </div>
        {!isUnlimited && (
          <p className="text-xs text-[#A19D95]">
            الاحتفاظ بأحدث {retentionInput || '…'} رفعة لكل فرع (النطاق: ١–٥٠)
          </p>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-[#A88554]/20 bg-[#FAF6F0] px-4 py-3 text-xs font-bold text-[#A88554] flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A88554]" />
          {message}
        </div>
      )}

      {/* Per-branch snapshot list */}
      <div className="space-y-2">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#A88554]">رفعات الفروع</div>
        {branches.map((branch) => (
          <div key={branch._id} className="rounded-xl border border-[#EAE8E4] bg-white overflow-hidden">
            <button
              onClick={() => toggleBranch(branch._id)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-[#1E2229] hover:bg-[#FCFAF7]/40 transition-colors"
            >
              <span>{branch.name}</span>
              <svg
                className={`h-4 w-4 text-[#A19D95] transition-transform ${expanded === branch._id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === branch._id && (
              <div className="border-t border-[#EAE8E4] divide-y divide-[#EAE8E4]">
                {!snapshots[branch._id] ? (
                  <div className="px-4 py-3 text-xs text-[#A19D95] font-semibold">جاري التحميل…</div>
                ) : snapshots[branch._id].length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#A19D95] font-semibold">لا توجد رفعات</div>
                ) : (
                  snapshots[branch._id].map((snap) => (
                    <div key={snap._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1E2229]">
                          {new Date(snap.uploadedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#78726A] font-semibold">{snap.productsCount.toLocaleString('ar-EG')} صنف</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${snap.hasPrices ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F0] text-[#A19D95]'}`}>
                            {snap.hasPrices ? 'كميات وأسعار' : 'كميات فقط'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSnapshot(snap._id, branch._id)}
                        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200 shrink-0"
                      >
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
