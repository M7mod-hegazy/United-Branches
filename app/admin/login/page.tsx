import { LoginForm } from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-8 pt-8">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E6FBF] border border-blue-100 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1E6FBF]" />
          بوابة الإشراف والأمان
        </span>
        <h1 className="text-3.5xl font-black text-slate-900 leading-tight">تسجيل دخول الإدارة</h1>
        <p className="text-xs font-bold text-slate-400 mt-2">يرجى إدخال اسم المستخدم وكلمة المرور الخاصة بمشرف النظام.</p>
      </div>
      <LoginForm />
    </div>
  )
}

