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
    ? 'border-red-400 bg-red-50/30'
    : isDragActive
      ? 'border-[#1E6FBF] bg-blue-50/30 scale-[0.99] shadow-inner'
      : file
        ? 'border-[#1E6FBF]/50 bg-blue-50/10'
        : 'border-slate-200 bg-white hover:border-[#1E6FBF] hover:bg-slate-50/30 shadow-sm'

  return (
    <div
      {...getRootProps()}
      className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${borderColor}`}
    >
      <input {...getInputProps()} />

      {file ? (
        <>
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3.5 text-[#1E6FBF] shadow-sm">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-800 leading-snug">{file.name}</p>
            <p className="mt-1.5 text-xs font-bold text-slate-400">
              {(file.size / 1024).toFixed(1)} كيلوبايت — انقر أو اسحب ملفاً آخر لتغييره
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-3.5 text-slate-400 shadow-sm">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-800 leading-snug">
              {isDragReject ? 'صيغة الملف غير مدعومة' : isDragActive ? 'أفلت مستند Excel هنا...' : 'قم بسحب ملف Excel وإفلاته هنا أو تصفح جهازك'}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-400">يدعم جداول البيانات بصيغتي .xls و .xlsx فقط</p>
          </div>
        </>
      )}
    </div>
  )
}


