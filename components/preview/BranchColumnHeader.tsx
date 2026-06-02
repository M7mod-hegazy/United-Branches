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
    <div className="text-right space-y-1">
      <div className="font-black text-[13px] text-slate-800 leading-tight">{branch.name}</div>
      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-[#1E6FBF] shrink-0" />
        {new Date(branch.uploadedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
      </div>
      <SnapshotDropdown
        branchId={branch.id}
        selectedSnapshotId={selectedSnapshotId}
        onChange={onSnapshotChange}
      />
    </div>
  )
}

