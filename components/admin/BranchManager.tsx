'use client'

import { FormEvent, useEffect, useState } from 'react'

interface Branch {
  _id: string
  name: string
}

export function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')
  const [message, setMessage] = useState('')

  async function loadBranches() {
    const response = await fetch('/api/branches')
    setBranches(await response.json())
  }

  useEffect(() => {
    loadBranches()
  }, [])

  async function addBranch(event: FormEvent) {
    event.preventDefault()
    const response = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!response.ok) {
      setMessage('تعذر إضافة الفرع')
      return
    }
    setName('')
    setMessage('تمت إضافة الفرع')
    loadBranches()
  }

  async function updateBranch(id: string) {
    const response = await fetch(`/api/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName }),
    })
    if (!response.ok) {
      setMessage('تعذر تعديل الفرع')
      return
    }
    setEditingId('')
    setEditingName('')
    setMessage('تم تعديل الفرع')
    loadBranches()
  }

  async function deleteBranch(id: string) {
    if (!window.confirm('حذف الفرع سيحذف لقطات المخزون المرتبطة به. هل تريد المتابعة؟')) return
    const response = await fetch(`/api/branches/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setMessage('تعذر حذف الفرع')
      return
    }
    setMessage('تم حذف الفرع')
    loadBranches()
  }

  async function clearAllSnapshots() {
    if (!window.confirm('سيتم حذف جميع بيانات المخزون من كل الفروع. هل أنت متأكد؟')) return
    const response = await fetch('/api/snapshots', { method: 'DELETE' })
    const data = await response.json()
    setMessage(`تم مسح ${data.deleted} سجل من قاعدة البيانات`)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={clearAllSnapshots}
          className="rounded-lg border border-red-200/60 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 hover:border-red-300 transition-all duration-200 active:scale-95 shadow-sm"
        >
          مسح قاعدة البيانات
        </button>
        <button
          onClick={logout}
          className="rounded-lg border border-[#E2E0D9] bg-white px-4 py-2 text-xs font-bold text-[#78726A] hover:border-[#1E2229] hover:text-[#1E2229] transition-all duration-200 active:scale-95 shadow-sm"
        >
          تسجيل الخروج
        </button>
      </div>

      <form onSubmit={addBranch} className="flex gap-3 rounded-xl border border-[#EAE8E4] bg-white p-4 transition-all duration-300 shadow-sm">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="أدخل اسم الفرع الجديد..."
          className="h-11 flex-1 rounded-lg border border-[#E2E0D9] bg-[#FCFAF7]/30 px-3.5 text-xs font-semibold text-[#1E2229] placeholder-[#A19D95] outline-none transition-all duration-200 focus:border-[#A88554] focus:bg-white focus:ring-1 focus:ring-[#A88554]"
        />
        <button className="h-11 rounded-lg bg-[#1E2229] hover:bg-[#2e343f] px-6 text-xs font-bold tracking-wide text-white transition-all duration-200 active:scale-95 shadow-sm">
          إضافة الفرع
        </button>
      </form>

      {message && (
        <div className="rounded-xl border border-[#A88554]/20 bg-[#FAF6F0] px-4 py-3 text-xs font-bold text-[#A88554] flex items-center gap-2 transition-all duration-300 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A88554]" />
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#EAE8E4] bg-white transition-all duration-300 shadow-sm divide-y divide-[#EAE8E4]">
        {branches.map((branch) => (
          <div key={branch._id} className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-[#FCFAF7]/40">
            {editingId === branch._id ? (
              <input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                className="h-10 flex-1 rounded-lg border border-[#E2E0D9] px-3.5 text-xs font-semibold text-[#1E2229] focus:border-[#A88554] focus:ring-1 focus:ring-[#A88554] outline-none transition-all duration-200"
              />
            ) : (
              <div className="flex-1 text-xs font-bold text-[#1E2229]">{branch.name}</div>
            )}
            {editingId === branch._id ? (
              <button
                onClick={() => updateBranch(branch._id)}
                className="rounded-lg bg-[#A88554] hover:bg-[#BD9865] px-4 py-2 text-xs font-bold text-white transition-all duration-200 active:scale-95 shadow-sm"
              >
                حفظ
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingId(branch._id)
                  setEditingName(branch.name)
                }}
                className="rounded-lg border border-[#E2E0D9] px-4 py-2 text-xs font-bold text-[#78726A] hover:border-[#1E2229] hover:text-[#1E2229] transition-all duration-200 active:scale-95 bg-white shadow-sm"
              >
                تعديل
              </button>
            )}
            <button
              onClick={() => deleteBranch(branch._id)}
              className="rounded-lg border border-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all duration-200 active:scale-95 bg-white shadow-sm"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
