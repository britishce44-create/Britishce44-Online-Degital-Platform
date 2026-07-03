import { useState, useEffect } from 'react'
import { AppProvider, useAppState } from '@/components/student-app/app-provider'
import { AppLogin } from '@/components/student-app/app-login'
import { AppDashboard } from '@/components/student-app/app-dashboard'
import { AppSchedule } from '@/components/student-app/app-schedule'
import { AppNotifications } from '@/components/student-app/app-notifications'
import { AppWhiteboard } from '@/components/student-app/app-whiteboard'
import { AppLiveClass } from '@/components/student-app/app-live-class'
import { AppChat } from '@/components/student-app/app-chat'
import { AppProfile } from '@/components/student-app/app-profile'
import { AppAlarmManager } from '@/components/student-app/app-alarm'
import { registerSW } from '@/lib/pwa-utils'

type Page = 'dashboard' | 'schedule' | 'notifications' | 'whiteboard' | 'live' | 'chat' | 'profile'

function StudentAppInner() {
  const { student, logout, syncSchedule } = useAppState()
  const [page, setPage] = useState<Page>('dashboard')

  useEffect(() => {
    registerSW()
    /* Check URL for prefill */
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token') || localStorage.getItem('b44_app_token')
    const name = params.get('name') || ''
    if (token) localStorage.setItem('b44_app_token', token)
    setPrefill(name ? { name, token: token || '' } : null)
    setLoading(false)
  }, [])

  const [prefill, setPrefill] = useState<{ name: string; token: string } | null>(null)
  const [loading, setLoading] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#F5C518] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-golden/20">
            <span className="text-xl font-black text-[#17125c]">B44</span>
          </div>
          <p className="text-white/50 text-sm font-medium">Loading Student App…</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return <AppLogin prefill={prefill} onComplete={() => { syncSchedule(); setPage('dashboard') }} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a1628' }}>
      {/* Alarm manager (runs silently) */}
      <AppAlarmManager />

      {/* Page content */}
      {page === 'dashboard' && <AppDashboard onNavigate={setPage} />}
      {page === 'schedule' && <AppSchedule />}
      {page === 'notifications' && <AppNotifications />}
      {page === 'whiteboard' && <AppWhiteboard />}
      {page === 'live' && <AppLiveClass />}
      {page === 'chat' && <AppChat />}
      {page === 'profile' && <AppProfile onLogout={logout} />}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'dashboard' as Page, icon: '🏠', label: 'Home' },
          { id: 'schedule' as Page, icon: '📅', label: 'Classes' },
          { id: 'notifications' as Page, icon: '🔔', label: 'Alerts' },
          { id: 'chat' as Page, icon: '💬', label: 'Chat' },
          { id: 'profile' as Page, icon: '👤', label: 'Profile' },
        ].map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition active:scale-90"
            style={{ background: page === item.id ? 'rgba(37,99,235,0.12)' : 'transparent' }}>
            <span className="text-xl">{item.icon}</span>
            <span className={`text-[9px] font-bold ${page === item.id ? 'text-blue-400' : 'text-gray-500'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export function StudentAppPage() {
  return (
    <AppProvider>
      <StudentAppInner />
    </AppProvider>
  )
}
