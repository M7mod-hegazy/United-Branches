'use client'

interface SearchFiltersProps {
  search: string
  branchId: string
  hideZero: boolean
  branches: { id: string; name: string }[]
  onSearchChange: (value: string) => void
  onBranchChange: (value: string) => void
  onHideZeroChange: (value: boolean) => void
}

export function SearchFilters({
  search,
  branchId,
  hideZero,
  branches,
  onSearchChange,
  onBranchChange,
  onHideZeroChange,
}: SearchFiltersProps) {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px_auto]">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="ابحث بالكود أو اسم الصنف"
        className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600"
      />
      <select
        value={branchId}
        onChange={(event) => onBranchChange(event.target.value)}
        className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600"
      >
        <option value="">كل الفروع</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <label className="flex h-11 items-center gap-2 rounded-md border border-slate-300 px-3">
        <input
          type="checkbox"
          checked={hideZero}
          onChange={(event) => onHideZeroChange(event.target.checked)}
          className="h-4 w-4 accent-emerald-700"
        />
        <span className="whitespace-nowrap text-sm font-medium">إخفاء الأرصدة الصفرية</span>
      </label>
    </section>
  )
}
