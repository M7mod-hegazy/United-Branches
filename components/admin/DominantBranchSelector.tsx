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
  const [dominantId, setDominantId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setDominantId(data.dominantBranchId || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function saveDominantBranch() {
    setMessage('')
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dominantBranchId: dominantId || null }),
    })
    if (!response.ok) {
      setMessage('تعذر حفظ الفرع المهيمن')
      return
    }
    setMessage('تم حفظ الفرع المهيمن بنجاح')
  }

  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white p-6 space-y-5 shadow-premium transition-all duration-300">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#1E6FBF] bg-blue-50/50 px-3 py-1 rounded-full w-fit border border-blue-100/40">الفرع المهيمن والمستهدف للمقارنة</span>
        <h2 className="text-sm font-extrabold text-slate-800 mt-1">تحديد الفرع المهيمن للأسعار</h2>
        <p className="text-xs text-slate-400 font-bold leading-relaxed mt-0.5">
          عند قيام الفرع المختار هنا برفع ملف كميات وأسعار جديد، سيقوم النظام تلقائياً بمقارنته مع آخر رفع له، لإتاحة مراجعة واعتماد التعديلات ومشاركتها مع بقية الفروع.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={dominantId}
          disabled={loading}
          onChange={(e) => setDominantId(e.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none min-w-[220px] transition-all duration-300 cursor-pointer shadow-sm"
        >
          <option value="">-- بدون فرع مهيمن --</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <button
          onClick={saveDominantBranch}
          disabled={loading}
          className="h-11 rounded-xl bg-slate-900 hover:bg-indigo-900 active:scale-95 px-6 text-xs font-black text-white transition-all duration-300 shadow-premium shadow-slate-950/5 shrink-0"
        >
          حفظ الفرع المهيمن
        </button>
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
