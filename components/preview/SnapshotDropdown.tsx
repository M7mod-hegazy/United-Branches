'use client'

import { useEffect, useRef, useState } from 'react'

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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/snapshots?branchId=${branchId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setSnapshots)
      .catch(() => setSnapshots([]))
  }, [branchId])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = snapshots.find((s) => s._id === selectedSnapshotId)
  const label = selected
    ? new Date(selected.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'آخر تقرير رفع'

  return (
    <div ref={ref} className="relative mt-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-[11px] font-black text-slate-500 hover:text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 transition-all duration-300 cursor-pointer flex items-center justify-between gap-2"
      >
        <span className="truncate">{label}</span>
        <svg className={`h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-premium overflow-hidden">
          <div className="max-h-[175px] overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => { onChange(branchId, ''); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-right text-[11px] font-black transition-colors duration-150 ${
                !selectedSnapshotId ? 'bg-blue-50 text-[#1E6FBF]' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              آخر تقرير رفع
            </button>
            {snapshots.map((snapshot) => (
              <button
                key={snapshot._id}
                type="button"
                onClick={() => { onChange(branchId, snapshot._id); setOpen(false) }}
                className={`w-full px-4 py-2.5 text-right text-[11px] font-black transition-colors duration-150 ${
                  snapshot._id === selectedSnapshotId ? 'bg-blue-50 text-[#1E6FBF]' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {new Date(snapshot.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

