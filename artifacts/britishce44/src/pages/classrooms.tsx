import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, RefreshCw, Settings, Pencil, Check } from 'lucide-react'
import { apiGet, ApiError, type ClassroomRoom } from '@/lib/api'
import { SettingsSidebar } from '@/components/settings/settings-sidebar'

type RoomStatus = 'live' | 'scheduled' | 'empty' | 'locked'

interface RoomCard extends ClassroomRoom {
  computedGrade: string
  subjectLine: string
  teacherDisplay: string
  studentDisplay: number
  joinCode: number
  num: number
}

const STATUS_SEQUENCE: RoomStatus[] = ['live', 'scheduled', 'empty', 'empty', 'locked', 'live', 'scheduled', 'empty']

const FALLBACK_ROOMS: RoomCard[] = Array.from({ length: 60 }, (_, i) => {
  const id = i + 1
  const status = STATUS_SEQUENCE[i % STATUS_SEQUENCE.length]
  const grade = `Grade ${Math.ceil(id / 12)}`
  return {
    id,
    courseId: id,
    roomId: 100 + id,
    label: `${grade} · Virtual Room ${id}`,
    status,
    active: true,
    createdAt: new Date().toISOString(),
    courseName: `${grade} Cohort`,
    teacherName: 'Teacher',
    level: grade,
    studentCount: status === 'live' ? 10 + (id % 10) : 0,
    startTime: status === 'scheduled' ? '09:00' : null,
    endTime: status === 'scheduled' ? '10:00' : null,
    computedGrade: grade,
    subjectLine: `${grade} · Virtual Room ${id}`,
    teacherDisplay: 'Teacher',
    studentDisplay: status === 'live' ? 10 + (id % 10) : 0,
    joinCode: 100 + id,
    num: i + 1,
  }
})

const TEACHER_STORAGE_KEY = 'b44_classroom_teachers'

function getJoinLink(roomId: number): string {
  return `${window.location.origin}${window.location.pathname}?room=${roomId}`
}

function copyJoinLink(roomId: number) {
  const link = getJoinLink(roomId)
  navigator.clipboard.writeText(link).then(() => {
    toast.success(`Link for room ${roomId} copied`, { duration: 2000 })
  }).catch(() => {
    toast.error('Could not copy link')
  })
}

/* ── Inline card icons (match the reference design exactly) ── */

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 35, height: 35, fill: '#ffffff' }}>
      <path d="M3 3h8v8H3V3m10 0h8v8h-8V3M3 13h8v8H3v-8m10 0h8v8h-8v-8z" />
    </svg>
  )
}

function DeskIllustration() {
  return (
    <svg viewBox="0 0 200 160" style={{ width: '100%', maxWidth: 160, height: 'auto' }}>
      <rect x="20" y="40" width="140" height="90" rx="4" fill="#062263" stroke="#1d4db8" strokeWidth="2" />
      <rect x="30" y="50" width="120" height="70" fill="#0b328a" />
      <rect x="10" y="110" width="160" height="8" rx="2" fill="#1442b5" />
      <rect x="25" y="118" width="8" height="30" fill="#1442b5" />
      <rect x="145" y="118" width="8" height="30" fill="#1442b5" />
      <rect x="55" y="100" width="25" height="30" rx="3" fill="#1442b5" />
      <path d="M50 135 L85 135" stroke="#1442b5" strokeWidth="4" />
      <path d="M165 118 C165 95 180 95 180 118 Z" fill="#1442b5" />
      <rect x="160" y="118" width="20" height="20" rx="2" fill="#0e348f" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: '#d4af37', flexShrink: 0 }}>
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 10.63 21 8.55 21 6V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: '#d4af37', background: '#fff', padding: '0 8px', position: 'relative', zIndex: 1 }}>
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#b58d3d' }}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#1952d4' }}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: '#b58d3d' }}>
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: '#ffffff' }}>
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
      <path d="M5 13h11.86l-5.6 5.6 1.42 1.42L21.42 12l-7.74-8-1.42 1.42 5.6 5.6H5z" fill="#fff" />
    </svg>
  )
}

/* ── Status badge ── */

