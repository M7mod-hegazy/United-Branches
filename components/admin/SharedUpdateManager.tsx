'use client'

import { useEffect, useState } from 'react'

interface SharedUpdateSummary {
  _id: string
  name: string
  branchName: string
  createdAt: string
  changesCount: number
  newProductsCount: number
  priceUpdatesCount: number
  nameUpdatesCount: number
}

export function SharedUpdateManager() {
  const [updates, setUpdates] = useState<SharedUpdateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')
  const [message, setMessage] = useState('')

  async function loadUpdates() {
    try {
      const response = await fetch('/api/shared-updates?t=' + Date.now())
      if (!response.ok) throw new Error()
      const data = await response.json()
      setUpdates(Array.isArray(data) ? data : [])
    } catch {
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUpdates()
  }, [])

  async function updateName(id: string) {
    if (!editingName.trim()) return

    try {
      const response = await fetch(`/api/shared-updates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      })
      if (!response.ok) throw new Error()
      setMessage('تم تعديل اسم القائمة بنجاح')
      setEditingId('')
      setEditingName('')
      loadUpdates()
    } catch {
      setMessage('تعذر تعديل اسم قائمة التحديث')
    }
  }

  async function deleteUpdate(id: string, updateName: string) {
    if (!window.confirm(`هل أنت متأكد من حذف قائمة "${updateName}"؟ لن يتمكن باقي زوار الموقع من رؤيتها.`)) return

    try {
      const response = await fetch(`/api/shared-updates/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      setMessage(`تم حذف قائمة "${updateName}" بنجاح`)
      loadUpdates()
    } catch {
      setMessage('تعذر حذف قائمة التحديث')
    }
  }

  async function deleteAllUpdates() {
    if (!window.confirm('تحذير: سيتم حذف جميع قوائم التحديثات والتعميمات نهائياً من قاعدة البيانات. هل تريد المتابعة؟')) return

    try {
      const response = await fetch('/api/shared-updates', { method: 'DELETE' })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setMessage(`تم مسح جميع قوائم التحديثات بنجاح (تم مسح ${data.deleted} قائمة)`)
      loadUpdates()
    } catch {
      setMessage('تعذر مسح قوائم التحديثات')
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-premium">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900">إدارة قوائم التحديثات والتعميمات</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">تعديل مسميات قوائم التعديل المرفوعة أو مسحها نهائياً من قاعدة البيانات.</p>
        </div>
        {updates.length > 0 && (
          <button
            onClick={deleteAllUpdates}
            className="rounded-xl border border-rose-100 bg-rose-50/40 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 hover:text-rose-900 transition-all duration-300 active:scale-95 border-dashed shrink-0"
          >
            مسح جميع القوائم المعممة
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200/50 bg-blue-50/20 px-4 py-3 text-xs font-black text-[#1E6FBF] flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#1E6FBF] animate-ping" />
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-xs font-bold text-slate-400">جاري تحميل قوائم التعميم...</div>
      ) : updates.length === 0 ? (
        <div className="text-center py-8 text-xs font-bold text-slate-400">لا توجد قوائم تحديثات معممة حالياً.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/10 divide-y divide-slate-100">
          {updates.map((up) => (
            <div key={up._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-slate-50/30 transition-colors">
              <div className="flex-1 space-y-2">
                {editingId === up._id ? (
                  <div className="flex gap-2 max-w-lg">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                    />
                    <button
                      onClick={() => updateName(up._id)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-black text-white transition-all duration-300 active:scale-95 shadow-sm"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => setEditingId('')}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all duration-300"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{up.name}</h4>
                    <div className="text-[10px] text-slate-400 font-bold mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span>الفرع: {up.branchName}</span>
                      <span>تاريخ الرفع: {new Date(up.createdAt).toLocaleDateString('en-US')}</span>
                      <span>إجمالي التغييرات: <b className="font-mono">{up.changesCount}</b></span>
                    </div>
                  </div>
                )}

                {/* Counter Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {up.newProductsCount > 0 && (
                    <span className="rounded-lg bg-green-50 border border-green-200/50 px-2 py-0.5 text-[9px] font-black text-green-700">
                      +{up.newProductsCount} أصناف جديدة
                    </span>
                  )}
                  {up.priceUpdatesCount > 0 && (
                    <span className="rounded-lg bg-amber-50 border border-amber-200/50 px-2 py-0.5 text-[9px] font-black text-amber-700">
                      ~{up.priceUpdatesCount} تعديلات أسعار
                    </span>
                  )}
                  {up.nameUpdatesCount > 0 && (
                    <span className="rounded-lg bg-blue-50 border border-blue-200/50 px-2 py-0.5 text-[9px] font-black text-blue-700">
                      ~{up.nameUpdatesCount} تعديلات أسماء
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                {editingId !== up._id && (
                  <button
                    onClick={() => {
                      setEditingId(up._id)
                      setEditingName(up.name)
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] transition-all duration-300 active:scale-95 shadow-sm"
                  >
                    تعديل الاسم
                  </button>
                )}
                <button
                  onClick={() => deleteUpdate(up._id, up.name)}
                  className="rounded-xl border border-rose-100 bg-rose-50/20 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-all duration-300 active:scale-95 border-dashed"
                >
                  حذف القائمة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
