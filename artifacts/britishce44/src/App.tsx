import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './components/providers/auth-provider'
import { LanguageProvider } from './lib/i18n'
import { LoginPage } from './components/auth/login-page'
import { DashboardLayout } from './components/layout/dashboard-layout'
import { StudentAppPage } from './pages/student-app-page'
import { AppDownloadPage } from './pages/app-download-page'
import { WebRTCProvider } from './components/webrtc/webrtc-provider'
import { ClassroomRoom } from './components/classroom/classroom-room'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 2, refetchOnWindowFocus: false },
  },
})

/** Read ?room=N from the URL once */
function getPendingRoom(): number | null {
  const params = new URLSearchParams(window.location.search)
  const val = params.get('room')
  const n = val ? parseInt(val, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

/* ── Simple path-based router ── */
function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return path
}

function MeetingWindow() {
  const [roomId] = useState<number | null>(getPendingRoom)
  const stored = typeof window !== 'undefined' ? localStorage.getItem('b44_user') : null
  const userInfo = stored ? JSON.parse(stored) : null
  return (
    <WebRTCProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: '#080f22' }}>
        <div className="flex-1">
          {roomId ? (
            <ClassroomRoom roomId={roomId} onClose={() => window.close()} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">No classroom specified.</div>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: '#0a0f2a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs text-gray-400">Room {roomId} · {userInfo?.firstName || 'User'}</span>
          <button onClick={() => window.close()}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            ✕ Leave Meeting
          </button>
        </div>
      </div>
    </WebRTCProvider>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()
  const [pendingRoom] = useState<number | null>(getPendingRoom)
  const [isMeetingWindow] = useState(() => new URLSearchParams(window.location.search).get('meeting') === '1')
  const path = usePath()

  /* Meeting window (opened by Electron desktop app) */
  if (isMeetingWindow) {
    return <MeetingWindow />
  }

  /* Student Mobile App — standalone PWA path */
  if (path === '/app') {
    return <StudentAppPage />
  }

  /* App download/install page */
  if (path === '/app-download') {
    return <AppDownloadPage />
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center navy-gradient">
        <div className="text-center">
          <div className="w-16 h-16 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-navy font-black text-2xl">B44</span>
          </div>
          {pendingRoom ? (
            <p className="text-white/70 text-sm">Joining classroom {pendingRoom}…</p>
          ) : (
            <p className="text-white/70 text-sm">Loading Britishce44 Platform...</p>
          )}
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage pendingRoom={pendingRoom} />
  return <DashboardLayout initialRoom={pendingRoom} />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#1d1668', color: '#fff', borderRadius: '12px', fontSize: '14px' },
            }}
          />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
