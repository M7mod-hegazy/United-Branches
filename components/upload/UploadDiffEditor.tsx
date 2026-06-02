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
  isManual?: boolean
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

  // Manual entry form state
  const [manualType, setManualType] = useState<'price_update' | 'name_update' | 'new_product'>('price_update')
  const [manualCode, setManualCode] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualSelling, setManualSelling] = useState('')
  const [manualOldSelling, setManualOldSelling] = useState('')
  const [manualBuying, setManualBuying] = useState('')
  const [manualOldBuying, setManualOldBuying] = useState('')
  const [manualError, setManualError] = useState('')

  // Split changes by type (excluding excluded codes)
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

  // Handle inline edits on existing rows
  function handleFieldChange(code: string, field: keyof ChangeItem, value: any) {
    setChanges((prev) =>
      prev.map((c) => (c.code === code ? { ...c, [field]: value } : c))
    )
  }

  // Toggle exclude (auto-detected entries)
  function toggleExclude(code: string) {
    setExcludedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  // Remove a manually added entry entirely
  function removeManualEntry(code: string) {
    setChanges((prev) => prev.filter((c) => c.code !== code))
  }

  // Handle manual code entry and auto-prefill fields
  function handleCodeChange(val: string) {
    setManualCode(val)
    setManualError('')

    if (val.trim()) {
      const existing = initialAllProducts.find(
        (p: any) => String(p.code).trim().toLowerCase() === val.trim().toLowerCase()
      )
      if (existing) {
        if (existing.name && !manualName) {
          setManualName(existing.name)
        }
        if (existing.sellingPrice != null) {
          setManualOldSelling(existing.sellingPrice.toString())
        } else {
          setManualOldSelling('')
        }
        if (existing.buyingPrice != null) {
          setManualOldBuying(existing.buyingPrice.toString())
        } else {
          setManualOldBuying('')
        }
      }
    }
  }

  // Add a manual entry based on explicitly selected type
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

    // Smart lookup: does this code already exist in the product database?
    const existing = initialAllProducts.find(
      (p: any) => String(p.code).trim().toLowerCase() === code.toLowerCase()
    )

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
        isManual: true,
      }
      setActiveTab('new')
    } else if (manualType === 'price_update') {
      if (!existing) {
        setManualError('كود الصنف هذا غير موجود كصنف سابق. يرجى اختيار نوع التعديل "صنف جديد"')
        return
      }

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

      const oldName = existing.name ?? ''
      const targetName = name || oldName

      entry = {
        code,
        type: 'price_update',
        name: targetName,
        oldName: targetName.trim() !== oldName.trim() ? oldName : undefined,
        sellingPrice: hasSelling ? selling : undefined,
        oldSellingPrice: hasOldSelling ? oldSelling : undefined,
        buyingPrice: hasBuying ? buying : undefined,
        oldBuyingPrice: hasOldBuying ? oldBuying : undefined,
        isManual: true,
      }
      setActiveTab('price')
    } else {
      // name_update
      if (!existing) {
        setManualError('كود الصنف هذا غير موجود كصنف سابق. يرجى اختيار نوع التعديل "صنف جديد"')
        return
      }
      if (!name) {
        setManualError('يرجى إدخال الاسم الجديد لتعديل الاسم')
        return
      }
      entry = {
        code,
        type: 'name_update',
        name,
        oldName: existing.name ?? '',
        isManual: true,
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
  }

  async function handleShareUpdate() {
    setSubmitting(true)
    setErrorMessage('')

    // Strip isManual flag — API doesn't need it
    const confirmedChanges = changes
      .filter((c) => !excludedCodes.has(c.code))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ isManual: _m, ...rest }) => rest)

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
        <h2 className="text-xl font-black text-slate-900 mt-2">مراجعة واعتماد قائمة التحديثات</h2>
        <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed max-w-2xl">
          راجع وعدّل التحديثات المكتشفة تلقائياً، أو أضف أصناف وأسعار يدوياً — ثم عمّمها على باقي الفروع.
        </p>
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

      {/* Metrics Summary Tabs */}
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
          <span className="text-[10px] font-black text-amber-700 block uppercase tracking-wide">تعديلات الأسعار</span>
          <span className="text-4xl font-black text-amber-900 tracking-wider mt-1 block tabular-nums">
            {priceChanges.length.toLocaleString('en-US')}
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
          <span className="text-4xl font-black text-blue-900 tracking-wider mt-1 block tabular-nums">
            {nameChanges.length.toLocaleString('en-US')}
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
          <span className="text-[10px] font-black text-green-700 block uppercase tracking-wide">أصناف جديدة</span>
          <span className="text-4xl font-black text-green-900 tracking-wider mt-1 block tabular-nums">
            {newChanges.length.toLocaleString('en-US')}
          </span>
        </button>
      </div>

      {/* ── Manual Entry Panel ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-violet-50/20 p-6 shadow-sm">
        <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-indigo-400/5 blur-3xl" />
        <div className="relative">

          {/* Header & Type Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/50 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm shadow-indigo-500/25">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-900">إضافة صنف يدوياً للتعميم</h3>
                <p className="text-[10px] font-bold text-indigo-600/70 mt-0.5">
                  اختر نوع التعديل واملأ البيانات المطلوبة لإدراجها يدوياً
                </p>
              </div>
            </div>

            {/* Premium segmented control */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-indigo-100/60 self-start md:self-auto">
              {(['price_update', 'name_update', 'new_product'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setManualType(type)
                    setManualError('')
                  }}
                  className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black transition-all duration-300 text-center ${
                    manualType === type
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-700 hover:bg-indigo-200/50'
                  }`}
                >
                  {type === 'price_update' && 'تعديل سعر'}
                  {type === 'name_update' && 'تعديل اسم'}
                  {type === 'new_product' && 'صنف جديد'}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">

            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 block">كود الصنف <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                placeholder="مثال: 12.001"
                className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
              />
            </div>

            {/* Name */}
            <div className={`space-y-1.5 ${manualType !== 'new_product' ? 'lg:col-span-3' : ''}`}>
              <label className="text-[10px] font-black text-slate-500 block">
                {manualType === 'price_update' && 'اسم الصنف (اختياري لتغيير الاسم)'}
                {manualType === 'name_update' && 'الاسم الجديد للصنف *'}
                {manualType === 'new_product' && 'اسم الصنف الجديد *'}
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => { setManualName(e.target.value); setManualError('') }}
                onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                placeholder={manualType === 'price_update' ? 'اتركه فارغاً للاحتفاظ بالاسم الحالي...' : 'اسم الصنف...'}
                className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
              />
            </div>

            {/* Price fields depending on manualType */}
            {manualType === 'price_update' && (
              <>
                {/* Selling Price - Old */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 block">سعر البيع القديم (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualOldSelling}
                    onChange={(e) => setManualOldSelling(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
                  />
                </div>

                {/* Selling Price - New */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 block">سعر البيع الجديد (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualSelling}
                    onChange={(e) => setManualSelling(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
                  />
                </div>

                {/* Buying Price - Old */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 block">سعر الشراء القديم (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualOldBuying}
                    onChange={(e) => setManualOldBuying(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
                  />
                </div>

                {/* Buying Price - New */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 block">سعر الشراء الجديد (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualBuying}
                    onChange={(e) => setManualBuying(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
                  />
                </div>
              </>
            )}

            {manualType === 'new_product' && (
              <>
                {/* Selling Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 block">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualSelling}
                    onChange={(e) => setManualSelling(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
                  />
                </div>

                {/* Buying Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 block">سعر الشراء (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualBuying}
                    onChange={(e) => setManualBuying(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManualEntry()}
                    placeholder="0.00"
                    className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 font-mono text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all duration-300"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Zone - Elegant Full Width Footer */}
          <div className="mt-5 pt-4 border-t border-indigo-100/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            {manualError ? (
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {manualError}
              </div>
            ) : (
              <span className="text-[10px] font-bold text-slate-400/80">
                {manualType === 'price_update' && '* في تعديل السعر، عند تعديل فئة (البيع أو الشراء) يلزم إدخال السعرين القديم والجديد معاً'}
                {manualType === 'name_update' && '* الحقول المميزة بنجمة مطلوبة لتعديل اسم الصنف'}
                {manualType === 'new_product' && '* الحقول المميزة بنجمة مطلوبة لإضافة صنف جديد'}
              </span>
            )}
            <button
              type="button"
              onClick={addManualEntry}
              className="h-10 w-full sm:w-auto min-w-[180px] flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 text-xs font-black text-white transition-all duration-200 shadow-sm shadow-indigo-500/25"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              إضافة التعديل للتعميم
            </button>
          </div>
        </div>
      </div>

      {/* Main Diff Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-premium">
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
                  <tr
                    key={item.code}
                    className={`hover:bg-slate-50/40 transition-colors ${item.isManual ? 'bg-indigo-50/30' : ''}`}
                  >
                    {/* Code cell with manual badge */}
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 border border-slate-200/30">
                          {item.code}
                        </span>
                        {item.isManual && (
                          <span className="rounded-md bg-indigo-100 border border-indigo-200/60 px-1.5 py-0.5 text-[8px] font-black text-indigo-700 uppercase tracking-wide leading-none">
                            يدوي
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name columns */}
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

                    {/* Price editing — price tab */}
                    {activeTab === 'price' && (
                      <>
                        <td className="px-6 py-4 text-slate-400 font-mono">
                          {item.oldSellingPrice != null ? `${item.oldSellingPrice.toLocaleString('en-US')} ج.م` : '—'}
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
                          {item.oldBuyingPrice != null ? `${item.oldBuyingPrice.toLocaleString('en-US')} ج.م` : '—'}
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

                    {/* Price editing — new products tab */}
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

                    {/* Row action: حذف for manual, استبعاد/إعادة تضمين for auto */}
                    <td className="px-6 py-4 text-center">
                      {item.isManual ? (
                        <button
                          type="button"
                          onClick={() => removeManualEntry(item.code)}
                          className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/30 text-rose-700 px-4 py-1.5 text-xs font-black transition-all duration-300 active:scale-95"
                        >
                          حذف
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExclude(item.code)}
                          className={`rounded-lg border px-4 py-1.5 text-xs font-black transition-all duration-300 active:scale-95 ${
                            excludedCodes.has(item.code)
                              ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              : 'bg-rose-50 hover:bg-rose-100 border-rose-200/30 text-rose-700'
                          }`}
                        >
                          {excludedCodes.has(item.code) ? 'إعادة تضمين' : 'استبعاد'}
                        </button>
                      )}
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

      {/* Action Buttons */}
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
