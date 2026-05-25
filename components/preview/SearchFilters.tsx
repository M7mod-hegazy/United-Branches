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
    <section className="grid gap-4.5 rounded-2xl border border-slate-200/50 bg-white p-5 md:grid-cols-[1fr_220px_220px_auto] items-center shadow-premium transition-all duration-300">
      
      {/* Search Input Box */}
      <div className="relative">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث بالكود أو اسم الصنف..."
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-5 pl-11 text-sm font-bold text-slate-800 placeholder-slate-400 focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100"
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
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-bold text-slate-800 appearance-none focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100"
        >
          <option value="">جميع الفروع</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <span className="absolute left-4 top-4.5 pointer-events-none text-slate-400">
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
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-bold text-slate-800 appearance-none focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100"
        >
          <option value="">جميع الفئات</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              الفئة {cat}
            </option>
          ))}
        </select>
        <span className="absolute left-4 top-4.5 pointer-events-none text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Checkbox Switch */}
      <label className="flex h-12 items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 px-5 cursor-pointer select-none hover:border-[#1E6FBF] hover:bg-white transition-all duration-300">
        <input
          type="checkbox"
          checked={hideZero}
          onChange={(event) => onHideZeroChange(event.target.checked)}
          className="h-5 w-5 rounded-lg border-slate-300 text-[#1E6FBF] focus:ring-[#1E6FBF] accent-[#1E6FBF] cursor-pointer"
        />
        <span className="whitespace-nowrap text-sm font-extrabold text-slate-500 hover:text-slate-800 transition-colors">إخفاء الأرصدة الصفرية</span>
      </label>
    </section>
  )
}

