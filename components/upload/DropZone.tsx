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
      ? 'border-[#A88554] bg-[#FAF6F0]'
      : file
        ? 'border-[#A88554]/50 bg-[#FCFAF7]'
        : 'border-[#E2E0D9] hover:border-[#A88554] bg-white hover:bg-[#FAFBFD]/30'

  return (
    <div
      {...getRootProps()}
      className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${borderColor}`}
    >
      <input {...getInputProps()} />

      {file ? (
        <>
          <div className="rounded-full bg-[#F7F2EB] p-3 text-[#A88554] shadow-sm">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-[#1E2229]">{file.name}</p>
            <p className="mt-1 text-xs font-semibold text-[#A19D95]">
              {(file.size / 1024).toFixed(1)} كيلوبايت — انقر أو اسحب لتعديل الملف
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-full bg-[#FCFAF7] border border-[#EAE8E4] p-3 text-[#78726A] shadow-sm">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-[#1E2229]">
              {isDragReject ? 'صيغة الملف غير مدعومة' : isDragActive ? 'أفلت مستند Excel هنا...' : 'قم بسحب ملف Excel وإفلاته هنا أو تصفح جهازك'}
            </p>
            <p className="mt-1.5 text-xs font-medium text-[#A19D95]">يدعم جداول البيانات بصيغتي .xls و .xlsx فقط</p>
          </div>
        </>
      )}
    </div>
  )
}

