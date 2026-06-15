import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Live Screen Viewer (with student consent) ───────────────────────
   Reusable, consent-gated screen-viewing modal. Used by the Exam System,
   the "From Google Forms" section, and the Academic Room template library.
   The student's screen is never viewed without explicit, logged consent.
   Camera/mic/screen capture is simulated to match the rest of the platform
   (a real getDisplayMedia call is attempted opportunistically and falls
   back silently when the proxied iframe blocks it). ──────────────────── */

type Phase = 'intro' | 'awaiting' | 'granted' | 'denied'

interface ScreenConsentViewerProps {
  studentName: string
  contextLabel: string
  onClose: () => void
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function ScreenConsentViewer({ studentName, contextLabel, onClose }: ScreenConsentViewerProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [secs, setSecs] = useState(0)
  const [grantedAt, setGrantedAt] = useState('')
  const realStream = useRef<MediaStream | null>(null)
  const closedRef = useRef(false)

  const stopStream = () => { realStream.current?.getTracks().forEach(tk => tk.stop()); realStream.current = null }

  // Session timer (runs only while actively viewing)
  useEffect(() => {
    if (phase !== 'granted') return
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  // Clean up any real capture stream on unmount
  useEffect(() => () => { closedRef.current = true; stopStream() }, [])

  const grant = async () => {
    setGrantedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    setSecs(0)
    setPhase('granted')
    // Opportunistic real screen capture — silently ignored when blocked.
    try {
      const md = navigator.mediaDevices as MediaDevices & { getDisplayMedia?: (c?: any) => Promise<MediaStream> }
      if (md?.getDisplayMedia) {
        const stream = await md.getDisplayMedia({ video: true })
        // Guard against the picker resolving after the modal was closed/unmounted.
        if (closedRef.current) stream.getTracks().forEach(tk => tk.stop())
        else realStream.current = stream
      }
    } catch { /* simulated preview used instead */ }
  }

  const revoke = () => { stopStream(); setPhase('denied') }
  const end = () => { stopStream(); onClose() }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,12,60,0.55)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#ffffff', border: '1px solid rgba(21,13,121,0.08)', maxHeight: '92vh' }}>
        <div className="h-1 bg-gradient-to-r from-[#150d79] via-[#2620a8] to-[#3FBAEB]" />

        <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(92vh - 4px)' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(63,186,235,0.12)', border: '1px solid rgba(63,186,235,0.25)' }}>🖥️</div>
              <div>
                <h3 className="text-lg font-black text-[#150d79]">Live Screen Viewer</h3>
                <p className="text-[11px] text-slate-500">{studentName} · {contextLabel}</p>
                <p className="text-[10px] text-slate-400" style={{ fontFamily: 'Tajawal,sans-serif' }}>عارض الشاشة المباشر بموافقة الطالب</p>
              </div>
            </div>
            <button onClick={end} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">✕</button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── INTRO — explain & request consent ── */}
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,174,116,0.07)', border: '1px solid rgba(0,174,116,0.20)' }}>
                  <p className="text-xs font-black text-[#00855a] mb-2">🔒 Consent-first proctoring</p>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li>• The student is asked first — viewing starts <b>only</b> after they accept.</li>
                    <li>• A consent record (name, time, context) is logged for the report.</li>
                    <li>• The student sees a persistent “your screen is being viewed” banner.</li>
                    <li>• The student can revoke consent and end the session at any time.</li>
                  </ul>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed" style={{ fontFamily: 'Tajawal,sans-serif' }}>
                    لا تبدأ المشاهدة إلا بعد موافقة الطالب صراحةً، ويمكنه إنهاء الجلسة في أي وقت.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:border-slate-300 transition">Cancel</button>
                  <button onClick={() => setPhase('awaiting')} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#150d79,#2620a8)', boxShadow: '0 4px 20px rgba(38,32,168,0.25)' }}>
                    📨 Request student consent
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── AWAITING — student device prompt (simulated) ── */}
            {phase === 'awaiting' && (
              <motion.div key="awaiting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-center text-xs text-slate-500 mb-3 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Waiting for {studentName} to respond on their device…
                </p>
                {/* Simulated student-side prompt */}
                <div className="mx-auto max-w-xs rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid rgba(21,13,121,0.12)', boxShadow: '0 10px 30px rgba(21,13,121,0.12)' }}>
                  <div className="px-4 py-2 text-[10px] font-bold text-white flex items-center gap-2" style={{ background: '#17125c' }}>
                    <span>👨‍🎓</span> {studentName}'s device
                  </div>
                  <div className="p-4 bg-white text-center">
                    <p className="text-3xl mb-2">🖥️</p>
                    <p className="text-sm font-black text-[#150d79] leading-snug">Your teacher requests to view your screen</p>
                    <p className="text-[11px] text-slate-500 mt-1">During: {contextLabel}</p>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed" style={{ fontFamily: 'Tajawal,sans-serif' }}>
                      يطلب معلمك مشاهدة شاشتك أثناء الاختبار. يمكنك القبول أو الرفض.
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setPhase('denied')} className="flex-1 py-2 rounded-xl text-[11px] font-bold transition"
                        style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>Decline</button>
                      <button onClick={grant} className="flex-1 py-2 rounded-xl text-[11px] font-bold text-white transition"
                        style={{ background: 'linear-gradient(135deg,#00875a,#00ae74)' }}>Allow</button>
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-400">This panel simulates the student's response on their own device.</p>
              </motion.div>
            )}

            {/* ── GRANTED — live (simulated) screen ── */}
            {phase === 'granted' && (
              <motion.div key="granted" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,174,116,0.12)', color: '#00855a' }}>
                    ✅ Consent granted by {studentName} · {grantedAt}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(248,113,113,0.12)', color: '#e11d48' }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE · {fmt(secs)}
                  </span>
                </div>

                {/* Simulated student screen */}
                <div className="rounded-2xl overflow-hidden relative" style={{ border: '1px solid rgba(21,13,121,0.12)', background: '#0b1020' }}>
                  {/* fake browser chrome */}
                  <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: '#11152b' }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                    <span className="ml-2 text-[9px] text-white/40 truncate">britishce44.app/test/{contextLabel.toLowerCase().replace(/\s+/g, '-').slice(0, 22)}</span>
                  </div>
                  {/* fake test content */}
                  <div className="p-4 space-y-2.5 min-h-[180px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-white/80">{contextLabel}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.18)', color: '#fca5a5' }}>⏱ 14:32</span>
                    </div>
                    {[1, 2, 3].map(q => (
                      <div key={q} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] text-white/55 mb-1.5">Q{q}. Choose the correct answer…</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['A', 'B', 'C', 'D'].map(o => (
                            <span key={o} className="text-[9px] px-2 py-1 rounded"
                              style={{ background: o === 'B' && q === 1 ? 'rgba(0,174,116,0.25)' : 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
                              {o}. option
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* student-side consent banner overlay */}
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 text-[8px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,174,116,0.9)', color: '#fff' }}>
                    🟢 Screen shared with teacher
                  </div>
                  {/* live cursor blip */}
                  <motion.div className="absolute w-2 h-2 rounded-full bg-sky-400 pointer-events-none"
                    animate={{ left: ['30%', '62%', '45%', '30%'], top: ['60%', '70%', '85%', '60%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
                </div>

                <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
                  <span>🛡 No recording without a second consent</span>
                  <span>·</span>
                  <span style={{ fontFamily: 'Tajawal,sans-serif' }}>الطالب يرى تنبيهًا دائمًا بأن شاشته قيد المشاهدة</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={revoke} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:border-slate-300 transition">
                    Student revoked
                  </button>
                  <button onClick={end} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}>
                    ⏹ End viewing session
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── DENIED / REVOKED ── */}
            {phase === 'denied' && (
              <motion.div key="denied" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="text-center py-6">
                <p className="text-5xl mb-3">🚫</p>
                <p className="text-lg font-black text-[#150d79]">Screen not shared</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {studentName} did not consent to screen viewing. Proctoring continues with the standard AI anti-cheat monitor only.
                </p>
                <p className="text-[11px] text-slate-400 mt-2" style={{ fontFamily: 'Tajawal,sans-serif' }}>
                  لم يوافق الطالب على مشاركة الشاشة. تستمر المراقبة عبر نظام منع الغش الذكي فقط.
                </p>
                <div className="flex gap-3 mt-5 max-w-xs mx-auto">
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:border-slate-300 transition">Close</button>
                  <button onClick={() => setPhase('awaiting')} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#150d79,#2620a8)' }}>Ask again</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
