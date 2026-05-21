'use client'

import { useState, useMemo } from 'react'

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
    const changesMap = new Map<string, ChangeItem>()
    confirmedChanges.forEach((c) => changesMap.set(c.code.toLowerCase(), c))

    // Compile final products list
    let finalProducts = initialAllProducts
      .map((product) => {
        const codeKey = product.code.trim().toLowerCase()
        const isExcluded = excludedCodes.has(product.code)

        if (isExcluded) {
          // Find original change metadata to restore previous values if name/price update
          const originalChange = changes.find((c) => c.code === product.code)
          if (originalChange) {
            if (originalChange.type === 'price_update') {
              return {
                ...product,
                sellingPrice: originalChange.oldSellingPrice,
                buyingPrice: originalChange.oldBuyingPrice,
              }
            } else if (originalChange.type === 'name_update') {
              return {
                ...product,
                name: originalChange.oldName || product.name,
              }
            } else if (originalChange.type === 'new_product') {
              // Excluded new products will be filtered out completely
              return null
            }
          }
          return product
        }

        // Apply any confirmed edits
        const confirmedEdit = changesMap.get(codeKey)
        if (confirmedEdit) {
          return {
            ...product,
            name: confirmedEdit.name,
            sellingPrice: confirmedEdit.sellingPrice,
            buyingPrice: confirmedEdit.buyingPrice,
          }
        }

        return product
      })
      .filter(Boolean)

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
    <div className="space-y-6">
      {/* Title block */}
      <div className="rounded-2xl border border-amber-200/50 bg-[#FCFAF7] p-6 shadow-sm">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A88554] bg-[#F7F2EB] px-2.5 py-1 rounded-full">خطوة مراجعة التحديثات</span>
        <h2 className="text-xl font-extrabold text-[#1E2229] mt-3">مراجعة وتعديل قائمة التحديثات المكتشفة</h2>
        <p className="text-xs text-[#78726A] mt-1.5 leading-relaxed">
          تم اكتشاف فروقات بين الملف المرفوع وآخر رفع للفرع المهيمن. يمكنك مراجعة الأسعار والمسميات، تعديلها، أو استبعاد بعض الأصناف قبل تعميمها.
        </p>

        {/* Update list name field */}
        <div className="mt-5 max-w-xl space-y-2">
          <label className="text-xs font-bold text-[#1E2229] block">اسم قائمة التحديثات (سيظهر لباقي الفروع)</label>
          <input
            type="text"
            value={updateName}
            onChange={(e) => setUpdateName(e.target.value)}
            placeholder="مثال: تحديث أسعار الصيف..."
            className="h-10 w-full rounded-lg border border-[#E2E0D9] bg-white px-3 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] focus:ring-1 focus:ring-[#A88554] outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Metrics Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('price')}
          className={`rounded-xl border p-4 text-right transition-all duration-200 shadow-sm ${
            activeTab === 'price'
              ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400'
              : 'border-[#EAE8E4] bg-white hover:bg-[#FCFAF7]/40'
          }`}
        >
          <span className="text-[10px] font-bold text-amber-700 block">تعديلات الأسعار المكتشفة</span>
          <span className="text-2xl font-black text-amber-900 tracking-wider mt-1 block">
            {priceChanges.length.toLocaleString('ar-EG')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('name')}
          className={`rounded-xl border p-4 text-right transition-all duration-200 shadow-sm ${
            activeTab === 'name'
              ? 'border-blue-400 bg-blue-50/40 ring-1 ring-blue-400'
              : 'border-[#EAE8E4] bg-white hover:bg-[#FCFAF7]/40'
          }`}
        >
          <span className="text-[10px] font-bold text-blue-700 block">تعديل مسميات الأصناف</span>
          <span className="text-2xl font-black text-blue-900 tracking-wider mt-1 block">
            {nameChanges.length.toLocaleString('ar-EG')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`rounded-xl border p-4 text-right transition-all duration-200 shadow-sm ${
            activeTab === 'new'
              ? 'border-green-400 bg-green-50/40 ring-1 ring-green-400'
              : 'border-[#EAE8E4] bg-white hover:bg-[#FCFAF7]/40'
          }`}
        >
          <span className="text-[10px] font-bold text-green-700 block">أصناف جديدة مكتشفة</span>
          <span className="text-2xl font-black text-green-900 tracking-wider mt-1 block">
            {newChanges.length.toLocaleString('ar-EG')}
          </span>
        </button>
      </div>

      {/* Main diff Table container */}
      <div className="rounded-xl border border-[#EAE8E4] bg-white overflow-hidden shadow-sm transition-all duration-300">
        <div className="overflow-x-auto">
          {currentTabChanges.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-[#A19D95]">
              لا توجد تعديلات نشطة في هذا القسم حالياً.
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#EAE8E4] text-[10px] font-extrabold uppercase tracking-wider text-[#78726A]">
                  <th className="px-4 py-3">الكود</th>
                  {activeTab === 'name' ? (
                    <>
                      <th className="px-4 py-3">الاسم القديم</th>
                      <th className="px-4 py-3">الاسم المقترح الجديد</th>
                    </>
                  ) : (
                    <th className="px-4 py-3">اسم الصنف</th>
                  )}
                  {activeTab === 'price' && (
                    <>
                      <th className="px-4 py-3 text-amber-700">سعر البيع القديم</th>
                      <th className="px-4 py-3 text-amber-900">سعر البيع الجديد</th>
                      <th className="px-4 py-3 text-green-700">سعر الشراء القديم</th>
                      <th className="px-4 py-3 text-green-900">سعر الشراء الجديد</th>
                    </>
                  )}
                  {activeTab === 'new' && (
                    <>
                      <th className="px-4 py-3 text-amber-700">سعر البيع</th>
                      <th className="px-4 py-3 text-green-700">سعر الشراء</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E4] text-xs font-semibold text-[#1E2229]">
                {currentTabChanges.map((item) => (
                  <tr key={item.code} className="hover:bg-[#FCFAF7]/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#78726A]">{item.code}</td>
                    
                    {/* Name column editing */}
                    {activeTab === 'name' ? (
                      <>
                        <td className="px-4 py-3 text-[#A19D95] max-w-[200px] truncate">{item.oldName}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                            className="h-8 w-full rounded border border-[#E2E0D9] bg-white px-2 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] outline-none"
                          />
                        </td>
                      </>
                    ) : activeTab === 'new' ? (
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleFieldChange(item.code, 'name', e.target.value)}
                          className="h-8 w-full rounded border border-[#E2E0D9] bg-white px-2 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] outline-none"
                        />
                      </td>
                    ) : (
                      <td className="px-4 py-3 max-w-[220px] truncate">{item.name}</td>
                    )}

                    {/* Price editing */}
                    {activeTab === 'price' && (
                      <>
                        <td className="px-4 py-3 text-[#A19D95] font-mono">
                          {item.oldSellingPrice != null ? `${item.oldSellingPrice.toLocaleString('ar-EG')} ج.م` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.sellingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'sellingPrice', Number(e.target.value) || undefined)}
                            className="h-8 w-20 rounded border border-[#E2E0D9] bg-white px-2 font-mono text-xs font-semibold text-[#1E2229] focus:border-[#A88554] outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-[#A19D95] font-mono">
                          {item.oldBuyingPrice != null ? `${item.oldBuyingPrice.toLocaleString('ar-EG')} ج.م` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.buyingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'buyingPrice', Number(e.target.value) || undefined)}
                            className="h-8 w-20 rounded border border-[#E2E0D9] bg-white px-2 font-mono text-xs font-semibold text-[#1E2229] focus:border-[#A88554] outline-none"
                          />
                        </td>
                      </>
                    )}

                    {activeTab === 'new' && (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.sellingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'sellingPrice', Number(e.target.value) || undefined)}
                            className="h-8 w-20 rounded border border-[#E2E0D9] bg-white px-2 font-mono text-xs font-semibold text-[#1E2229] focus:border-[#A88554] outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.buyingPrice ?? ''}
                            onChange={(e) => handleFieldChange(item.code, 'buyingPrice', Number(e.target.value) || undefined)}
                            className="h-8 w-20 rounded border border-[#E2E0D9] bg-white px-2 font-mono text-xs font-semibold text-[#1E2229] focus:border-[#A88554] outline-none"
                          />
                        </td>
                      </>
                    )}

                    {/* Exclude row action */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExclude(item.code)}
                        className="rounded bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 text-[11px] font-bold transition-all duration-150"
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
        <div className="rounded-xl border border-red-200/50 bg-red-50/30 p-4 text-red-700 font-bold text-xs">
          {errorMessage}
        </div>
      )}

      {/* Confirm or Cancel Panel Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleShareUpdate}
          disabled={submitting}
          className="rounded-lg bg-[#1E2229] hover:bg-[#2e343f] active:scale-95 disabled:opacity-50 disabled:pointer-events-none px-8 py-3.5 text-xs font-bold text-white transition-all duration-200 shadow-sm"
        >
          {submitting ? 'جاري تعميم التحديث ومشاركته...' : 'حفظ وتعميم قائمة التحديثات (مشاركة)'}
        </button>

        <button
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-[#E2E0D9] hover:border-red-400 hover:text-red-500 bg-white px-6 py-3.5 text-xs font-bold text-[#78726A] transition-all duration-200 shrink-0"
        >
          إلغاء والعودة
        </button>
      </div>
    </div>
  )
}
