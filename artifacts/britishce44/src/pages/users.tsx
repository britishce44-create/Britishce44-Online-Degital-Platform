import { useEffect, useState, useMemo } from 'react'
import { ContactsManager } from '@/components/contacts/contacts-manager'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError, type Course } from '@/lib/api'

type Tab = 'users' | 'contacts'
type Role = 'admin' | 'teacher' | 'student' | 'supervisor' | 'parent'
type Status = 'active' | 'inactive' | 'suspended'

interface ApiUser {
  id: number; email: string; name: string; role: Role;
  phone: string; status: Status; permissions: string[];
  accessFrom: string; accessTo: string;
  dashboardConfig: Record<string, boolean>;
  teacherId?: number | null; studentId?: number | null; parentId?: number | null;
  lastSeen: string; createdAt: string; updatedAt: string;
}

const ALL_PERMISSIONS = [
  { key: 'classrooms', label: 'Classrooms', icon: '🚪' },
  { key: 'exams', label: 'Exams', icon: '📝' },
  { key: 'messenger', label: 'Messenger', icon: '💬' },
  { key: 'homework', label: 'Homework', icon: '📄' },
  { key: 'reports', label: 'Reports', icon: '📊' },
  { key: 'recordings', label: 'Recordings', icon: '🎞️' },
  { key: 'placements', label: 'Placements', icon: '🎯' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'users', label: 'User Mgmt', icon: '👥' },
  { key: 'assessment', label: 'Assessment', icon: '✍️' },
  { key: 'attendance', label: 'Attendance', icon: '📅' },
  { key: 'results', label: 'Results', icon: '🏆' },
  { key: 'videoeditor', label: 'Video Editor', icon: '🎬' },
  { key: 'marketing', label: 'Marketing', icon: '📢' },
  { key: 'ailearning', label: 'AI Learning', icon: '🧠' },
  { key: 'parentportal', label: 'Parent Portal', icon: '👨‍👩‍👧' },
]

const DASHBOARD_WIDGETS = [
  { key: 'overview', label: 'Overview Stats', icon: '📊' },
  { key: 'courses', label: 'My Courses', icon: '📚' },
  { key: 'schedule', label: 'Schedule', icon: '📅' },
  { key: 'tasks', label: 'Tasks', icon: '✅' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'recentActivity', label: 'Recent Activity', icon: '🕐' },
  { key: 'performance', label: 'Performance', icon: '📈' },
  { key: 'attendance', label: 'Attendance', icon: '🚦' },
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'announcements', label: 'Announcements', icon: '📣' },
]

const ROLE_CFG: Record<Role, { color: string; bg: string; emoji: string; label: string }> = {
  admin: { color: '#2563eb', bg: '#dbeafe', emoji: '👑', label: 'Admin' },
  teacher: { color: '#0284c7', bg: '#e0f2fe', emoji: '👩‍🏫', label: 'Teacher' },
  supervisor: { color: '#0d9488', bg: '#ccfbf1', emoji: '🔭', label: 'Supervisor' },
  student: { color: '#4f46e5', bg: '#eef2ff', emoji: '🎓', label: 'Student' },
  parent: { color: '#7c3aed', bg: '#f5f3ff', emoji: '👪', label: 'Parent' },
}

const STATUS_CFG: Record<Status, { color: string; label: string; dot: string }> = {
  active: { color: '#059669', label: 'Active', dot: '#34d399' },
  inactive: { color: '#94a3b8', label: 'Inactive', dot: '#cbd5e1' },
  suspended: { color: '#dc2626', label: 'Suspended', dot: '#f87171' },
}

