import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './components/providers/auth-provider'
import { LanguageProvider } from './lib/i18n'
import { LoginPage } from './components/auth/login-page'
import { DashboardLayout } from './components/layout/dashboard-layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 2, refetchOnWindowFocus: false },
  },
})

/** Read ?room=N from the URL once — returns the room id or null */
function getPendingRoom(): number | null {
  const params = new URLSearchParams(window.location.search)
  const val = params.get('room')
  const n = val ? parseInt(val, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

function AppContent() {
  const { user, isLoading } = useAuth()
  // Capture ?room=N once at mount — survives login redirect
  const [pendingRoom] = useState<number | null>(getPendingRoom)

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
