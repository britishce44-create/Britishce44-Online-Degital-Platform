import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { apiGet, ApiError, type CalendarEvent } from '@/lib/api'

const TYPE_STYLE: Record<string, { color: string; icon: string }> = {
  reminder: { color: '#3FBAEB', icon: '⏰' },
  milestone: { color: '#00AE74', icon: '🎯' },
  assessment: { color: '#a78bfa', icon: '📋' },
  exam: { color: '#f87171', icon: '📝' },
  default: { color: '#94a3b8', icon: '📅' },
}
const styleFor = (t: string | null) => TYPE_STYLE[t ?? 'default'] ?? TYPE_STYLE.default

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiGet<{ events: CalendarEvent[] }>('/calendar')
      setEvents(d.events)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const k = e.date.slice(0, 10)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(e)
    }
    return m
  }, [events])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = ymd(new Date())

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const upcoming = useMemo(() => {
    return [...events]
      .filter(e => e.date.slice(0, 10) >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8)
  }, [events, todayKey])

  const selectedEvents = selected ? byDate.get(selected) ?? [] : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📅 Academic Calendar</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assessment milestones, reminders &amp; school events — auto-synced to Google Calendar once connected.</p>
        </div>
        <button onClick={load}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white"
          style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.3)' }}>↻ Refresh</button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Month grid */}
        <div className="lg:col-span-2 rounded-2xl p-4"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-lg text-white hover:bg-white/10 transition">‹</button>
            <p className="text-sm font-bold text-white">{MONTHS[month]} {year}</p>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-lg text-white hover:bg-white/10 transition">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(d => <div key={d} className="text-center text-[9px] font-bold text-gray-500 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day == null) return <div key={`e${i}`} />
              const key = ymd(new Date(year, month, day))
              const dayEvents = byDate.get(key) ?? []
              const isToday = key === todayKey
              const isSel = key === selected
              return (
                <button key={key} onClick={() => setSelected(isSel ? null : key)}
                  className="aspect-square rounded-lg p-1 flex flex-col items-center transition relative"
                  style={{
                    background: isSel ? 'rgba(63,186,235,0.18)' : isToday ? 'rgba(0,174,116,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isToday ? 'rgba(0,174,116,0.4)' : isSel ? 'rgba(63,186,235,0.4)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-emerald-300' : 'text-gray-300'}`}>{day}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map(e => (
                      <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: styleFor(e.type).color }} />
                    ))}
                  </div>
                  {dayEvents.length > 3 && <span className="text-[7px] text-gray-500">+{dayEvents.length - 3}</span>}
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[11px] font-bold text-white mb-2">{selected}</p>
              {selectedEvents.length === 0 && <p className="text-[10px] text-gray-500">No events.</p>}
              <div className="space-y-2">
                {selectedEvents.map(e => (
                  <div key={e.id} className="flex items-start gap-2.5 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-sm">{styleFor(e.type).icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white">{e.title}</p>
                      {e.description && <p className="text-[9px] text-gray-500">{e.description}</p>}
                    </div>
                    {e.googleEventId && <span className="text-[8px] text-emerald-400">✓ synced</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming agenda */}
        <div className="rounded-2xl overflow-hidden self-start"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0,174,116,0.18)' }}>
          <div className="px-4 py-3 text-xs font-bold text-emerald-400 border-b" style={{ borderColor: 'rgba(0,174,116,0.1)' }}>
            Upcoming
          </div>
          {loading && <div className="px-4 py-6 text-center text-[11px] text-gray-500">Loading…</div>}
          {!loading && upcoming.length === 0 && <div className="px-4 py-6 text-center text-[11px] text-gray-500">No upcoming events.</div>}
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {upcoming.map((e, i) => {
              const st = styleFor(e.type)
              return (
                <motion.div key={e.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${st.color}1a`, border: `1px solid ${st.color}33` }}>{st.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-white">{e.title}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{e.date.slice(0, 10)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
