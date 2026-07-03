import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet } from '@/lib/api'
import { getStudentFiles, getStudentActivity, logActivity, aggregateFromLocalStorage, type FileRecord, type StudentActivityEntry } from '@/lib/student-records-db'

interface UserRecord {
  id: number; name: string; email: string; phone: string; role: string
  teacher: string; classroomNum: number; level: string; status: string
}

export function StudentRecordArchive() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<UserRecord | null>(null)
  const [studentFiles, setStudentFiles] = useState<FileRecord[]>([])
  const [studentActivity, setStudentActivity] = useState<StudentActivityEntry[]>([])
  const [viewTab, setViewTab] = useState<'overview' | 'files' | 'activity'>('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const r = await apiGet<{ users: UserRecord[] }>('/users')
        setUsers(r.users.filter(u => u.role === 'student'))
      } catch {
        /* Fallback: from localStorage users if API fails */
        const stored = localStorage.getItem('b44_users')
        if (stored) {
          try { setUsers(JSON.parse(stored).filter((u: any) => u.role === 'student')) } catch {}
        }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q))
    )
  }, [users, search])

  const loadStudentDetail = async (student: UserRecord) => {
    setSelectedStudent(student)
    setViewTab('overview')
    const files = await getStudentFiles(student.id)
    const activity = await getStudentActivity(student.id)
    setStudentFiles(files)
    setStudentActivity(activity)
    await logActivity({
      studentId: student.id, type: 'assessment',
      title: 'Record viewed', description: `Student record accessed for ${student.name}`,
      date: new Date().toISOString(), status: 'info',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(37,99,235,0.20)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-black text-white">📚 Student Records Archive</h3>
            <p className="text-xs text-gray-400 mt-0.5">Complete academic history for all students · aggregating from all modules</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(37,99,235,0.10)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.20)' }}>
              {users.length} Students
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.20)' }}>
              {users.filter(u => u.status === 'active').length} Active
            </span>
          </div>
        </div>
        <div className="relative mt-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search students by name, email or phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
        </div>
      </div>

      {/* Student grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((student, i) => {
          const agg = aggregateFromLocalStorage(student.id, student.name)
          return (
            <motion.div key={student.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              onClick={() => loadStudentDetail(student)}
              className="rounded-2xl p-4 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: selectedStudent?.id === student.id ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedStudent?.id === student.id ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,0.12)', color: '#60a5fa' }}>{student.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{student.name}</p>
                  <p className="text-[10px] text-gray-400 truncate font-medium">{student.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${student.status === 'active' ? 'text-emerald-400' : 'text-gray-500'}`}
                  style={{ background: student.status === 'active' ? 'rgba(52,211,153,0.10)' : 'rgba(148,163,184,0.10)', border: `1px solid ${student.status === 'active' ? 'rgba(52,211,153,0.20)' : 'rgba(148,163,184,0.15)'}` }}>
                  {student.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-xs font-bold" style={{ color: agg.attendanceRate >= 75 ? '#34d399' : agg.attendanceRate >= 50 ? '#D4A017' : '#f87171' }}>{agg.attendanceRate}%</p>
                  <p className="text-[8px] text-gray-500">Attendance</p>
                </div>
                <div className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-xs font-bold text-white">{agg.avgScore ?? '—'}</p>
                  <p className="text-[8px] text-gray-500">Avg Score</p>
                </div>
                <div className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-xs font-bold text-white">{agg.assessmentCount}</p>
                  <p className="text-[8px] text-gray-500">Assessments</p>
                </div>
              </div>
              <p className="text-[9px] text-gray-600 mt-2 truncate font-medium">
                {student.teacher ? `Teacher: ${student.teacher}` : ''}
                {student.classroomNum ? ` · Room ${student.classroomNum}` : ''}
                {student.level ? ` · ${student.level}` : ''}
              </p>
            </motion.div>
          )
        })}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-bold text-gray-400">No students match your search</p>
          </div>
        )}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/5" />
              <div className="flex-1"><div className="h-3 bg-white/5 rounded w-24 mb-1" /><div className="h-2 bg-white/5 rounded w-32" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2"><div className="h-12 bg-white/5 rounded-xl" /><div className="h-12 bg-white/5 rounded-xl" /><div className="h-12 bg-white/5 rounded-xl" /></div>
          </div>
        ))}
      </div>

      {/* Student detail panel */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(37,99,235,0.20)' }}>
            {/* Student header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: 'rgba(37,99,235,0.12)', color: '#60a5fa' }}>{selectedStudent.name.charAt(0)}</div>
                <div>
                  <h4 className="text-base font-black text-white">{selectedStudent.name}</h4>
                  <p className="text-[10px] text-gray-400 font-medium">{selectedStudent.email} · {selectedStudent.phone || '—'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-500 hover:text-red-400 transition text-sm">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['overview', 'files', 'activity'] as const).map(tab => (
                <button key={tab} onClick={() => setViewTab(tab)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  style={{ background: viewTab === tab ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)', color: viewTab === tab ? '#60a5fa' : 'rgba(255,255,255,0.5)', border: `1px solid ${viewTab === tab ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                  {tab === 'overview' ? '📊 Overview' : tab === 'files' ? '📁 Files' : '📋 Activity'}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {viewTab === 'overview' && <StudentOverview student={selectedStudent} files={studentFiles} activity={studentActivity} />}
            {viewTab === 'files' && <StudentFilesView files={studentFiles} studentId={selectedStudent.id} />}
            {viewTab === 'activity' && <StudentActivityView activity={studentActivity} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StudentOverview({ student, files, activity }: { student: UserRecord; files: FileRecord[]; activity: StudentActivityEntry[] }) {
  const agg = aggregateFromLocalStorage(student.id, student.name)
  const recentActivity = activity.slice(0, 10)
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Attendance', value: `${agg.attendanceRate}%`, sub: `${agg.presentCount}/${agg.totalAttendance} days`, color: agg.attendanceRate >= 75 ? '#34d399' : '#D4A017' },
          { label: 'Avg Score', value: agg.avgScore?.toString() || '—', sub: `${agg.assessmentCount} assessments`, color: '#60a5fa' },
          { label: 'Files', value: files.length.toString(), sub: `${files.filter(f => f.type === 'homework').length} homework · ${files.filter(f => f.type === 'video').length} videos`, color: '#a855f7' },
          { label: 'Activities', value: activity.length.toString(), sub: recentActivity.length > 0 ? `Latest: ${new Date(recentActivity[0].date).toLocaleDateString()}` : 'No activity', color: '#D4A017' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] font-bold text-white/70 mt-0.5">{stat.label}</p>
            <p className="text-[8px] text-gray-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs font-bold text-white mb-3">📋 Student Info</p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            ['Name', student.name], ['Email', student.email], ['Phone', student.phone || '—'],
            ['Role', student.role], ['Teacher', student.teacher || '—'],
            ['Classroom', student.classroomNum ? `Room ${student.classroomNum}` : '—'],
            ['Level', student.level || '—'], ['Status', student.status],
          ].map(([label, value], i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-gray-400 font-medium">{label}</span>
              <span className="text-white font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white mb-2">📋 Recent Activity</p>
          <div className="space-y-1.5">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-sm">{a.type === 'assessment' ? '📝' : a.type === 'attendance' ? '✅' : a.type === 'homework' ? '📄' : a.type === 'video' ? '🎥' : a.type === 'message' ? '💬' : '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white font-bold truncate">{a.title}</p>
                  <p className="text-[9px] text-gray-500">{a.date ? new Date(a.date).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StudentFilesView({ files, studentId }: { files: FileRecord[]; studentId: number }) {
  const typeIcons: Record<string, string> = { homework: '📄', video: '🎥', document: '📋' }
  return (
    <div className="p-4">
      {files.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">📁</p>
          <p className="text-sm text-gray-400 font-bold">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xl">{typeIcons[f.type] || '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{f.title || f.name}</p>
                <p className="text-[10px] text-gray-400">{f.type} · {(f.size / 1024).toFixed(1)} KB · {new Date(f.uploadedAt).toLocaleDateString()}</p>
                {f.graded && <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Grade: {f.grade}/100 · {f.teacherComment}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { const url = URL.createObjectURL(f.data); window.open(url); setTimeout(() => URL.revokeObjectURL(url), 60000) }}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition"
                  style={{ background: 'rgba(37,99,235,0.10)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.15)' }}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentActivityView({ activity }: { activity: StudentActivityEntry[] }) {
  return (
    <div className="p-4">
      {activity.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-gray-400 font-bold">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {activity.map(a => (
            <div key={a.id} className="flex items-start gap-3 py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-base mt-0.5">
                {a.type === 'assessment' ? '📝' : a.type === 'attendance' ? '✅' : a.type === 'homework' ? '📄' : a.type === 'video' ? '🎥' : a.type === 'message' ? '💬' : '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-bold">{a.title}</p>
                <p className="text-[10px] text-gray-400">{a.description}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{new Date(a.date).toLocaleString()}</p>
              </div>
              {a.score != null && <span className="text-[10px] font-bold text-emerald-400">{a.score}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
