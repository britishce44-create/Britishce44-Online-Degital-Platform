import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiGet, apiPost, apiDelete, type ClassroomRoom, type Course } from '@/lib/api'

type RoomStatus = 'live' | 'scheduled' | 'empty' | 'locked'

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; glow: string; bg: string; dot: string }> = {
  live:      { label: 'LIVE',      color: '#34d399', glow: '0 0 14px rgba(52,211,153,0.55)', bg: 'rgba(16,185,129,0.09)', dot: 'bg-emerald-400 animate-pulse' },
  scheduled: { label: 'Scheduled', color: '#3b82f6', glow: '0 0 10px rgba(59,130,246,0.40)', bg: 'rgba(37,99,235,0.08)',  dot: 'bg-blue-500' },
  empty:     { label: 'Empty',     color: '#4b5563', glow: 'none',                             bg: 'transparent',           dot: 'bg-gray-600' },
  locked:    { label: 'Locked',    color: '#f87171', glow: '0 0 8px rgba(248,113,113,0.3)',   bg: 'rgba(239,68,68,0.05)',  dot: 'bg-red-400' },
}

function getJoinLink(roomId: number): string {
  return `${window.location.origin}${window.location.pathname}?room=${roomId}`
}

function copyJoinLink(roomId: number) {
  const link = getJoinLink(roomId)
  navigator.clipboard.writeText(link).then(() => {
    toast.success(`🔗 Room ${roomId} link copied!`, { duration: 2000 })
  }).catch(() => {
    toast.error('Could not copy link')
  })
}

