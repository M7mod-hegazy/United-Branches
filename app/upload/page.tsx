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
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#A88554] block mb-1">رفع تقارير الفروع</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1E2229]">استيراد أرصدة المخزون</h1>
      </div>

      {status === 'success' && successData ? (
        <div className="rounded-2xl border border-[#A88554]/25 bg-[#FAF6F0] p-8 text-[#1E2229] transition-all duration-300">
          <div className="mb-5 flex items-center gap-2.5 text-[#A88554]">
            <div className="rounded-full bg-[#1E2229] p-2 text-white shadow-sm">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-wide">
              {successData.isDominant ? 'تم حفظ البيانات وتعميم التحديث بنجاح' : 'تم استيراد البيانات وحفظها بنجاح'}
            </span>
          </div>
          <div className="divide-y divide-[#EAE8E4] text-xs font-semibold text-[#78726A]">
            <div className="flex justify-between py-3">
              <span className="text-[#A19D95]">الفرع المستهدف</span>
              <span className="font-bold text-[#1E2229]">{successData.branchName}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-[#A19D95]">الأصناف المستوردة</span>
              <span className="font-extrabold text-[#1E2229] tracking-wider">{successData.count.toLocaleString('ar-EG')} صنف</span>
            </div>
            {successData.isDominant && (
              <>
                <div className="flex justify-between py-3">
                  <span className="text-[#A19D95]">اسم قائمة التحديث</span>
                  <span className="font-bold text-[#A88554]">{successData.updateName}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-[#A19D95]">التعديلات التي تم تعميمها</span>
                  <span className="font-extrabold text-green-700 tracking-wider">
                    {successData.changesCount?.toLocaleString('ar-EG')} تعديل
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between py-3">
              <span className="text-[#A19D95]">الأعمدة المكتشفة</span>
              <span className="flex gap-1 flex-wrap justify-end">
                {successData.detectedColumns.map((col) => {
                  const labels: Record<string, string> = {
                    code: 'الكود',
                    name: 'الاسم',
                    quantity: 'الكمية',
                    sellingPrice: 'سعر البيع',
                    buyingPrice: 'سعر الشراء',
                  }
                  return (
                    <span key={col} className="rounded px-1.5 py-0.5 text-xs font-bold bg-[#EAE8E4] text-[#1E2229]">
                      {labels[col] ?? col}
                    </span>
                  )
                })}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-[#A19D95]">تاريخ ووقت المعالجة</span>
              <span className="font-bold text-[#1E2229]">{new Date(successData.uploadedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <a href="/" className="inline-flex items-center justify-center rounded-lg bg-[#1E2229] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#2e343f] transition-all duration-200 shadow-sm">
              عرض المعاينة الموحدة
            </a>
            <button onClick={reset} className="rounded-lg border border-[#E2E0D9] bg-white px-5 py-2.5 text-xs font-bold text-[#78726A] hover:border-[#A88554] hover:text-[#A88554] transition-all duration-200">
              رفع ملف آخر
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
          <DropZone file={file} onFile={setFile} />

          <div className="rounded-xl border border-[#EAE8E4] bg-white p-6 transition-all duration-300">
            <BranchSelector branches={branches} value={branchId} onChange={setBranchId} />
          </div>

          {status === 'uploading' && <ProgressBar value={progress} />}

          {status === 'error' && (
            <div className="rounded-xl border border-red-200/50 bg-red-50/30 p-5 text-red-900 transition-all duration-300">
              <div className="mb-2 flex items-center gap-2 text-red-700 font-bold text-sm">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                فشلت عملية الاستيراد
              </div>
              <p className="text-xs font-semibold text-red-700">{errorMessage}</p>
              <button onClick={() => setStatus('idle')} className="mt-3.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-all duration-200">
                المحاولة مرة أخرى
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`rounded-lg px-8 py-3.5 text-xs font-bold tracking-wide transition-all duration-300 shadow-sm ${
                canSave
                  ? 'bg-[#1E2229] hover:bg-[#2e343f] text-white cursor-pointer active:scale-95'
                  : 'bg-[#EAE8E4] text-[#A19D95] cursor-not-allowed opacity-60'
              }`}
            >
              {status === 'uploading' ? 'جاري استيراد البيانات...' : 'حفظ البيانات المحددة'}
            </button>
            {!file && <p className="text-xs font-bold text-[#A19D95]">يرجى اختيار ملف Excel أولاً</p>}
            {file && !branchId && <p className="text-xs font-bold text-[#A88554] animate-pulse">يرجى تحديد الفرع المستهدف لإتمام عملية الحفظ</p>}
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
