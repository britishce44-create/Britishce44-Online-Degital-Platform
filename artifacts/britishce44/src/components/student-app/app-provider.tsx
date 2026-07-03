import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { requestNotificationPermission, scheduleAlarm } from '@/lib/pwa-utils'

/* ── Types ── */
export interface AppStudentData {
  id: number; name: string; email: string; phone: string
  teacher: string; classroomNum: number; level: string
  startTime: string; endTime: string; startDate: string; endDate: string
  permissions: string[]; settings: Record<string, boolean>
  dashboardConfig: Record<string, boolean>
  token: string
}

export interface AppClassEvent {
  id: string; name: string; teacher: string; room: number
  startTime: string; endTime: string; date: string
}

interface AppNotification {
  id: string; title: string; body: string; time: string; read: boolean; type: 'class' | 'message' | 'announcement' | 'alert'
}

interface AppState {
  student: AppStudentData | null
  classes: AppClassEvent[]
  notifications: AppNotification[]
  unreadCount: number
  online: boolean
}

interface AppContextType extends AppState {
  setStudent: (s: AppStudentData) => void
  logout: () => void
  addNotification: (n: AppNotification) => void
  markRead: (id: string) => void
  setOnline: (v: boolean) => void
  syncSchedule: () => Promise<void>
  refreshConfig: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [student, setStudentState] = useState<AppStudentData | null>(() => {
    const s = localStorage.getItem('b44_app_student')
    return s ? JSON.parse(s) : null
  })
  const [classes, setClasses] = useState<AppClassEvent[]>(() => {
    const c = localStorage.getItem('b44_app_classes')
    return c ? JSON.parse(c) : []
  })
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const n = localStorage.getItem('b44_app_notifications')
    return n ? JSON.parse(n) : []
  })
  const [online, setOnlineState] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnlineState(true)
    const off = () => setOnlineState(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const setStudent = useCallback((s: AppStudentData) => {
    setStudentState(s)
    localStorage.setItem('b44_app_student', JSON.stringify(s))
  }, [])

  const logout = useCallback(() => {
    setStudentState(null)
    localStorage.removeItem('b44_app_student')
    localStorage.removeItem('b44_app_token')
  }, [])

  const addNotification = useCallback((n: AppNotification) => {
    setNotifications(prev => [n, ...prev])
    localStorage.setItem('b44_app_notifications', JSON.stringify([n, ...notifications]))
  }, [notifications])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const setOnline = useCallback((v: boolean) => setOnlineState(v), [])

  const syncSchedule = useCallback(async () => {
    try {
      const token = localStorage.getItem('b44_app_token')
      if (!token) return
      const res = await fetch('/api/v1/classroom-assessment/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const fetched: AppClassEvent[] = data.classes || []
      setClasses(fetched)
      localStorage.setItem('b44_app_classes', JSON.stringify(fetched))

      /* Schedule alarms for upcoming classes */
      const now = Date.now()
      for (const cls of fetched) {
        const classTime = new Date(`${cls.date}T${cls.startTime}`).getTime()
        const alertTime = classTime - 5 * 60 * 1000
        if (alertTime > now) {
          scheduleAlarm(cls.id, alertTime, 'Class Starting Soon!', `${cls.name} with ${cls.teacher} in 5 minutes`)
        }
      }
    } catch {}
  }, [])

  const refreshConfig = useCallback(async () => {
    try {
      const token = localStorage.getItem('b44_app_token')
      if (!token || !student) return
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.user) {
        const updated = { ...student, permissions: data.user.permissions || [], settings: data.user.settings || {}, dashboardConfig: data.user.dashboardConfig || {} }
        setStudent(updated)
      }
    } catch {}
  }, [student, setStudent])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      student, classes, notifications, unreadCount, online,
      setStudent, logout, addNotification, markRead, setOnline, syncSchedule, refreshConfig,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
