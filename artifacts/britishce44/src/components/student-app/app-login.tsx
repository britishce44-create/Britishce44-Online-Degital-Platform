import { useState, useEffect } from 'react'
import { useAppState, AppStudentData } from './app-provider'

interface Props {
  prefill: { name: string; token: string } | null
  onComplete: () => void
}

export function AppLogin({ prefill, onComplete }: Props) {
  const { setStudent, syncSchedule, syncAssignments, refreshConfig } = useAppState()
  const [name, setName] = useState(prefill?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (prefill) {
      setName(prefill.name)
    }
  }, [prefill])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    setLoading(true); setError('')
    try {
      /* Try API login with name-only (no password needed) */
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@student.britishce44.com`
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'student' }),
      })
      if (res.ok) {
        const data = await res.json()
        const student: AppStudentData = {
          id: data.user.id, name: data.user.name || name,
          email: data.user.email, phone: data.user.phone || '',
          teacher: data.user.teacher || '', classroomNum: data.user.classroomNum || 0,
          level: data.user.level || '', startTime: data.user.startTime || '',
          endTime: data.user.endTime || '', startDate: data.user.startDate || '',
          endDate: data.user.endDate || '', permissions: data.user.permissions || [],
          settings: data.user.settings || {}, dashboardConfig: data.user.dashboardConfig || {},
          token: data.accessToken,
        }
        setStudent(student)
        localStorage.setItem('b44_app_token', data.accessToken)
        syncSchedule(); syncAssignments(); refreshConfig(); onComplete()
        return
      }

      /* Fallback: local-only login (no server needed) */
      const localStudent: AppStudentData = {
        id: Date.now(),
        name: name.trim(),
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@student.britishce44.com`,
        phone: '', teacher: '', classroomNum: 0, level: '',
        startTime: '', endTime: '', startDate: '', endDate: '',
        permissions: [], settings: {}, dashboardConfig: {},
        token: `local-${Date.now()}`,
      }
      setStudent(localStudent)
      localStorage.setItem('b44_app_token', localStudent.token)
      syncSchedule(); refreshConfig(); onComplete()
    } catch {
      /* Network error — login locally anyway */
      const localStudent: AppStudentData = {
        id: Date.now(),
        name: name.trim(),
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@student.britishce44.com`,
        phone: '', teacher: '', classroomNum: 0, level: '',
        startTime: '', endTime: '', startDate: '', endDate: '',
        permissions: [], settings: {}, dashboardConfig: {},
        token: `local-${Date.now()}`,
      }
      setStudent(localStudent)
      localStorage.setItem('b44_app_token', localStudent.token)
      syncSchedule(); refreshConfig(); onComplete()
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a1628, #1a1a4e)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#F5C518] flex items-center justify-center mb-6 shadow-xl shadow-golden/20">
          <span className="text-3xl font-black text-[#17125c]">B44</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-1 text-center">Britishce44</h1>
        <p className="text-sm text-gray-400 mb-8 text-center font-medium">Student Mobile App</p>

        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1 block">Student Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none bg-white/5 border border-indigo-500/20 focus:border-golden/50 placeholder-gray-600 transition"
              placeholder="Enter your name" autoFocus readOnly={!!prefill} />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition shadow-lg"
            style={{ background: loading ? 'linear-gradient(135deg, #D4A017, #b8921a)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.30)' }}>
            {loading ? 'Signing in…' : '🔑 Sign In'}
          </button>
        </form>

        <p className="text-[10px] text-gray-600 mt-8 text-center max-w-xs">
          Enter your name to access the app. No password required.
        </p>
      </div>
    </div>
  )
}
