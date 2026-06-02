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
    <div className="space-y-6">
      
      {/* Retention setting */}
      <div className="rounded-2xl border border-slate-200/50 bg-white p-5 space-y-4 shadow-premium transition-all duration-300">
        <div className="text-[10px] font-black uppercase tracking-wider text-[#1E6FBF] bg-blue-50/50 px-3 py-1 rounded-full w-fit border border-blue-100/40">
          قواعد أرشفة والاحتفاظ بالرفعات التاريخية
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
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
              className="h-4 w-4 rounded border-slate-350 text-[#1E6FBF] focus:ring-[#1E6FBF] accent-[#1E6FBF]"
            />
            احتفاظ غير محدود (بلا حد أقصى)
          </label>
          
          {!isUnlimited && (
            <input
              type="number"
              min={1}
              max={50}
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300 shadow-sm"
            />
          )}
          
          <button
            onClick={saveRetention}
            className="rounded-xl bg-slate-900 hover:bg-indigo-900 active:scale-95 px-5 h-10 text-xs font-black text-white transition-all duration-300 shadow-premium shadow-slate-950/5 shrink-0"
          >
            حفظ القاعدة
          </button>
        </div>
        {!isUnlimited && (
          <p className="text-xs font-semibold text-slate-400">
            سيقوم النظام تلقائياً بالاحتفاظ بأحدث {retentionInput || '…'} رفعة لكل فرع وحذف ما قبلها لتوفير المساحة (النطاق المسموح: ١–٥٠).
          </p>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200/50 bg-blue-50/20 px-5 py-4 text-xs font-black text-[#1E6FBF] flex items-center gap-2.5 transition-all duration-300 shadow-sm animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
          {message}
        </div>
      )}

      {/* Per-branch snapshot list */}
      <div className="space-y-3.5">
        <div className="text-xs font-black uppercase tracking-wider text-slate-400">سجل رفعات الفروع الحالية</div>
        
        {branches.map((branch) => (
          <div key={branch._id} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-premium">
            <button
              onClick={() => toggleBranch(branch._id)}
              className="w-full flex items-center justify-between px-5 py-4 text-xs font-black text-slate-800 hover:bg-slate-50/30 transition-colors"
            >
              <span className="text-sm font-extrabold text-slate-800">{branch.name}</span>
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${expanded === branch._id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expanded === branch._id && (
              <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/10">
                {!snapshots[branch._id] ? (
                  <div className="px-5 py-5 text-xs text-slate-400 font-bold">جاري تحميل السجل…</div>
                ) : snapshots[branch._id].length === 0 ? (
                  <div className="px-5 py-5 text-xs text-slate-400 font-bold">لا توجد أي رفعات مخزنة لهذا الفرع.</div>
                ) : (
                  snapshots[branch._id].map((snap) => (
                    <div key={snap._id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-extrabold text-slate-800">
                          {new Date(snap.uploadedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/30 tabular-nums">
                            {snap.productsCount.toLocaleString('en-US')} صنف
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                            snap.hasPrices
                              ? 'bg-green-50 border-green-200/60 text-green-700'
                              : 'bg-slate-50 border-slate-200/60 text-slate-400'
                          }`}>
                            {snap.hasPrices ? 'كميات وأسعار' : 'كميات فقط'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSnapshot(snap._id, branch._id)}
                        className="rounded-xl border border-rose-100 bg-rose-50/20 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-all duration-300 active:scale-95 border-dashed"
                      >
                        حذف اللقطة
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
