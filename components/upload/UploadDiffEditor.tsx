'use client'

import { useState, useMemo } from 'react'
import { buildFinalProducts } from '@/lib/build-final-products'

interface ChangeItem {
  code: string
  type: 'price_update' | 'name_update' | 'new_product'
  name: string
  oldName?: string
  sellingPrice?: number
  oldSellingPrice?: number
  buyingPrice?: number
  oldBuyingPrice?: number
}

interface UploadDiffEditorProps {
  branchId: string
  initialChanges: ChangeItem[]
  initialAllProducts: any[]
  defaultUpdateName: string
  onSuccess: (result: any) => void
  onCancel: () => void
}

type TabType = 'price' | 'name' | 'new'

export function UploadDiffEditor({
  branchId,
  initialChanges,
  initialAllProducts,
  defaultUpdateName,
  onSuccess,
  onCancel,
}: UploadDiffEditorProps) {
  const [updateName, setUpdateName] = useState(defaultUpdateName)
  const [changes, setChanges] = useState<ChangeItem[]>(initialChanges)
  const [excludedCodes, setExcludedCodes] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<TabType>('price')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Split changes by type (excluding standard exclusions)
  const priceChanges = useMemo(
    () => changes.filter((c) => c.type === 'price_update' && !excludedCodes.has(c.code)),
    [changes, excludedCodes]
  )

  const nameChanges = useMemo(
    () => changes.filter((c) => c.type === 'name_update' && !excludedCodes.has(c.code)),
    [changes, excludedCodes]
  )

  const newChanges = useMemo(
    () => changes.filter((c) => c.type === 'new_product' && !excludedCodes.has(c.code)),
    [changes, excludedCodes]
  )

  // Handle inline edits
  function handleFieldChange(code: string, field: keyof ChangeItem, value: any) {
    setChanges((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          return { ...c, [field]: value }
        }
        return c
      })
    )
  }

  // Toggle exclusion
  function toggleExclude(code: string) {
    setExcludedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  async function handleShareUpdate() {
    setSubmitting(true)
    setErrorMessage('')

    const confirmedChanges = changes.filter((c) => !excludedCodes.has(c.code))
    const finalProducts = buildFinalProducts(initialAllProducts, changes, excludedCodes)

    try {
      const response = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          products: finalProducts,
          changes: confirmedChanges,
          name: updateName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'تعذر حفظ وتعميم التحديث')
        setSubmitting(false)
        return
      }

      onSuccess({
        count: finalProducts.length,
        uploadedAt: data.uploadedAt,
        changesCount: confirmedChanges.length,
        updateName,
      })
    } catch {
      setErrorMessage('خطأ في الاتصال بالخادم. الرجاء المحاولة مرة أخرى.')
      setSubmitting(false)
    }
  }

  const currentTabChanges =
    activeTab === 'price' ? priceChanges : activeTab === 'name' ? nameChanges : newChanges

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/40 p-7 backdrop-blur-md shadow-premium">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl" />
        
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E6FBF] border border-blue-100 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
          خطوة المراجعة والتعميم الذكي
        </span>
        <h2 className="text-xl font-black text-slate-900 mt-2">مراجعة واعتماد قائمة التحديثات المكتشفة</h2>
        <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed max-w-2xl">
          تم كشف اختلافات سعرية أو مسميات بين ملفك المرفوع والبيانات المخزنة. يرجى مراجعة وتعديل التحديثات أدناه أو استبعاد بعض الأصناف قبل تعميمها.
        </p>

        {/* Update list name field */}
        <div className="mt-6 max-w-xl space-y-2">
          <label className="text-xs font-black text-slate-600 block">اسم قائمة التحديثات (سيظهر لباقي الفروع)</label>
          <input
            type="text"
            value={updateName}
            onChange={(e) => setUpdateName(e.target.value)}
            placeholder="مثال: تحديث أسعار الصيف..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300 shadow-sm"
          />
        </div>
      </div>

      {/* Metrics Summary cards (Tabs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('price')}
          className={`rounded-2xl border p-5 text-right transition-all duration-300 shadow-sm ${
            activeTab === 'price'
              ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400'
              : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:-translate-y-[1px]'
          }`}
        >
          <span className="text-[10px] font-black text-amber-700 block uppercase tracking-wide">تعديلات الأسعار المكتشفة</span>
          <span className="text-2.5xl font-black text-amber-900 tracking-wider mt-1 block tabular-nums">
            {priceChanges.length.toLocaleString('ar-EG')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('name')}
          className={`rounded-2xl border p-5 text-right transition-all duration-300 shadow-sm ${
            activeTab === 'name'
              ? 'border-blue-400 bg-blue-50/20 ring-1 ring-blue-400'
              : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:-translate-y-[1px]'
          }`}
        >
          <span className="text-[10px] font-black text-blue-700 block uppercase tracking-wide">تعديل مسميات الأصناف</span>
          <span className="text-2.5xl font-black text-blue-900 tracking-wider mt-1 block tabular-nums">
            {nameChanges.length.toLocaleString('ar-EG')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`rounded-2xl border p-5 text-right transition-all duration-300 shadow-sm ${
            activeTab === 'new'
              ? 'border-green-400 bg-green-50/20 ring-1 ring-green-400'
              : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:-translate-y-[1px]'
          }`}
        >
          <span className="text-[10px] font-black text-green-700 block uppercase tracking-wide">أصناف جديدة مكتشفة</span>
          <span className="text-2.5xl font-black text-green-900 tracking-wider mt-1 block tabular-nums">
            {newChanges.length.toLocaleString('ar-EG')}
          </span>
        </button>
      </div>

      {/* Main diff Table container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-premium transition-all duration-300">
        <div className="overflow-x-auto">
          {currentTabChanges.length === 0 ? (
            <div className="py-20 text-center text-sm font-bold text-slate-400">
              لا توجد تعديلات معلقة في هذا التبويب حالياً.
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">الكود</th>
                  {activeTab === 'name' ? (
                    <>
                      <th className="px-6 py-4">الاسم القديم</th>
                      <th className="px-6 py-4">الاسم المقترح الجديد (قابل للتعديل)</th>
                    </>
                  ) : (
                    <th className="px-6 py-4">اسم الصنف</th>
                  )}
                  {activeTab === 'price' && (
                    <>
                      <th className="px-6 py-4 text-amber-700">سعر البيع القديم</th>
                      <th className="px-6 py-4 text-amber-900">سعر البيع المقترح</th>
                      <th className="px-6 py-4 text-green-700">سعر الشراء القديم</th>
                      <th className="px-6 py-4 text-green-900">سعر الشراء المقترح</th>
                    </>
                  )}
                  {activeTab === 'new' && (
                    <>
                      <th className="px-6 py-4 text-amber-700">سعر البيع المقترح</th>
                      <th className="px-6 py-4 text-green-700">سعر الشراء المقترح</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                {currentTabChanges.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 border border-slate-200/30">
                        {item.code}
                      </span>
                    </td>
                    
                    {/* Name column editing */}
                    {activeTab === 'name' ? (
                      <>
                        <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">{item.oldName}</td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                          />
                        </td>
                      </>
                    ) : activeTab === 'new' ? (
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                        />
                      </td>
                    ) : (
                      <td className="px-6 py-4">
                        {item.oldName ? (
                          <div className="space-y-0.5">
                            <span className="line-through text-[10px] text-slate-350 block">{item.oldName}</span>
                            <span className="font-extrabold text-slate-800 text-sm">{item.name}</span>
                          </div>
                        ) : (
                          <span className="max-w-[220px] truncate block text-slate-800 font-extrabold text-sm">{item.name}</span>
                        )}
                      </td>
                    )}

                    {/* Price editing */}
                    {activeTab === 'price' && (
                      <>
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {item.oldSellingPrice != null ? `${item.oldSellingPrice.toLocaleString('ar-EG')} ج.م` : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={item.sellingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'sellingPrice', Number(e.target.value) || undefined)}
                            className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                          />
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {item.oldBuyingPrice != null ? `${item.oldBuyingPrice.toLocaleString('ar-EG')} ج.م` : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={item.buyingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'buyingPrice', Number(e.target.value) || undefined)}
                            className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                          />
                        </td>
                      </>
                    )}

                    {activeTab === 'new' && (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={item.sellingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'sellingPrice', Number(e.target.value) || undefined)}
                            className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={item.buyingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'buyingPrice', Number(e.target.value) || undefined)}
                            className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
                          />
                        </td>
                      </>
                    )}

                    {/* Exclude row action */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExclude(item.code)}
                        className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/30 text-rose-700 px-4 py-1.5 text-xs font-black transition-all duration-300 active:scale-95"
                      >
                        استبعاد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50/20 p-5 text-red-700 font-bold text-xs shadow-sm">
          {errorMessage}
        </div>
      )}

      {/* Confirm or Cancel Panel Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={handleShareUpdate}
          disabled={submitting}
          className="rounded-xl bg-slate-900 hover:bg-indigo-900 active:scale-95 disabled:opacity-50 disabled:pointer-events-none px-8 py-4 text-xs font-black text-white transition-all duration-300 shadow-premium shadow-slate-950/10"
        >
          {submitting ? 'جاري تعميم التحديث ومشاركته...' : 'حفظ وتعميم التحديثات الحالية مع الفروع'}
        </button>

        <button
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-200 hover:border-red-400 hover:text-red-500 bg-white px-6 py-4 text-xs font-black text-slate-500 transition-all duration-300 shrink-0"
        >
          إلغاء والعودة للرفع
        </button>
      </div>
    </div>
  )
}

