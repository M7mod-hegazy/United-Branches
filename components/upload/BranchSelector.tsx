'use client'

interface Branch {
  _id: string
  name: string
}

interface BranchSelectorProps {
  branches: Branch[]
  value: string
  onChange: (value: string) => void
}

export function BranchSelector({ branches, value, onChange }: BranchSelectorProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      الفرع
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-emerald-600"
      >
        <option value="">اختر الفرع</option>
        {branches.map((branch) => (
          <option key={branch._id} value={branch._id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  )
}
