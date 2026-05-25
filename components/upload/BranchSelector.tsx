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
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 bg-slate-50/50 leading-relaxed">
        <span>لا توجد فروع مسجلة حالياً في النظام. يرجى إضافة فرع جديد من </span>
        <a href="/admin" className="font-extrabold text-[#1E6FBF] underline hover:text-[#1557A0] transition-colors">
          لوحة التحكم أولاً
        </a>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">حدد الفرع المستهدف للمستند</span>
      <div className="flex flex-wrap gap-2.5">
        {branches.map((branch) => {
          const selected = value === branch._id
          return (
            <button
              key={branch._id}
              type="button"
              onClick={() => onChange(selected ? '' : branch._id)}
              className={`rounded-2xl border px-6 py-2.5 text-xs font-black transition-all duration-300 active:scale-95 ${
                selected
                  ? 'border-[#1E6FBF] bg-[#1E6FBF] text-white shadow-premium shadow-blue-500/10'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] hover:shadow-sm'
              }`}
            >
              {branch.name}
            </button>
          )
        })}
      </div>
      {!value && (
        <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1.5 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          يرجى تحديد الفرع لتتمكن من حفظ ملف الأرصدة
        </p>
      )}
    </div>
  )
}


