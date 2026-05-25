'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    setLoading(false)

    if (!response.ok) {
      setError('بيانات الدخول غير صحيحة')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-6 rounded-3xl border border-slate-200/50 bg-white/70 p-8 backdrop-blur-md shadow-premium transition-all duration-300">
      
      {/* Username Field */}
      <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        اسم المستخدم للمشرف
        <input
          value={username}
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
          className="h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-850 outline-none transition-all duration-300 focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
        />
      </label>

      {/* Password Field */}
      <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        كلمة المرور السرية
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-850 outline-none transition-all duration-300 focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
        />
      </label>

      {/* Error Message Box */}
      {error && (
        <div className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Action */}
      <button
        disabled={loading}
        className="h-12 w-full rounded-xl bg-slate-900 px-4 text-xs font-black tracking-widest text-white transition-all duration-300 hover:bg-indigo-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-premium shadow-slate-950/10"
      >
        {loading ? 'جاري التحقق والاتصال...' : 'دخول لوحة التحكم'}
      </button>
    </form>
  )
}

