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
    <section className="grid gap-4 rounded-xl border border-[#EAE8E4] bg-white p-5 md:grid-cols-[1fr_220px_220px_auto] items-center">
      <div className="relative">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ابحث بالكود أو اسم الصنف..."
          className="h-11 w-full rounded-lg border border-[#E2E0D9] bg-[#FAF9F6] px-4 pl-10 text-sm placeholder-[#A19D95] focus:border-[#A88554] focus:bg-white focus:ring-1 focus:ring-[#A88554]"
        />
        <span className="absolute left-3 top-3.5 text-[#78726A]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>
      <div className="relative">
        <select
          value={branchId}
          onChange={(event) => onBranchChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-[#E2E0D9] bg-[#FAF9F6] px-4 text-sm text-[#1E2229] appearance-none focus:border-[#A88554] focus:bg-white focus:ring-1 focus:ring-[#A88554]"
        >
          <option value="">جميع الفروع</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <span className="absolute left-3 top-4 pointer-events-none text-[#78726A]">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      <div className="relative">
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-[#E2E0D9] bg-[#FAF9F6] px-4 text-sm text-[#1E2229] appearance-none focus:border-[#A88554] focus:bg-white focus:ring-1 focus:ring-[#A88554]"
        >
          <option value="">جميع الفئات</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              الفئة {cat}
            </option>
          ))}
        </select>
        <span className="absolute left-3 top-4 pointer-events-none text-[#78726A]">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      <label className="flex h-11 items-center gap-3 rounded-lg border border-[#E2E0D9] bg-[#FAF9F6] px-4 cursor-pointer select-none hover:border-[#A88554] hover:bg-white">
        <input
          type="checkbox"
          checked={hideZero}
          onChange={(event) => onHideZeroChange(event.target.checked)}
          className="h-4 w-4 rounded border-[#E2E0D9] text-[#A88554] focus:ring-[#A88554] accent-[#A88554]"
        />
        <span className="whitespace-nowrap text-sm font-medium text-[#78726A]">إخفاء الأرصدة الصفرية</span>
      </label>
    </section>
  )
}

