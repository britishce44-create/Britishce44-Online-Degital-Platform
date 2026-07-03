import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, ApiError } from '@/lib/api'

interface Quiz { id: number; title: string; type: string; courseName: string; aiAntiCheat: boolean; cameraRequired: boolean; micRequired: boolean; duration: number; scheduledTime: string }
interface Student { id: number; name: string; level: string; status: string; score: number | null; micSilenced: boolean; tabSwitches: number; flagged: boolean }
interface QuizResult { id: number; studentId: number; studentName: string; studentLevel: string; status: string; percentage: number; totalScore: number; maxScore: number; passed: boolean; tabSwitchCount: number; flagged: boolean; submittedAt: string }

const QUIZ_ICONS: Record<string, string> = { quiz1: '📝', quiz2: '📝', speaking: '🎤', final: '🏆' }
const QUIZ_COLORS: Record<string, string> = { quiz1: '#3b82f6', quiz2: '#8b5cf6', speaking: '#f59e0b', final: '#ef4444' }

export function TeacherMonitor() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [aiActive, setAiActive] = useState(true)
  const [viewMode, setViewMode] = useState<'monitor' | 'results'>('monitor')
  const [results, setResults] = useState<QuizResult[]>([])
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadQuizzes = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiGet<{ quizzes: Quiz[] }>('/quizzes')
      setQuizzes(r.quizzes)
      // Auto-select live or next quiz
      const live = r.quizzes.find(q => q.status === 'live')
      if (live) { selectQuiz(live.id) }
    } catch { setMsg('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadQuizzes() }, [loadQuizzes])

  const selectQuiz = async (id: number) => {
    const q = quizzes.find(q => q.id === id)
    if (!q) return
    setActiveQuiz(q)
    setAiActive(q.aiAntiCheat)
    setViewMode('monitor')

    try {
      const r = await apiGet<{ quiz: Quiz; students: Student[] }>(`/quizzes/${id}/monitor`)
      setStudents(r.students)
    } catch { setMsg('Failed to load students') }
  }

  const viewResults = async (quizId: number) => {
    setViewMode('results')
    try {
      const r = await apiGet<{ results: QuizResult[] }>(`/quizzes/${quizId}/results`)
      setResults(r.results)
    } catch { setMsg('Failed to load results') }
  }

  const toggleSilence = async (studentId: number, currentlySilenced: boolean) => {
    if (!activeQuiz) return
    try {
      await apiPost(`/quizzes/${activeQuiz.id}/monitor/silence`, { studentId, silenced: !currentlySilenced })
      setStudents(s => s.map(st => st.id === studentId ? { ...st, micSilenced: !currentlySilenced } : st))
    } catch { setMsg('Failed to toggle mic') }
  }

  const toggleAiCheat = async () => {
    if (!activeQuiz) return
    setBusy(true)
    try {
      const newState = !aiActive
      await apiPost(`/quizzes/${activeQuiz.id}/monitor/ai-toggle`, { active: newState })
      setAiActive(newState)
      setMsg(newState ? '🛡️ AI Anti-Cheat activated' : '⚠️ AI Anti-Cheat deactivated')
    } catch { setMsg('Failed to toggle AI') }
    finally { setBusy(false) }
  }

  const statusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; label: string }> = {
      not_started: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', label: 'Not Started' },
      in_progress: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'In Progress' },
      submitted: { bg: 'rgba(0,174,116,0.15)', color: '#00ae74', label: 'Submitted' },
    }
    const c = cfg[status] || cfg.not_started
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between"
          style={{ background: msg.includes('🛡️') ? 'rgba(0,174,116,0.1)' : msg.includes('⚠️') ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(255,255,255,0.06)', color: msg.includes('🛡️') ? '#00ae74' : msg.includes('⚠️') ? '#f59e0b' : '#ef4444' }}>
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Quiz selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {quizzes.filter(q => q.status === 'live' || q.status === 'scheduled').map(q => (
          <button key={q.id} onClick={() => selectQuiz(q.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shrink-0"
            style={activeQuiz?.id === q.id ? { background: `${QUIZ_COLORS[q.type] || '#3b82f6'}20`, color: QUIZ_COLORS[q.type] || '#3b82f6', borderColor: `${QUIZ_COLORS[q.type] || '#3b82f6'}30` } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {QUIZ_ICONS[q.type] || '📝'} {q.title}
          </button>
        ))}
        <button onClick={loadQuizzes} className="px-2 py-1.5 rounded-lg text-xs text-white/30 hover:bg-white/5 transition">↻</button>
      </div>

      {activeQuiz ? (
        <>
          {/* Active quiz header */}
          <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
            style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${QUIZ_COLORS[activeQuiz.type] || '#3b82f6'}20` }}>{QUIZ_ICONS[activeQuiz.type] || '📝'}</div>
              <div>
                <p className="text-sm font-bold text-white">{activeQuiz.title}</p>
                <p className="text-xs text-white/40">{activeQuiz.courseName} · {activeQuiz.scheduledTime} · {activeQuiz.duration}min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: aiActive ? 'rgba(0,174,116,0.1)' : 'rgba(239,68,68,0.1)', color: aiActive ? '#00ae74' : '#ef4444' }}>
                <div className={`w-2 h-2 rounded-full ${aiActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                AI {aiActive ? 'Active' : 'Off'}
              </div>
              <button onClick={toggleAiCheat} disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)' }}>
                Toggle AI
              </button>
              <button onClick={() => viewResults(activeQuiz.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                📊 View Results
              </button>
            </div>
          </div>

          {/* Tab: Monitor / Results */}
          <div className="flex gap-1 p-0.5 rounded-xl w-fit"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setViewMode('monitor')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              style={viewMode === 'monitor' ? { background: 'rgba(37,99,235,0.2)', color: '#60a5fa' } : { color: 'rgba(255,255,255,0.4)' }}>
              🎥 Monitor
            </button>
            <button onClick={() => viewResults(activeQuiz.id)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              style={viewMode === 'results' ? { background: 'rgba(37,99,235,0.2)', color: '#60a5fa' } : { color: 'rgba(255,255,255,0.4)' }}>
              📊 Results
            </button>
          </div>

          {/* Monitor view */}
          {viewMode === 'monitor' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {students.map(st => (
                <motion.div key={st.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(8,14,32,0.90)', border: `1px solid ${st.flagged ? 'rgba(239,68,68,0.3)' : st.status === 'in_progress' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  
                  {/* Camera placeholder / avatar */}
                  <div className="aspect-video flex items-center justify-center relative"
                    style={{ background: st.status === 'not_started' ? 'rgba(0,0,0,0.5)' : 'linear-gradient(135deg, #1a1a4e, #2d2d6a)' }}>
                    {st.status === 'not_started' ? (
                      <span className="text-3xl opacity-30">📷</span>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ background: 'rgba(255,255,255,0.15)' }}>{st.name.charAt(0)}</div>
                        {st.micSilenced && <span className="text-xs mt-1 text-red-400">🔇</span>}
                      </div>
                    )}
                    
                    {/* Status indicators */}
                    <div className="absolute top-2 left-2">
                      {statusBadge(st.status)}
                    </div>
                    {st.flagged && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">🚨</div>
                    )}
                  </div>

                  {/* Student info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white truncate">{st.name}</p>
                    <p className="text-[10px] text-white/30">{st.level || '—'}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {/* Silence mic button */}
                      <button onClick={() => toggleSilence(st.id, st.micSilenced)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition border"
                        style={{ background: st.micSilenced ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', borderColor: st.micSilenced ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', color: st.micSilenced ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
                        {st.micSilenced ? '🔊 Unmute' : '🔇 Silence'}
                      </button>
                      
                      {st.score !== null && (
                        <span className="text-xs font-bold px-2 py-1 rounded"
                          style={{ background: st.score >= 70 ? 'rgba(0,174,116,0.15)' : st.score >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: st.score >= 70 ? '#00ae74' : st.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {st.score}%
                        </span>
                      )}
                    </div>

                    {st.tabSwitches > 0 && (
                      <p className="text-[9px] text-red-400 mt-1.5">⚠️ {st.tabSwitches} tab switches</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Results view */}
          {viewMode === 'results' && (
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Result</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Tab Switches</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white/50 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        className="hover:bg-white/5 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">{r.studentName.charAt(0)}</div>
                            <span className="text-sm font-medium text-white">{r.studentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-white">{r.percentage}%</span>
                          <span className="text-xs text-white/30 ml-1">({r.totalScore}/{r.maxScore})</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {r.passed ? '✅ Pass' : '❌ Fail'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs ${r.tabSwitchCount > 2 ? 'text-red-400' : 'text-white/40'}`}>{r.tabSwitchCount}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setSelectedResult(selectedResult?.id === r.id ? null : r)}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition">
                            📄 Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result detail modal */}
          <AnimatePresence>
            {selectedResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="rounded-xl p-5 mt-2" style={{ background: 'rgba(8,14,32,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white">{selectedResult.studentName} — Detailed Report</h4>
                  <button onClick={() => setSelectedResult(null)} className="text-white/30 hover:text-white/60">✕</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-lg font-black text-white">{selectedResult.percentage}%</p>
                    <p className="text-[10px] text-white/40">Score</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-lg font-black text-white">{selectedResult.totalScore}/{selectedResult.maxScore}</p>
                    <p className="text-[10px] text-white/40">Points</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className={`text-lg font-black ${selectedResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>{selectedResult.passed ? 'Pass' : 'Fail'}</p>
                    <p className="text-[10px] text-white/40">Result</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-lg font-black text-white">{selectedResult.tabSwitchCount}</p>
                    <p className="text-[10px] text-white/40">Tab Switches</p>
                  </div>
                </div>
                <p className="text-[10px] text-white/30 mt-3 text-center">Submitted: {selectedResult.submittedAt ? new Date(selectedResult.submittedAt).toLocaleString() : '—'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">🎥</p>
          <p className="text-sm text-white/40">Select a quiz to start monitoring</p>
        </div>
      )}
    </div>
  )
}
