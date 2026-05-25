'use client'

interface SearchFiltersProps {
  search: string
  branchId: string
  hideZero: boolean
  category: string
  branches: { id: string; name: string }[]
  categories: string[]
  onSearchChange: (value: string) => void
  onBranchChange: (value: string) => void
  onHideZeroChange: (value: boolean) => void
  onCategoryChange: (value: string) => void
}

export function SearchFilters({
  search,
  branchId,
  hideZero,
  category,
  branches,
  categories,
  onSearchChange,
  onBranchChange,
  onHideZeroChange,
  onCategoryChange,
}: SearchFiltersProps) {
  return (
    <section className="grid gap-4 rounded-3xl border border-slate-200/40 bg-white/60 p-5 md:grid-cols-[1fr_220px_220px_auto] items-center shadow-premium backdrop-blur-md transition-all duration-300">
      
      {/* Search Input Box */}
      <div className="relative">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث بالكود أو اسم الصنف..."
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 pl-11 text-xs font-black text-slate-800 placeholder-slate-400 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100/50 shadow-sm transition-all"
        />
        <span className="absolute left-4 top-3.5 text-slate-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {/* Branch Selector Box */}
      <div className="relative">
        <select
          value={branchId}
          onChange={(event) => onBranchChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-800 appearance-none focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100/50 shadow-sm transition-all"
        >
          <option value="">جميع الفروع</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <span className="absolute left-4 top-[18px] pointer-events-none text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Category Selector Box */}
      <div className="relative">
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-800 appearance-none focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100/50 shadow-sm transition-all"
        >
          <option value="">جميع الفئات</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              الفئة {cat}
            </option>
          ))}
        </select>
        <span className="absolute left-4 top-[18px] pointer-events-none text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Custom iOS Toggle Switch */}
      <div 
        onClick={() => onHideZeroChange(!hideZero)}
        className="flex h-12 items-center justify-between gap-5 rounded-2xl border border-slate-250 bg-slate-50/40 px-5 cursor-pointer select-none hover:border-[#1E6FBF] hover:bg-white transition-all duration-300 w-full md:w-auto shadow-sm"
      >
        <span className="whitespace-nowrap text-xs font-black text-slate-500 transition-colors">إخفاء الأرصدة الصفرية</span>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            hideZero ? 'bg-[#1E6FBF]' : 'bg-slate-250'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              hideZero ? '-translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </section>
  )
}

