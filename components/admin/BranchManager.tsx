'use client'

import { FormEvent, useEffect, useState } from 'react'
import { SnapshotManager } from '@/components/admin/SnapshotManager'
import { DominantBranchSelector } from '@/components/admin/DominantBranchSelector'

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
    <div className="space-y-8">
      
      {/* Database control actions */}
      <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-sm">
        <button
          onClick={clearAllSnapshots}
          className="rounded-xl border border-rose-200 bg-rose-50/30 px-5 py-2.5 text-xs font-black text-rose-700 hover:bg-rose-100/50 transition-all duration-300 active:scale-95 shadow-sm"
        >
          مسح قاعدة البيانات كاملة
        </button>
        <button
          onClick={logout}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] transition-all duration-300 active:scale-95 shadow-sm"
        >
          تسجيل الخروج
        </button>
      </div>

      {/* Add new branch form */}
      <form onSubmit={addBranch} className="flex gap-4 rounded-2xl border border-slate-200/55 bg-white p-5 shadow-premium">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="أدخل اسم الفرع الجديد المراد تسجيله..."
          className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-bold text-slate-850 placeholder-slate-400 outline-none transition-all duration-300 focus:border-[#1E6FBF] focus:bg-white focus:ring-2 focus:ring-blue-100 shadow-sm"
        />
        <button className="h-12 rounded-xl bg-slate-900 hover:bg-indigo-900 px-6 text-xs font-black text-white transition-all duration-300 active:scale-95 shadow-premium shadow-slate-900/10 shrink-0">
          إضافة الفرع
        </button>
      </form>

      {/* Notification banner */}
      {message && (
        <div className="rounded-xl border border-blue-200/50 bg-blue-50/20 px-5 py-4 text-xs font-black text-[#1E6FBF] flex items-center gap-2.5 transition-all duration-300 shadow-sm animate-pulse">
          <span className="h-2 w-2 rounded-full bg-[#1E6FBF]" />
          {message}
        </div>
      )}

      {/* Branches List Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-premium divide-y divide-slate-100">
        {branches.map((branch) => (
          <div key={branch._id} className="flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-slate-50/30">
            {editingId === branch._id ? (
              <input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-800 focus:border-[#1E6FBF] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300"
              />
            ) : (
              <div className="flex-1 text-sm font-extrabold text-slate-800">{branch.name}</div>
            )}
            
            {editingId === branch._id ? (
              <button
                onClick={() => updateBranch(branch._id)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-black text-white transition-all duration-300 active:scale-95 shadow-sm shrink-0"
              >
                حفظ الاسم
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingId(branch._id)
                  setEditingName(branch.name)
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-500 hover:border-[#1E6FBF] hover:text-[#1E6FBF] transition-all duration-300 active:scale-95 shadow-sm"
              >
                تعديل الاسم
              </button>
            )}
            <button
              onClick={() => deleteBranch(branch._id)}
              className="rounded-xl border border-rose-100 bg-rose-50/20 px-5 py-2.5 text-xs font-black text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-all duration-300 active:scale-95 border-dashed"
            >
              حذف الفرع
            </button>
          </div>
        ))}
      </div>

      <DominantBranchSelector branches={branches} />

      <SnapshotManager branches={branches} onDeleted={loadBranches} />
    </div>
  )
}

