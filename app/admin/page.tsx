import { BranchManager } from '@/components/admin/BranchManager'
import { SharedUpdateManager } from '@/components/admin/SharedUpdateManager'

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E6FBF] border border-blue-100 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
          منطقة الإشراف الفني
        </span>
        <h1 className="text-3.5xl font-black text-slate-900 leading-tight">إدارة النظام ومخازن الفروع</h1>
        <p className="text-sm font-semibold text-slate-400 mt-2">تسجيل الفروع الجديدة، ضبط نسب وقواعد الاحتفاظ بالرفعات التاريخية، وإدارة السجلات الاحتياطية.</p>
      </div>
      <BranchManager />
      <SharedUpdateManager />
    </div>
  )
}


