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
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <label className="grid gap-2 text-sm font-medium">
        اسم المستخدم
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        كلمة المرور
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600"
        />
      </label>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      <button
        disabled={loading}
        className="h-11 w-full rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? 'جاري الدخول...' : 'دخول'}
      </button>
    </form>
  )
}
