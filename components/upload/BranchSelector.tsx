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
  if (!branches.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
        لا توجد فروع مسجلة — أضف فرعاً من{' '}
        <a href="/admin" className="text-emerald-700 underline">
          صفحة الإدارة
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">اختر الفرع</span>
      <div className="flex flex-wrap gap-2">
        {branches.map((branch) => {
          const selected = value === branch._id
          return (
            <button
              key={branch._id}
              type="button"
              onClick={() => onChange(branch._id)}
              className={`rounded-full border-2 px-5 py-2 text-sm font-medium transition-all duration-150 ${
                selected
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700'
              }`}
            >
              {branch.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
