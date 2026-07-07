import { useState, useMemo } from 'react'
import { useAppState, AppClassEvent } from './app-provider'

export function AppSchedule() {
  const { classes, student } = useAppState()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekDays = useMemo(() => {
    const days: { date: string; label: string; classes: AppClassEvent[] }[] = []
    const now = new Date()
    now.setDate(now.getDate() + weekOffset * 7)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayClasses = classes.filter(c => c.date === dateStr)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      days.push({ date: dateStr, label: dayNames[d.getDay()], classes: dayClasses })
    }
    return days
  }, [classes, weekOffset])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black text-white">📅 Schedule</h2>
        <div className="flex gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            ← Prev
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
            style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)' }}>
            Today
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Next →
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {weekDays.map(day => (
          <div key={day.date}
            className="rounded-2xl overflow-hidden transition"
            style={{ background: day.date === today ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${day.date === today ? 'rgba(37,99,235,0.20)' : 'rgba(255,255,255,0.05)'}` }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className={`text-sm font-bold ${day.date === today ? 'text-blue-400' : 'text-white/70'}`}>
                {day.label}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">{day.date}</span>
              {day.date === today && <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold ml-auto">Today</span>}
            </div>
            {day.classes.length === 0 ? (
              <div className="px-4 py-3">
                <p className="text-xs text-gray-600 font-medium">No classes</p>
              </div>
            ) : day.classes.map(cls => {
              const isActive = day.date === today &&
                new Date(`${cls.date}T${cls.startTime}`) <= new Date() &&
                new Date(`${cls.date}T${cls.endTime}`) >= new Date()
              return (
                <div key={cls.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`}
                    style={{ background: isActive ? '#34d399' : '#64748b' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{cls.name}</p>
                    <p className="text-[10px] text-gray-400">{cls.teacher} · Room {cls.room}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-white/80">{cls.startTime}</p>
                    <p className="text-[9px] text-gray-500">{cls.endTime}</p>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => {
                        const roomId = cls.courseId || Number(cls.room) || 0
                        if (roomId > 0) window.open(`${window.location.origin}/?room=${roomId}`, '_blank')
                      }}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white transition"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 2px 8px rgba(34,197,94,0.25)' }}>
                      Join →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Room info */}
      {student?.classroomNum && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.12)' }}>
          <p className="text-xs font-bold text-golden-bright mb-1">🏫 Your Classroom</p>
          <p className="text-sm text-white font-bold">Room {student.classroomNum}</p>
          <p className="text-[10px] text-gray-400">Teacher: {student.teacher} · {student.level || ''}</p>
        </div>
      )}
    </div>
  )
}
