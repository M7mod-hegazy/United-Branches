import { BranchManager } from '@/components/admin/BranchManager'

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#A88554] block mb-1">إعدادات النظام</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1E2229]">إدارة الفروع والمخزون</h1>
      </div>
      <BranchManager />
    </div>
  )
}
