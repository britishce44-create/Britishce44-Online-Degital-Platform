import { useEffect } from 'react'
import { useAppState } from './app-provider'
import { AppSchedule } from './app-schedule'
import { AppNotifications } from './app-notifications'

interface Props {
  onNavigate: (page: string) => void
}

export function AppDashboard({ onNavigate }: Props) {
  const { student, classes, notifications, unreadCount, online, syncSchedule, syncAssignments, refreshConfig } = useAppState()

  useEffect(() => {
    syncSchedule()
    syncAssignments()
    refreshConfig()
    const interval = setInterval(() => { syncSchedule(); syncAssignments(); refreshConfig() }, 60000)
    return () => clearInterval(interval)
  }, [syncSchedule, syncAssignments, refreshConfig])

  const nextClass = classes
    .filter(c => new Date(`${c.date}T${c.startTime}`) > new Date())
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())[0]

  const todayClasses = classes.filter(c => c.date === new Date().toISOString().slice(0, 10))

  return (
    <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">
      {/* Offline banner */}
      {!online && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 bg-red-500/10 border border-red-500/20">
          <span className="text-lg">📡</span>
          <div>
            <p className="text-sm font-bold text-red-400">You are offline</p>
            <p className="text-xs text-red-300/70">Connect to the internet for full functionality</p>
          </div>
        </div>
      )}

      {/* Welcome card */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', boxShadow: '0 8px 24px rgba(30,58,138,0.35)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #D4A017 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative">
          <p className="text-xs text-golden-bright/80 font-semibold mb-1">Welcome back,</p>
          <h2 className="text-xl font-black text-white">{student?.name || 'Student'}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">
              {student?.classroomNum ? `Room ${student.classroomNum}` : 'No room assigned'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">
              {student?.teacher || 'No teacher'}
            </span>
          </div>
        </div>
      </div>

      {/* Next class countdown */}
      {nextClass && (
        <button onClick={() => onNavigate('schedule')} className="w-full rounded-2xl p-4 text-left transition active:scale-[0.98]"
          style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.20)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-golden-bright">⬆ Next Class</span>
            <span className="text-[10px] text-gray-400">{nextClass.date}</span>
          </div>
          <p className="text-base font-black text-white">{nextClass.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{nextClass.startTime} — {nextClass.endTime} · {nextClass.teacher}</p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full" style={{ width: '30%', background: 'linear-gradient(90deg, #D4A017, #F5C518)' }} />
          </div>
          <p className="text-[10px] text-golden-bright/60 mt-1 font-medium">Class starts in a few hours</p>
        </button>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📅', label: 'Schedule', page: 'schedule', color: '#3b82f6' },
          { icon: '🔔', label: 'Notifications', page: 'notifications', color: '#D4A017', badge: unreadCount || undefined },
          { icon: '🎥', label: 'Live Class', page: 'live', color: '#22c55e' },
          { icon: '💬', label: 'Messages', page: 'chat', color: '#a855f7' },
          { icon: '✏️', label: 'Whiteboard', page: 'whiteboard', color: '#f97316' },
          { icon: '👤', label: 'Profile', page: 'profile', color: '#64748b' },
        ].map(btn => (
          <button key={btn.page} onClick={() => onNavigate(btn.page)}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 transition active:scale-95 relative"
            style={{ background: `${btn.color}10`, border: `1px solid ${btn.color}20` }}>
            <span className="text-2xl">{btn.icon}</span>
            <span className="text-[10px] font-bold text-white/70">{btn.label}</span>
            {btn.badge && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {btn.badge > 9 ? '9+' : btn.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Today's classes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Today's Classes</h3>
          <button onClick={() => onNavigate('schedule')} className="text-[10px] text-blue-400 font-semibold">View All →</button>
        </div>
        {todayClasses.length === 0 ? (
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-gray-500">No classes scheduled for today</p>
          </div>
        ) : todayClasses.map(cls => (
          <div key={cls.id} className="rounded-xl p-3 mb-2 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg flex-shrink-0">📚</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{cls.name}</p>
              <p className="text-[10px] text-gray-400">{cls.startTime} — {cls.endTime} · Room {cls.room}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.10)', color: '#34d399', border: '1px solid rgba(34,197,94,0.20)' }}>
              {new Date(`${cls.date}T${cls.startTime}`) > new Date() ? 'Upcoming' : 'Now'}
            </span>
          </div>
        ))}
      </div>

      {/* Unread notifications summary */}
      {unreadCount > 0 && (
        <button onClick={() => onNavigate('notifications')} className="w-full rounded-xl p-3 flex items-center gap-3 transition active:scale-98"
          style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)' }}>
          <span className="text-xl">🔔</span>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-golden-bright">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
            <p className="text-[10px] text-gray-500 font-medium">Tap to view</p>
          </div>
          <span className="text-golden-bright">→</span>
        </button>
      )}
    </div>
  )
}
