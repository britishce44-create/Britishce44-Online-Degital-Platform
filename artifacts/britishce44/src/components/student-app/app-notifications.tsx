import { useAppState } from './app-provider'

export function AppNotifications() {
  const { notifications, markRead } = useAppState()

  const typeIcon: Record<string, string> = {
    class: '📚', message: '💬', announcement: '📢', alert: '⚠️',
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">
      <h2 className="text-lg font-black text-white mb-3">🔔 Notifications</h2>
      {notifications.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-3xl mb-2">🔕</p>
          <p className="text-sm font-bold text-gray-400">No notifications</p>
          <p className="text-xs text-gray-600 mt-1">You're all caught up!</p>
        </div>
      ) : notifications.map(n => (
        <button key={n.id} onClick={() => markRead(n.id)}
          className="w-full rounded-2xl p-4 text-left transition active:scale-[0.99]"
          style={{
            background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(37,99,235,0.06)',
            border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.15)'}`,
          }}>
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{typeIcon[n.type] || '📌'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-sm font-bold truncate ${n.read ? 'text-white/60' : 'text-white'}`}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
              </div>
              <p className={`text-xs ${n.read ? 'text-gray-500' : 'text-gray-300'}`}>{n.body}</p>
              <p className="text-[9px] text-gray-600 mt-1.5 font-medium">{n.time}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
