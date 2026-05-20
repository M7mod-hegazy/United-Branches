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
      <div className="rounded-xl border border-dashed border-[#E2E0D9] p-6 text-center text-sm text-[#78726A] bg-[#FCFAF7]/50">
        <span>لا توجد فروع مسجلة حالياً. يرجى إضافة فرع جديد من </span>
        <a href="/admin" className="font-bold text-[#A88554] underline hover:text-[#BD9865] transition-colors">
          صفحة الإدارة
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-[#78726A]">اختر الفرع المستهدف</span>
      <div className="flex flex-wrap gap-2.5">
        {branches.map((branch) => {
          const selected = value === branch._id
          return (
            <button
              key={branch._id}
              type="button"
              onClick={() => onChange(selected ? '' : branch._id)}
              className={`rounded-full border px-5 py-2 text-xs font-bold transition-all duration-200 ${
                selected
                  ? 'border-[#1E2229] bg-[#1E2229] text-white shadow-sm ring-1 ring-[#1E2229]'
                  : 'border-[#E2E0D9] bg-white text-[#78726A] hover:border-[#A88554] hover:text-[#A88554]'
              }`}
            >
              {branch.name}
            </button>
          )
        })}
      </div>
      {!value && <p className="text-[11px] font-semibold text-[#A88554] mt-1 flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-[#A88554]" />
        اختر فرعاً لتتمكن من حفظ الملف
      </p>}
    </div>
  )
}

