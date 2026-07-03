import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiGet } from '@/lib/api'
import {
  LibraryUserPermission, getAllLibraryUserPermissions, setUserLibraryPermission,
} from '@/lib/library-storage'

export function LibraryUsersPanel() {
  const [apiUsers, setApiUsers] = useState<{ id: number; name: string; email: string; role: string }[]>([])
  const [permissions, setPermissions] = useState<LibraryUserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await apiGet<{ users: { id: number; name: string; email: string; role: string }[] }>('/users')
      setApiUsers(r.users)
    } catch {
      /* Fallback */
      try {
        const stored = localStorage.getItem('b44_users')
        if (stored) setApiUsers(JSON.parse(stored))
      } catch {}
    }
    const perms = await getAllLibraryUserPermissions()
    setPermissions(perms)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleAccess = async (user: { id: number; name: string; email: string; role: string }, currentAccess: 'allow' | 'ban' | undefined) => {
    const newAccess: 'allow' | 'ban' = currentAccess === 'ban' ? 'allow' : 'ban'
    const adminName = 'Library Admin'
    await setUserLibraryPermission({
      userId: user.id, userName: user.name, email: user.email, role: user.role,
      libraryAccess: newAccess, setBy: adminName, setAt: new Date().toISOString(),
    })
    load()
  }

  const getStatus = (userId: number): { access: 'allow' | 'ban'; setBy?: string } => {
    const perm = permissions.find(p => p.userId === userId)
    if (!perm) return { access: 'allow' }
    return { access: perm.libraryAccess, setBy: perm.setBy }
  }

  const filtered = apiUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(37,99,235,0.20)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h3 className="text-lg font-black text-white">👥 Library Users Panel</h3>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
              {apiUsers.filter(u => getStatus(u.id).access === 'allow').length} Allowed
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              {apiUsers.filter(u => getStatus(u.id).access === 'ban').length} Banned
            </span>
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading users…</div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {filtered.map(u => {
            const status = getStatus(u.id)
            const isBanned = status.access === 'ban'
            return (
              <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition"
                style={{ opacity: isBanned ? 0.5 : 1 }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: isBanned ? 'rgba(239,68,68,0.10)' : 'rgba(37,99,235,0.10)', color: isBanned ? '#f87171' : '#60a5fa' }}>
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-400 truncate font-medium">{u.email} · {u.role}</p>
                  {status.setBy && <p className="text-[8px] text-gray-600">Set by: {status.setBy}</p>}
                </div>
                <button onClick={() => toggleAccess(u, status.access)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${isBanned
                    ? 'text-emerald-400'
                    : 'text-red-400'}`}
                  style={{ background: isBanned ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isBanned ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                  {isBanned ? '✅ Allow' : '🚫 Ban'}
                </button>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">No users match</div>
          )}
        </div>
      )}
    </div>
  )
}
