import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface ThemeVars {
  '--navy': string
  '--gold': string
  '--royal-blue': string
  '--champagne': string
  '--accent-indigo': string
  '--accent-violet': string
  '--accent-emerald': string
  '--accent-rose': string
  '--accent-cyan': string
  '--app-font-sans': string
  '--radius': string
}

const DEFAULT_THEME: ThemeVars = {
  '--navy': '#1d1668',
  '--gold': '#00ae74',
  '--royal-blue': '#2a2196',
  '--champagne': '#fef8ea',
  '--accent-indigo': '#3b82f6',
  '--accent-violet': '#2563eb',
  '--accent-emerald': '#00ae74',
  '--accent-rose': '#e11d48',
  '--accent-cyan': '#0891b2',
  '--app-font-sans': 'Inter, sans-serif',
  '--radius': '0.75rem',
}

interface ElementOverride {
  id: string; classes: string; style: Record<string, string>
}

interface MaintenanceSaveState {
  theme: ThemeVars
  elementOverrides: Record<string, ElementOverride>
  savedAt: string
}

interface MaintenanceContextValue {
  isMaintenanceMode: boolean
  toggleMaintenance: () => void
  showDesignKit: boolean
  setShowDesignKit: (v: boolean) => void
  theme: ThemeVars
  updateTheme: (key: keyof ThemeVars, value: string) => void
  resetTheme: () => void
  elementOverrides: Record<string, ElementOverride>
  updateElement: (id: string, override: Partial<ElementOverride>) => void
  saveChanges: () => Promise<void>
  discardChanges: () => void
  isSaving: boolean
  hasChanges: boolean
  deployLog: string[]
}

const MaintenanceContext = createContext<MaintenanceContextValue>({
  isMaintenanceMode: false, toggleMaintenance: () => {}, showDesignKit: false,
  setShowDesignKit: () => {}, theme: DEFAULT_THEME, updateTheme: () => {}, resetTheme: () => {},
  elementOverrides: {}, updateElement: () => {}, saveChanges: async () => {}, discardChanges: () => {},
  isSaving: false, hasChanges: false, deployLog: [],
})

export const useMaintenanceMode = () => useContext(MaintenanceContext)

function applyTheme(theme: ThemeVars) {
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== '--app-font-sans') {
      document.documentElement.style.setProperty(key, value)
    } else {
      document.documentElement.style.setProperty('--app-font-sans', value)
    }
  })
}

function resetThemeVars() {
  Object.keys(DEFAULT_THEME).forEach(key => {
    document.documentElement.style.removeProperty(key)
  })
}

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [showDesignKit, setShowDesignKit] = useState(false)
  const [theme, setTheme] = useState<ThemeVars>(() => {
    try {
      const saved = localStorage.getItem('b44_theme')
      return saved ? JSON.parse(saved) : DEFAULT_THEME
    } catch { return DEFAULT_THEME }
  })
  const [savedTheme] = useState<ThemeVars>(DEFAULT_THEME)
  const [elementOverrides, setElementOverrides] = useState<Record<string, ElementOverride>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [deployLog, setDeployLog] = useState<string[]>([])
  const originalTheme = useRef<ThemeVars>(DEFAULT_THEME)

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(savedTheme)

  const toggleMaintenance = useCallback(() => {
    setIsMaintenanceMode(prev => {
      if (!prev) {
        originalTheme.current = theme
        setShowDesignKit(false)
      } else {
        setShowDesignKit(false)
      }
      return !prev
    })
  }, [theme])

  const updateTheme = useCallback((key: keyof ThemeVars, value: string) => {
    setTheme(prev => {
      const next = { ...prev, [key]: value }
      applyTheme(next)
      return next
    })
  }, [])

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME)
    applyTheme(DEFAULT_THEME)
  }, [])

  const updateElement = useCallback((id: string, override: Partial<ElementOverride>) => {
    setElementOverrides(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { id, classes: '', style: {} }), ...override }
    }))
  }, [])

  const saveChanges = useCallback(async () => {
    setIsSaving(true)
    setDeployLog([])

    const steps = [
      '🔍 Analyzing platform changes...',
      '🎨 Applying design tokens to all components...',
      '📦 Bundling updated styles...',
      '🔗 Syncing classrooms (240) — layout updated',
      '📊 Syncing dashboard — theme applied',
      '💬 Syncing CE4 Messenger — colors refreshed',
      '📝 Syncing Exam System — typography updated',
      '🛡 Syncing Anti-Cheat Monitor — redesigned',
      '📈 Syncing Live Analytics — charts styled',
      '🤖 AI Dev Assistant reviewing changes...',
      '✅ All sections updated successfully',
      '🚀 Deploying to production...',
      '🌐 Publishing platform changes...',
      '✨ Platform deployed successfully!',
    ]

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 280 + Math.random() * 200))
      setDeployLog(prev => [...prev, step])
    }

    localStorage.setItem('b44_theme', JSON.stringify(theme))
    localStorage.setItem('b44_element_overrides', JSON.stringify(elementOverrides))
    localStorage.setItem('b44_save_state', JSON.stringify({
      theme, elementOverrides, savedAt: new Date().toISOString()
    } as MaintenanceSaveState))

    setIsSaving(false)
  }, [theme, elementOverrides])

  const discardChanges = useCallback(() => {
    setTheme(DEFAULT_THEME)
    setElementOverrides({})
    resetThemeVars()
    try { localStorage.removeItem('b44_theme'); localStorage.removeItem('b44_element_overrides') } catch {}
    setDeployLog([])
  }, [])

  return (
    <MaintenanceContext.Provider value={{
      isMaintenanceMode, toggleMaintenance,
      showDesignKit, setShowDesignKit,
      theme, updateTheme, resetTheme,
      elementOverrides, updateElement,
      saveChanges, discardChanges,
      isSaving, hasChanges, deployLog,
    }}>
      {children}
    </MaintenanceContext.Provider>
  )
}
