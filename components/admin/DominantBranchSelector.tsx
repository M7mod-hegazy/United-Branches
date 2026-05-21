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
    <div className="rounded-xl border border-[#EAE8E4] bg-white p-4 space-y-4 shadow-sm transition-all duration-300">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A88554] bg-[#FAF6F0] px-2.5 py-1 rounded-full w-fit">الفرع المهيمن والمستهدف للمقارنة</span>
        <h2 className="text-sm font-extrabold text-[#1E2229] mt-1">تحديد الفرع المهيمن للأسعار</h2>
        <p className="text-xs text-[#78726A] mt-0.5 leading-relaxed">
          عند قيام الفرع المختار هنا برفع ملف كميات وأسعار جديد، سيقوم النظام تلقائياً بمقارنته مع آخر رفع له، لإتاحة مراجعة واعتماد التعديلات ومشاركتها مع بقية الفروع.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={dominantId}
          disabled={loading}
          onChange={(e) => setDominantId(e.target.value)}
          className="h-10 rounded-lg border border-[#E2E0D9] bg-white px-3 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] focus:ring-1 focus:ring-[#A88554] outline-none min-w-[200px] transition-all duration-200"
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
          className="h-10 rounded-lg bg-[#1E2229] hover:bg-[#2e343f] active:scale-95 px-6 text-xs font-bold text-white transition-all duration-200 shadow-sm shrink-0"
        >
          حفظ الفرع المهيمن
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-[#A88554]/20 bg-[#FAF6F0] px-4 py-2.5 text-xs font-bold text-[#A88554] flex items-center gap-2 transition-all duration-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A88554]" />
          {message}
        </div>
      )}
    </div>
  )
}
