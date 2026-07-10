import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiGet, ApiError, type ClassroomRoom } from '@/lib/api'

type RoomStatus = 'live' | 'scheduled' | 'empty' | 'locked'

interface RoomCard extends ClassroomRoom {
  computedGrade: string
  subjectLine: string
  teacherDisplay: string
  studentDisplay: number
  joinCode: number
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; glow: string; bg: string; dot: string }> = {
  live:      { label: 'LIVE',      color: '#34d399', glow: '0 0 14px rgba(52,211,153,0.55)', bg: 'rgba(16,185,129,0.09)', dot: 'bg-emerald-400 animate-pulse' },
  scheduled: { label: 'Scheduled', color: '#3b82f6', glow: '0 0 10px rgba(59,130,246,0.40)', bg: 'rgba(37,99,235,0.08)',  dot: 'bg-blue-500' },
  empty:     { label: 'Empty',     color: '#4b5563', glow: 'none',                             bg: 'transparent',           dot: 'bg-gray-600' },
  locked:    { label: 'Locked',    color: '#f87171', glow: '0 0 8px rgba(248,113,113,0.3)',   bg: 'rgba(239,68,68,0.05)',  dot: 'bg-red-400' },
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
  }
})

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

function ClassroomCard({ room, onEnter }: { room: RoomCard; onEnter: (id: number) => void }) {
  const s = STATUS_CONFIG[room.status]
  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => room.status !== 'locked' && onEnter(room.joinCode)}
      className="relative rounded-xl overflow-hidden cursor-pointer select-none flex flex-col"
      style={{
        minHeight: '172px',
        background: `linear-gradient(145deg, #2a2196 0%, #122055 100%)`,
        border: `1px solid ${room.status === 'live' ? 'rgba(52,211,153,0.28)' : room.status === 'locked' ? 'rgba(248,113,113,0.22)' : 'rgba(37,99,235,0.18)'}`,
        boxShadow: room.status === 'live' ? s.glow : room.status === 'scheduled' ? s.glow : undefined,
      }}>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: room.status === 'live'
          ? 'linear-gradient(90deg,transparent,#34d399,transparent)'
          : room.status === 'locked'
            ? 'linear-gradient(90deg,transparent,#f87171,transparent)'
            : room.status === 'scheduled'
              ? 'linear-gradient(90deg,transparent,#3b82f6,transparent)'
              : 'linear-gradient(90deg,transparent,rgba(37,99,235,0.25),transparent)' }} />

      <div className="p-4 flex flex-col flex-1">
        {/* Header: room ID + status */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{
              background: room.status === 'live'
                ? 'linear-gradient(135deg,#064e3b,#00684a)'
                : room.status === 'locked'
                  ? 'linear-gradient(135deg,#450a0a,#7f1d1d)'
                  : 'linear-gradient(135deg,#241c80,#2620a8)',
              color: s.color,
              boxShadow: s.glow !== 'none' ? s.glow : undefined,
              fontSize: room.status === 'locked' ? '16px' : '11px',
            }}>
            {room.status === 'locked' ? '🔒' : room.joinCode}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: s.color }}>
                {s.label}
              </span>
            </div>
            {room.status === 'live' && (
              <span className="text-[8px] text-emerald-400/70 flex items-center gap-0.5">
                👥 {room.studentDisplay}
              </span>
            )}
            {room.status === 'scheduled' && room.startTime && (
              <span className="text-[8px]" style={{ color: 'rgba(59,130,246,0.7)' }}>⏰ {room.startTime}</span>
            )}
          </div>
        </div>

        {/* Subject + grade */}
        <p className="text-[11px] font-bold text-white leading-snug">{room.subjectLine}</p>
        <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'rgba(147,197,253,0.65)' }}>
          {room.teacherDisplay} · {room.computedGrade}
        </p>

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-1">
          {room.status === 'empty' && (
            <span className="text-[8px]" style={{ color: 'rgba(107,114,128,0.7)' }}>Available</span>
          )}
          {room.status === 'locked' && (
            <span className="text-[8px]" style={{ color: 'rgba(248,113,113,0.6)' }}>Restricted</span>
          )}

          {/* Copy join link — always visible so teachers can share it */}
          <button
            onClick={e => { e.stopPropagation(); copyJoinLink(room.joinCode) }}
            title="Copy student join link"
            className="flex items-center gap-0.5 text-[8px] px-2 py-1 rounded-full font-semibold transition-all hover:opacity-100 opacity-60"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(147,197,253,0.9)',
              border: '1px solid rgba(147,197,253,0.18)',
            }}>
            🔗 Link
          </button>

          {(room.status === 'live' || room.status === 'scheduled' || room.status === 'empty') && (
            <button onClick={e => { e.stopPropagation(); onEnter(room.joinCode) }}
              className="text-[9px] px-2.5 py-1 rounded-full font-bold transition-all ml-auto"
              style={{
                background: room.status === 'live' ? 'rgba(52,211,153,0.18)' : 'rgba(37,99,235,0.18)',
                color: s.color,
                border: `1px solid ${s.color}30`,
              }}>
              {room.status === 'live' ? 'Join →' : room.status === 'scheduled' ? 'Reserve' : 'Enter →'}
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
  return classrooms.map((room) => {
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

  const cardBg = 'rgba(11,22,62,0.85)'
  const cardBorder = 'rgba(37,99,235,0.18)'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">🏫 Virtual Classrooms</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.55)' }}>
            {rooms.length} classrooms — live WebRTC rooms synced from the academic schedule
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span style={{ color: 'rgba(52,211,153,0.85)' }}>{counts.live} Live</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span style={{ color: 'rgba(59,130,246,0.85)' }}>{counts.scheduled} Scheduled</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" /><span className="text-gray-500">{counts.empty} Open</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-gray-500">{counts.locked} Locked</span></span>
          <button onClick={loadRooms}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-sky-300 border border-sky-500/30 hover:border-sky-200 hover:text-white transition"
            style={{ background: 'rgba(14,165,233,0.08)' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-200 bg-amber-500/20 border border-amber-400/40">
          ⚠ {error}. Showing last known layout.
        </div>
      )}

      {/* Search + grade filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="🔍 Search by subject, teacher or room number…"
          className="flex-1 min-w-48 px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }} />
        <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(0) }}
          className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap items-center">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => { setStatusFilter(f.id); setPage(0) }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={statusFilter === f.id ? {
              background: 'linear-gradient(135deg,#2620a8,#2563eb)',
              color: '#fff', boxShadow: '0 2px 12px rgba(37,99,235,0.35)',
            } : {
              background: cardBg, color: 'rgba(147,197,253,0.6)',
              border: `1px solid ${cardBorder}`,
            }}>
            <span>{f.emoji}</span>{f.label}
            {f.id !== 'all' && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: 'rgba(255,255,255,0.10)' }}>
                {f.id === 'live' ? counts.live : f.id === 'scheduled' ? counts.scheduled : f.id === 'empty' ? counts.empty : counts.locked}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-600 self-center">{filtered.length} rooms</span>
      </div>

      {/* Grid — 6 columns max for taller, more readable cards */}
      {loading ? (
        <div className="py-20 text-center text-sm text-sky-200">Syncing live classrooms…</div>
      ) : paginated.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {paginated.map(r => (
            <ClassroomCard key={`${r.id}-${r.joinCode}`} room={r} onEnter={onEnterClassroom} />
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
            className="px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-30"
            style={{ background: cardBg, color: 'rgba(147,197,253,0.7)', border: `1px solid ${cardBorder}` }}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(totalPages - 7, page - 3)) + i
            return (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                className="w-8 h-8 rounded-xl text-xs font-medium transition"
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
            className="px-3 py-1.5 rounded-xl text-xs transition disabled:opacity-30"
            style={{ background: cardBg, color: 'rgba(147,197,253,0.7)', border: `1px solid ${cardBorder}` }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
