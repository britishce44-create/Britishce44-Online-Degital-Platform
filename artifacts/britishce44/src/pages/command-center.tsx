import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const KPIS = [
  { label: 'Active Students', value: '1,284', delta: '+6.2%', up: true, color: '#2563eb' },
  { label: 'Monthly Revenue', value: '$18.4k', delta: '+11.8%', up: true, color: '#00ae74' },
  { label: 'Retention Rate', value: '93.1%', delta: '+1.4%', up: true, color: '#34d399' },
  { label: 'Churn Risk', value: '37', delta: '-9', up: true, color: '#f87171' },
]

const FORECAST = [62, 68, 71, 75, 80, 84, 89, 95, 101, 108, 114, 122]
const ACTUAL = [60, 66, 70, 73, 78, 81, 86, 90, 0, 0, 0, 0]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CHURN = [
  { name: 'Omar Al-Hadi', grade: 'G8', risk: 84, reason: 'Attendance ↓ 40% · 2 missed exams', color: '#f87171' },
  { name: 'Lina Saeed', grade: 'G6', risk: 71, reason: 'No login 9 days · fee overdue', color: '#fb923c' },
  { name: 'Yusuf Nasser', grade: 'G9', risk: 66, reason: 'Performance dropped 2 levels', color: '#fb923c' },
  { name: 'Maha Tariq', grade: 'G5', risk: 58, reason: 'Low engagement in live classes', color: '#fbbf24' },
]

const SIGNALS = [
  { icon: '📉', text: 'Grade 7 cohort engagement dipped 12% this week', tone: '#f87171' },
  { icon: '🚀', text: 'Speaking-club students renew 2.3× more often', tone: '#34d399' },
  { icon: '💡', text: 'Predicted: +84 enrollments if Aug placement opens early', tone: '#00ae74' },
]

export function CommandCenterPage() {
  const { t } = useI18n()
  const [tick, setTick] = useState(0)
  useEffect(() => { const i = setInterval(() => setTick(x => x + 1), 4000); return () => clearInterval(i) }, [])
  const max = Math.max(...FORECAST)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📊 {t('nav.commandcenter')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Predictive intelligence — revenue, retention & churn forecasting</p>
        </div>
        <span className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(52,211,153,0.8)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Models synced {tick * 4 % 60}s ago
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIS.map(k => (
          <div key={k.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${k.color}20` }}>
            <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg,transparent,${k.color},transparent)` }} />
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{k.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: k.up ? '#34d399' : '#f87171', background: k.up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
              {k.delta} {k.up ? '↑' : '↓'}
            </span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Forecast chart */}
        <div className="md:col-span-2 rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0, 174, 116,0.18)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white">💰 Revenue Forecast (AI projection)</p>
            <div className="flex items-center gap-3 text-[9px]">
              <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-500" />Actual</span>
              <span className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-full" style={{ background: '#2563eb' }} />Projected</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {FORECAST.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative h-full justify-end">
                <div className="w-full rounded-t" style={{ height: `${(v / max) * 100}%`, background: 'linear-gradient(to top,rgba(37,99,235,0.2),rgba(37,99,235,0.5))' }} />
                {ACTUAL[i] > 0 && (
                  <div className="absolute bottom-0 w-full rounded-t" style={{ height: `${(ACTUAL[i] / max) * 100}%`, background: 'linear-gradient(to top,#00ae74,#009e69)' }} />
                )}
                <span className="text-[7px] text-gray-600">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI signals */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <p className="text-xs font-bold text-white mb-3">🤖 AI Signals</p>
          <div className="space-y-2.5">
            {SIGNALS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-xl p-3 flex gap-2.5" style={{ background: `${s.tone}10`, border: `1px solid ${s.tone}25` }}>
                <span className="text-sm">{s.icon}</span>
                <p className="text-[10px] text-gray-300 leading-relaxed">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Churn watch */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(248,113,113,0.18)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(248,113,113,0.1)' }}>
          <p className="text-xs font-bold text-white">⚠️ Churn Watch — students needing attention</p>
          <span className="text-[9px] text-gray-500">Ranked by predicted risk</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(248,113,113,0.06)' }}>
          {CHURN.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                style={{ background: c.color }}>{c.risk}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{c.name} <span className="text-gray-600 font-normal">· {c.grade}</span></p>
                <p className="text-[10px] text-gray-500">{c.reason}</p>
              </div>
              <button className="text-[10px] font-bold px-3 py-1.5 rounded-full text-white flex-shrink-0"
                style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>Intervene</button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
