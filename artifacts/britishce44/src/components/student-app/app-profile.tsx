import { useAppState } from './app-provider'

interface Props {
  onLogout: () => void
}

export function AppProfile({ onLogout }: Props) {
  const { student, online } = useAppState()

  return (
    <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">
      {/* Avatar & name */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-3xl text-white font-bold mb-3 shadow-xl">
          {student?.name?.charAt(0) || '?'}
        </div>
        <h2 className="text-xl font-black text-white">{student?.name || 'Student'}</h2>
        <p className="text-xs text-gray-400 font-medium">{student?.email}</p>
      </div>

      {/* Details */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Phone', value: student?.phone || '—' },
          { label: 'Teacher', value: student?.teacher || '—' },
          { label: 'Classroom', value: student?.classroomNum ? `Room ${student.classroomNum}` : '—' },
          { label: 'Level', value: student?.level || '—' },
          { label: 'Class Time', value: student?.startTime && student?.endTime ? `${student.startTime} — ${student.endTime}` : '—' },
          { label: 'Date Range', value: student?.startDate && student?.endDate ? `${student.startDate} → ${student.endDate}` : '—' },
          { label: 'Connection', value: online ? 'Online' : 'Offline' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span className="text-xs text-gray-400 font-medium">{item.label}</span>
            <span className="text-xs font-bold text-white">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Permissions */}
      {student?.permissions && student.permissions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 mb-2 px-1">Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {student.permissions.map(p => (
              <span key={p} className="text-[9px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(37,99,235,0.08)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.15)' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* App info */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] text-gray-500">Britishce44 Student App v1.0</p>
        <p className="text-[10px] text-gray-600">Pre-configured for {student?.name}</p>
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        className="w-full py-3.5 rounded-xl text-sm font-bold transition"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
        🚪 Sign Out
      </button>
    </div>
  )
}
