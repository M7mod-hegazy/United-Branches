'use client'

import { useEffect, useState } from 'react'
import { BranchSelector } from '@/components/upload/BranchSelector'
import { DropZone } from '@/components/upload/DropZone'
import { ProgressBar } from '@/components/upload/ProgressBar'
import { UploadDiffEditor } from '@/components/upload/UploadDiffEditor'

interface Branch {
  _id: string
  name: string
}

type Status = 'idle' | 'uploading' | 'success' | 'error'

interface SuccessData {
  count: number
  uploadedAt: string
  branchName: string
  detectedColumns: string[]
  isDominant?: boolean
  changesCount?: number
  updateName?: string
}

export default function UploadPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const [diffMode, setDiffMode] = useState(false)
  const [diffData, setDiffData] = useState<{
    changes: any[]
    allProducts: any[]
    defaultUpdateName: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => setBranches([]))
  }, [])

  function reset() {
    setFile(null)
    setBranchId('')
    setStatus('idle')
    setProgress(0)
    setSuccessData(null)
    setErrorMessage('')
    setDiffMode(false)
    setDiffData(null)
  }

  async function handleSave() {
    if (!file || !branchId) return

    const branchName = branches.find((b) => b._id === branchId)?.name ?? ''
    setStatus('uploading')
    setProgress(15)

    const t1 = setTimeout(() => setProgress(45), 400)
    const t2 = setTimeout(() => setProgress(75), 900)

    const form = new FormData()
    form.append('branchId', branchId)
    form.append('file', file)

    try {
      // Step 1: Upload to compare endpoint first
      const compareResponse = await fetch('/api/upload/compare', { method: 'POST', body: form })
      const compareResult = await compareResponse.json()

      if (!compareResponse.ok) {
        clearTimeout(t1)
        clearTimeout(t2)
        setStatus('error')
        setErrorMessage(buildErrorMessage(compareResponse.status, compareResult.error))
        return
      }

      if (compareResult.isDominant) {
        clearTimeout(t1)
        clearTimeout(t2)
        setProgress(100)
        setStatus('idle')
        setDiffData({
          changes: compareResult.changes,
          allProducts: compareResult.allProducts,
          defaultUpdateName: compareResult.defaultUpdateName,
        })
        setDiffMode(true)
        return
      }

      // Step 2: If not dominant branch, proceed to standard save
      const response = await fetch('/api/upload', { method: 'POST', body: form })
      clearTimeout(t1)
      clearTimeout(t2)
      setProgress(90)

      const result = await response.json()

      if (!response.ok) {
        setStatus('error')
        setErrorMessage(buildErrorMessage(response.status, result.error))
        return
      }

      setProgress(100)
      setStatus('success')
      setSuccessData({
        count: result.productsCount,
        uploadedAt: result.uploadedAt,
        branchName,
        detectedColumns: result.detectedColumns ?? [],
        isDominant: false,
      })
    } catch {
      clearTimeout(t1)
      clearTimeout(t2)
      setStatus('error')
      setErrorMessage('تعذّر الاتصال بالخادم — تأكد من اتصالك بالإنترنت وحاول مرة أخرى')
    }
  }

  const canSave = !!file && !!branchId && status !== 'uploading'

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      
      {/* Title Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E6FBF] border border-blue-100 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
          أدوات البيانات الذكية
        </span>
        <h1 className="text-3.5xl font-black tracking-tight text-slate-900 leading-tight">استيراد وأرشفة أرصدة المخزون</h1>
        <p className="text-sm font-semibold text-slate-400 mt-2">قم برفع تقارير الفروع بصيغة Excel لدمجها فورياً مع أرصدة الفروع المتحدة.</p>
      </div>

      {/* Success Panel */}
      {status === 'success' && successData ? (
        <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/20 p-8 text-slate-850 shadow-premium transition-all duration-300">
          <div className="mb-6 flex items-center gap-3 text-emerald-800">
            <div className="rounded-xl bg-emerald-500 p-2.5 text-white shadow-sm shadow-emerald-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="font-black text-base tracking-wide">
              {successData.isDominant ? 'تم حفظ التحديث وتعميم الأسعار بنجاح' : 'تم استيراد وقراءة البيانات وحفظها بنجاح'}
            </span>
          </div>
          
          <div className="divide-y divide-emerald-100/60 text-xs font-bold text-slate-600">
            <div className="flex justify-between py-3.5">
              <span className="text-slate-400">الفرع المستهدف للتقرير</span>
              <span className="font-extrabold text-slate-900 text-sm">{successData.branchName}</span>
            </div>
            <div className="flex justify-between py-3.5">
              <span className="text-slate-400">عدد الأصناف المستوردة</span>
              <span className="font-black text-slate-900 text-base tabular-nums">{successData.count.toLocaleString('en-US')} صنف</span>
            </div>
            {successData.isDominant && (
              <>
                <div className="flex justify-between py-3.5">
                  <span className="text-slate-400">اسم قائمة التحديث المعممة</span>
                  <span className="font-extrabold text-[#1E6FBF] text-sm">{successData.updateName}</span>
                </div>
                 <div className="flex justify-between py-3.5">
                  <span className="text-slate-400">التعديلات السعرية النشطة</span>
                  <span className="font-black text-green-700 text-base tabular-nums">
                    {successData.changesCount?.toLocaleString('en-US')} تعديل معمّم
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between py-3.5">
              <span className="text-slate-400">الأعمدة المكتشفة بالملف</span>
              <span className="flex gap-1.5 flex-wrap justify-end">
                {successData.detectedColumns.map((col) => {
                  const labels: Record<string, string> = {
                    code: 'الكود',
                    name: 'الاسم',
                    quantity: 'الكمية',
                    sellingPrice: 'سعر البيع',
                    buyingPrice: 'سعر الشراء',
                  }
                  return (
                    <span key={col} className="rounded-lg px-2 py-0.5 text-[10px] font-black bg-emerald-100/60 text-emerald-800 border border-emerald-200/30">
                      {labels[col] ?? col}
                    </span>
                  )
                })}
              </span>
            </div>
            <div className="flex justify-between py-3.5">
              <span className="text-slate-400">تاريخ المعالجة والأرشفة</span>
              <span className="font-extrabold text-slate-900">{new Date(successData.uploadedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3.5 flex-wrap">
            <a href="/" className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-xs font-black text-white hover:bg-indigo-900 transition-all duration-300 shadow-premium shadow-slate-900/10 active:scale-95">
              عرض المعاينة الموحدة
            </a>
            <button onClick={reset} className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-black text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] transition-all duration-300 active:scale-95">
              رفع ملف فرع آخر
            </button>
          </div>
        </div>
      ) : diffMode && diffData ? (
        <UploadDiffEditor
          branchId={branchId}
          initialChanges={diffData.changes}
          initialAllProducts={diffData.allProducts}
          defaultUpdateName={diffData.defaultUpdateName}
          onSuccess={(result) => {
            setSuccessData({
              count: result.count,
              uploadedAt: result.uploadedAt,
              branchName: branches.find((b) => b._id === branchId)?.name ?? '',
              detectedColumns: ['code', 'name', 'quantity', 'sellingPrice', 'buyingPrice'],
              isDominant: true,
              changesCount: result.changesCount,
              updateName: result.updateName,
            })
            setDiffMode(false)
            setStatus('success')
          }}
          onCancel={() => {
            setDiffMode(false)
            setDiffData(null)
            setStatus('idle')
          }}
        />
      ) : (
        <>
          <div className="rounded-3xl border border-slate-200/50 bg-white p-7 shadow-premium space-y-6">
            <DropZone file={file} onFile={setFile} />
            <div className="border-t border-slate-100 pt-6">
              <BranchSelector branches={branches} value={branchId} onChange={setBranchId} />
            </div>
          </div>

          {status === 'uploading' && <ProgressBar value={progress} />}

          {status === 'error' && (
            <div className="rounded-2xl border border-red-200/50 bg-red-50/20 p-6 text-red-900 shadow-sm transition-all duration-300">
              <div className="mb-2 flex items-center gap-2 text-red-700 font-extrabold text-sm">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                فشلت معالجة ملف الاستيراد
              </div>
              <p className="text-xs font-bold text-red-600/80 leading-relaxed">{errorMessage}</p>
              <button onClick={() => setStatus('idle')} className="mt-4 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs font-black text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-95">
                إعادة المحاولة
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 flex-wrap">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`rounded-xl px-8 py-4 text-xs font-black tracking-wide transition-all duration-300 shadow-premium active:scale-95 ${
                canSave
                  ? 'bg-slate-900 hover:bg-indigo-900 text-white cursor-pointer shadow-slate-900/10'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {status === 'uploading' ? 'جاري استيراد البيانات...' : 'حفظ ومطابقة الملف المرفوع'}
            </button>
            {!file && <p className="text-xs font-bold text-slate-400">يرجى سحب وإرفاق مستند Excel للبدء في المطابقة</p>}
            {file && !branchId && <p className="text-xs font-bold text-amber-600 animate-pulse">حدد الفرع المستهدف لإتمام الاستيراد</p>}
          </div>
        </>
      )}
    </div>
  )
}


function buildErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage
  switch (status) {
    case 400: return 'الطلب غير صحيح — تأكد من اختيار الفرع وتحديد الملف'
    case 404: return 'الفرع المحدد غير موجود — حاول اختيار فرع آخر'
    case 422: return 'لم يتم التعرف على أي أصناف في الملف — تأكد من أن الملف يحتوي على أعمدة الكود والاسم والكمية'
    case 413: return 'حجم الملف كبير جداً'
    default: return `حدث خطأ غير متوقع (${status})`
  }
}
