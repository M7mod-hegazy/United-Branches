'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ProgressBar } from './ProgressBar'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface SuccessData {
  count: number
  uploadedAt: string
  branchName: string
}

interface DropZoneProps {
  branchId: string
  branchName: string
}

export function DropZone({ branchId, branchName }: DropZoneProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  function reset() {
    setProgress(0)
    setStatus('idle')
    setSuccessData(null)
    setErrorMessage('')
  }

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!branchId) {
        setStatus('error')
        setErrorMessage('اختر الفرع أولاً قبل رفع الملف')
        return
      }

      reset()
      setStatus('uploading')

      // Animate progress in stages
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
          setProgress(0)
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
        })
      } catch {
        clearTimeout(t1)
        clearTimeout(t2)
        setProgress(0)
        setStatus('error')
        setErrorMessage('تعذّر الاتصال بالخادم — تأكد من اتصالك بالإنترنت وحاول مرة أخرى')
      }
    },
    [branchId, branchName]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
    disabled: status === 'uploading',
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  })

  const dropBorder =
    isDragReject
      ? 'border-red-400 bg-red-50'
      : isDragActive
        ? 'border-emerald-500 bg-emerald-50'
        : status === 'success'
          ? 'border-emerald-400 bg-emerald-50/40'
          : status === 'error'
            ? 'border-red-300 bg-red-50/40'
            : 'border-slate-300 hover:border-emerald-500'

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-white p-8 text-center transition-all duration-200 ${dropBorder} ${status === 'uploading' ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <input {...getInputProps()} />
        <DropIcon status={status} isDragActive={isDragActive} isDragReject={isDragReject} />
        <div>
          <p className="text-base font-semibold text-slate-800">
            {isDragReject
              ? 'هذا النوع غير مدعوم'
              : isDragActive
                ? 'أفلت الملف هنا...'
                : status === 'uploading'
                  ? 'جاري المعالجة...'
                  : 'اسحب ملف Excel هنا أو اضغط للاختيار'}
          </p>
          {status === 'idle' && (
            <p className="mt-1 text-sm text-slate-500">يدعم .xls و .xlsx</p>
          )}
        </div>
      </div>

      {status === 'uploading' && <ProgressBar value={progress} />}

      {status === 'success' && successData && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-700">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-base">تم الرفع بنجاح</span>
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
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              عرض المعاينة الموحدة
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <button
              onClick={reset}
              className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              رفع ملف آخر
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-base">فشل الرفع</span>
          </div>
          <p className="mb-4 text-sm text-red-700">{errorMessage}</p>
          <button
            onClick={reset}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            المحاولة مرة أخرى
          </button>
        </div>
      )}
    </div>
  )
}

function DropIcon({
  status,
  isDragActive,
  isDragReject,
}: {
  status: UploadStatus
  isDragActive: boolean
  isDragReject: boolean
}) {
  if (isDragReject) return <span className="text-4xl">🚫</span>
  if (isDragActive) return <span className="text-4xl">📂</span>
  if (status === 'uploading') {
    return (
      <svg className="h-10 w-10 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
    )
  }
  return (
    <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function buildErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage
  switch (status) {
    case 400: return 'الطلب غير صحيح — تأكد من اختيار الفرع وتحديد الملف'
    case 404: return 'الفرع المحدد غير موجود — حاول اختيار فرع آخر'
    case 422: return 'لم يتم التعرف على أي أصناف في الملف — تأكد من أن الملف يحتوي على أعمدة الكود والاسم والكمية'
    case 413: return 'حجم الملف كبير جداً — حاول ضغط الملف أو تقليل عدد الصفوف'
    default: return `حدث خطأ غير متوقع (${status}) — حاول مرة أخرى'`
  }
}
