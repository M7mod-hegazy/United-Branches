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
    <select
      value={selectedSnapshotId || ''}
      onChange={(event) => onChange(branchId, event.target.value)}
      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-normal text-slate-700"
    >
      <option value="">آخر رفع</option>
      {snapshots.map((snapshot) => (
        <option key={snapshot._id} value={snapshot._id}>
          {new Date(snapshot.uploadedAt).toLocaleString('ar-EG')}
        </option>
      ))}
    </select>
  )
}
