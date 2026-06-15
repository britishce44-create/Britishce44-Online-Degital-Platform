import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QUESTIONS, PASSAGES, LEVEL_BANDS, SKILL_META, SKILLS, TOTAL_QUESTIONS,
  scoreTest, type PlacementResult,
} from '../lib/placement-test'

type Phase = 'intro' | 'test' | 'result'

const passageById = (id?: string) => PASSAGES.find((p) => p.id === id)

function speak(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.95
    window.speechSynthesis.speak(u)
    return true
  } catch {
    return false
  }
}

const CEFR_BADGE: Record<string, string> = {
  A1: '#00ae74', A2: '#0a85c2', B1: '#3FBAEB', B2: '#2620a8', C1: '#150d79', C2: '#7c3aed',
}

export function PlacementsPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [name, setName] = useState('')
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<PlacementResult | null>(null)
  const [revealTranscript, setRevealTranscript] = useState(false)
  const audioSupported = useRef(typeof window !== 'undefined' && 'speechSynthesis' in window)

  const q = QUESTIONS[idx]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round(((idx + 1) / TOTAL_QUESTIONS) * 100)

  const start = () => {
    setAnswers({}); setIdx(0); setResult(null); setRevealTranscript(false); setPhase('test')
  }
  const choose = (qid: string, oi: number) => setAnswers((a) => ({ ...a, [qid]: oi }))
  const next = () => {
    if (idx < TOTAL_QUESTIONS - 1) { setRevealTranscript(false); setIdx((i) => i + 1) }
    else finish()
  }
  const prev = () => { if (idx > 0) { setRevealTranscript(false); setIdx((i) => i - 1) } }
  const finish = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setResult(scoreTest(answers)); setPhase('result')
  }
  const retake = () => { setPhase('intro'); setAnswers({}); setIdx(0); setResult(null) }

  // ---------------- INTRO ----------------
  if (phase === 'intro') {
    return (
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl p-7 text-white"
          style={{ background: 'linear-gradient(135deg,#150d79 0%,#2620a8 55%,#3FBAEB 100%)', boxShadow: '0 10px 30px rgba(21,13,121,0.22)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
          <div className="relative">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-3">Assessment Center</span>
            <h2 className="text-3xl font-black leading-tight">📝 English Placement Test</h2>
            <p className="text-white/85 text-sm mt-2 max-w-2xl">
              One comprehensive, automatically scored test covering every skill — Listening, Grammar, Vocabulary,
              Reading and Use of English. Get an instant CEFR level and your exact Britishce44 class placement.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-4">
              {[`${TOTAL_QUESTIONS} questions`, '≈ 15–20 minutes', 'All skills', 'Auto-scored', 'Instant level verdict'].map((t) => (
                <span key={t} className="text-[11px] font-bold bg-white/15 border border-white/25 px-3 py-1.5 rounded-xl">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* What it measures */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SKILLS.map((s) => {
            const count = QUESTIONS.filter((x) => x.skill === s).length
            const m = SKILL_META[s]
            return (
              <div key={s} className="rounded-2xl p-4 bg-white text-center" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
                <div className="w-11 h-11 mx-auto rounded-xl flex items-center justify-center text-xl mb-2" style={{ background: m.tint }}>{m.icon}</div>
                <p className="text-xs font-black text-[#150d79]">{s}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{count} questions</p>
              </div>
            )
          })}
        </div>

        {/* Level map */}
        <div>
          <h3 className="text-sm font-black text-[#150d79] mb-3 px-1">Levels you can be placed into</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {LEVEL_BANDS.map((lvl) => (
              <div key={lvl.cefr} className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
                <div className="h-1.5" style={{ background: lvl.gradient }} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-[#150d79]">{lvl.title}</h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: lvl.color }}>{lvl.cefr}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{lvl.blurb}</p>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">{lvl.kids}</p>
                    <p className="text-[11px] font-bold text-slate-700">{lvl.adult}</p>
                    <p className="text-[10px] text-slate-500">📘 {lvl.book}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start card */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-600">Student name <span className="text-slate-400 font-medium">(optional, shown on your report)</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Ali"
                className="mt-1 w-full px-4 py-2.5 rounded-xl text-sm outline-none bg-[#f1f5f9] border border-slate-200 text-[#150d79] placeholder-slate-400 focus:border-[#3FBAEB]" />
            </div>
            <button onClick={start}
              className="px-6 py-3 rounded-xl text-sm font-black text-white transition hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#150d79,#2620a8)', boxShadow: '0 8px 20px rgba(38,32,168,0.30)' }}>
              Start placement test →
            </button>
          </div>
          {!audioSupported.current && (
            <p className="text-[11px] text-amber-700 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              🔇 Your browser does not support audio playback — listening questions will show the transcript instead so you can still answer.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ---------------- TEST ----------------
  if (phase === 'test') {
    const m = SKILL_META[q.skill]
    const passage = passageById(q.passageId)
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg" style={{ background: m.tint, color: m.color }}>{m.icon} {q.skill}</span>
              <span className="text-[10px] font-black px-2 py-1 rounded-lg text-white" style={{ background: CEFR_BADGE[q.cefr] }}>{q.cefr}</span>
            </div>
            <span className="text-xs font-bold text-slate-500">Question {idx + 1} / {TOTAL_QUESTIONS} · {answeredCount} answered</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#2620a8,#3FBAEB)' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
            className="rounded-2xl p-5 sm:p-6 bg-white" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>

            {/* Listening controls */}
            {q.skill === 'Listening' && q.audioScript && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(38,32,168,0.06)', border: '1px solid rgba(38,32,168,0.15)' }}>
                <p className="text-[11px] font-bold text-slate-600 mb-2">🎧 Listen carefully, then answer. You can replay as many times as you like.</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => speak(q.audioScript!)} disabled={!audioSupported.current}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#2620a8,#3FBAEB)' }}>▶ Play audio</button>
                  <button onClick={() => speak(q.audioScript!)} disabled={!audioSupported.current}
                    className="px-3 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40"
                    style={{ background: 'rgba(38,32,168,0.10)', color: '#2620a8' }}>↻ Replay</button>
                  {!audioSupported.current && (
                    <span className="text-[11px] font-bold text-amber-700">Audio unavailable — read the transcript below.</span>
                  )}
                  {audioSupported.current && (
                    <button onClick={() => setRevealTranscript((v) => !v)} className="text-[11px] font-bold text-slate-500 underline ml-auto">
                      {revealTranscript ? 'Hide transcript' : 'Show transcript'}
                    </button>
                  )}
                </div>
                {(revealTranscript || !audioSupported.current) && (
                  <p className="mt-3 text-sm text-slate-700 italic bg-white rounded-lg px-3 py-2 border border-slate-200">“{q.audioScript}”</p>
                )}
              </div>
            )}

            {/* Reading passage */}
            {passage && (
              <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,128,90,0.06)', border: '1px solid rgba(0,128,90,0.15)' }}>
                <p className="text-[11px] font-black uppercase tracking-wide text-[#00805a] mb-1">📖 {passage.title}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{passage.text}</p>
              </div>
            )}

            <h3 className="text-lg font-black text-[#150d79] mb-4">{q.prompt}</h3>

            <div className="space-y-2.5">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi
                return (
                  <button key={oi} onClick={() => choose(q.id, oi)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition"
                    style={{
                      background: selected ? 'rgba(63,186,235,0.12)' : '#f8fafc',
                      border: selected ? '2px solid #3FBAEB' : '1px solid #e2e8f0',
                      color: selected ? '#150d79' : '#334155',
                    }}>
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: selected ? '#2620a8' : '#e2e8f0', color: selected ? '#fff' : '#64748b' }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={prev} disabled={idx === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40"
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>← Previous</button>
          <button onClick={() => { if (confirm('Finish the test and see your level now?')) finish() }}
            className="text-xs font-bold text-slate-400 hover:text-slate-600">Finish early</button>
          <button onClick={next}
            className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition hover:-translate-y-0.5"
            style={{ background: idx === TOTAL_QUESTIONS - 1 ? 'linear-gradient(135deg,#00805a,#00ae74)' : 'linear-gradient(135deg,#150d79,#2620a8)', boxShadow: '0 6px 16px rgba(38,32,168,0.25)' }}>
            {idx === TOTAL_QUESTIONS - 1 ? 'Finish & get my level ✓' : 'Next →'}
          </button>
        </div>
      </div>
    )
  }

  // ---------------- RESULT ----------------
  return result ? <ResultReport result={result} name={name} onRetake={retake} /> : null
}

function ResultReport({ result, name, onRetake }: { result: PlacementResult; name: string; onRetake: () => void }) {
  const { overallPct, band, correct, total, skills, strengths, weaknesses, recommendations, cefrCeiling } = result
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Verdict hero */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-7 text-white"
        style={{ background: band.gradient, boxShadow: '0 12px 32px rgba(21,13,121,0.25)' }}>
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
        <div className="relative">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-3">Your Result {name ? `· ${name}` : ''}</span>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Recommended Placement</p>
              <h2 className="text-4xl font-black leading-tight">{band.title}</h2>
              <p className="text-white/90 text-sm mt-1">{band.kids} &nbsp;·&nbsp; {band.adult}</p>
              <p className="text-white/80 text-xs mt-1">📘 Start with {band.book}</p>
            </div>
            <div className="text-center ml-auto">
              <div className="text-5xl font-black leading-none">{overallPct}%</div>
              <p className="text-white/80 text-[11px] mt-1">{correct} / {total} correct</p>
              <span className="inline-block mt-2 text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-full">CEFR ceiling: {cefrCeiling}</span>
            </div>
          </div>
          <p className="text-white/85 text-sm mt-4 max-w-2xl">{band.blurb}</p>
        </div>
      </motion.div>

      {/* Skill breakdown */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
        <h3 className="text-sm font-black text-[#150d79] mb-4">Skill breakdown</h3>
        <div className="space-y-3.5">
          {skills.map((s) => {
            const m = SKILL_META[s.skill]
            return (
              <div key={s.skill}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">{m.icon} {s.skill}</span>
                  <span className="font-black text-[#150d79]">{s.pct}% <span className="text-slate-400 font-medium">({s.correct}/{s.total})</span></span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Strengths & weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(0,174,116,0.25)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
          <h3 className="text-sm font-black text-[#00805a] mb-3">💪 Strengths</h3>
          {strengths.length ? (
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(0,174,116,0.12)', color: '#00805a' }}>{SKILL_META[s].icon} {s}</span>)}
            </div>
          ) : <p className="text-xs text-slate-500">Keep practising — your strengths will grow with every lesson.</p>}
        </div>
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(180,83,9,0.22)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
          <h3 className="text-sm font-black text-[#b45309] mb-3">🎯 Focus areas</h3>
          {weaknesses.length ? (
            <div className="flex flex-wrap gap-2">
              {weaknesses.map((s) => <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(180,83,9,0.12)', color: '#b45309' }}>{SKILL_META[s].icon} {s}</span>)}
            </div>
          ) : <p className="text-xs text-slate-500">Great balance — no weak areas stood out. Aim higher!</p>}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid rgba(21,13,121,0.08)', boxShadow: '0 1px 3px rgba(21,13,121,0.06)' }}>
        <h3 className="text-sm font-black text-[#150d79] mb-3">🤖 AI recommendations</h3>
        <ul className="space-y-2.5">
          {recommendations.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5" style={{ background: '#2620a8' }}>{i + 1}</span>
              <span className="leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onRetake} className="px-6 py-3 rounded-xl text-sm font-black text-white transition hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#150d79,#2620a8)', boxShadow: '0 8px 20px rgba(38,32,168,0.30)' }}>↻ Retake test</button>
        <button onClick={() => window.print()} className="px-6 py-3 rounded-xl text-sm font-bold transition"
          style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>🖨 Print / save report</button>
      </div>
    </div>
  )
}
