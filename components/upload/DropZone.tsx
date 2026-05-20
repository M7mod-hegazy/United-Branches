'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface DropZoneProps {
  file: File | null
  onFile: (file: File) => void
}

export function DropZone({ file, onFile }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0])
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  })

  const borderColor = isDragReject
    ? 'border-red-400 bg-red-50'
    : isDragActive
      ? 'border-emerald-500 bg-emerald-50'
      : file
        ? 'border-emerald-400 bg-emerald-50/50'
        : 'border-slate-300 hover:border-emerald-500'

  return (
    <div
      {...getRootProps()}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-white p-8 text-center transition-all duration-200 ${borderColor}`}
    >
      <input {...getInputProps()} />

      {file ? (
        <>
          <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-slate-800">{file.name}</p>
            <p className="mt-1 text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB — اضغط لتغيير الملف</p>
          </div>
        </>
      ) : (
        <>
          <svg className="h-10 w-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div>
            <p className="font-semibold text-slate-800">
              {isDragReject ? 'هذا النوع غير مدعوم' : isDragActive ? 'أفلت الملف هنا...' : 'اسحب ملف Excel هنا أو اضغط للاختيار'}
            </p>
            <p className="mt-1 text-sm text-slate-500">يدعم .xls و .xlsx</p>
          </div>
        </>
      )}
    </div>
  )
}
