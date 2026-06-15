import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface User {
  id: string; email: string; firstName: string; lastName: string;
  role: 'admin' | 'supervisor' | 'teacher' | 'student' | 'parent';
  phone?: string; grade?: number; classroomId?: number;
}

interface AuthContextType {
  user: User | null; isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void; register: (data: Partial<User> & { password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('b44_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('b44_user') }
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
    localStorage.setItem('b44_token', data.accessToken)
    localStorage.setItem('b44_user', JSON.stringify(data.user))
    setUser(data.user)
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
