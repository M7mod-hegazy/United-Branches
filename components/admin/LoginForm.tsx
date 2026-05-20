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
    <form onSubmit={submit} className="mx-auto max-w-md space-y-5 rounded-2xl border border-[#EAE8E4] bg-white p-8 transition-all duration-300 shadow-sm">
      <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-[#78726A]">
        اسم المستخدم
        <input
          value={username}
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
          className="h-11 rounded-lg border border-[#E2E0D9] bg-[#FCFAF7]/30 px-3.5 text-sm font-semibold text-[#1E2229] outline-none transition-all duration-200 focus:border-[#A88554] focus:bg-white focus:ring-1 focus:ring-[#A88554]"
        />
      </label>
      <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-[#78726A]">
        كلمة المرور
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-lg border border-[#E2E0D9] bg-[#FCFAF7]/30 px-3.5 text-sm font-semibold text-[#1E2229] outline-none transition-all duration-200 focus:border-[#A88554] focus:bg-white focus:ring-1 focus:ring-[#A88554]"
        />
      </label>
      {error && (
        <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="h-11 w-full rounded-lg bg-[#1E2229] px-4 text-xs font-bold tracking-wide text-white transition-all duration-200 hover:bg-[#2e343f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
      >
        {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}
