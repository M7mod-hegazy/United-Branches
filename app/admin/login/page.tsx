import { LoginForm } from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-7 pt-6">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#A88554] block mb-1">لوحة التحكم</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1E2229]">تسجيل الدخول</h1>
      </div>
      <LoginForm />
    </div>
  )
}
