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
    <div className="relative mt-2">
      <select
        value={selectedSnapshotId || ''}
        onChange={(event) => onChange(branchId, event.target.value)}
        className="w-full rounded-lg border border-[#E2E0D9] bg-white pl-7 pr-3 py-1.5 text-xs font-medium text-[#78726A] appearance-none focus:border-[#A88554] focus:ring-1 focus:ring-[#A88554]"
      >
        <option value="">آخر تقرير رفع</option>
        {snapshots.map((snapshot) => (
          <option key={snapshot._id} value={snapshot._id}>
            {new Date(snapshot.uploadedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </option>
        ))}
      </select>
      <span className="absolute left-2.5 top-2.5 pointer-events-none text-[#78726A]">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )

}
