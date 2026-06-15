import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CARD = 'rgba(11,22,62,0.85)'
const BORDER = 'rgba(37,99,235,0.18)'
const GOLD = '#00ae74'
const ROYAL = '#2563eb'

interface Detection { name: string; desc: string; descAr: string; icon: string; active: boolean; sensitivity: 'high'|'medium'|'low'; triggered: number }
interface Session { id: string; student: string; exam: string; room: string; risk: 'critical'|'high'|'medium'|'low'; flags: string[]; time: string }
interface Alert { id: string; msg: string; severity: 'critical'|'warn'|'info'; time: string }

const SYSTEMS: Detection[] = [
  { name: 'Tab Switch Detection',    desc: 'Detects when the student leaves the exam tab', descAr: 'يكتشف مغادرة تبويب الاختبار', icon: '🔄', active: true,  sensitivity: 'high',   triggered: 14 },
  { name: 'Screen Recording Block',  desc: 'Prevents screen capture during live exam',    descAr: 'يمنع تصوير الشاشة',             icon: '🚫', active: true,  sensitivity: 'high',   triggered:  8 },
  { name: 'AI Webcam Proctoring',    desc: 'Webcam-based behaviour & identity analysis',  descAr: 'مراقبة كاميرا الويب بالذكاء',  icon: '👁', active: true,  sensitivity: 'high',   triggered:  3 },
  { name: 'Keystroke Pattern AI',    desc: 'Detects copy-paste and anomalous typing',     descAr: 'يحلّل النمط الكتابي والنسخ',   icon: '⌨️', active: true,  sensitivity: 'medium', triggered: 21 },
  { name: 'IP & Device Fingerprint', desc: 'Flags multiple devices or location changes',  descAr: 'يرصد تغيير الجهاز أو الموقع',  icon: '🌐', active: true,  sensitivity: 'medium', triggered:  5 },
  { name: 'Time Anomaly AI',         desc: 'Flags suspiciously rapid exam completions',   descAr: 'يرصد سرعة الإجابة الغير طبيعية',icon: '⏱', active: false, sensitivity: 'low',    triggered:  2 },
]

const FLAGGED: Session[] = [
  { id: 's1', student: 'Omar Al-Yahia',   exam: 'Model A — Quiz 1', room: 'Room 12', risk: 'critical', flags: ['Tab switch x4', 'Face not visible'], time: '10:14' },
  { id: 's2', student: 'Hana Al-Rashid',  exam: 'Model B — Final',  room: 'Room 7',  risk: 'high',     flags: ['Clipboard paste detected'],           time: '10:09' },
  { id: 's3', student: 'Kareem Yousef',   exam: 'Model A — Quiz 2', room: 'Room 19', risk: 'high',     flags: ['IP location changed'],                time: '09:55' },
  { id: 's4', student: 'Lina Al-Farsi',   exam: 'Model C — Midterm',room: 'Room 3',  risk: 'medium',   flags: ['Typing speed anomaly'],               time: '09:42' },
  { id: 's5', student: 'Rami Hassan',     exam: 'Model D — Quiz 1', room: 'Room 25', risk: 'medium',   flags: ['Tab switch x1'],                      time: '09:31' },
]

const INIT_ALERTS: Alert[] = [
  { id: 'a1', msg: 'Critical: Omar Al-Yahia — face not visible for 45 seconds', severity: 'critical', time: '10:14' },
  { id: 'a2', msg: 'High: Clipboard paste detected in Room 7 — Hana Al-Rashid',  severity: 'warn',     time: '10:09' },
  { id: 'a3', msg: 'IP location changed for Kareem Yousef (Room 19)',             severity: 'warn',     time: '09:55' },
  { id: 'a4', msg: 'AI proctoring active on 38 concurrent exam sessions',         severity: 'info',     time: '09:30' },
]

const RISK_CFG = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Critical' },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  label: 'High'     },
  medium:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', label: 'Medium'   },
  low:      { color: '#34d399', bg: 'rgba(52,211,153,0.10)', label: 'Low'      },
}

const SENS_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#34d399' }

