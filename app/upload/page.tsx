'use client'

import { useEffect, useState } from 'react'
import { BranchSelector } from '@/components/upload/BranchSelector'
import { DropZone } from '@/components/upload/DropZone'

interface Branch {
  _id: string
  name: string
}

export default function UploadPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState('')

  useEffect(() => {
    fetch('/api/branches')
      .then((response) => response.json())
      .then(setBranches)
      .catch(() => setBranches([]))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">رفع تقرير فرع</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">استيراد أرصدة Excel</h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <BranchSelector branches={branches} value={branchId} onChange={setBranchId} />
      </div>
      <DropZone branchId={branchId} />
    </div>
  )
}
