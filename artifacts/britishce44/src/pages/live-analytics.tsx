import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Simulated live data with intervals
function useLiveValue(base: number, variance: number) {
  const [val, setVal] = useState(base)
  useEffect(() => {
    const t = setInterval(() => {
      setVal(Math.max(0, base + Math.round((Math.random() - 0.5) * variance)))
    }, 2800)
    return () => clearInterval(t)
  }, [base, variance])
  return val
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 80 - 10
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }} />
    </svg>
  )
}

function LiveKPI({ label, value, change, color, sparkData, unit = '' }: {
  label: string; value: number; change: string; color: string; sparkData: number[]; unit?: string
}) {
  return (
    <div className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${color}20` }}>
      <div className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">{change}</span>
      </div>
      <p className="text-2xl font-black" style={{ color }}>{value}{unit}</p>
      <SparkLine data={sparkData} color={color} />
    </div>
  )
}

const HOURS = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`)
const HOURLY_BASE = [8, 22, 35, 55, 72, 88, 90, 85, 78, 64, 42, 18]
const CLASSROOM_DATA = [
  { id: 1, subject: 'Mathematics G5', teacher: 'Suhair Almojahid', students: 18, status: 'live', quality: 96, duration: '01:23' },
  { id: 2, subject: 'English G7', teacher: "Wa'ad Alhammadi", students: 22, status: 'live', quality: 88, duration: '00:47' },
  { id: 3, subject: 'Science G6', teacher: 'Jamal Alshameeri', students: 15, status: 'live', quality: 92, duration: '02:05' },
  { id: 4, subject: 'History G8', teacher: 'Hassan Almakhlafi', students: 20, status: 'live', quality: 79, duration: '00:31' },
  { id: 5, subject: 'ICT G9', teacher: 'Nadia Alqaiti', students: 17, status: 'live', quality: 95, duration: '01:12' },
]
const EVENTS = [
  { time: '18:21', event: 'Student joined Classroom #3', type: 'join', color: '#34d399' },
  { time: '18:20', event: 'Exam #12 started — G7 English', type: 'exam', color: '#3b82f6' },
  { time: '18:18', event: 'Arabic alert: Ahmed in Classroom #1', type: 'alert', color: '#f87171' },
  { time: '18:15', event: 'Recording started — Classroom #5', type: 'record', color: '#00ae74' },
  { time: '18:12', event: 'New homework submitted — Sara G9', type: 'hw', color: '#67e8f9' },
  { time: '18:09', event: 'Teacher Suhair entered Classroom #1', type: 'join', color: '#34d399' },
  { time: '18:05', event: 'AI Evaluation completed — Score 91%', type: 'ai', color: '#7dd3fc' },
]

export function LiveAnalyticsPage() {
  const activeUsers = useLiveValue(42, 8)
  const liveClassrooms = useLiveValue(5, 2)
  const examsRunning = useLiveValue(7, 3)
  const submissions = useLiveValue(156, 15)

  const sparkA = Array.from({ length: 10 }, (_, i) => 35 + i * 3 + Math.round(Math.random() * 6))
  const sparkB = Array.from({ length: 10 }, (_, i) => 3 + (i % 3))
  const sparkC = Array.from({ length: 10 }, (_, i) => 5 + (i % 4))
  const sparkD = Array.from({ length: 10 }, (_, i) => 140 + i * 1.5 + Math.round(Math.random() * 8))

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📡 Live Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time platform metrics — auto-refresh every 3 seconds</p>
        </div>
        <div className="flex items-center gap-2 text-xs"
          style={{ color: 'rgba(52,211,153,0.8)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">{currentTime}</span>
          <span className="text-gray-600">· Live</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <LiveKPI label="Active Users" value={activeUsers} change="+8% today" color="#3b82f6" sparkData={sparkA} />
        <LiveKPI label="Live Classrooms" value={liveClassrooms} change="↑ 2 joined" color="#34d399" sparkData={sparkB} />
        <LiveKPI label="Exams Running" value={examsRunning} change="steady" color="#7dd3fc" sparkData={sparkC} />
        <LiveKPI label="Submissions Today" value={submissions} change="+23%" color="#00ae74" sparkData={sparkD} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Hourly activity bar chart */}
        <div className="md:col-span-2 rounded-2xl p-4"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white">⏰ Hourly Platform Activity</p>
            <span className="text-[9px] text-gray-600">Today</span>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {HOURLY_BASE.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t relative overflow-hidden"
                  style={{ height: `${v}%`, background: 'linear-gradient(to top,rgba(37,99,235,0.45),rgba(27,62,166,0.75))' }}>
                  {i === 5 || i === 6 ? (
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,#2620a8,#2563eb)', boxShadow: '0 0 8px rgba(37,99,235,0.5)' }} />
                  ) : null}
                </div>
                <span className="text-[7px] text-gray-600">{HOURS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geo distribution */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <p className="text-xs font-bold text-white mb-3">🌍 User Geography</p>
          <div className="space-y-2.5">
            {[
              { flag: '🇾🇪', country: 'Yemen',        pct: 78, color: '#2563eb' },
              { flag: '🇸🇦', country: 'Saudi Arabia', pct: 12, color: '#00ae74' },
              { flag: '🇦🇪', country: 'UAE',           pct: 6,  color: '#34d399' },
              { flag: '🌐', country: 'Other',          pct: 4,  color: '#6b7280' },
            ].map(g => (
              <div key={g.country} className="flex items-center gap-2">
                <span className="text-sm">{g.flag}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px] text-gray-400">{g.country}</span>
                    <span className="text-[9px] font-bold text-white">{g.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${g.pct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ background: g.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Live classrooms table */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(52,211,153,0.12)' }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(52,211,153,0.08)' }}>
            <p className="text-xs font-bold text-white">🔴 Live Classrooms ({liveClassrooms})</p>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(52,211,153,0.06)' }}>
            {CLASSROOM_DATA.slice(0, liveClassrooms).map(c => (
              <div key={c.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{c.subject}</p>
                  <p className="text-[9px] text-gray-500">{c.teacher} · 👥 {c.students}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-emerald-400 font-mono">{c.duration}</p>
                  <p className="text-[9px] text-gray-600">Quality {c.quality}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live event feed */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(63, 186, 235,0.12)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(63, 186, 235,0.08)' }}>
            <p className="text-xs font-bold text-white">⚡ Live Event Feed</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(63, 186, 235,0.06)' }}>
            {EVENTS.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="px-4 py-2.5 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/80 truncate">{e.event}</p>
                </div>
                <span className="text-[9px] text-gray-600 font-mono flex-shrink-0">{e.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
