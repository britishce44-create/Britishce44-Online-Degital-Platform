import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '@/lib/api'

interface Quiz {
  id: number; title: string; type: string; courseId: number; teacherId: number | null;
  courseName: string; teacherName: string | null;
  scheduledDate: string; scheduledTime: string; duration: number; status: string;
  aiAntiCheat: boolean; cameraRequired: boolean; micRequired: boolean;
  questionCount: number; passingScore: number; randomizeQuestions: boolean;
  createdAt: string;
}

const QUIZ_TYPES = [
  { key: 'quiz1', label: 'Quiz 1', icon: '📝', color: '#3b82f6' },
  { key: 'quiz2', label: 'Quiz 2', icon: '📝', color: '#8b5cf6' },
  { key: 'speaking', label: 'Speaking Quiz', icon: '🎤', color: '#f59e0b' },
  { key: 'final', label: 'Final Test', icon: '🏆', color: '#ef4444' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function QuizScheduler() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [showCreate, setShowCreate] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiGet<{ quizzes: Quiz[] }>('/quizzes')
      setQuizzes(r.quizzes)
    } catch { setMsg({ kind: 'err', text: 'Failed to load quizzes' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const quizMap = useMemo(() => {
    const map: Record<string, Quiz[]> = {}
    quizzes.forEach(q => {
      const d = q.scheduledDate
      if (!map[d]) map[d] = []
      map[d].push(q)
    })
    return map
  }, [quizzes])

  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; quizzes: Quiz[] }[] = []
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({ date: dateStr, day: i, quizzes: quizMap[dateStr] || [] })
    }
    return days
  }, [daysInMonth, quizMap, year, month])

  const deleteQuiz = async (id: number) => {
    try { await apiDelete(`/quizzes/${id}`); load(); setMsg({ kind: 'ok', text: 'Quiz deleted' }) }
    catch { setMsg({ kind: 'err', text: 'Delete failed' }) }
  }

  const statusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; label: string }> = {
      scheduled: { bg: '#dbeafe', color: '#1e40af', label: 'Scheduled' },
      live: { bg: '#fef3c7', color: '#92400e', label: 'Live' },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
      cancelled: { bg: '#fce4ec', color: '#b91c1c', label: 'Cancelled' },
    }
    const c = cfg[status] || cfg.scheduled
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">📅 Quiz Schedule</h3>
          <p className="text-xs text-white/40 mt-0.5">Schedule Quiz 1, Quiz 2, Speaking Quiz, and Final Tests</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
          ＋ Schedule Quiz
        </button>
      </div>

      {/* Quiz type legend */}
      <div className="flex gap-3 flex-wrap">
        {QUIZ_TYPES.map(t => (
          <span key={t.key} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}25` }}>
            {t.icon} {t.label}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            className="px-3 py-1 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition">{'‹'} Prev</button>
          <span className="text-sm font-bold text-white/80">{MONTHS[month]} {year}</span>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            className="px-3 py-1 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition">Next {'›'}</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-white/30 uppercase py-2 border-b border-white/5">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="min-h-[80px] p-1" />)}
          {calendarDays.map(d => {
            const today = d.date === new Date().toISOString().split('T')[0]
            return (
              <div key={d.date} className={`min-h-[80px] p-1.5 border border-white/5 transition ${today ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}>
                <span className={`text-[10px] font-bold ${today ? 'text-blue-400' : 'text-white/30'}`}>{d.day}</span>
                <div className="mt-1 space-y-0.5">
                  {d.quizzes.slice(0, 3).map(q => {
                    const t = QUIZ_TYPES.find(t => t.key === q.type)
                    return (
                      <div key={q.id} className="text-[8px] font-semibold px-1 py-0.5 rounded truncate text-white cursor-default"
                        style={{ background: `${t?.color || '#3b82f6'}30`, borderLeft: `2px solid ${t?.color || '#3b82f6'}` }}
                        title={`${q.title} · ${q.scheduledTime} · ${q.status}`}>
                        {t?.icon} {q.scheduledTime}
                      </div>
                    )
                  })}
                  {d.quizzes.length > 3 && <div className="text-[7px] text-white/30">+{d.quizzes.length - 3} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quiz list */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-8 text-center text-sm text-white/40">Loading quizzes…</div>
        ) : quizzes.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/30">No quizzes scheduled</div>
        ) : (
          quizzes.map(q => {
            const t = QUIZ_TYPES.find(t => t.key === q.type)
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                style={{ background: 'rgba(8,14,32,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${t?.color || '#3b82f6'}20` }}>{t?.icon || '📝'}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{q.title}</p>
                    <p className="text-xs text-white/40">{q.courseName} · {t?.label} · {q.scheduledDate} @ {q.scheduledTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-white/40">
                    <span>{q.duration}min · {q.questionCount}Q · Pass {q.passingScore}%</span>
                    {q.aiAntiCheat && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px]">AI</span>}
                  </div>
                  {statusBadge(q.status)}
                  <button onClick={() => deleteQuiz(q.id)} className="p-1.5 rounded-lg text-red-400/50 hover:bg-red-500/10 hover:text-red-400 transition">🗑️</button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      <p className="text-xs text-white/20 text-center">{quizzes.length} total quizzes</p>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && <CreateQuizModal onClose={() => setShowCreate(false)} onCreated={() => { load(); setShowCreate(false) }} />}
      </AnimatePresence>
    </div>
  )
}

/* ─── Create Quiz Modal ─── */
function CreateQuizModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('quiz1')
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [teachers, setTeachers] = useState<{ id: number; name: string }[]>([])
  const [teacherId, setTeacherId] = useState<number | null>(null)
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [duration, setDuration] = useState(30)
  const [questionCount, setQuestionCount] = useState(10)
  const [passingScore, setPassingScore] = useState(50)
  const [aiAntiCheat, setAiAntiCheat] = useState(true)
  const [cameraRequired, setCameraRequired] = useState(true)
  const [micRequired, setMicRequired] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    apiGet<{ courses: { id: number; name: string }[] }>('/assessment/courses').then(r => setCourses(r.courses)).catch(() => {})
    apiGet<{ teachers: { id: number; name: string }[] }>('/classroom-assessment/teachers').then(r => setTeachers(r.teachers)).catch(() => {})
  }, [])

  const t = QUIZ_TYPES.find(t => t.key === type)

  const handleCreate = async () => {
    if (!title.trim() || !courseId) { setErr('Title and course required'); return }
    setBusy(true); setErr('')
    try {
      await apiPost('/quizzes', {
        title: title.trim(), type, courseId, teacherId,
        scheduledDate, scheduledTime, duration, questionCount, passingScore,
        aiAntiCheat, cameraRequired, micRequired,
      })
      onCreated()
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Failed to create') }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl overflow-auto shadow-2xl" style={{ background: '#0b1120', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-purple-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">📝 Schedule Quiz</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full text-white/30 hover:bg-white/5 transition">✕</button>
          </div>

          {err && <div className="mb-4 px-4 py-2 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">{err}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1">Quiz Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Quiz 1 - Unit 3"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Quiz Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {QUIZ_TYPES.map(qt => (
                  <button key={qt.key} onClick={() => setType(qt.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
                    style={type === qt.key ? { background: `${qt.color}20`, color: qt.color, borderColor: `${qt.color}40` } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', borderColor: 'transparent' }}>
                    {qt.icon} {qt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Course</label>
              <select value={courseId ?? ''} onChange={e => setCourseId(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="" style={{ background: '#0b1120' }}>Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id} style={{ background: '#0b1120' }}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Teacher (optional)</label>
              <select value={teacherId ?? ''} onChange={e => setTeacherId(Number(e.target.value))}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <option value="" style={{ background: '#0b1120' }}>Select teacher…</option>
                {teachers.map(t => <option key={t.id} value={t.id} style={{ background: '#0b1120' }}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Date</label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Time</label>
              <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Duration (minutes)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={5} max={180}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Questions</label>
              <input type="number" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} min={1} max={100}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Passing Score (%)</label>
              <input type="number" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} min={0} max={100}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
          </div>

          {/* Anti-cheat settings */}
          <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">🛡️ AI Anti-Cheat & Monitoring</p>
            <div className="space-y-3">
              {[
                { key: 'aiAntiCheat', label: 'AI Anti-Cheat Monitoring', desc: 'Detect tab switches, copy/paste, and suspicious behavior' },
                { key: 'cameraRequired', label: 'Camera Required', desc: 'Students must enable their camera during the quiz' },
                { key: 'micRequired', label: 'Microphone Required', desc: 'Students must enable their microphone' },
              ].map(item => {
                const val = item.key === 'aiAntiCheat' ? aiAntiCheat : item.key === 'cameraRequired' ? cameraRequired : micRequired
                const set = item.key === 'aiAntiCheat' ? setAiAntiCheat : item.key === 'cameraRequired' ? setCameraRequired : setMicRequired
                return (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <button onClick={() => set(!val)}
                      className={`w-10 h-5 rounded-full transition relative ${val ? 'bg-amber-500' : 'bg-white/10'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition ${val ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-white/80">{item.label}</p>
                      <p className="text-[10px] text-white/30">{item.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="mt-3 text-xs text-amber-400/60 bg-amber-500/5 rounded-lg px-3 py-2">⚠️ Screenshots and translation tools will be disabled during the quiz. Quiz content is in English only. Reports can be bilingual.</div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 transition"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
            <button onClick={handleCreate} disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
              {busy ? 'Creating…' : `📝 Schedule ${QUIZ_TYPES.find(t => t.key === type)?.label || 'Quiz'}`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
