import { LoginForm } from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-emerald-700">إدارة الفروع</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">تسجيل الدخول</h1>
      </div>
      <LoginForm />
    </div>
  )
}
