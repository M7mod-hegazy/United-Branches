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

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={logout} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
          خروج
        </button>
      </div>
      <form onSubmit={addBranch} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="اسم الفرع"
          className="h-11 flex-1 rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600"
        />
        <button className="h-11 rounded-md bg-emerald-700 px-5 font-semibold text-white hover:bg-emerald-800">
          إضافة
        </button>
      </form>
      {message && <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div>}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {branches.map((branch) => (
          <div key={branch._id} className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-b-0">
            {editingId === branch._id ? (
              <input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                className="h-10 flex-1 rounded-md border border-slate-300 px-3"
              />
            ) : (
              <div className="flex-1 font-semibold text-slate-950">{branch.name}</div>
            )}
            {editingId === branch._id ? (
              <button onClick={() => updateBranch(branch._id)} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
                حفظ
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingId(branch._id)
                  setEditingName(branch.name)
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
              >
                تعديل
              </button>
            )}
            <button onClick={() => deleteBranch(branch._id)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
