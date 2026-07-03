import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FEATURES, modeLabel } from '@/lib/config'
import { useI18n } from '@/lib/i18n'

type State = 'operational' | 'degraded' | 'down'
const STATE_META: Record<State, { label: string; color: string }> = {
  operational: { label: 'Operational', color: '#34d399' },
  degraded: { label: 'Degraded', color: '#fb923c' },
  down: { label: 'Outage', color: '#f87171' },
}

const SERVICES: { name: string; icon: string; state: State; uptime: string; latency: number; onlineOnly?: boolean }[] = [
  { name: 'Virtual Classrooms', icon: '🎥', state: FEATURES.videoClassrooms ? 'operational' : 'degraded', uptime: FEATURES.videoClassrooms ? '99.98%' : '—', latency: FEATURES.videoClassrooms ? 42 : 0, onlineOnly: true },
  { name: 'AI Learning Hub', icon: '🧠', state: FEATURES.ai ? 'operational' : 'degraded', uptime: FEATURES.ai ? '99.87%' : '—', latency: FEATURES.ai ? 95 : 0, onlineOnly: true },
  { name: 'AI Reports', icon: '📊', state: FEATURES.aiReports ? 'operational' : 'degraded', uptime: FEATURES.aiReports ? '99.95%' : '—', latency: FEATURES.aiReports ? 80 : 0, onlineOnly: true },
  { name: 'Google Integrations', icon: '🔗', state: FEATURES.google ? 'operational' : 'degraded', uptime: FEATURES.google ? '99.90%' : '—', latency: FEATURES.google ? 65 : 0, onlineOnly: true },
  { name: 'Authentication', icon: '🔐', state: 'operational', uptime: '100%', latency: 28 },
  { name: 'Exam Engine', icon: '📝', state: 'operational', uptime: '99.95%', latency: 51 },
  { name: 'In-Class Assessment', icon: '✍️', state: 'operational', uptime: '100%', latency: 15 },
  { name: 'Teacher Evaluation', icon: '⭐', state: 'operational', uptime: '100%', latency: 18 },
  { name: 'Placement Test', icon: '🎯', state: 'operational', uptime: '100%', latency: 10 },
  { name: 'CE4 Messenger', icon: '💬', state: 'operational', uptime: '99.98%', latency: 25 },
  { name: 'Notifications', icon: '🔔', state: 'operational', uptime: '99.93%', latency: 60 },
  { name: 'Database', icon: '🗄️', state: 'operational', uptime: '100%', latency: 12 },
]

const INCIDENTS = [
  { date: 'Jun 8', title: 'CE4 Messenger elevated latency', state: 'degraded' as State, body: 'Investigating slow message delivery during peak hours. Mitigation deployed; monitoring.' },
  { date: 'Jun 2', title: 'Scheduled maintenance — CDN upgrade', state: 'operational' as State, body: 'Completed successfully. Video load times improved ~30%.' },
  { date: 'May 27', title: 'Brief auth disruption', state: 'operational' as State, body: 'Resolved within 8 minutes. Root cause: certificate rotation. Safeguards added.' },
]

function UptimeBars({ down }: { down: number[] }) {
  return (
    <div className="flex items-end gap-[2px] h-6">
      {Array.from({ length: 40 }).map((_, i) => {
        const isDown = down.includes(i)
        return <div key={i} className="flex-1 rounded-sm" style={{ height: '100%', background: isDown ? '#fb923c' : '#34d399', opacity: isDown ? 0.9 : 0.55 }} />
      })}
    </div>
  )
}

export function StatusPage() {
  const { t } = useI18n()
  const [now, setNow] = useState(new Date().toLocaleTimeString())
  useEffect(() => { const i = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000); return () => clearInterval(i) }, [])

  const allUp = SERVICES.every(s => s.state === 'operational')
  const banner = allUp ? STATE_META.operational : STATE_META.degraded

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">🟢 {t('nav.statuspage')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Live system health & incident history</p>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">Updated {now}</span>
      </div>

      {/* Mode banner */}
      <div className="rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
        style={{ background: `linear-gradient(120deg,${FEATURES.onlineMode ? '#34d399' : '#3b82f6'}22,rgba(26, 19, 92,0.7))`, border: `1px solid ${FEATURES.onlineMode ? '#34d399' : '#3b82f6'}40` }}>
        <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: FEATURES.onlineMode ? '#34d399' : '#3b82f6' }} />
        <div>
          <p className="text-base font-black text-white">{modeLabel()}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {FEATURES.onlineMode
              ? 'All features enabled – AI, Google, and Video classrooms available'
              : 'Core features only – AI, Google, and Video classrooms gracefully disabled'}
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="grid sm:grid-cols-2 gap-3">
        {SERVICES.map((s, i) => {
          const effectiveState = s.onlineOnly && FEATURES.localMode ? 'down' : s.state
          const m = STATE_META[effectiveState]
          const label = s.onlineOnly && FEATURES.localMode ? 'Unavailable' : m.label
          return (
            <motion.div key={s.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${m.color}22`, opacity: s.onlineOnly && FEATURES.localMode ? 0.55 : 1 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{s.icon}</span>
                  <p className="text-xs font-bold text-white">{s.name}</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: m.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />{label}
                </span>
              </div>
              <UptimeBars down={effectiveState === 'degraded' ? [33, 35, 36] : effectiveState === 'down' ? [5, 10, 15, 20, 25, 30, 35] : []} />
              <div className="flex items-center justify-between mt-2 text-[9px] text-gray-500">
                <span>{s.onlineOnly && FEATURES.localMode ? 'Needs online hosting' : `Uptime ${s.uptime}`}</span><span>{s.onlineOnly && FEATURES.localMode ? '' : `${s.latency} ms`}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Incidents */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(37,99,235,0.1)' }}>
          <p className="text-xs font-bold text-white">📜 Incident History</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(37,99,235,0.06)' }}>
          {INCIDENTS.map((inc, i) => {
            const m = STATE_META[inc.state]
            return (
              <div key={i} className="px-4 py-3 flex gap-3">
                <div className="text-[9px] text-gray-600 font-mono w-12 flex-shrink-0 pt-0.5">{inc.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    <p className="text-[11px] font-bold text-white">{inc.title}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{inc.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
