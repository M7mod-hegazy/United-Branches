import { BranchManager } from '@/components/admin/BranchManager'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">إدارة الفروع</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">الفروع</h1>
      </div>
      <BranchManager />
    </div>
  )
}
