import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

type RoomStatus = 'live' | 'scheduled' | 'empty' | 'locked'

interface Room {
  id: number; grade: string; subject: string; teacher: string
  students: number; status: RoomStatus; startTime?: string
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; glow: string; bg: string; dot: string }> = {
  live:      { label: 'LIVE',      color: '#34d399', glow: '0 0 14px rgba(52,211,153,0.55)', bg: 'rgba(16,185,129,0.09)', dot: 'bg-emerald-400 animate-pulse' },
  scheduled: { label: 'Scheduled', color: '#3b82f6', glow: '0 0 10px rgba(59,130,246,0.40)', bg: 'rgba(37,99,235,0.08)',  dot: 'bg-blue-500' },
  empty:     { label: 'Empty',     color: '#4b5563', glow: 'none',                             bg: 'transparent',           dot: 'bg-gray-600' },
  locked:    { label: 'Locked',    color: '#f87171', glow: '0 0 8px rgba(248,113,113,0.3)',   bg: 'rgba(239,68,68,0.05)',  dot: 'bg-red-400' },
}

const TEACHERS = [
  'Suhair Almojahid', "Wa'ad Alhammadi", 'Jamal Alshameeri',
  'Amani Alsharabi', 'Khadeejah Alghaily', 'Shihab Alomary',
  'Nadia Alqaiti', 'Hassan Almakhlafi', 'Rania Althawr',
]
const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Arabic', 'ICT', 'Physics', 'Chemistry', 'Biology', 'Geography']
const START_TIMES = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00']
const STATUSES: RoomStatus[] = ['live', 'scheduled', 'empty', 'empty', 'locked', 'live', 'scheduled', 'empty']

function buildRooms(): Room[] {
  return Array.from({ length: 240 }, (_, i) => {
    const id = i + 1
    const status = STATUSES[i % STATUSES.length]
    return {
      id, grade: `G${Math.ceil(id / 24)} · ${SUBJECTS[i % SUBJECTS.length]}`,
      subject: SUBJECTS[i % SUBJECTS.length], teacher: TEACHERS[i % TEACHERS.length],
      students: status === 'live' ? 12 + (i % 18) : 0, status,
      startTime: status === 'scheduled' ? START_TIMES[i % START_TIMES.length] : undefined,
    }
  })
}

function ClassroomCard({ room, onEnter }: { room: Room; onEnter: (id: number) => void }) {
  const s = STATUS_CONFIG[room.status]
  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => room.status !== 'locked' && onEnter(room.id)}
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
            {room.status === 'locked' ? '🔒' : room.id}
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
                👥 {room.students}
              </span>
            )}
            {room.status === 'scheduled' && room.startTime && (
              <span className="text-[8px]" style={{ color: 'rgba(59,130,246,0.7)' }}>⏰ {room.startTime}</span>
            )}
          </div>
        </div>

        {/* Subject + grade */}
        <p className="text-[11px] font-bold text-white leading-snug">{room.grade}</p>
        <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'rgba(147,197,253,0.65)' }}>
          {room.teacher}
        </p>

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          {room.status === 'empty' && (
            <span className="text-[8px]" style={{ color: 'rgba(107,114,128,0.7)' }}>Available</span>
          )}
          {room.status === 'locked' && (
            <span className="text-[8px]" style={{ color: 'rgba(248,113,113,0.6)' }}>Restricted</span>
          )}
          {(room.status === 'live' || room.status === 'scheduled' || room.status === 'empty') && (
            <button onClick={e => { e.stopPropagation(); onEnter(room.id) }}
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

const GRADES = ['All Grades', ...Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`)]
const FILTERS: { id: RoomStatus | 'all'; label: string; emoji: string }[] = [
  { id: 'all',       label: 'All',       emoji: '🏫' },
  { id: 'live',      label: 'Live',      emoji: '🔴' },
  { id: 'scheduled', label: 'Scheduled', emoji: '📅' },
  { id: 'empty',     label: 'Available', emoji: '✅' },
  { id: 'locked',    label: 'Locked',    emoji: '🔒' },
]

const ALL_ROOMS = buildRooms()
const PAGE_SIZE = 42

export function ClassroomsPage({ onEnterClassroom }: { onEnterClassroom: (id: number) => void }) {
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    return ALL_ROOMS.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (gradeFilter !== 'All Grades') {
        const gNum = gradeFilter.replace('Grade ', '')
        if (!r.grade.startsWith(`G${gNum} ·`)) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return r.subject.toLowerCase().includes(q) || r.teacher.toLowerCase().includes(q) || String(r.id).includes(q)
      }
      return true
    })
  }, [statusFilter, gradeFilter, search])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const counts = useMemo(() => ({
    live: ALL_ROOMS.filter(r => r.status === 'live').length,
    scheduled: ALL_ROOMS.filter(r => r.status === 'scheduled').length,
    empty: ALL_ROOMS.filter(r => r.status === 'empty').length,
    locked: ALL_ROOMS.filter(r => r.status === 'locked').length,
  }), [])

  const cardBg = 'rgba(11,22,62,0.85)'
  const cardBorder = 'rgba(37,99,235,0.18)'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">🏫 Virtual Classrooms</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.55)' }}>
            240 classrooms across 10 grades — click any room to enter live
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span style={{ color: 'rgba(52,211,153,0.85)' }}>{counts.live} Live</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span style={{ color: 'rgba(59,130,246,0.85)' }}>{counts.scheduled} Scheduled</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" /><span className="text-gray-500">{counts.empty} Open</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-gray-500">{counts.locked} Locked</span></span>
        </div>
      </div>

      {/* Search + grade filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="🔍 Search by subject, teacher or room number…"
          className="flex-1 min-w-48 px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }} />
        <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(0) }}
          className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
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
      {paginated.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {paginated.map(r => (
            <ClassroomCard key={r.id} room={r} onEnter={onEnterClassroom} />
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
