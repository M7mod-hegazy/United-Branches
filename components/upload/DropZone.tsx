'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ProgressBar } from './ProgressBar'

interface DropZoneProps {
  branchId: string
}

export function DropZone({ branchId }: DropZoneProps) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!branchId) {
        setMessage('اختر الفرع أولا')
        return
      }

      setUploading(true)
      setProgress(20)
      setMessage('')

      const form = new FormData()
      form.append('branchId', branchId)
      form.append('file', file)

      try {
        setProgress(55)
        const response = await fetch('/api/upload', { method: 'POST', body: form })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'فشل رفع الملف')
        setProgress(100)
        setMessage(`تم حفظ ${result.productsCount} صنف بنجاح`)
      } catch (error) {
        setProgress(0)
        setMessage(error instanceof Error ? error.message : 'فشل رفع الملف')
      } finally {
        setUploading(false)
      }
    },
    [branchId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-8 text-center transition ${
          isDragActive ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 hover:border-emerald-600'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-lg font-semibold text-slate-950">اسحب ملف Excel هنا</div>
        <div className="mt-2 text-sm text-slate-600">أو اضغط لاختيار ملف .xls أو .xlsx</div>
      </div>
      {uploading && <ProgressBar value={progress} />}
      {message && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}
    </div>
  )
}
