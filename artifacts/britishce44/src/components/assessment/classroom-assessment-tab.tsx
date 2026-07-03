import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, ApiError } from '@/lib/api'

interface Teacher { id: number; name: string; email: string }
interface Course { id: number; name: string; level: string; termLabel: string; teachingWeekdays: number[] }
interface Student { id: number; name: string; level: string; parentName: string | null }
interface Criterion { id: number; key: string; labelEn: string; labelAr: string }

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function ClassroomAssessmentTab() {
  const [step, setStep] = useState<'select' | 'assess' | 'review'>('select')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const [selTeacher, setSelTeacher] = useState<number | null>(null)
  const [selCourse, setSelCourse] = useState<number | null>(null)
  const [selTime, setSelTime] = useState('09:00')
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0])
  const [selTerm, setSelTerm] = useState('')

  const [scores, setScores] = useState<Record<number, Record<number, number | null>>>({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [reportHtml, setReportHtml] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const loadTeachers = useCallback(async () => {
    try {
      const r = await apiGet<{ teachers: Teacher[] }>('/classroom-assessment/teachers')
      setTeachers(r.teachers)
    } catch { setMsg({ kind: 'err', text: 'Failed to load teachers' }) }
  }, [])

  const loadCriteria = useCallback(async () => {
    try {
      const r = await apiGet<{ criteria: Criterion[] }>('/assessment/criteria')
      setCriteria(r.criteria)
    } catch {}
  }, [])

  useEffect(() => { loadTeachers(); loadCriteria() }, [loadTeachers, loadCriteria])

  const loadCourses = useCallback(async (teacherId: number) => {
    setBusy(true)
    try {
      const r = await apiGet<{ courses: Course[] }>(`/classroom-assessment/teachers/${teacherId}/courses`)
      setCourses(r.courses)
    } catch { setMsg({ kind: 'err', text: 'Failed to load courses' }) }
    finally { setBusy(false) }
  }, [])

  const loadStudents = useCallback(async (courseId: number) => {
    setBusy(true)
    try {
      const r = await apiGet<{ students: Student[] }>(`/classroom-assessment/courses/${courseId}/students`)
      setStudents(r.students)
    } catch { setMsg({ kind: 'err', text: 'Failed to load students' }) }
    finally { setBusy(false) }
  }, [])

  const handleTeacherChange = (id: number) => {
    setSelTeacher(id)
    setSelCourse(null)
    setCourses([])
    setStudents([])
    if (id) loadCourses(id)
  }

  const handleCourseChange = (id: number) => {
    setSelCourse(id)
    setStudents([])
    setScores({})
    setSaved(false)
    const course = courses.find(c => c.id === id)
    if (course) {
      setSelTerm(course.termLabel || '')
    }
    if (id) loadStudents(id)
  }

  const setScore = (studentId: number, criterionId: number, value: number | null) => {
    setScores(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [criterionId]: value },
    }))
  }

  const getScore = (studentId: number, criterionId: number): number | null =>
    scores[studentId]?.[criterionId] ?? null

  const studentAvg = (studentId: number): number | null => {
    const vals = criteria.map(c => getScore(studentId, c.id)).filter((v): v is number => v !== null)
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  }

  const handleSave = async (generateReports: boolean) => {
    if (!selCourse) return
    setBusy(true)
    setMsg(null)
    try {
      const scoreData = students.flatMap(st =>
        criteria.map(c => ({
          studentId: st.id,
          criterionId: c.id,
          score: getScore(st.id, c.id),
        }))
      )
      const r = await apiPost<{ sheetId: number; scoreCount: number; reportsGenerated: boolean }>('/classroom-assessment/save', {
        teacherId: selTeacher,
        courseId: selCourse,
        termLabel: selTerm,
        date: selDate,
        scores: scoreData,
        generateReports,
      })
      setMsg({ kind: 'ok', text: `${r.scoreCount} scores saved${r.reportsGenerated ? ' · Reports generated!' : ''}` })
      setSaved(true)
      if (generateReports) setStep('review')
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Save failed' })
    }
    finally { setBusy(false) }
  }

  const selectedCourse = courses.find(c => c.id === selCourse)
  const dayOfWeek = new Date(selDate).getDay()

  // Determine color for score
  const scoreColor = (v: number | null): string => {
    if (v == null) return '#f3f4f6'
    if (v <= 2) return '#fecaca'
    if (v === 3) return '#fde68a'
    if (v === 4) return '#bfdbfe'
    return '#a7f3d0'
  }

  const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {['select', 'assess', 'review'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => setStep(s as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${step === s ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-500 hover:bg-blue-100'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/20">
                {step === 'select' ? '1' : step === 'assess' ? '2' : '3'}
              </span>
              {s === 'select' ? 'Select Class' : s === 'assess' ? 'Enter Grades' : 'Reports'}
            </button>
            {i < 2 && <span className="text-blue-200">→</span>}
          </div>
        ))}
      </div>

      {step === 'select' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 bg-white border border-blue-100 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-blue-900">📋 Select Classroom & Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Teacher */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">👩‍🏫 Teacher</label>
              <select className={inp} value={selTeacher ?? ''} onChange={e => handleTeacherChange(Number(e.target.value))}>
                <option value="">Select teacher…</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {/* Course */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">🚪 Active Classroom</label>
              <select className={inp} value={selCourse ?? ''} onChange={e => handleCourseChange(Number(e.target.value))} disabled={!selTeacher}>
                <option value="">{selTeacher ? 'Select classroom…' : 'Choose teacher first'}</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
              </select>
            </div>
            {/* Level (auto from course) */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">📊 Level</label>
              <input className={inp + ' bg-gray-50'} value={selectedCourse?.level || ''} readOnly placeholder="Auto from course" />
            </div>
            {/* Term */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">📖 Active Term</label>
              <input className={inp} value={selTerm} onChange={e => setSelTerm(e.target.value)} placeholder="e.g. Term 1" />
            </div>
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">📅 Date</label>
              <input type="date" className={inp} value={selDate} onChange={e => setSelDate(e.target.value)} />
            </div>
            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">⏰ Time</label>
              <input type="time" className={inp} value={selTime} onChange={e => setSelTime(e.target.value)} />
            </div>
          </div>

          {/* Teaching weekdays info */}
          {selectedCourse?.teachingWeekdays && (
            <div className="flex items-center gap-2 text-xs text-blue-500 bg-blue-50 rounded-xl px-4 py-2">
              <span>📌 Teaching Days:</span>
              {selectedCourse.teachingWeekdays.map(d => (
                <span key={d} className={`px-2 py-0.5 rounded-full font-semibold ${d === dayOfWeek ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  {WEEKDAYS[d]}
                </span>
              ))}
              <span className="ml-2 text-blue-300">· Today is {WEEKDAYS[dayOfWeek]}</span>
            </div>
          )}

          {selCourse && students.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-blue-100">
              <span className="text-sm text-blue-500">{students.length} students in this class</span>
              <button onClick={() => setStep('assess')}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                Continue to Assessment →
              </button>
            </div>
          )}
        </motion.div>
      )}

      {step === 'assess' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Summary bar */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2 text-white">
              <div className="flex items-center gap-4 text-sm">
                <span>👩‍🏫 {teachers.find(t => t.id === selTeacher)?.name}</span>
                <span className="text-blue-200">|</span>
                <span>🚪 {selectedCourse?.name}</span>
                <span className="text-blue-200">|</span>
                <span>📅 {selDate} · {selTime}</span>
                <span className="text-blue-200">|</span>
                <span>📖 {selTerm}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-200">{students.length} students</span>
                <button onClick={async () => {
                  try {
                    const r = await apiGet<{ users: { id: number; name: string; role: string; level?: string }[] }>('/users')
                    const fromUsers = r.users.filter(u => u.role === 'student').map(u => ({ id: u.id, name: u.name, level: u.level || '—', parentName: null }))
                    if (fromUsers.length > 0) {
                      setStudents(fromUsers)
                      setMsg({ kind: 'ok', text: `Loaded ${fromUsers.length} students from Manage Users` })
                    }
                  } catch {
                    setMsg({ kind: 'err', text: 'Failed to load from Users' })
                  }
                }} className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition"
                  style={{ background: 'rgba(255,255,255,0.10)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                  📋 From Users
                </button>
              </div>
            </div>
          </div>

          {/* Grade table */}
          <div className="rounded-xl overflow-hidden bg-white border border-blue-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <th className="sticky left-0 bg-blue-50 z-10 px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[150px]">Student</th>
                    {criteria.map(c => (
                      <th key={c.id} className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[80px]">{c.labelEn}</th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[60px]">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => {
                    const avg = studentAvg(st.id)
                    return (
                      <tr key={st.id} className="border-t border-blue-50 hover:bg-blue-50/30 transition">
                        <td className="sticky left-0 bg-white px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{st.name}</p>
                              <p className="text-[10px] text-blue-400">{st.level || '—'}</p>
                            </div>
                          </div>
                        </td>
                        {criteria.map(c => {
                          const v = getScore(st.id, c.id)
                          return (
                            <td key={c.id} className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                {[1,2,3,4,5].map(n => (
                                  <button key={n} onClick={() => setScore(st.id, c.id, v === n ? null : n)}
                                    className="w-6 h-6 rounded text-[10px] font-bold transition border"
                                    style={{
                                      background: v === n ? scoreColor(n) : '#f9fafb',
                                      borderColor: v === n ? '#93c5fd' : '#e5e7eb',
                                      color: v === n ? '#1e40af' : '#9ca3af',
                                    }}>
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block text-xs font-bold px-2 py-1 rounded ${avg !== null && avg >= 4 ? 'bg-emerald-100 text-emerald-700' : avg !== null && avg >= 3 ? 'bg-amber-100 text-amber-700' : avg !== null ? 'bg-red-100 text-red-700' : ''}`}>
                            {avg !== null ? avg.toFixed(1) : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
            <div className="flex gap-2">
              <button onClick={() => setStep('select')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition">
                ← Back
              </button>
              <span className="text-xs text-blue-400 self-center">
                {Object.values(scores).reduce((a, s) => a + Object.values(s).filter(v => v !== null).length, 0)} grades entered
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSave(false)} disabled={busy}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50">
                {busy ? 'Saving…' : '💾 Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={busy}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                {busy ? 'Generating…' : '📄 Save & Generate Reports'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {step === 'review' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 bg-white border border-blue-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-900">✅ Reports Generated</h3>
              <p className="text-sm text-blue-500 mt-0.5">The following reports have been created and delivered:</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setStep('select'); setSaved(false); setScores({}) }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">
                New Assessment
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: '👩‍🏫', title: "Teacher's Report", desc: 'Feedback on weaknesses + suggested activities & teaching methods', color: '#2563eb' },
              { icon: '🎓', title: "Student's Report", desc: 'Arabic & English performance report for each student', color: '#00ae74' },
              { icon: '🏢', title: 'Academic Management', desc: 'Detailed classroom report with all scores & absences', color: '#8b5cf6' },
            ].map((card, i) => (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                key={i} className="rounded-xl p-5 border"
                style={{ borderColor: `${card.color}20`, background: `${card.color}06` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                  style={{ background: `${card.color}12`, border: `1px solid ${card.color}20` }}>
                  {card.icon}
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">{card.title}</p>
                <p className="text-xs text-gray-500">{card.desc}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold" style={{ color: card.color }}>
                  <span>✓ Delivered</span>
                  <span>·</span>
                  <span>📎 PDF Available</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 flex items-center gap-3">
            <span className="text-lg">📌</span>
            <span>Reports are available in each user's dashboard. Teachers can view detailed feedback, students see bilingual reports, and academic management gets a comprehensive classroom summary with absence records.</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