const BADGE: Record<RoomStatus, { label: string; color: string; dot: string }> = {
  live:      { label: 'LIVE',      color: '#1b8a3e', dot: '#2ecc71' },
  scheduled: { label: 'SCHEDULED', color: '#1d4ed8', dot: '#60a5fa' },
  empty:     { label: 'AVAILABLE', color: '#6b7280', dot: '#94a3b8' },
  locked:    { label: 'LOCKED',    color: '#dc2626', dot: '#f87171' },
}

/* ── Manually-edited teacher name field ── */

function TeacherField({ value, onSave }: { value: string; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    const v = draft.trim()
    onSave(v)
    setEditing(false)
  }

  if (editing) {
    return (
      <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(value); setEditing(false) }
          }}
          placeholder="Add teacher name…"
          style={{ border: '1px solid #d4af37', background: '#fdfaf3', color: '#222', fontWeight: 600, fontSize: 15, padding: '6px 12px', borderRadius: 12, width: '100%', maxWidth: 280, outline: 'none' }}
        />
        <button onClick={commit} className="flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#104fe6 0%,#072d8a 100%)', border: '1px solid #d4af37', cursor: 'pointer' }}>
          <Check className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setDraft(value); setEditing(true) }}
      title="Click to edit teacher name"
      className="flex items-center gap-2 rounded-lg px-1.5 py-0.5 transition group"
      style={{ cursor: 'pointer', background: 'transparent' }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{value || '—'}</span>
      <Pencil className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" style={{ color: '#b58d3d' }} />
    </button>
  )
}

/* ── Classroom card ── */

