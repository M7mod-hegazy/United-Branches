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
    <div className="min-w-44 text-right py-1.5 space-y-1.5">
      <div className="font-extrabold text-sm text-slate-800 tracking-wide">{branch.name}</div>
      <div className="text-[11px] font-extrabold text-slate-400 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
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

