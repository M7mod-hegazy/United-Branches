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
    <div className="min-w-44 text-right py-1">
      <div className="font-bold text-sm text-[#1E2229]">{branch.name}</div>
      <div className="text-[10px] font-semibold text-[#A19D95] mt-1 flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-[#A88554]/60" />
        {new Date(branch.uploadedAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
      </div>
      <SnapshotDropdown
        branchId={branch.id}
        selectedSnapshotId={selectedSnapshotId}
        onChange={onSnapshotChange}
      />
    </div>
  )
}