function ClassroomCard({ room, teacherName, onTeacherChange, onEnter }: {
  room: RoomCard
  teacherName: string
  onTeacherChange: (name: string) => void
  onEnter: (id: number) => void
}) {
  const locked = room.status === 'locked'
  const badge = BADGE[room.status]
  const handleEnter = () => !locked && onEnter(room.joinCode)

  return (
    <motion.div
      whileHover={locked ? undefined : { y: -4 }}
      whileTap={locked ? undefined : { scale: 0.985 }}
      onClick={handleEnter}
      className="relative flex overflow-hidden cursor-pointer select-none"
      style={{
        background: '#ffffff',
        borderRadius: 30,
        boxShadow: '0 15px 35px rgba(0,0,0,0.10)',
        border: '1px solid #f0e6d2',
        minHeight: 300,
      }}>

      {/* Left banner */}
      <div className="relative flex flex-col items-center justify-between flex-shrink-0"
        style={{ width: '35%', background: 'linear-gradient(135deg,#0b3bb1 0%,#041c5c 100%)', padding: '28px 18px', borderTopLeftRadius: 30, borderBottomLeftRadius: 30 }}>
        {/* Wavy divider curve */}
        <div style={{ position: 'absolute', top: 0, right: -30, width: 60, height: '100%', background: 'radial-gradient(circle at left, transparent 65%, #0b3bb1 66%)', borderRadius: '50%', zIndex: 2 }} />
        <div className="flex items-center justify-center"
          style={{ width: 75, height: 75, background: 'linear-gradient(135deg,#104fe6 0%,#072d8a 100%)', border: '3px solid #d4af37', borderRadius: '50%', boxShadow: '0 6px 15px rgba(0,0,0,0.3)', zIndex: 3 }}>
          <GridIcon />
        </div>
        <div style={{ opacity: 0.85, zIndex: 3, textAlign: 'center' }}>
          <DeskIllustration />
        </div>
        <div />
      </div>

      {/* Right content */}
      <div className="flex flex-col flex-1" style={{ padding: '30px 28px 22px 44px', zIndex: 1, minWidth: 0 }}>
        <div className="flex items-start justify-between gap-3">
          <h1 style={{ fontSize: 'clamp(22px, 3.2vw, 32px)', color: '#0b2265', fontWeight: 800, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            Room {room.num}
          </h1>
          <div className="flex items-center" style={{ background: '#ffffff', border: '1px solid #e0e0e0', padding: '6px 14px', borderRadius: 20, gap: 6, fontWeight: 700, fontSize: 14, color: badge.color, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, background: badge.dot, borderRadius: '50%', boxShadow: room.status === 'live' ? '0 0 6px #2ecc71' : 'none' }} />
            {badge.label}
          </div>
        </div>

        <div className="flex items-center" style={{ background: '#fdfaf3', border: '1px solid #f4e8d0', padding: '10px 18px', borderRadius: 25, gap: 12, marginTop: 14, width: 'fit-content', maxWidth: '100%' }}>
          <TrophyIcon />
          <span style={{ color: '#a67c1e', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>Together we build your success</span>
        </div>

        <div className="flex items-center justify-center" style={{ margin: '16px 0', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '100%', height: 1, background: '#eee' }} />
          <StarIcon />
        </div>

        <div style={{ fontSize: 18, color: '#0c1838', fontWeight: 700, marginBottom: 18 }}>Britishce44-Online Virtual Room {room.num}</div>

        <div className="flex items-center" style={{ gap: 12, marginBottom: 12 }}>
          <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: '#f2e9dc', borderRadius: '50%', flexShrink: 0 }}>
            <PersonIcon />
          </div>
          <TeacherField value={teacherName} onSave={onTeacherChange} />
        </div>

        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex items-center justify-center" style={{ width: 32, height: 32, background: '#e3ecfc', borderRadius: '50%', flexShrink: 0 }}>
            <UsersIcon />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1952d4' }}>{room.studentDisplay} present</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-between gap-3" style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f4f4f4' }}>
          <button
            onClick={e => { e.stopPropagation(); copyJoinLink(room.joinCode) }}
            className="flex items-center"
            style={{ background: '#fff8f0', border: '1px solid #f5ebd9', padding: '10px 18px', borderRadius: 25, gap: 10, cursor: 'pointer' }}>
            <LinkIcon />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#b58d3d', whiteSpace: 'nowrap' }}>Copy link</span>
          </button>

          <button
            onClick={e => { e.stopPropagation(); handleEnter() }}
            className="flex items-center"
            style={{
              background: locked ? 'linear-gradient(135deg,#9ca3af,#6b7280)' : 'linear-gradient(135deg,#104fe6 0%,#072d8a 100%)',
              border: '1px solid #d4af37',
              padding: '12px 22px',
              borderRadius: 30,
              gap: 10,
              cursor: locked ? 'not-allowed' : 'pointer',
              boxShadow: locked ? 'none' : '0 4px 15px rgba(11,59,177,0.3)',
              opacity: locked ? 0.6 : 1,
            }}>
            <PlayIcon />
            <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>{locked ? 'Locked' : 'Join Room'}</span>
            {!locked && <ArrowIcon />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const FILTERS: { id: RoomStatus | 'all'; label: string }[] = [
  { id: 'all',       label: 'All rooms' },
  { id: 'live',      label: 'Live' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'empty',     label: 'Available' },
  { id: 'locked',    label: 'Locked' },
]

const PAGE_SIZE = 12

function deriveGradeLabel(room: ClassroomRoom): string {
  const label = room.label || room.courseName || room.level || ''
  const match = label.match(/G(\d+)/i)
  if (match?.[1]) return `Grade ${match[1]}`
  const gradeWord = (label.match(/Grade\s*(\d+)/i)?.[1])
  if (gradeWord) return `Grade ${gradeWord}`
  if (room.level && /\d/.test(room.level)) return room.level
  return 'General'
}

function buildRoomCards(classrooms: ClassroomRoom[]): RoomCard[] {
  if (!classrooms.length) return FALLBACK_ROOMS
  return classrooms.map((room, idx) => {
    const grade = deriveGradeLabel(room)
    const subjectLine = room.courseName || room.label || `Classroom ${room.id}`
    const teacher = room.teacherName || '—'
    const status = (room.status ?? 'empty') as RoomStatus
    return {
      ...room,
      status,
      computedGrade: grade,
      subjectLine,
      teacherDisplay: teacher,
      studentDisplay: room.studentCount ?? 0,
      joinCode: room.roomId ?? room.id,
      num: idx + 1,
    }
  })
}

export function ClassroomsPage({ onEnterClassroom }: { onEnterClassroom: (id: number) => void }) {
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rooms, setRooms] = useState<RoomCard[]>(FALLBACK_ROOMS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [teacherMap, setTeacherMap] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(TEACHER_STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  })

  const saveTeacher = useCallback((num: number, name: string) => {
    setTeacherMap(prev => {
      const next = { ...prev, [String(num)]: name }
      try {
        localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  const loadRooms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ classrooms: ClassroomRoom[] }>('/classrooms')
      setRooms(buildRoomCards(res.classrooms))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load classrooms'
      setError(message)
      setRooms(buildRoomCards([]))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

  const gradeOptions = useMemo(() => {
    const set = new Set<string>()
    rooms.forEach(room => set.add(room.computedGrade))
    return ['All Grades', ...Array.from(set.values()).sort()]
  }, [rooms])

  const filtered = useMemo(() => rooms.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (gradeFilter !== 'All Grades' && r.computedGrade !== gradeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.subjectLine.toLowerCase().includes(q) || r.teacherDisplay.toLowerCase().includes(q) || String(r.joinCode).includes(q)
    }
    return true
  }), [rooms, statusFilter, gradeFilter, search])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const counts = useMemo(() => rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1
    return acc
  }, { live: 0, scheduled: 0, empty: 0, locked: 0 } as Record<RoomStatus, number>), [rooms])

  const cardBg = 'rgba(19,24,66,0.92)'
  const cardBorder = 'rgba(37,99,235,0.22)'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora flex items-center gap-2">
            Virtual Classrooms
            <span className="text-[11px] font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
              {counts.live} live now
            </span>
          </h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(147,197,253,0.5)' }}>
            {rooms.length} WebRTC rooms synced from the academic schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadRooms}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition hover:bg-white/5"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: 'rgba(147,197,253,0.8)' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition"
            style={{ background: 'linear-gradient(135deg,#2620a8,#2563eb)', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}>
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-200 bg-amber-500/15 border border-amber-400/30">
          ⚠ {error}. Showing last known layout.
        </div>
      )}

      {/* Toolbar: search + grade + status */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search subject, teacher or room number…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }} />
        </div>
        <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(0) }}
          className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-500">{filtered.length} rooms</span>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap items-center">
        {FILTERS.map(f => {
          const active = statusFilter === f.id
          const count = f.id === 'all' ? rooms.length : counts[f.id as RoomStatus]
          return (
            <button key={f.id} onClick={() => { setStatusFilter(f.id); setPage(0) }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={active ? {
                background: 'linear-gradient(135deg,#2620a8,#2563eb)',
                color: '#fff', boxShadow: '0 2px 12px rgba(37,99,235,0.35)',
              } : {
                background: cardBg, color: 'rgba(147,197,253,0.6)',
                border: `1px solid ${cardBorder}`,
              }}>
              {f.label}
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid — big reference-designed cards */}
      {loading ? (
        <div className="py-20 text-center text-sm text-sky-200">Syncing live classrooms…</div>
      ) : paginated.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {paginated.map(r => (
            <ClassroomCard
              key={`${r.id}-${r.joinCode}`}
              room={r}
              teacherName={teacherMap[String(r.num)] || r.teacherDisplay}
              onTeacherChange={name => saveTeacher(r.num, name)}
              onEnter={onEnterClassroom}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20" style={{ color: 'rgba(107,114,128,0.7)' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">No classrooms match your filters</p>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setGradeFilter('All Grades') }}
            className="mt-3 text-xs transition" style={{ color: '#2563eb' }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-2 rounded-xl text-xs transition disabled:opacity-30"
            style={{ background: cardBg, color: 'rgba(147,197,253,0.7)', border: `1px solid ${cardBorder}` }}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i
            return (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                className="w-9 h-9 rounded-xl text-xs font-medium transition"
                style={page === pageNum ? {
                  background: 'linear-gradient(135deg,#2620a8,#2563eb)', color: '#fff',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                } : {
                  background: cardBg, color: 'rgba(147,197,253,0.6)',
                  border: `1px solid ${cardBorder}`,
                }}>
                {pageNum + 1}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-3 py-2 rounded-xl text-xs transition disabled:opacity-30"
            style={{ background: cardBg, color: 'rgba(147,197,253,0.7)', border: `1px solid ${cardBorder}` }}>
            Next →
          </button>
        </div>
      )}

      {/* Settings sidebar */}
      <SettingsSidebar open={settingsOpen} onClose={() => setSettingsOpen(false)} defaultTab="classroom" />
    </div>
  )
}
