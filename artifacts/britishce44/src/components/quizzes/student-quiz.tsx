import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, apiPost, ApiError } from '@/lib/api'

interface Quiz { id: number; title: string; type: string; duration: number; questionCount: number; status: string; scheduledTime: string; canStart: boolean }
interface Question { id: number; questionText: string; questionType: string; options: string[]; points: number }
interface Attempt { id: number; status: string }

const QUIZ_ICONS: Record<string, string> = { quiz1: '📝', quiz2: '📝', speaking: '🎤', final: '🏆' }

export function StudentQuizView({ onClose }: { onClose?: () => void }) {
  const [pendingQuizzes, setPendingQuizzes] = useState<Quiz[]>([])
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; maxScore: number; percentage: number; passed: boolean; report?: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Load pending quizzes
  const loadPending = useCallback(async () => {
    try {
      const r = await apiGet<{ quizzes: Quiz[] }>('/quizzes/pending')
      setPendingQuizzes(r.quizzes)
    } catch { setMsg('Failed to load quizzes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadPending() }, [loadPending])

  // Anti-cheat: detect tab switches
  useEffect(() => {
    if (!activeQuiz) return
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount(c => c + 1)
        // Log to server
        if (attempt) {
          apiPost('/quizzes/anti-cheat/log', { attemptId: attempt.id, eventType: 'tab_switch', details: { count: tabSwitchCount + 1 } }).catch(() => {})
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [activeQuiz, attempt, tabSwitchCount])

  // Anti-cheat: detect screenshot attempts
  useEffect(() => {
    if (!activeQuiz) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'PrintScreen') || (e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
        setScreenshotCount(c => c + 1)
        if (attempt) {
          apiPost('/quizzes/anti-cheat/log', { attemptId: attempt.id, eventType: 'screenshot', details: { key: e.key } }).catch(() => {})
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeQuiz, attempt])

  // Prevent copy/paste
  useEffect(() => {
    if (!activeQuiz) return
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); if (attempt) apiPost('/quizzes/anti-cheat/log', { attemptId: attempt.id, eventType: 'copy_paste', details: {} }).catch(() => {}) }
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handleCopy)
    document.addEventListener('cut', handleCopy)
    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handleCopy)
      document.removeEventListener('cut', handleCopy)
    }
  }, [activeQuiz, attempt])

  // Fullscreen lock
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setFullscreen(true)
    } catch { setMsg('Please enable fullscreen for the quiz') }
  }

  // Timer
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0 || submitted) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [activeQuiz, timeLeft, submitted])

  const startQuiz = async (quiz: Quiz) => {
    setBusy(true); setMsg(null)
    try {
      const r = await apiPost<{ attempt: Attempt; resume: boolean }>(`/quizzes/${quiz.id}/start`)
      setAttempt(r.attempt)
      setActiveQuiz(quiz)
      setTimeLeft(quiz.duration * 60)
      setAnswers({})
      setTabSwitchCount(0)
      setScreenshotCount(0)
      setSubmitted(false)
      setResult(null)

      // Load questions (without answers)
      const qs = await apiGet<{ questions: Question[] }>(`/quizzes/${quiz.id}/questions`)
      setQuestions(qs.questions)

      // Fullscreen
      await enterFullscreen()
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Failed to start') }
    finally { setBusy(false) }
  }

  const handleSubmit = async () => {
    if (!activeQuiz || !attempt || submitted) return
    setBusy(true)
    try {
      const r = await apiPost<{ attemptId: number; score: number; maxScore: number; percentage: number; passed: boolean }>(
        `/quizzes/${activeQuiz.id}/submit`, { answers, tabSwitches: tabSwitchCount, screenshotAttempts: screenshotCount }
      )
      setSubmitted(true)
      setResult(r)

      // Load full report
      const report = await apiGet<{ report: any }>(`/quizzes/${activeQuiz.id}/results/${r.attemptId}/report`)
      setResult({ ...r, report: report.report })

      if (document.fullscreenElement) await document.exitFullscreen()
      setFullscreen(false)
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Submit failed') }
    finally { setBusy(false) }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60); const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // If no active quiz, show pending list
  if (!activeQuiz) {
    return (
      <div className="space-y-4">
        {msg && <div className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">{msg}<button onClick={() => setMsg(null)} className="ml-2">✕</button></div>}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">📝 My Quizzes</h3>
          <button onClick={loadPending} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:bg-white/5 transition">↻</button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-white/40">Loading quizzes…</div>
        ) : pendingQuizzes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm text-white/40">No pending quizzes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingQuizzes.map(q => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: 'rgba(8,14,32,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-white/5">{QUIZ_ICONS[q.type] || '📝'}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{q.title}</p>
                    <p className="text-xs text-white/40">{q.questionCount} questions · {q.duration} min</p>
                  </div>
                </div>
                <button onClick={() => startQuiz(q)} disabled={busy || !q.canStart}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-30"
                  style={{ background: q.canStart ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#374151' }}>
                  {busy ? 'Starting…' : q.canStart ? '▶ Start Quiz' : '⏳ Scheduled'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Active quiz view (full-screen style)
  if (submitted && result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0b1120' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg rounded-2xl p-8 text-center"
          style={{ background: 'rgba(8,14,32,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ${result.passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {result.passed ? '🎉' : '😔'}
          </div>
          <h2 className={`text-2xl font-black mb-2 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.passed ? 'Passed!' : 'Needs Improvement'}
          </h2>
          <p className="text-4xl font-black text-white mb-1">{result.percentage}%</p>
          <p className="text-sm text-white/40 mb-4">{result.score}/{result.maxScore} points</p>

          {!showReport && (
            <button onClick={() => setShowReport(true)}
              className="w-full py-3 rounded-xl text-sm font-bold text-white mb-3 transition"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              📄 View Detailed Report
            </button>
          )}

          {showReport && result.report && (
            <div className="text-left mt-4 bg-white/5 rounded-xl p-4 border border-white/10 space-y-3 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Performance</span>
                <span className="font-bold text-white">{result.report.performanceSummary.grade}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Correct</span>
                <span className="font-bold text-emerald-400">{result.report.correctCount}/{result.report.totalQuestions}</span>
              </div>

              {result.report.lessonExplanations.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs font-bold text-amber-400 mb-2">📚 Topics to Review</p>
                  {result.report.lessonExplanations.map((e: string, i: number) => (
                    <p key={i} className="text-xs text-white/60 mb-1 pl-3 border-l-2 border-amber-500/30">• {e}</p>
                  ))}
                </div>
              )}

              {result.report.tabSwitches > 0 && (
                <p className="text-[10px] text-red-400">⚠️ {result.report.tabSwitches} tab switches detected</p>
              )}
            </div>
          )}

          <button onClick={() => { setActiveQuiz(null); setSubmitted(false); setResult(null); setShowReport(false); loadPending() }}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 mt-3 transition hover:bg-white/5">
            ← Back to Quizzes
          </button>
        </motion.div>
      </div>
    )
  }

  // In-progress quiz
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0b1120' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-lg">{QUIZ_ICONS[activeQuiz.type] || '📝'}</span>
          <span className="text-sm font-bold text-white">{activeQuiz.title}</span>
          {!fullscreen && (
            <button onClick={enterFullscreen} className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">⛶ Enter Fullscreen</button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40">Tab switches: {tabSwitchCount}</span>
          <span className={`text-sm font-bold font-mono ${timeLeft < 120 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {msg && <div className="mx-6 mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">{msg}</div>}

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {questions.map((q, idx) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-white">
                  <span className="text-blue-400 mr-2">Q{idx + 1}.</span>
                  {q.questionText}
                </p>
                <span className="text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/5">{q.points}pt{q.points > 1 ? 's' : ''}</span>
              </div>

              {q.questionType === 'mcq' && q.options?.length > 0 && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                      style={{ background: answers[String(q.id)] === opt ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${answers[String(q.id)] === opt ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[String(q.id)] === opt}
                        onChange={() => setAnswers(a => ({ ...a, [String(q.id)]: opt }))}
                        className="accent-blue-500" />
                      <span className="text-sm text-white/80">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.questionType === 'truefalse' && (
                <div className="flex gap-3">
                  {['True', 'False'].map(opt => (
                    <button key={opt} onClick={() => setAnswers(a => ({ ...a, [String(q.id)]: opt }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${answers[String(q.id)] === opt ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {(q.questionType === 'short' || q.questionType === 'essay') && (
                <textarea
                  value={answers[String(q.id)] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [String(q.id)]: e.target.value }))}
                  placeholder={q.questionType === 'short' ? 'Type your answer…' : 'Write your essay…'}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition resize-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  rows={q.questionType === 'essay' ? 5 : 2} />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Submit bar */}
      <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-white/30">{Object.keys(answers).length} of {questions.length} answered</span>
        <div className="flex gap-3">
          <button onClick={() => { setActiveQuiz(null); if (document.fullscreenElement) document.exitFullscreen() }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 transition">
            ✕ Quit
          </button>
          <button onClick={handleSubmit} disabled={busy}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
            {busy ? 'Submitting…' : '📤 Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}
