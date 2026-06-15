import { useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const FRAMEWORKS = [
  { name: 'GDPR', region: 'EU data protection', status: 'Compliant', pct: 100, color: '#34d399' },
  { name: 'FERPA', region: 'Student education records', status: 'Compliant', pct: 100, color: '#34d399' },
  { name: 'COPPA', region: "Children's online privacy", status: 'Compliant', pct: 96, color: '#34d399' },
  { name: 'ISO 27001', region: 'Information security', status: 'In review', pct: 78, color: '#fb923c' },
]

const CONTROLS = [
  { icon: '🔐', title: 'End-to-end encryption', body: 'All classroom video & messages encrypted in transit (TLS 1.3) and at rest (AES-256).', on: true },
  { icon: '🧹', title: 'Data retention policy', body: 'Recordings auto-deleted after 180 days unless flagged for academic review.', on: true },
  { icon: '👁️', title: 'Parental consent gating', body: 'Guardians approve data processing for students under 13 before activation.', on: true },
  { icon: '📤', title: 'Right to export & erase', body: 'Users can download or permanently delete their personal data on request.', on: true },
  { icon: '📝', title: 'Audit logging', body: 'Every admin action recorded with actor, timestamp & IP for accountability.', on: true },
  { icon: '🌍', title: 'Data residency', body: 'Primary data stored in-region; cross-border transfers use standard contractual clauses.', on: false },
]

const REQUESTS = [
  { type: 'Data export', user: 'Guardian — Sara A.', status: 'Completed', color: '#34d399', time: '2 days ago' },
  { type: 'Account deletion', user: 'Student — Omar H.', status: 'Processing', color: '#fb923c', time: '5h ago' },
  { type: 'Consent update', user: 'Guardian — Lina S.', status: 'Completed', color: '#34d399', time: '1 week ago' },
]

export function CompliancePage() {
  const { t } = useI18n()
  const [controls, setControls] = useState(CONTROLS)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-gradient-aurora">🛡️ {t('nav.compliance')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Privacy, security & data governance — built for trust</p>
      </div>

      {/* Frameworks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FRAMEWORKS.map((f, i) => (
          <motion.div key={f.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${f.color}22` }}>
            <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg,transparent,${f.color},transparent)` }} />
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-white">{f.name}</p>
              <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ color: f.color, background: `${f.color}1a` }}>{f.status}</span>
            </div>
            <p className="text-[9px] text-gray-500 mt-0.5">{f.region}</p>
            <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${f.pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: f.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Controls */}
        <div className="md:col-span-2 rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <p className="text-xs font-bold text-white mb-3">⚙️ Privacy & Security Controls</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {controls.map((c, idx) => (
              <div key={c.title} className="rounded-xl p-3 flex gap-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-base flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-white">{c.title}</p>
                    <button onClick={() => setControls(cs => cs.map((x, i) => i === idx ? { ...x, on: !x.on } : x))}
                      className="w-8 h-4 rounded-full relative transition-all flex-shrink-0" style={{ background: c.on ? '#34d399' : 'rgba(255,255,255,0.1)' }}>
                      <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: c.on ? '17px' : '2px' }} />
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data requests */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0, 174, 116,0.18)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0, 174, 116,0.1)' }}>
            <p className="text-xs font-bold text-white">📋 Data Subject Requests</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(0, 174, 116,0.06)' }}>
            {REQUESTS.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-white">{r.type}</p>
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ color: r.color, background: `${r.color}1a` }}>{r.status}</span>
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5">{r.user} · {r.time}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(0, 174, 116,0.06)' }}>
            <p className="text-[9px] text-gray-600 text-center">Avg. response time: 1.4 days · SLA: 30 days</p>
          </div>
        </div>
      </div>
    </div>
  )
}
