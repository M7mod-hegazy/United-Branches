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
  const [cardPage, setCardPage] = useState(1)

  const CARDS_PER_PAGE = 10

  useEffect(() => {
    fetch('/api/shared-updates?t=' + Date.now())
      .then((r) => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then((data) => {
        setUpdates(Array.isArray(data) ? data : [])
        setCardPage(1)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading shared updates:', err)
        setUpdates([])
        setLoading(false)
      })
  }, [])

  async function handleSelectUpdate(id: string) {
    setSelectedUpdateId(id)
    setLoadingDetails(true)
    setDetails(null)
    setSearchQuery('')
    setDetailsTab('all')

    try {
      const response = await fetch(`/api/shared-updates/${id}?t=` + Date.now())
      if (!response.ok) {
        throw new Error('Failed to fetch details')
      }
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setDetails(data)
      setLoadingDetails(false)
    } catch (err) {
      console.error('Error fetching details:', err)
      setDetails(null)
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

  const pagedUpdates = updates.slice((cardPage - 1) * CARDS_PER_PAGE, cardPage * CARDS_PER_PAGE)
  const totalCardPages = Math.max(1, Math.ceil(updates.length / CARDS_PER_PAGE))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div 
        className="relative flex flex-col w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-100 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 shadow-sm border border-amber-100">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">تحديثات الأسعار ومسميات الأصناف</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">قوائم التعديلات والمنتجات الجديدة المعممة من الإدارة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content body split into left list and right details */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* List of Card Updates Sidebar */}
          <div className="w-80 border-l border-slate-100 flex flex-col bg-slate-50/30 shrink-0">
            {/* Sidebar Header */}
            <div className="px-5 pt-5 pb-3 shrink-0 border-b border-slate-100/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">أحدث قوائم التحديثات</span>
              {!loading && updates.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 mt-0.5 block tabular-nums">{updates.length.toLocaleString('en-US')} قائمة مرفوعة</span>
              )}
            </div>

            {/* Scrollable Cards Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              {loading ? (
                <div className="text-center py-12 text-sm font-bold text-slate-400">جاري تحميل السجل...</div>
              ) : updates.length === 0 ? (
                <div className="text-center py-12 text-sm font-bold text-slate-400">لا توجد تحديثات معممة حالياً.</div>
              ) : (
                pagedUpdates.map((up) => {
                  const selected = selectedUpdateId === up._id
                  return (
                    <button
                      key={up._id}
                      onClick={() => handleSelectUpdate(up._id)}
                      className={`w-full text-right p-4 rounded-2xl border transition-all duration-300 block shadow-sm relative overflow-hidden ${
                        selected
                          ? 'border-[#1E6FBF] bg-blue-50/30 ring-1 ring-[#1E6FBF]'
                          : 'border-slate-200/60 bg-white hover:border-[#1E6FBF] hover:-translate-y-[1px]'
                      }`}
                    >
                      {/* Glowing highlight indicator */}
                      {selected && (
                        <span className="absolute top-0 right-0 h-full w-1.5 bg-[#1E6FBF]" />
                      )}
                      <h4 className="text-xs font-black text-slate-800 max-w-[220px] truncate leading-snug">{up.name}</h4>
                      <div className="text-[10px] font-bold text-slate-400 mt-2 flex justify-between items-center">
                        <span>الفرع: {up.branchName}</span>
                        <span className="font-mono text-slate-400">
                          {new Date(up.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Summary pills */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {up.newProductsCount > 0 && (
                          <span className="rounded-lg bg-green-50 border border-green-150 px-2 py-0.5 text-[9px] font-black text-green-700">
                            +{up.newProductsCount} جديد
                          </span>
                        )}
                        {up.priceUpdatesCount > 0 && (
                          <span className="rounded-lg bg-amber-50 border border-amber-150 px-2 py-0.5 text-[9px] font-black text-amber-700">
                            ~{up.priceUpdatesCount} أسعار
                          </span>
                        )}
                        {up.nameUpdatesCount > 0 && (
                          <span className="rounded-lg bg-blue-50 border border-blue-150 px-2 py-0.5 text-[9px] font-black text-blue-700">
                            ~{up.nameUpdatesCount} أسماء
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Sidebar Pagination */}
            {!loading && totalCardPages > 1 && (
              <div className="shrink-0 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                  disabled={cardPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                >
                  <svg className="h-3 w-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                  السابق
                </button>
                <span className="text-[10px] font-black text-slate-400 tabular-nums">
                  {cardPage.toLocaleString('en-US')} / {totalCardPages.toLocaleString('en-US')}
                </span>
                <button
                  onClick={() => setCardPage((p) => Math.min(totalCardPages, p + 1))}
                  disabled={cardPage === totalCardPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                >
                  التالي
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {!selectedUpdateId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="rounded-full bg-slate-50 border border-slate-200/50 p-5 text-slate-400 mb-5 shadow-sm">
                  <svg className="h-10 w-10 stroke-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-base font-extrabold text-slate-800">اختر تحديثاً من القائمة الجانبية لمعاينة تفاصيله</h4>
                <p className="text-xs font-semibold text-slate-400 mt-2 max-w-sm leading-relaxed">
                  انقر على أي قائمة تحديث معتمدة لعرض جداول تعديل الأسعار، تعديل الأسماء، أو الأصناف المكتشفة الجديدة بشكل تفصيلي ومطابق للأنظمة.
                </p>
              </div>
            ) : loadingDetails ? (
              <div className="flex-1 flex items-center justify-center text-sm font-bold text-slate-400">
                جاري تحميل تفاصيل التحديث...
              </div>
            ) : details ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Detail summary & search header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/20 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{details.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        تم التعميم في {new Date(details.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Search inside update */}
                    <div className="relative min-w-[220px]">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بكود أو اسم صنف..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                      <svg className="absolute top-3.5 right-3 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Detail filter tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold border-b border-slate-100">
                    <button
                      onClick={() => setDetailsTab('all')}
                      className={`px-4 py-2 border-b-2 transition-all duration-300 ${
                        detailsTab === 'all'
                          ? 'border-[#1E6FBF] text-[#1E6FBF]'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      الكل ({details.changes.length})
                    </button>
                    <button
                      onClick={() => setDetailsTab('price')}
                      className={`px-4 py-2 border-b-2 transition-all duration-300 ${
                        detailsTab === 'price'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      الأسعار ({details.changes.filter(c => c.type === 'price_update').length})
                    </button>
                    <button
                      onClick={() => setDetailsTab('name')}
                      className={`px-4 py-2 border-b-2 transition-all duration-300 ${
                        detailsTab === 'name'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      المسميات ({details.changes.filter(c => c.type === 'name_update').length})
                    </button>
                    <button
                      onClick={() => setDetailsTab('new')}
                      className={`px-4 py-2 border-b-2 transition-all duration-300 ${
                        detailsTab === 'new'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      أصناف جديدة ({details.changes.filter(c => c.type === 'new_product').length})
                    </button>
                  </div>
                </div>

                {/* Details Table */}
                <div className="flex-1 overflow-y-auto">
                  {filteredChanges.length === 0 ? (
                    <div className="p-16 text-center text-sm font-bold text-slate-400">
                      لا توجد تعديلات مطابقة لبحثك أو تبويب المراجعة هذا.
                    </div>
                  ) : (
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                          <th className="px-6 py-3.5">الكود</th>
                          <th className="px-6 py-3.5">النوع</th>
                          <th className="px-6 py-3.5">التعديل التفصيلي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                        {filteredChanges.map((c) => (
                          <tr key={c.code} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-4 font-mono text-base font-black text-slate-700">{c.code}</td>
                            <td className="px-6 py-4">
                              {c.type === 'new_product' && (
                                <span className="rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-[10px] font-black text-green-700">صنف جديد</span>
                              )}
                              {c.type === 'price_update' && (
                                <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-black text-amber-700">تعديل سعر</span>
                              )}
                              {c.type === 'name_update' && (
                                <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[10px] font-black text-blue-700">تعديل اسم</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {c.type === 'new_product' && (
                                <div className="space-y-2">
                                  <div className="font-extrabold text-slate-800 text-sm">{c.name}</div>
                                  <div className="text-[11px] font-bold text-slate-400 flex gap-4">
                                    {c.sellingPrice != null && <span>سعر البيع: <b className="text-amber-700 font-mono font-black">{c.sellingPrice} ج.م</b></span>}
                                    {c.buyingPrice != null && <span>سعر الشراء: <b className="text-green-700 font-mono font-black">{c.buyingPrice} ج.م</b></span>}
                                  </div>
                                </div>
                              )}

                              {c.type === 'name_update' && (
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="text-slate-400 line-through font-semibold">{c.oldName}</span>
                                  <svg className="h-3.5 w-3.5 text-slate-300 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                  <span className="text-blue-700 font-extrabold">{c.name}</span>
                                </div>
                              )}

                              {c.type === 'price_update' && (
                                <div className="space-y-2">
                                  <div className="font-extrabold text-slate-850 text-sm">{c.name}</div>
                                  <div className="text-[11px] font-bold flex gap-4 flex-wrap mt-1">
                                    {/* Selling price diff */}
                                    {(c.sellingPrice !== c.oldSellingPrice) && (
                                      <span className="flex items-center gap-2">
                                        <span className="text-slate-400">سعر البيع:</span>
                                        <span className="text-slate-350 line-through font-mono">{c.oldSellingPrice ?? '—'}</span>
                                        <svg className="h-3 w-3 text-slate-300 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className="text-amber-800 font-mono font-black">{c.sellingPrice ?? '—'} ج.م</span>
                                      </span>
                                    )}
                                    {/* Buying price diff */}
                                    {(c.buyingPrice !== c.oldBuyingPrice) && (
                                      <span className="flex items-center gap-2">
                                        <span className="text-slate-400">سعر الشراء:</span>
                                        <span className="text-slate-350 line-through font-mono">{c.oldBuyingPrice ?? '—'}</span>
                                        <svg className="h-3 w-3 text-slate-300 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className="text-green-800 font-mono font-black">{c.buyingPrice ?? '—'} ج.م</span>
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
