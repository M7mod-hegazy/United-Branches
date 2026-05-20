'use client'

import { SnapshotDropdown } from './SnapshotDropdown'

interface BranchColumnHeaderProps {
  branch: { id: string; name: string; uploadedAt: string }
  selectedSnapshotId?: string
  onSnapshotChange: (branchId: string, snapshotId: string) => void
}

export function BranchColumnHeader({
  branch,
  selectedSnapshotId,
  onSnapshotChange,
}: BranchColumnHeaderProps) {
  return (
    <div className="min-w-36">
      <div className="font-semibold text-slate-950">{branch.name}</div>
      <div className="text-xs font-normal text-slate-500">
        {new Date(branch.uploadedAt).toLocaleString('ar-EG')}
      </div>
      <SnapshotDropdown
        branchId={branch.id}
        selectedSnapshotId={selectedSnapshotId}
        onChange={onSnapshotChange}
      />
    </div>
  )
}
