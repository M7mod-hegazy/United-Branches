'use client'

import { useEffect, useState } from 'react'
import { BranchSelector } from '@/components/upload/BranchSelector'
import { DropZone } from '@/components/upload/DropZone'
import { ProgressBar } from '@/components/upload/ProgressBar'

interface Branch {
  _id: string
  name: string
}

type Status = 'idle' | 'uploading' | 'success' | 'error'

interface SuccessData {
  count: number
  uploadedAt: string
  branchName: string
}

export default function UploadPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

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
  }

  async function handleSave() {
    if (!file || !branchId) return

    const branchName = branches.find((b) => b._id === branchId)?.name ?? ''
    setStatus('uploading')
    setProgress(15)

    const t1 = setTimeout(() => setProgress(40), 400)
    const t2 = setTimeout(() => setProgress(65), 900)

    const form = new FormData()
    form.append('branchId', branchId)
    form.append('file', file)

    try {
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
      setSuccessData({ count: result.productsCount, uploadedAt: result.uploadedAt, branchName })
    } catch {
      clearTimeout(t1)
      clearTimeout(t2)
      setStatus('error')
      setErrorMessage('تعذّر الاتصال بالخادم — تأكد من اتصالك بالإنترنت وحاول مرة أخرى')
    }
  }

  const canSave = !!file && !!branchId && status !== 'uploading'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">رفع تقرير فرع</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">استيراد أرصدة Excel</h1>
      </div>

      {status === 'success' && successData ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="mb-3 flex items-center gap-2 text-emerald-700">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-base">تم الحفظ بنجاح</span>
          </div>
          <dl className="grid gap-1.5 text-sm text-slate-700">
            <div className="flex gap-2">
              <dt className="text-slate-500 shrink-0">الفرع:</dt>
              <dd className="font-semibold text-slate-900">{successData.branchName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500 shrink-0">عدد الأصناف المستوردة:</dt>
              <dd className="font-semibold text-emerald-800">{successData.count.toLocaleString('ar-EG')} صنف</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500 shrink-0">وقت الرفع:</dt>
              <dd className="font-medium">{new Date(successData.uploadedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-3">
            <a href="/" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
              عرض المعاينة الموحدة
            </a>
            <button onClick={reset} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
              رفع ملف آخر
            </button>
          </div>
        </div>
      ) : (
        <>
          <DropZone file={file} onFile={setFile} />

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <BranchSelector branches={branches} value={branchId} onChange={setBranchId} />
          </div>

          {status === 'uploading' && <ProgressBar value={progress} />}

          {status === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-red-700 font-bold">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                فشل الرفع
              </div>
              <p className="text-sm text-red-700">{errorMessage}</p>
              <button onClick={() => setStatus('idle')} className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
                المحاولة مرة أخرى
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'uploading' ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            {!file && <p className="text-sm text-slate-400">اختر ملف Excel أولاً</p>}
            {file && !branchId && <p className="text-sm text-slate-400">اختر الفرع ثم اضغط حفظ</p>}
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
