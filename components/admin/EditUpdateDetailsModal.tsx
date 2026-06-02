'use client'

import { useEffect, useState, useMemo } from 'react'

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

interface EditUpdateDetailsModalProps {
  updateId: string
  updateName: string
  onClose: () => void
  onSuccess: () => void
}

type TabType = 'price' | 'name' | 'new'

export function EditUpdateDetailsModal({
  updateId,
  updateName,
  onClose,
  onSuccess,
}: EditUpdateDetailsModalProps) {
  const [changes, setChanges] = useState<ChangeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<TabType>('price')
  const [showAddForm, setShowAddForm] = useState(false)

  // Manual entry states inside Edit modal
  const [manualType, setManualType] = useState<'price_update' | 'name_update' | 'new_product'>('price_update')
  const [manualCode, setManualCode] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualSelling, setManualSelling] = useState('')
  const [manualOldSelling, setManualOldSelling] = useState('')
  const [manualBuying, setManualBuying] = useState('')
  const [manualOldBuying, setManualOldBuying] = useState('')
  const [manualError, setManualError] = useState('')

  useEffect(() => {
    async function loadDetails() {
      try {
        const response = await fetch(`/api/shared-updates/${updateId}?t=` + Date.now())
        if (!response.ok) throw new Error()
        const data = await response.json()
        setChanges(Array.isArray(data.changes) ? data.changes : [])
      } catch {
        setError('تعذر تحميل تفاصيل التعميم')
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [updateId])

  // Filter changes based on tab
  const priceChanges = useMemo(() => changes.filter((c) => c.type === 'price_update'), [changes])
  const nameChanges = useMemo(() => changes.filter((c) => c.type === 'name_update'), [changes])
  const newChanges = useMemo(() => changes.filter((c) => c.type === 'new_product'), [changes])

  const currentTabChanges =
    activeTab === 'price' ? priceChanges : activeTab === 'name' ? nameChanges : newChanges

  function handleFieldChange(code: string, field: keyof ChangeItem, value: any) {
    setChanges((prev) =>
      prev.map((c) => (c.code === code ? { ...c, [field]: value } : c))
    )
  }

  function handleCodeFieldChange(oldCode: string, newCode: string) {
    setChanges((prev) =>
      prev.map((c) => (c.code === oldCode ? { ...c, code: newCode } : c))
    )
  }

  function removeEntry(code: string) {
    setChanges((prev) => prev.filter((c) => c.code !== code))
  }

  function addManualEntry() {
    const code = manualCode.trim()
    const name = manualName.trim()
    setManualError('')

    if (!code) {
      setManualError('يرجى إدخال كود الصنف')
      return
    }

    if (changes.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
      setManualError(`الكود "${code}" موجود بالفعل في قائمة التحديثات`)
      return
    }

    const selling = manualSelling !== '' ? parseFloat(manualSelling) : undefined
    const oldSelling = manualOldSelling !== '' ? parseFloat(manualOldSelling) : undefined
    const buying = manualBuying !== '' ? parseFloat(manualBuying) : undefined
    const oldBuying = manualOldBuying !== '' ? parseFloat(manualOldBuying) : undefined

    let entry: ChangeItem

    if (manualType === 'new_product') {
      if (!name) {
        setManualError('يرجى إدخال اسم الصنف الجديد')
        return
      }
      entry = {
        code,
        type: 'new_product',
        name,
        sellingPrice: selling,
        buyingPrice: buying,
      }
      setActiveTab('new')
    } else if (manualType === 'price_update') {
      const hasSelling = manualSelling !== ''
      const hasOldSelling = manualOldSelling !== ''
      if (hasSelling !== hasOldSelling) {
        setManualError('عند تعديل سعر البيع، يجب إدخال السعر القديم والجديد معاً')
        return
      }

      const hasBuying = manualBuying !== ''
      const hasOldBuying = manualOldBuying !== ''
      if (hasBuying !== hasOldBuying) {
        setManualError('عند تعديل سعر الشراء، يجب إدخال السعر القديم والجديد معاً')
        return
      }

      if (!hasSelling && !hasBuying) {
        setManualError('يرجى إدخال تعديل سعر البيع (القديم والجديد) أو سعر الشراء (القديم والجديد)')
        return
      }

      entry = {
        code,
        type: 'price_update',
        name: name || 'صنف غير معروف',
        sellingPrice: hasSelling ? selling : undefined,
        oldSellingPrice: hasOldSelling ? oldSelling : undefined,
        buyingPrice: hasBuying ? buying : undefined,
        oldBuyingPrice: hasOldBuying ? oldBuying : undefined,
      }
      setActiveTab('price')
    } else {
      if (!name) {
        setManualError('يرجى إدخال الاسم الجديد لتعديل الاسم')
        return
      }
      entry = {
        code,
        type: 'name_update',
        name,
        oldName: '',
      }
      setActiveTab('name')
    }

    setChanges((prev) => [entry, ...prev])
    setManualCode('')
    setManualName('')
    setManualSelling('')
    setManualOldSelling('')
    setManualBuying('')
    setManualOldBuying('')
    setShowAddForm(false)
  }

  async function handleSaveChanges() {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/shared-updates/${updateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      })

      if (!response.ok) throw new Error()
      onSuccess()
    } catch {
      setError('تعذر حفظ التغييرات على تفاصيل التعديل')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div 
        className="relative flex flex-col w-full max-w-5xl min-h-[680px] max-h-[90vh] rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm shadow-indigo-500/25">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">تعديل تفاصيل التعميم: {updateName}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1">تعديل الأكواد والأسعار المعتمدة بداخل التعميم مباشرة وتعميمها فورياً.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm font-bold text-slate-400">
            جاري تحميل تفاصيل التعديل...
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-6">
            
            {/* Type Selector Segmented Tabs */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {(['price', 'name', 'new'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3.5 px-4 rounded-xl border text-right transition-all duration-300 ${
                    activeTab === tab
                      ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <span className="text-[9px] font-black text-indigo-700 block uppercase tracking-wider">
                    {tab === 'price' && 'تعديلات الأسعار'}
                    {tab === 'name' && 'تعديل الأسم�            {/* ── Sleek Trigger Button / Collapsed State ── */}
            {!showAddForm ? (
              <div className="flex justify-between items-center shrink-0 border border-slate-200/50 bg-slate-50/30 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span className="text-xs font-black text-slate-700">بنود التحديث المعتمدة في هذا التبويب:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="rounded-xl border border-indigo-150 bg-indigo-50/60 hover:bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 transition-all duration-300 active:scale-95 flex items-center gap-1.5 shadow-sm"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  إضافة صنف أو بند جديد لهذا التعميم
                </button>
              </div>
            ) : (
              /* ── Manual Add Form inside Edit Modal ────────────────── */
              <div className="relative overflow-hidden rounded-xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/20 to-violet-50/10 p-5 shrink-0">
                {/* Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-100/50 pb-3 mb-4">
                  <span className="text-xs font-black text-indigo-900">إضافة بند جديد إلى هذا التعميم</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 p-1 rounded-xl bg-indigo-100/50">
                      {(['price_update', 'name_update', 'new_product'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { setManualType(type); setManualError('') }}
                          className={`py-1 px-3 rounded-lg text-[9px] font-black transition-all duration-300 ${
                            manualType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-700 hover:bg-indigo-200/30'
                          }`}
                        >
                          {type === 'price_update' && 'تعديل سعر'}
                          {type === 'name_update' && 'تعديل اسم'}
                          {type === 'new_product' && 'صنف جديد'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs font-black text-slate-400 hover:text-slate-650 transition-colors"
                    >
                      إلغاء ×
                    </button>
                  </div>
                </div>

                {/* Grid fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 block">الكود *</label>
                    <input
                      value={manualCode}
                      onChange={(e) => { setManualCode(e.target.value); setManualError('') }}
                      placeholder="مثال: 12.001"
                      className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className={`space-y-1.5 ${manualType !== 'new_product' ? 'lg:col-span-3' : ''}`}>
                    <label className="text-[9px] font-black text-slate-500 block">
                      {manualType === 'price_update' ? 'الاسم' : 'الاسم الجديد *'}
                    </label>
                    <input
                      value={manualName}
                      onChange={(e) => { setManualName(e.target.value); setManualError('') }}
                      placeholder="اسم الصنف..."
                      className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {manualType === 'price_update' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 block">سعر البيع القديم</label>
                        <input
                          type="number"
                          value={manualOldSelling}
                          onChange={(e) => setManualOldSelling(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 block">سعر البيع الجديد</label>
                        <input
                          type="number"
                          value={manualSelling}
                          onChange={(e) => setManualSelling(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 block">سعر الشراء القديم</label>
                        <input
                          type="number"
                          value={manualOldBuying}
                          onChange={(e) => setManualOldBuying(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 block">سعر الشراء الجديد</label>
                        <input
                          type="number"
                          value={manualBuying}
                          onChange={(e) => setManualBuying(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold"
                        />
                      </div>
                    </>
                  )}

                  {manualType === 'new_product' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 block">سعر البيع</label>
                        <input
                          type="number"
                          value={manualSelling}
                          onChange={(e) => setManualSelling(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 block">سعر الشراء</label>
                        <input
                          type="number"
                          value={manualBuying}
                          onChange={(e) => setManualBuying(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Form Action */}
                <div className="mt-4 pt-3 border-t border-indigo-100/50 flex justify-between items-center gap-3">
                  <span className="text-[9px] font-bold text-rose-500">{manualError}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all duration-200"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={addManualEntry}
                      className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 text-xs font-black text-white transition-all duration-200 active:scale-95"
                    >
                      إضافة البند للتعميم
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Changes table */}
            <div className="flex-1 min-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white">ndigo-100/50 flex justify-between items-center gap-3">
                <span className="text-[9px] font-bold text-rose-500">{manualError}</span>
                <button
                  type="button"
                  onClick={addManualEntry}
                  className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 text-xs font-black text-white transition-all duration-200 active:scale-95"
                >
                  إضافة البند للتعميم
                </button>
              </div>
            </div>

            {/* Changes table */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {currentTabChanges.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  لا توجد بنود في هذا التبويب حالياً.
                </div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                      <th className="px-5 py-3">الكود</th>
                      {activeTab === 'name' ? (
                        <>
                          <th className="px-5 py-3">الاسم القديم</th>
                          <th className="px-5 py-3">الاسم الجديد</th>
                        </>
                      ) : (
                        <th className="px-5 py-3">اسم الصنف</th>
                      )}
                      {activeTab === 'price' && (
                        <>
                          <th className="px-5 py-3 text-amber-700">سعر البيع القديم</th>
                          <th className="px-5 py-3 text-amber-900">سعر البيع المقترح</th>
                          <th className="px-5 py-3 text-green-700">سعر الشراء القديم</th>
                          <th className="px-5 py-3 text-green-900">سعر الشراء المقترح</th>
                        </>
                      )}
                      {activeTab === 'new' && (
                        <>
                          <th className="px-5 py-3 text-amber-700">سعر البيع المقترح</th>
                          <th className="px-5 py-3 text-green-700">سعر الشراء المقترح</th>
                        </>
                      )}
                      <th className="px-5 py-3 text-center">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                    {currentTabChanges.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50/20 transition-colors">
                        {/* Code */}
                        <td className="px-5 py-3">
                          <input
                            value={item.code}
                            onChange={(e) => handleCodeFieldChange(item.code, e.target.value)}
                            className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold focus:border-indigo-500 outline-none"
                          />
                        </td>

                        {/* Name columns */}
                        {activeTab === 'name' ? (
                          <>
                            <td className="px-5 py-3">
                              <input
                                value={item.oldName ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'oldName', e.target.value)}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold focus:border-indigo-500 outline-none"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                value={item.name}
                                onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold focus:border-indigo-500 outline-none"
                              />
                            </td>
                          </>
                        ) : activeTab === 'new' ? (
                          <td className="px-5 py-3">
                            <input
                              value={item.name}
                              onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold focus:border-indigo-500 outline-none"
                            />
                          </td>
                        ) : (
                          <td className="px-5 py-3">
                            <div className="space-y-1">
                              {item.oldName && (
                                <span className="line-through text-[9px] text-slate-350 block">{item.oldName}</span>
                              )}
                              <input
                                value={item.name}
                                onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold focus:border-indigo-500 outline-none"
                              />
                            </div>
                          </td>
                        )}

                        {/* Price columns - Price tab */}
                        {activeTab === 'price' && (
                          <>
                            <td className="px-5 py-3 font-mono">
                              <input
                                type="number"
                                value={item.oldSellingPrice ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'oldSellingPrice', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                placeholder="—"
                                className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold outline-none"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                value={item.sellingPrice ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'sellingPrice', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                placeholder="—"
                                className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold outline-none"
                              />
                            </td>
                            <td className="px-5 py-3 font-mono">
                              <input
                                type="number"
                                value={item.oldBuyingPrice ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'oldBuyingPrice', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                placeholder="—"
                                className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold outline-none"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                value={item.buyingPrice ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'buyingPrice', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                placeholder="—"
                                className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold outline-none"
                              />
                            </td>
                          </>
                        )}

                        {/* Price columns - New tab */}
                        {activeTab === 'new' && (
                          <>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                value={item.sellingPrice ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'sellingPrice', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                placeholder="—"
                                className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold outline-none"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                value={item.buyingPrice ?? ''}
                                onChange={(e) => handleFieldChange(item.code, 'buyingPrice', e.target.value !== '' ? parseFloat(e.target.value) : undefined)}
                                placeholder="—"
                                className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold outline-none"
                              />
                            </td>
                          </>
                        )}

                        {/* Controls */}
                        <td className="px-5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeEntry(item.code)}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/30 text-rose-700 px-3 py-1 text-xs font-black transition-all"
                          >
                            حذف البند
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-rose-500">{error}</span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="flex-1 sm:flex-none rounded-xl bg-slate-900 hover:bg-indigo-900 active:scale-95 px-6 py-3 text-xs font-black text-white transition-all shadow-premium"
                >
                  {saving ? 'جاري حفظ التغييرات...' : 'حفظ وتعميم التغييرات'}
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-500 hover:bg-slate-50 transition-all shrink-0"
                >
                  إلغاء
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
