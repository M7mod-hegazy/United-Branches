'use client'

import { useEffect, useState } from 'react'

interface SnapshotOption {
  _id: string
  uploadedAt: string
}

interface SnapshotDropdownProps {
  branchId: string
  selectedSnapshotId?: string
  onChange: (branchId: string, snapshotId: string) => void
}

export function SnapshotDropdown({ branchId, selectedSnapshotId, onChange }: SnapshotDropdownProps) {
  const [snapshots, setSnapshots] = useState<SnapshotOption[]>([])

  useEffect(() => {
    fetch(`/api/snapshots?branchId=${branchId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setSnapshots)
      .catch(() => setSnapshots([]))
  }, [branchId])

  return (
    <div className="relative mt-2.5">
      <select
        value={selectedSnapshotId || ''}
        onChange={(event) => onChange(branchId, event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-[11px] font-black text-slate-500 hover:text-slate-800 appearance-none focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 transition-all duration-300 cursor-pointer"
      >
        <option value="">آخر تقرير رفع</option>
        {snapshots.map((snapshot) => (
          <option key={snapshot._id} value={snapshot._id}>
            {new Date(snapshot.uploadedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </option>
        ))}
      </select>
      <span className="absolute left-3.5 top-3 pointer-events-none text-slate-400">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}

