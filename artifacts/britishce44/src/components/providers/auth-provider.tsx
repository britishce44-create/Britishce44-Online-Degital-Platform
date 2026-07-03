import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

export interface NewcomerData {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  city: string;
  country: string;
  gmail: string;
  callPhone: string;
  whatsappPhone: string;
  registeredAt: string;
  status: 'waiting' | 'in-interview' | 'completed' | 'enrolled';
}

interface User {
  id: string; email: string; firstName: string; lastName: string;
  role: 'admin' | 'supervisor' | 'teacher' | 'student' | 'parent' | 'newcomer';
  phone?: string; grade?: number; classroomId?: number;
  dashboardConfig?: Record<string, boolean>;
  newcomerData?: NewcomerData;
}

interface AuthContextType {
  user: User | null; isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void; register: (data: Partial<User> & { password: string }) => Promise<void>;
  registerNewcomer: (data: NewcomerData) => Promise<void>;
  getNewcomers: () => NewcomerData[];
  updateNewcomerStatus: (id: string, status: NewcomerData['status']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('b44_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Newcomer registrations are form submissions only — do not restore as logged-in user.
        if (parsed?.role === 'newcomer') {
          localStorage.removeItem('b44_user')
        } else {
          setUser(parsed)
        }
      } catch { localStorage.removeItem('b44_user') }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) throw new Error('Invalid credentials')
    const data = await response.json()
    const userWithConfig = {
      ...data.user,
      dashboardConfig: data.dashboardConfig ?? Object.fromEntries(
        ['overview','courses','schedule','tasks','notifications','recentActivity','performance','attendance','messages','announcements'].map(k => [k, true])
      ),
    }
    localStorage.setItem('b44_token', data.accessToken)
    localStorage.setItem('b44_user', JSON.stringify(userWithConfig))
    setUser(userWithConfig)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('b44_user')
    localStorage.removeItem('b44_token')
    setUser(null)
  }, [])

  const register = useCallback(async (data: Partial<User> & { password: string }) => {
    const response = await fetch('/api/v1/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Registration failed')
    }
  }, [])

  const registerNewcomer = useCallback(async (data: NewcomerData) => {
    const id = `newcomer-${Date.now()}`
    const newcomer: NewcomerData = { ...data, id }
    const existing = JSON.parse(localStorage.getItem('b44_newcomers') || '[]')
    existing.push(newcomer)
    localStorage.setItem('b44_newcomers', JSON.stringify(existing))
    // Do NOT set as current user — newcomer registration is just a form submission.
    // The user should stay on the login page to sign in with their credentials.
  }, [])

  const getNewcomers = useCallback((): NewcomerData[] => {
    return JSON.parse(localStorage.getItem('b44_newcomers') || '[]')
  }, [])

  const updateNewcomerStatus = useCallback((id: string, status: NewcomerData['status']) => {
    const existing: NewcomerData[] = JSON.parse(localStorage.getItem('b44_newcomers') || '[]')
    const updated = existing.map(n => n.id === id ? { ...n, status } : n)
    localStorage.setItem('b44_newcomers', JSON.stringify(updated))
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, registerNewcomer, getNewcomers, updateNewcomerStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
