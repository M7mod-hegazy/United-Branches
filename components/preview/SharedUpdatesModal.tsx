'use client'

import { useEffect, useState, useMemo } from 'react'

interface SharedUpdatesModalProps {
  onClose: () => void
}

interface UpdateSummary {
  _id: string
  name: string
  branchName: string
  uploadedAt: string
  createdAt: string
  changesCount: number
  newProductsCount: number
  priceUpdatesCount: number
  nameUpdatesCount: number
}

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

interface UpdateDetails {
  _id: string
  name: string
  branchId: { _id: string; name: string }
  uploadedAt: string
  createdAt: string
  changes: ChangeItem[]
}

type DetailsTab = 'all' | 'price' | 'name' | 'new'

export function SharedUpdatesModal({ onClose }: SharedUpdatesModalProps) {
  const [updates, setUpdates] = useState<UpdateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null)
  const [details, setDetails] = useState<UpdateDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/shared-updates')
      .then((r) => r.json())
      .then((data) => {
        setUpdates(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSelectUpdate(id: string) {
    setSelectedUpdateId(id)
    setLoadingDetails(true)
    setDetails(null)
    setSearchQuery('')
    setDetailsTab('all')

    try {
      const response = await fetch(`/api/shared-updates/${id}`)
      const data = await response.json()
      setDetails(data)
      setLoadingDetails(false)
    } catch {
      setLoadingDetails(false)
    }
  }

  // Filtered detail changes based on tab and search query
  const filteredChanges = useMemo(() => {
    if (!details || !details.changes) return []
    const query = searchQuery.trim().toLowerCase()
    
    return details.changes.filter((c) => {
      const matchesTab =
        detailsTab === 'all' ||
        (detailsTab === 'price' && c.type === 'price_update') ||
        (detailsTab === 'name' && c.type === 'name_update') ||
        (detailsTab === 'new' && c.type === 'new_product')

      const matchesSearch =
        !query ||
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        (c.oldName && c.oldName.toLowerCase().includes(query))

      return matchesTab && matchesSearch
    })
  }, [details, detailsTab, searchQuery])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2229]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative flex flex-col w-full max-w-4xl h-[85vh] rounded-2xl border border-[#EAE8E4] bg-white shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#EAE8E4] bg-[#FCFAF7] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1E2229]">تحديثات الأسعار ومسميات الأصناف</h3>
              <p className="text-[11px] font-semibold text-[#78726A] mt-0.5">قوائم التعديلات والمنتجات الجديدة المعممة من الإدارة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E2E0D9] p-2 text-[#78726A] hover:bg-[#FCFAF7] hover:text-[#1E2229] transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content body split into left list and right details */}
        <div className="flex-1 flex overflow-hidden">
          {/* List of Card Updates (Right sidebar in RTL, meaning left part or right part, we'll keep list on the right and details on the left for Arabic) */}
          <div className="w-80 border-l border-[#EAE8E4] overflow-y-auto p-4 space-y-3 bg-[#FCFAF7]/40 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A19D95] block mb-1">أحدث قوائم التحديثات</span>
            {loading ? (
              <div className="text-center py-8 text-xs font-bold text-[#A19D95]">جاري تحميل السجل...</div>
            ) : updates.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-[#A19D95]">لا توجد تحديثات معممة حالياً.</div>
            ) : (
              updates.map((up) => {
                const selected = selectedUpdateId === up._id
                return (
                  <button
                    key={up._id}
                    onClick={() => handleSelectUpdate(up._id)}
                    className={`w-full text-right p-4 rounded-xl border transition-all duration-200 block shadow-sm relative overflow-hidden ${
                      selected
                        ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400'
                        : 'border-[#EAE8E4] bg-white hover:border-[#A88554]/50'
                    }`}
                  >
                    {/* Glowing highlight indicator */}
                    {selected && (
                      <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 animate-pulse" />
                    )}
                    <h4 className="text-xs font-black text-[#1E2229] max-w-[220px] truncate leading-snug">{up.name}</h4>
                    <div className="text-[10px] font-semibold text-[#78726A] mt-1 flex justify-between items-center">
                      <span>الفرع: {up.branchName}</span>
                      <span className="font-mono text-[9px] text-[#A19D95]">
                        {new Date(up.createdAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Summary pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {up.newProductsCount > 0 && (
                        <span className="rounded bg-green-50 px-1 py-0.5 text-[9px] font-black text-green-700">
                          +{up.newProductsCount} جديد
                        </span>
                      )}
                      {up.priceUpdatesCount > 0 && (
                        <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-black text-amber-700">
                          ~{up.priceUpdatesCount} أسعار
                        </span>
                      )}
                      {up.nameUpdatesCount > 0 && (
                        <span className="rounded bg-blue-50 px-1 py-0.5 text-[9px] font-black text-blue-700">
                          ~{up.nameUpdatesCount} أسماء
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Details Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {!selectedUpdateId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A19D95]">
                <div className="rounded-full bg-[#FCFAF7] border border-[#EAE8E4] p-4 text-[#A19D95] mb-4">
                  <svg className="h-10 w-10 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-[#1E2229]">اختر تحديثاً لمعاينة التفاصيل</h4>
                <p className="text-xs text-[#78726A] mt-1 max-w-sm leading-relaxed">
                  انقر على أي بطاقة تحديث من القائمة الجانبية لعرض جداول تعديل الأسعار، تعديل الأسماء، أو المنتجات الجديدة بشكل تفصيلي.
                </p>
              </div>
            ) : loadingDetails ? (
              <div className="flex-1 flex items-center justify-center text-xs font-bold text-[#A19D95]">
                جاري تحميل تفاصيل التحديث...
              </div>
            ) : details ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Detail summary & search header */}
                <div className="p-4 border-b border-[#EAE8E4] bg-[#FCFAF7]/20 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-sm font-black text-[#1E2229]">{details.name}</h4>
                      <p className="text-[10px] text-[#78726A] font-semibold mt-0.5">
                        تم التحديث في {new Date(details.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Search inside update */}
                    <div className="relative min-w-[200px]">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بكود أو اسم الصنف..."
                        className="h-8 w-full rounded-lg border border-[#E2E0D9] bg-white pr-8 pl-3 text-[11px] font-semibold text-[#1E2229] placeholder-[#A19D95] focus:border-[#A88554] outline-none"
                      />
                      <svg className="absolute top-2 right-2.5 h-4 w-4 text-[#A19D95]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Detail filter tabs */}
                  <div className="flex items-center gap-1.5 border-b border-[#EAE8E4] pb-0.5 overflow-x-auto text-[11px] font-bold">
                    <button
                      onClick={() => setDetailsTab('all')}
                      className={`px-3 py-1 border-b-2 transition-all duration-150 ${
                        detailsTab === 'all'
                          ? 'border-[#A88554] text-[#A88554]'
                          : 'border-transparent text-[#78726A] hover:text-[#1E2229]'
                      }`}
                    >
                      الكل ({details.changes.length})
                    </button>
                    <button
                      onClick={() => setDetailsTab('price')}
                      className={`px-3 py-1 border-b-2 transition-all duration-150 ${
                        detailsTab === 'price'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-[#78726A] hover:text-[#1E2229]'
                      }`}
                    >
                      الأسعار ({details.changes.filter(c => c.type === 'price_update').length})
                    </button>
                    <button
                      onClick={() => setDetailsTab('name')}
                      className={`px-3 py-1 border-b-2 transition-all duration-150 ${
                        detailsTab === 'name'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-[#78726A] hover:text-[#1E2229]'
                      }`}
                    >
                      المسميات ({details.changes.filter(c => c.type === 'name_update').length})
                    </button>
                    <button
                      onClick={() => setDetailsTab('new')}
                      className={`px-3 py-1 border-b-2 transition-all duration-150 ${
                        detailsTab === 'new'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-[#78726A] hover:text-[#1E2229]'
                      }`}
                    >
                      أصناف جديدة ({details.changes.filter(c => c.type === 'new_product').length})
                    </button>
                  </div>
                </div>

                {/* Details Table */}
                <div className="flex-1 overflow-y-auto">
                  {filteredChanges.length === 0 ? (
                    <div className="p-8 text-center text-xs font-semibold text-[#A19D95]">
                      لا توجد نتائج مطابقة لبحثك أو تبويب المراجعة هذا.
                    </div>
                  ) : (
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#FCFAF7] border-b border-[#EAE8E4] text-[9px] font-extrabold uppercase tracking-wider text-[#78726A] sticky top-0 z-10">
                          <th className="px-4 py-2.5">الكود</th>
                          <th className="px-4 py-2.5">النوع</th>
                          <th className="px-4 py-2.5">التعديل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE8E4] text-xs font-semibold text-[#1E2229]">
                        {filteredChanges.map((c) => (
                          <tr key={c.code} className="hover:bg-[#FCFAF7]/10 transition-colors">
                            <td className="px-4 py-3 font-mono text-[10px] text-[#78726A]">{c.code}</td>
                            <td className="px-4 py-3">
                              {c.type === 'new_product' && (
                                <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">صنف جديد</span>
                              )}
                              {c.type === 'price_update' && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">تعديل سعر</span>
                              )}
                              {c.type === 'name_update' && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">تعديل اسم</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {c.type === 'new_product' && (
                                <div className="space-y-1">
                                  <div className="font-bold text-[#1E2229]">{c.name}</div>
                                  <div className="text-[10px] font-semibold text-[#78726A] flex gap-3">
                                    {c.sellingPrice != null && <span>بيع: <b className="text-amber-800 font-mono">{c.sellingPrice} ج.م</b></span>}
                                    {c.buyingPrice != null && <span>شراء: <b className="text-green-800 font-mono">{c.buyingPrice} ج.m</b></span>}
                                  </div>
                                </div>
                              )}

                              {c.type === 'name_update' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[#A19D95] line-through font-medium">{c.oldName}</span>
                                  <svg className="h-3 w-3 text-[#A19D95] transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                  <span className="text-blue-700 font-bold">{c.name}</span>
                                </div>
                              )}

                              {c.type === 'price_update' && (
                                <div className="space-y-1">
                                  <div className="text-[11px] font-extrabold text-[#1E2229]">{c.name}</div>
                                  <div className="text-[10px] font-bold flex gap-4 flex-wrap mt-0.5">
                                    {/* Selling price diff */}
                                    {(c.sellingPrice !== c.oldSellingPrice) && (
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-[#78726A]">سعر البيع:</span>
                                        <span className="text-[#A19D95] line-through font-mono">{c.oldSellingPrice ?? '—'}</span>
                                        <svg className="h-2.5 w-2.5 text-[#A19D95] transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className="text-amber-800 font-mono font-extrabold">{c.sellingPrice ?? '—'} ج.م</span>
                                      </span>
                                    )}
                                    {/* Buying price diff */}
                                    {(c.buyingPrice !== c.oldBuyingPrice) && (
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-[#78726A]">سعر الشراء:</span>
                                        <span className="text-[#A19D95] line-through font-mono">{c.oldBuyingPrice ?? '—'}</span>
                                        <svg className="h-2.5 w-2.5 text-[#A19D95] transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className="text-green-800 font-mono font-extrabold">{c.buyingPrice ?? '—'} ج.م</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