function ClassroomCard({ room, onEnter }: { room: ClassroomRoom; onEnter: (id: number) => void }) {
  const s = STATUS_CONFIG[room.status]
  const joinId = room.roomId || room.id
  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => room.status !== 'locked' && onEnter(joinId)}
      className="relative rounded-xl overflow-hidden cursor-pointer select-none flex flex-col"
      style={{
        minHeight: '172px',
        background: `linear-gradient(145deg, #2a2196 0%, #122055 100%)`,
        border: `1px solid ${room.status === 'live' ? 'rgba(52,211,153,0.28)' : room.status === 'locked' ? 'rgba(248,113,113,0.22)' : 'rgba(37,99,235,0.18)'}`,
        boxShadow: room.status === 'live' ? s.glow : room.status === 'scheduled' ? s.glow : undefined,
      }}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: s.color, opacity: 0.7 }} />

      {/* Header row */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="text-xs font-bold text-white/60">#{joinId}</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-3 pt-2 pb-2">
        <div className="text-white font-bold text-sm leading-tight">{room.courseName || room.label || `Room ${joinId}`}</div>
        <div className="text-white/50 text-xs mt-1">{room.teacherName || 'Unassigned'}</div>
        {room.level && <div className="text-white/40 text-[10px] mt-0.5">{room.level}</div>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-3 text-white/50 text-[11px]">
          {room.status === 'live' && <span>👥 {room.studentCount}</span>}
          {room.startTime && <span>⏰ {room.startTime}{room.endTime ? `–${room.endTime}` : ''}</span>}
        </div>
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => copyJoinLink(joinId)}
            className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 transition">
            🔗 Link
          </button>
          {room.status !== 'locked' && (
            <button
              onClick={() => onEnter(joinId)}
              className="text-[10px] px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/70 transition">
              {room.status === 'live' ? 'Enter →' : room.status === 'scheduled' ? 'Join →' : 'Reserve'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const FILTERS: { id: RoomStatus | 'all'; label: string; emoji: string }[] = [
  { id: 'all',       label: 'All',       emoji: '🏫' },
  { id: 'live',      label: 'Live',      emoji: '🔴' },
  { id: 'scheduled', label: 'Scheduled', emoji: '📅' },
  { id: 'empty',     label: 'Available', emoji: '✅' },
  { id: 'locked',    label: 'Locked',    emoji: '🔒' },
]

const PAGE_SIZE = 42

export function ClassroomsPage({ onEnterClassroom }: { onEnterClassroom: (id: number) => void }) {
  const [rooms, setRooms] = useState<ClassroomRoom[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [newRoom, setNewRoom] = useState({ courseId: 0, roomId: 0, label: '', status: 'scheduled' as RoomStatus })
  const [showNewCourse, setShowNewCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: '', level: '', room: '', startTime: '08:00', endTime: '09:30',
    termLabel: 'Term 1', termStartDate: new Date().toISOString().split('T')[0],
    teachingWeekdays: [0, 1, 2, 3, 4] as number[], teacherId: 0,
  })
  const [teachersList, setTeachersList] = useState<{ id: number; name: string }[]>([])

  const loadTeachers = useCallback(async () => {
    try {
      const r = await apiGet<{ teachers: { id: number; name: string }[] }>('/classroom-assessment/teachers')
      setTeachersList(r.teachers)
    } catch { /* ignore */ }
  }, [])

  const loadRooms = useCallback(async () => {
    try {
      const r = await apiGet<{ classrooms: ClassroomRoom[] }>('/classrooms')
      setRooms(r.classrooms)
    } catch { /* ignore — keep empty */ }
    setLoading(false)
  }, [])

  const loadCourses = useCallback(async () => {
    try {
      const r = await apiGet<{ courses: Course[] }>('/courses')
      setCourses(r.courses)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadRooms(); loadCourses(); loadTeachers() }, [loadRooms, loadCourses, loadTeachers])

  const filtered = useMemo(() => {
    return rooms.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (r.courseName || '').toLowerCase().includes(q) ||
               (r.teacherName || '').toLowerCase().includes(q) ||
               String(r.roomId || r.id).includes(q)
      }
      return true
    })
  }, [rooms, statusFilter, search])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const counts = useMemo(() => ({
    live: rooms.filter(r => r.status === 'live').length,
    scheduled: rooms.filter(r => r.status === 'scheduled').length,
    empty: rooms.filter(r => r.status === 'empty').length,
    locked: rooms.filter(r => r.status === 'locked').length,
  }), [rooms])

  const createRoom = async () => {
    if (!newRoom.courseId) { toast.error('Select a course or create one'); return }
    try {
      await apiPost('/classrooms', {
        courseId: newRoom.courseId,
        roomId: newRoom.roomId || undefined,
        label: newRoom.label || undefined,
        status: newRoom.status,
      })
      toast.success('Classroom created')
      setShowCreate(false)
      setNewRoom({ courseId: 0, roomId: 0, label: '', status: 'scheduled' })
      await loadRooms()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create classroom')
    }
  }

  const createCourseInline = async () => {
    if (!newCourse.name.trim()) { toast.error('Course name is required'); return }
    try {
      const r = await apiPost<{ course: Course }>('/courses', {
        teacherId: newCourse.teacherId || undefined,
        name: newCourse.name.trim(),
        level: newCourse.level || undefined,
        termLabel: newCourse.termLabel,
        termStartDate: newCourse.termStartDate,
        teachingWeekdays: newCourse.teachingWeekdays,
        room: newCourse.room || undefined,
        startTime: newCourse.startTime || undefined,
        endTime: newCourse.endTime || undefined,
      })
      toast.success('Course created')
      // Auto-select the new course
      setNewRoom({ ...newRoom, courseId: r.course.id, label: newCourse.name, roomId: newRoom.roomId })
      setShowNewCourse(false)
      setNewCourse({ name: '', level: '', room: '', startTime: '08:00', endTime: '09:30', termLabel: 'Term 1', termStartDate: new Date().toISOString().split('T')[0], teachingWeekdays: [0,1,2,3,4], teacherId: 0 })
      await loadCourses()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create course')
    }
  }

  const toggleWeekday = (n: number) => {
    setNewCourse(p => ({ ...p, teachingWeekdays: p.teachingWeekdays.includes(n) ? p.teachingWeekdays.filter(x => x !== n) : [...p.teachingWeekdays, n].sort() }))
  }

  const deleteRoom = async (id: number) => {
    if (!confirm('Delete this classroom?')) return
    try {
      await apiDelete(`/classrooms/${id}`)
      await loadRooms()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Classrooms</h2>
          <p className="text-white/50 text-sm">{rooms.length} rooms · {counts.live} live · {counts.scheduled} scheduled</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#3FBAEB,#2563eb)', boxShadow: '0 4px 16px rgba(63,186,235,0.3)' }}>
          + Assign Room
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => { setStatusFilter(f.id); setPage(0) }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              background: statusFilter === f.id ? 'rgba(63,186,235,0.2)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === f.id ? '#3FBAEB' : 'rgba(255,255,255,0.5)',
              border: statusFilter === f.id ? '1px solid rgba(63,186,235,0.3)' : '1px solid transparent',
            }}>
            {f.emoji} {f.label} {f.id !== 'all' ? `(${counts[f.id] || 0})` : ''}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search teacher, course, room…"
          className="ml-auto px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-blue-400/40"
          style={{ width: 220 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-white/40">Loading classrooms…</div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg mb-2">No classrooms yet</p>
          <p className="text-sm">Click "Assign Room" to create a classroom from a course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {paginated.map(room => (
            <div key={room.id} className="relative group">
              <ClassroomCard room={room} onEnter={onEnterClassroom} />
              <button
                onClick={() => deleteRoom(room.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-red-400 text-xs px-1.5 py-0.5 rounded bg-black/30 z-10">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg text-xs text-white/60 bg-white/5 disabled:opacity-30">← Prev</button>
          <span className="text-white/40 text-xs">Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded-lg text-xs text-white/60 bg-white/5 disabled:opacity-30">Next →</button>
        </div>
      )}

      {/* Create classroom modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => { setShowCreate(false); setShowNewCourse(false) }}>
          <div className="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#0b1640', border: '1px solid rgba(63,186,235,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-1">Assign Classroom</h3>
            <p className="text-white/40 text-xs mb-4">Create a classroom from an existing course, or add a new course manually.</p>

            {!showNewCourse ? (
              <>
                {/* Pick existing course */}
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Course</label>
                    {courses.length === 0 ? (
                      <div className="px-3 py-4 rounded-lg text-sm text-white/50 bg-white/5 border border-white/10 text-center">
                        No courses yet. <button onClick={() => setShowNewCourse(true)} className="text-sky-400 underline font-semibold">Add a course manually →</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select value={newRoom.courseId} onChange={(e) => setNewRoom({ ...newRoom, courseId: Number(e.target.value) })}
                          className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none">
                          <option value={0} className="bg-slate-800">— Select a course —</option>
                          {courses.map(c => <option key={c.id} value={c.id} className="bg-slate-800">{c.name} {c.level ? `(${c.level})` : ''}{c.room ? ` · ${c.room}` : ''}</option>)}
                        </select>
                        <button onClick={() => setShowNewCourse(true)} className="px-3 py-2 rounded-lg text-xs font-bold text-white whitespace-nowrap" style={{ background: 'rgba(63,186,235,0.2)', border: '1px solid rgba(63,186,235,0.3)' }}>+ New</button>
                      </div>
                    )}
                  </div>
                  {newRoom.courseId > 0 && (
                    <>
                      <div>
                        <label className="text-white/60 text-xs block mb-1">Room Number (for join link)</label>
                        <input type="number" value={newRoom.roomId || ''} onChange={(e) => setNewRoom({ ...newRoom, roomId: Number(e.target.value) })}
                          placeholder="e.g. 101" className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs block mb-1">Label (optional)</label>
                        <input value={newRoom.label} onChange={(e) => setNewRoom({ ...newRoom, label: e.target.value })}
                          placeholder="e.g. G1 · English" className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs block mb-1">Status</label>
                        <select value={newRoom.status} onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value as RoomStatus })}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none">
                          <option value="scheduled" className="bg-slate-800">Scheduled</option>
                          <option value="live" className="bg-slate-800">Live</option>
                          <option value="empty" className="bg-slate-800">Empty</option>
                          <option value="locked" className="bg-slate-800">Locked</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-3 mt-5 justify-end">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-white/60 bg-white/5">Cancel</button>
                  <button onClick={createRoom} disabled={newRoom.courseId === 0} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#3FBAEB,#2563eb)' }}>Create Classroom</button>
                </div>
              </>
            ) : (
              <>
                {/* Inline new course form */}
                <h4 className="text-sm font-bold text-sky-400 mb-3">+ Add New Course (manually)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Course Name *</label>
                    <input value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      placeholder="e.g. English B1, IELTS Prep, Math G5" className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Level</label>
                      <input value={newCourse.level} onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                        placeholder="B1, A2, G5" className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Room</label>
                      <input value={newCourse.room} onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                        placeholder="LAB 3, Room A" className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">Start Time</label>
                      <input type="time" value={newCourse.startTime} onChange={(e) => setNewCourse({ ...newCourse, startTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs block mb-1">End Time</label>
                      <input type="time" value={newCourse.endTime} onChange={(e) => setNewCourse({ ...newCourse, endTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Teacher</label>
                    <select value={newCourse.teacherId} onChange={(e) => setNewCourse({ ...newCourse, teacherId: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white outline-none">
                      <option value={0} className="bg-slate-800">— No teacher —</option>
                      {teachersList.map(t => <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Teaching Days</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[{n:0,l:'Sun'},{n:1,l:'Mon'},{n:2,l:'Tue'},{n:3,l:'Wed'},{n:4,l:'Thu'},{n:5,l:'Fri'},{n:6,l:'Sat'}].map(d => (
                        <button key={d.n} onClick={() => toggleWeekday(d.n)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold transition"
                          style={{ background: newCourse.teachingWeekdays.includes(d.n) ? '#3FBAEB' : 'rgba(255,255,255,0.08)', color: newCourse.teachingWeekdays.includes(d.n) ? '#fff' : 'rgba(255,255,255,0.5)' }}>{d.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5 justify-end">
                  <button onClick={() => setShowNewCourse(false)} className="px-4 py-2 rounded-lg text-sm text-white/60 bg-white/5">← Back</button>
                  <button onClick={createCourseInline} disabled={!newCourse.name.trim()} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#3FBAEB,#2563eb)' }}>Create Course & Select</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