export function AnticheatPage() {
  const [systems, setSystems] = useState(SYSTEMS)
  const [alerts, setAlerts] = useState(INIT_ALERTS)

  useEffect(() => {
    const t = setInterval(() => {
      setAlerts(prev => [{
        id: `a${Date.now()}`,
        msg: ['Keystroke pattern anomaly detected — Room 8', 'Screen resize event flagged — Room 14', 'AI proctoring confidence 99.2% — all clear'][Math.floor(Math.random() * 3)],
        severity: (['warn', 'info', 'critical'] as const)[Math.floor(Math.random() * 3)],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev.slice(0, 7)])
    }, 6000)
    return () => clearInterval(t)
  }, [])

  const activeCount = systems.filter(s => s.active).length
  const totalFlags = systems.reduce((a, s) => a + s.triggered, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">🤖 AI Anti-Cheat Monitor</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.55)' }}>
            Real-time AI detection protecting exam integrity across all rooms
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Monitoring Active
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Systems Active',    value: `${activeCount}/6`, icon: '🛡', color: '#34d399' },
          { label: 'Flagged Today',     value: FLAGGED.length,     icon: '🚩', color: '#f87171' },
          { label: 'Total Detections',  value: totalFlags,         icon: '⚡', color: GOLD      },
          { label: 'Sessions Monitored',value: 38,                 icon: '👁', color: ROYAL     },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg,transparent,${k.color},transparent)` }} />
            <span className="text-xl">{k.icon}</span>
            <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] font-semibold text-white mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Detection systems */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(147,197,253,0.45)' }}>Detection Systems</p>
          {systems.map((sys, i) => (
            <div key={sys.name} className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: CARD, border: `1px solid ${sys.active ? BORDER : 'rgba(255,255,255,0.05)'}` }}>
              <span className="text-xl flex-shrink-0">{sys.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-white">{sys.name}</p>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: `${SENS_COLOR[sys.sensitivity]}15`, color: SENS_COLOR[sys.sensitivity] }}>
                    {sys.sensitivity}
                  </span>
                </div>
                <p className="text-[9px] mt-0.5" style={{ color: 'rgba(147,197,253,0.45)' }}>{sys.desc}</p>
                <p className="text-[9px]" style={{ color: 'rgba(147,197,253,0.30)', fontFamily: 'Tajawal, sans-serif' }}>{sys.descAr}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => setSystems(s => s.map((x, j) => j === i ? { ...x, active: !x.active } : x))}
                  className="w-10 h-5 rounded-full relative transition-all"
                  style={{ background: sys.active ? '#2620a8' : 'rgba(255,255,255,0.10)', border: `1px solid ${sys.active ? ROYAL : 'rgba(255,255,255,0.15)'}` }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{ background: sys.active ? '#3b82f6' : 'rgba(255,255,255,0.3)', left: sys.active ? '20px' : '2px', boxShadow: sys.active ? '0 0 6px #3b82f680' : undefined }} />
                </button>
                {sys.triggered > 0 && (
                  <span className="text-[9px] font-bold" style={{ color: sys.active ? '#f87171' : 'rgba(107,114,128,0.4)' }}>
                    {sys.triggered} flags
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: flagged sessions + live alerts */}
        <div className="space-y-4">
          {/* Flagged sessions */}
          <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold text-white">🚩 Flagged Sessions</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                {FLAGGED.length} active
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {FLAGGED.map(s => {
                const cfg = RISK_CFG[s.risk]
                return (
                  <div key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold text-white truncate flex-1 mr-2">{s.student}</p>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p className="text-[9px] mb-1.5" style={{ color: 'rgba(147,197,253,0.45)' }}>{s.exam} · {s.room}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.flags.map(f => (
                        <span key={f} className="text-[8px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.7)', border: '1px solid rgba(248,113,113,0.15)' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live alert feed */}
          <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-bold text-white">Live Alert Feed</p>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: BORDER }}>
              <AnimatePresence initial={false}>
                {alerts.slice(0, 8).map(a => {
                  const c = a.severity === 'critical' ? '#f87171' : a.severity === 'warn' ? '#fbbf24' : '#3b82f6'
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}
                      className="px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: c }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] leading-snug" style={{ color: 'rgba(255,255,255,0.70)' }}>{a.msg}</p>
                          <p className="text-[8px] mt-0.5" style={{ color: 'rgba(107,114,128,0.5)' }}>{a.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
