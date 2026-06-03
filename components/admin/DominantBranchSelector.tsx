'use client'

import { useEffect, useState } from 'react'

interface Branch {
  _id: string
  name: string
}

interface DominantBranchSelectorProps {
  branches: Branch[]
}

export function DominantBranchSelector({ branches }: DominantBranchSelectorProps) {
  const [dominantIds, setDominantIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setDominantIds(Array.isArray(data.dominantBranchIds) ? data.dominantBranchIds : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function toggleBranch(id: string) {
    setDominantIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  async function saveDominantBranch() {
    setMessage('')
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dominantBranchIds: dominantIds }),
    })
    if (!response.ok) {
      setMessage('تعذر حفظ الفروع المهيمنة')
      return
    }
    setMessage('تم حفظ الفروع المهيمنة بنجاح')
  }

  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white p-6 space-y-5 shadow-premium transition-all duration-300">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#1E6FBF] bg-blue-50/50 px-3 py-1 rounded-full w-fit border border-blue-100/40">الفروع المهيمنة والمستهدفة للمقارنة</span>
        <h2 className="text-sm font-extrabold text-slate-800 mt-1">تحديد الفروع المهيمنة للأسعار</h2>
        <p className="text-xs text-slate-400 font-bold leading-relaxed mt-0.5">
          عند قيام أي فرع من الفروع المختارة هنا برفع ملف كميات وأسعار جديد، سيقوم النظام تلقائياً بمقارنته مع آخر رفع له، لإتاحة مراجعة واعتماد التعديلات ومشاركتها مع بقية الفروع.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={() => setDominantIds(branches.map((b) => b._id))}
            className="text-[10px] font-bold text-[#1E6FBF] hover:text-indigo-900 transition-colors"
          >
            تحديد الكل
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => setDominantIds([])}
            className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            إلغاء الكل
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => {
            const checked = dominantIds.includes(b._id)
            return (
              <label
                key={b._id}
                className={`flex items-center gap-2 h-10 rounded-xl border px-3.5 text-xs font-bold cursor-pointer transition-all duration-200 select-none ${
                  checked
                    ? 'border-[#1E6FBF] bg-blue-50/50 text-[#1E6FBF] shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={loading}
                  onChange={() => toggleBranch(b._id)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1E6FBF] focus:ring-[#1E6FBF] accent-[#1E6FBF]"
                />
                {b.name}
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={saveDominantBranch}
          disabled={loading}
          className="h-11 rounded-xl bg-slate-900 hover:bg-indigo-900 active:scale-95 px-6 text-xs font-black text-white transition-all duration-300 shadow-premium shadow-slate-950/5 shrink-0"
        >
          حفظ الفروع المهيمنة
        </button>
        {dominantIds.length > 0 && (
          <span className="text-[10px] font-bold text-slate-400">
            {dominantIds.length} فرع{dominantIds.length > 1 ? 'ة' : ''} مختارة
          </span>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200/50 bg-blue-50/20 px-5 py-3 text-xs font-black text-[#1E6FBF] flex items-center gap-2.5 transition-all duration-300 shadow-sm animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
          {message}
        </div>
      )}
    </div>
  )
}