function UserModal({
  user, onSave, onClose,
}: {
  user?: ApiUser | null; onSave: (data: any) => void; onClose: () => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(user?.role ?? 'student')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [status, setStatus] = useState<Status>(user?.status ?? 'active')
  const [accessFrom, setAccessFrom] = useState(user?.accessFrom ?? '00:00')
  const [accessTo, setAccessTo] = useState(user?.accessTo ?? '23:59')
  const [permissions, setPermissions] = useState<string[]>(user?.permissions ?? [])
  const [dashboardConfig, setDashboardConfig] = useState<Record<string, boolean>>(
    user?.dashboardConfig ?? Object.fromEntries(DASHBOARD_WIDGETS.map(w => [w.key, true]))
  )
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const isNew = !user

  const handleSave = async () => {
    setErr('')
    if (!name.trim()) { setErr('Name is required'); return }
    if (!email.trim()) { setErr('Email is required'); return }
    if (isNew && !password) { setErr('Password is required for new users'); return }
    setBusy(true)
    try {
      const body = { name: name.trim(), email: email.trim(), password, role, phone, status, accessFrom, accessTo, permissions, dashboardConfig }
      if (isNew) {
        await apiPost('/users', body)
      } else {
        const { password: _, ...updateBody } = body
        await apiPatch(`/users/${user!.id}`, updateBody)
        if (password) await apiPatch(`/users/${user!.id}/password`, { password })
      }
      onSave(body)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Save failed')
    } finally { setBusy(false) }
  }

  const togglePerm = (key: string) =>
    setPermissions(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key])

  const toggleDashboard = (key: string) =>
    setDashboardConfig(d => ({ ...d, [key]: !d[key] }))

  const selectAllPerms = () => setPermissions(ALL_PERMISSIONS.map(p => p.key))
  const clearAllPerms = () => setPermissions([])
  const enableAllDashboard = () => setDashboardConfig(Object.fromEntries(DASHBOARD_WIDGETS.map(w => [w.key, true])))
  const disableAllDashboard = () => setDashboardConfig(Object.fromEntries(DASHBOARD_WIDGETS.map(w => [w.key, false])))

  const inp = "w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder:text-gray-400 transition"
  const label = "block text-xs font-semibold text-blue-800 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-3xl rounded-2xl overflow-auto shadow-2xl bg-white max-h-[90vh]">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-300" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-blue-900">{isNew ? '➕ Create New User' : '✏️ Edit User'}</h3>
              <p className="text-xs text-blue-500 mt-0.5">{isNew ? 'Set up a new account' : `User #${user!.id} — ${user!.email}`}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-blue-400 hover:bg-blue-50 hover:text-blue-700 transition text-lg">✕</button>
          </div>

          {err && (
            <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200">{err}</div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={label}>Full Name</label>
              <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmed Nasser" />
            </div>
            <div>
              <label className={label}>Email Address</label>
              <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <label className={label}>{isNew ? 'Password' : 'New Password (leave blank to keep)'}</label>
              <input className={inp} type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder={isNew ? 'Set password' : 'Leave blank to keep'} />
            </div>
            <div>
              <label className={label}>Phone / WhatsApp</label>
              <input className={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+967 7XX XXX XXX" />
            </div>
            <div>
              <label className={label}>Role</label>
              <select className={inp} value={role} onChange={e => setRole(e.target.value as Role)}>
                {(Object.keys(ROLE_CFG) as Role[]).map(r => <option key={r} value={r}>{ROLE_CFG[r].emoji} {ROLE_CFG[r].label}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Account Status</label>
              <select className={inp} value={status} onChange={e => setStatus(e.target.value as Status)}>
                <option value="active">✅ Active</option>
                <option value="inactive">⏸ Inactive</option>
                <option value="suspended">🚫 Suspended</option>
              </select>
            </div>
            <div>
              <label className={label}>Access From</label>
              <input type="time" className={inp} value={accessFrom} onChange={e => setAccessFrom(e.target.value)} />
            </div>
            <div>
              <label className={label}>Access Until</label>
              <input type="time" className={inp} value={accessTo} onChange={e => setAccessTo(e.target.value)} />
            </div>
          </div>

          {/* Teacher Courses & Rooms panel */}
          {role === 'teacher' && <TeacherCoursesPanel userId={user?.id ?? 0} teacherId={user?.teacherId ?? null} teacherName={name} />}

          {/* Student course assignment panel */}
          {role === 'student' && <StudentCoursePanel userId={user?.id ?? 0} studentId={user?.studentId ?? null} />}

          {/* Permissions */}
          <div className="mb-6 p-5 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-blue-900">🔐 Platform Permissions</p>
              <div className="flex gap-2">
                <button onClick={selectAllPerms} className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">Grant All</button>
                <button onClick={clearAllPerms} className="text-xs px-3 py-1 rounded-full font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {ALL_PERMISSIONS.map(p => {
                const on = permissions.includes(p.key)
                return (
                  <button key={p.key} onClick={() => togglePerm(p.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition border ${on ? 'bg-white border-blue-300 shadow-sm' : 'bg-blue-50/50 border-transparent hover:bg-blue-100/50'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition ${on ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                      {on && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    <span className="text-xs font-medium text-gray-800">{p.icon} {p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dashboard config */}
          <div className="mb-6 p-5 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-blue-900">📊 Dashboard Widgets</p>
              <div className="flex gap-2">
                <button onClick={enableAllDashboard} className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">Show All</button>
                <button onClick={disableAllDashboard} className="text-xs px-3 py-1 rounded-full font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 transition">Hide All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {DASHBOARD_WIDGETS.map(w => {
                const on = dashboardConfig[w.key] !== false
                return (
                  <button key={w.key} onClick={() => toggleDashboard(w.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition border ${on ? 'bg-white border-blue-300 shadow-sm' : 'bg-blue-50/50 border-transparent opacity-60 hover:opacity-100'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition ${on ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'}`}>
                      {on && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    <span className="text-xs font-medium text-gray-800">{w.icon} {w.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-blue-400 mt-2">Control which widgets appear on this user's dashboard.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">Cancel</button>
            <button onClick={handleSave} disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              {busy ? 'Saving…' : isNew ? '➕ Create User' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function DeleteConfirm({ id, name, onConfirm, onClose }: { id: number; name: string; onConfirm: (id: number) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-2xl p-6 max-w-sm w-full shadow-2xl bg-white border border-red-200">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">🗑️</div>
        <p className="text-lg font-bold text-gray-900 mb-2 text-center">Delete User</p>
        <p className="text-sm text-gray-500 mb-1 text-center">Are you sure you want to delete</p>
        <p className="text-sm font-semibold text-gray-800 mb-4 text-center break-all">"{name}"?</p>
        <p className="text-xs text-red-500 mb-5 text-center bg-red-50 py-2 px-3 rounded-lg">This action is permanent and cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">Cancel</button>
          <button onClick={() => onConfirm(id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-200">Delete Permanently</button>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Teacher Courses & Rooms panel ── */
const WEEKDAY_OPTIONS = [
  { n: 0, label: 'Sun' }, { n: 1, label: 'Mon' }, { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' }, { n: 4, label: 'Thu' }, { n: 5, label: 'Fri' }, { n: 6, label: 'Sat' },
]

function TeacherCoursesPanel({ userId, teacherId, teacherName }: { userId: number; teacherId: number | null; teacherName: string }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: '', level: '', room: '', startTime: '08:00', endTime: '09:30',
    termLabel: 'Term 1', termStartDate: new Date().toISOString().split('T')[0],
    teachingWeekdays: [0, 1, 2, 3, 4] as number[],
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<{ room: string; startTime: string; endTime: string; level: string; name: string }>({ room: '', startTime: '', endTime: '', level: '', name: '' })

  const load = async () => {
    if (!teacherId) { setLoading(false); return }
    try {
      const r = await apiGet<{ courses: Course[] }>(`/classroom-assessment/teachers/${teacherId}/courses`)
      setCourses(r.courses)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [teacherId])

  const addCourse = async () => {
    if (!newCourse.name.trim()) { setMsg({ kind: 'err', text: 'Course name is required' }); return }
    if (!teacherId) { setMsg({ kind: 'err', text: 'Save the teacher first, then add courses' }); return }
    setBusy(true)
    try {
      await apiPost('/courses', {
        teacherId, name: newCourse.name.trim(), level: newCourse.level || null,
        termLabel: newCourse.termLabel, termStartDate: newCourse.termStartDate,
        teachingWeekdays: newCourse.teachingWeekdays,
        room: newCourse.room || null, startTime: newCourse.startTime || null, endTime: newCourse.endTime || null,
      })
      setMsg({ kind: 'ok', text: 'Course added' })
      setNewCourse({ ...newCourse, name: '', level: '', room: '' })
      setShowAdd(false)
      await load()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed to add course' })
    } finally { setBusy(false) }
  }

  const saveEdit = async (id: number) => {
    setBusy(true)
    try {
      await apiPatch(`/courses/${id}`, editData)
      setMsg({ kind: 'ok', text: 'Course updated' })
      setEditingId(null)
      await load()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  const deleteCourse = async (id: number) => {
    if (!confirm('Delete this course? Students will be unenrolled.')) return
    setBusy(true)
    try {
      await apiDelete(`/courses/${id}`)
      setMsg({ kind: 'ok', text: 'Course deleted' })
      await load()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  const toggleWeekday = (arr: number[], n: number) => arr.includes(n) ? arr.filter(x => x !== n) : [...arr, n].sort()

  const startEdit = (c: Course) => {
    setEditingId(c.id)
    setEditData({ room: c.room ?? '', startTime: c.startTime ?? '', endTime: c.endTime ?? '', level: c.level ?? '', name: c.name })
  }

  const inp = "w-full rounded-lg px-3 py-2 text-sm text-gray-900 bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none placeholder:text-gray-400 transition"

  return (
    <div className="mb-6 p-5 rounded-xl bg-sky-50 border border-sky-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-sky-900">🏫 Teacher Courses & Rooms {teacherName && <span className="text-sky-500 font-normal">— {teacherName}</span>}</p>
        <button onClick={() => setShowAdd(v => !v)} className="text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-600 text-white hover:bg-sky-700 transition">+ Add Course</button>
      </div>

      {msg && <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}

      {loading ? (
        <p className="text-xs text-sky-400">Loading courses…</p>
      ) : courses.length === 0 && !showAdd ? (
        <p className="text-xs text-sky-400 py-2">No courses assigned yet. Click "+ Add Course" to create one with a room and time slot.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {courses.map(c => (
            <div key={c.id} className="p-3 rounded-lg bg-white border border-sky-100">
              {editingId === c.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <input className={inp} value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder="Course name" />
                  <input className={inp} value={editData.level} onChange={e => setEditData({ ...editData, level: e.target.value })} placeholder="Level" />
                  <input className={inp} value={editData.room} onChange={e => setEditData({ ...editData, room: e.target.value })} placeholder="Room (e.g. LAB 3)" />
                  <input type="time" className={inp} value={editData.startTime} onChange={e => setEditData({ ...editData, startTime: e.target.value })} />
                  <input type="time" className={inp} value={editData.endTime} onChange={e => setEditData({ ...editData, endTime: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c.id)} disabled={busy} className="px-3 py-2 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition">💾 Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    <strong className="text-sm text-gray-800">{c.name}</strong>
                    {c.level && <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">{c.level}</span>}
                    {c.room && <span className="text-gray-600">🏫 {c.room}</span>}
                    {c.startTime && <span className="text-gray-600">⏰ {c.startTime}{c.endTime ? `–${c.endTime}` : ''}</span>}
                    <span className="text-gray-400">{(c.teachingWeekdays || []).map(w => WEEKDAY_OPTIONS.find(d => d.n === w)?.label).filter(Boolean).join(', ')}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition text-xs">✏️</button>
                    <button onClick={() => deleteCourse(c.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition text-xs">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new course form */}
      {showAdd && (
        <div className="p-4 rounded-lg bg-white border border-sky-200 space-y-3">
          <p className="text-xs font-bold text-sky-800">New Course</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-sky-700 mb-1">Course Name *</label>
              <input className={inp} value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. English B1, IELTS Prep" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-sky-700 mb-1">Level</label>
              <input className={inp} value={newCourse.level} onChange={e => setNewCourse({ ...newCourse, level: e.target.value })} placeholder="e.g. B1, A2, Grade 5" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-sky-700 mb-1">Room</label>
              <input className={inp} value={newCourse.room} onChange={e => setNewCourse({ ...newCourse, room: e.target.value })} placeholder="e.g. LAB 3, Room A" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-sky-700 mb-1">Start Time</label>
              <input type="time" className={inp} value={newCourse.startTime} onChange={e => setNewCourse({ ...newCourse, startTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-sky-700 mb-1">End Time</label>
              <input type="time" className={inp} value={newCourse.endTime} onChange={e => setNewCourse({ ...newCourse, endTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-sky-700 mb-1">Term Label</label>
              <input className={inp} value={newCourse.termLabel} onChange={e => setNewCourse({ ...newCourse, termLabel: e.target.value })} placeholder="Term 1" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-sky-700 mb-1">Teaching Days</label>
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAY_OPTIONS.map(d => (
                <button key={d.n} onClick={() => setNewCourse({ ...newCourse, teachingWeekdays: toggleWeekday(newCourse.teachingWeekdays, d.n) })}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition"
                  style={{
                    background: newCourse.teachingWeekdays.includes(d.n) ? '#0284c7' : '#f1f5f9',
                    color: newCourse.teachingWeekdays.includes(d.n) ? '#fff' : '#64748b',
                  }}>{d.label}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addCourse} disabled={busy} className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition disabled:opacity-50">{busy ? 'Adding…' : '+ Add Course'}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200">Cancel</button>
          </div>
          {!teacherId && <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">⚠ Save the user first (click "Create User"), then reopen to add courses.</p>}
        </div>
      )}
    </div>
  )
}

/* ── Student course assignment panel ── */
function StudentCoursePanel({ userId, studentId }: { userId: number; studentId: number | null }) {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    try {
      // Fetch all teachers' courses by fetching each teacher's courses — or use a simple all-courses endpoint
      // For simplicity, fetch teachers first then courses
      const tr = await apiGet<{ teachers: { id: number; name: string }[] }>('/classroom-assessment/teachers')
      const all: Course[] = []
      for (const t of tr.teachers) {
        try {
          const r = await apiGet<{ courses: Course[] }>(`/classroom-assessment/teachers/${t.id}/courses`)
          all.push(...r.courses.map(c => ({ ...c, teacherName: t.name })))
        } catch { /* skip */ }
      }
      setAllCourses(all)
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const assign = async () => {
    if (!selectedCourse || !studentId) return
    setBusy(true)
    try {
      await apiPost(`/courses/${selectedCourse}/assign-student`, { studentId })
      setMsg({ kind: 'ok', text: 'Student assigned to course' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  const inp = "w-full rounded-lg px-3 py-2 text-sm text-gray-900 bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"

  return (
    <div className="mb-6 p-5 rounded-xl bg-indigo-50 border border-indigo-100">
      <p className="text-sm font-bold text-indigo-900 mb-3">📚 Assign to Course</p>
      {msg && <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}
      {!studentId && <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded mb-2">⚠ Save the student first, then reopen to assign a course.</p>}
      <div className="flex gap-2">
        <select className={inp} value={selectedCourse ?? ''} onChange={e => setSelectedCourse(Number(e.target.value))} disabled={!studentId}>
          <option value="">— Select a course —</option>
          {allCourses.map(c => <option key={c.id} value={c.id}>{c.name} {c.level ? `(${c.level})` : ''} {(c as any).teacherName ? `· ${(c as any).teacherName}` : ''}{c.room ? ` · ${c.room}` : ''}</option>)}
        </select>
        <button onClick={assign} disabled={busy || !selectedCourse || !studentId} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50">Assign</button>
      </div>
    </div>
  )
}

export function UsersPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [editUser, setEditUser] = useState<ApiUser | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [delId, setDelId] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await apiGet<{ users: ApiUser[] }>('/users')
      setUsers(r.users)
    } catch { setMsg({ kind: 'err', text: 'Failed to load users' }) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase()
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (roleFilter === 'all' || u.role === roleFilter)
      && (statusFilter === 'all' || u.status === statusFilter)
  }), [users, search, roleFilter, statusFilter])

  const delUser = async (id: number) => {
    try {
      await apiDelete(`/users/${id}`)
      setUsers(p => p.filter(u => u.id !== id))
      setSelected(p => p.filter(x => x !== id))
      setMsg({ kind: 'ok', text: 'User deleted' })
    } catch { setMsg({ kind: 'err', text: 'Delete failed' }) }
    setDelId(null)
  }

  const bulkDelete = async () => {
    for (const id of selected) await apiDelete(`/users/${id}`).catch(() => {})
    setUsers(p => p.filter(u => !selected.includes(u.id)))
    setSelected([])
    setMsg({ kind: 'ok', text: `${selected.length} users deleted` })
  }

  const roleCounts = (Object.keys(ROLE_CFG) as Role[]).reduce((a, r) => ({ ...a, [r]: users.filter(u => u.role === r).length }), {} as Record<Role, number>)
  const allSel = filtered.length > 0 && filtered.every(u => selected.includes(u.id))

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'var(--beige-light)', border: '1px solid var(--blue-pale)' }}>
        <button onClick={() => setTab('users')}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition"
          style={tab === 'users' ? { background: '#fff', color: '#2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.15)' } : { color: '#64748b' }}>
          👥 Users
        </button>
        <button onClick={() => setTab('contacts')}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition"
          style={tab === 'contacts' ? { background: '#fff', color: '#2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.15)' } : { color: '#64748b' }}>
          📇 Contacts
        </button>
      </div>

      {tab === 'contacts' ? (
        <ContactsManager />
      ) : (
        <>
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl p-6 bg-beige-white border border-blue-pale/60" style={{ boxShadow: '0 2px 12px rgba(30,58,138,0.05)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-blue-deep">👥 User Management</h2>
            <p className="text-sm text-blue-dark/60 mt-0.5 font-medium">{users.length} accounts · Full permission & dashboard control</p>
          </div>
          <div className="flex gap-2">
            {selected.length > 0 && (
              <>
                <button onClick={bulkDelete} className="px-3 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">🗑 Delete {selected.length}</button>
                <button onClick={() => setSelected([])} className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">Clear</button>
              </>
            )}
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              ＋ New User
            </button>
          </div>
        </div>

        {/* Role pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(Object.keys(ROLE_CFG) as Role[]).map(r => (
            <button key={r} onClick={() => setRoleFilter(v => v === r ? 'all' : r)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-bold"
              style={{
                background: roleFilter === r ? ROLE_CFG[r].color : ROLE_CFG[r].bg,
                color: roleFilter === r ? '#fff' : ROLE_CFG[r].color,
                border: `1px solid ${roleFilter === r ? ROLE_CFG[r].color : 'transparent'}`,
              }}>
              <span>{ROLE_CFG[r].emoji}</span>
              <span>{ROLE_CFG[r].label}</span>
              <span className="text-[10px] ml-1 opacity-70">({roleCounts[r]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none bg-beige-white border border-blue-pale focus:border-blue-primary focus:ring-2 focus:ring-blue-ice text-blue-deep font-medium placeholder:text-blue-300 transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none bg-beige-white border border-blue-pale focus:border-blue-primary text-blue-deep font-medium">
          <option value="all">All Status</option>
          <option value="active">✅ Active</option>
          <option value="inactive">⏸ Inactive</option>
          <option value="suspended">🚫 Suspended</option>
        </select>
        <button onClick={load} className="px-4 py-2.5 rounded-xl text-sm font-bold text-blue-primary bg-blue-ice border border-blue-pale hover:bg-blue-pale transition">↻ Refresh</button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden bg-beige-white border border-blue-pale/60" style={{ boxShadow: '0 2px 12px rgba(30,58,138,0.05)' }}>
        {/* Header */}
        <div className="hidden md:grid px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-blue-pale text-blue-deep"
          style={{ gridTemplateColumns: '32px minmax(180px,1fr) minmax(160px,1fr) 90px 80px 130px 100px 100px 80px' }}>
          <div><input type="checkbox" checked={allSel} onChange={e => setSelected(e.target.checked ? filtered.map(u => u.id) : [])} className="accent-blue-600 cursor-pointer" /></div>
          <div>User</div><div>Contact</div><div>Role</div><div>Status</div><div>Access</div><div>Last Seen</div><div>App</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm font-semibold text-blue-dark">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-semibold text-blue-dark">No users match your filters</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((u, i) => {
              const rc = ROLE_CFG[u.role]; const sc = STATUS_CFG[u.status]; const isSel = selected.includes(u.id)
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: i * 0.015 }}
                  className={`px-4 py-3 border-b border-blue-pale/30 hover:bg-beige transition cursor-default ${isSel ? 'bg-blue-ice' : ''}`}>
                  {/* Mobile */}
                  <div className="flex md:hidden items-center gap-3 mb-2">
                    <input type="checkbox" checked={isSel} onChange={() => setSelected(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])} className="accent-blue-600" />
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: rc.bg, color: rc.color }}>{u.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-blue-deep truncate">{u.name}</p>
                      <p className="text-xs text-blue-dark/60 truncate font-medium">{u.email}</p>
                    </div>
                    <div className="flex gap-1">
                      {u.role === 'student' && (
                        <a href={`/app-download?name=${encodeURIComponent(u.name)}&uid=${u.id}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition" title="Download App"
                          style={{ color: '#D4A017' }}>📱</a>
                      )}
                      <button onClick={() => setEditUser(u)} className="p-1.5 rounded-lg text-blue-primary hover:bg-blue-ice transition">✏️</button>
                      <button onClick={() => setDelId(u.id)} className="p-1.5 rounded-lg text-orange hover:bg-orange-pale transition">🗑️</button>
                    </div>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid items-center gap-2" style={{ gridTemplateColumns: '32px minmax(180px,1fr) minmax(160px,1fr) 90px 80px 130px 100px 100px 80px' }}>
                    <input type="checkbox" checked={isSel} onChange={() => setSelected(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])} className="accent-blue-600 cursor-pointer" />
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: rc.bg, color: rc.color }}>{u.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-blue-deep truncate">{u.name}</p>
                        <p className="text-xs text-blue-dark/60 truncate font-medium">{u.role === 'student' ? 'Student' : u.role === 'teacher' ? 'Teacher' : u.role === 'parent' ? 'Parent' : u.role}</p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-blue-deep font-semibold truncate">{u.email}</p>
                      <p className="text-xs text-gray-500 font-medium truncate">{u.phone || '—'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: rc.bg, color: rc.color }}>{rc.emoji} {rc.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                      <span className="text-xs font-bold" style={{ color: sc.color }}>{sc.label}</span>
                    </div>
                    <div className="text-xs text-gray-600 font-mono font-medium">
                      {u.accessFrom} — {u.accessTo}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{u.lastSeen || '—'}</div>
                    {/* Mobile app download */}
                    <div className="flex justify-center">
                      {u.role === 'student' ? (
                        <a href={`/app-download?name=${encodeURIComponent(u.name)}&uid=${u.id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition"
                          style={{ background: 'rgba(212,160,23,0.08)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.15)' }}
                          title="Download Student App">
                          📱 App
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-500">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditUser(u)} title="Edit" className="p-1.5 rounded-lg text-blue-primary hover:bg-blue-ice transition text-xs">✏️</button>
                      <button onClick={() => setDelId(u.id)} title="Delete" className="p-1.5 rounded-lg text-orange hover:bg-orange-pale transition text-xs">🗑️</button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-blue-deep font-semibold">{filtered.length} of {users.length} users shown{selected.length > 0 && ` · ${selected.length} selected`}</span>
        <div className="flex gap-4 text-blue-dark font-medium">
          <span>👑 Admin {roleCounts.admin}</span>
          <span>👩‍🏫 Teacher {roleCounts.teacher}</span>
          <span>🔭 Supervisor {roleCounts.supervisor}</span>
          <span>🎓 Student {roleCounts.student}</span>
          <span>👪 Parent {roleCounts.parent}</span>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(editUser || showAdd) && (
          <UserModal user={editUser} onSave={() => { load(); setEditUser(null); setShowAdd(false); setMsg({ kind: 'ok', text: 'User saved' }) }} onClose={() => { setEditUser(null); setShowAdd(false) }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {delId !== null && (
          <DeleteConfirm id={delId!} name={users.find(u => u.id === delId)?.name ?? ''} onConfirm={delUser} onClose={() => setDelId(null)} />
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  )
}
