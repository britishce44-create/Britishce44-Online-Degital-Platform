import { useState, useEffect } from 'react'
import { useMaintenanceMode } from '../maintenance/maintenance-provider'
import { useI18n } from '@/lib/i18n'

interface TopBarProps {
  user: { firstName: string; lastName: string; role: string; email?: string } | null
  onLogout: () => void
  onToggleSidebar: () => void
}

export function TopBar({ user, onLogout, onToggleSidebar }: TopBarProps) {
  const [time, setTime] = useState(new Date())
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor'
  const { isMaintenanceMode, toggleMaintenance, isSaving, showDesignKit, setShowDesignKit } = useMaintenanceMode()
  const { t, lang, toggleLang, locked } = useI18n()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="h-14 bg-[#17125c] flex items-center justify-between px-4 flex-shrink-0 z-30 relative select-none">
      {/* Accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-700 via-sky-500 to-emerald-400" />

      {/* Left: Logo + toggle */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar}
          className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <span className="text-white font-black text-xs">B</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#17125c] animate-pulse" />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-wide">Britishce44</span>
            <p className="text-[9px] text-blue-300/50 leading-none hidden md:block">{t('chrome.platformTag')}</p>
          </div>
        </div>

        {/* Maintenance mode badge */}
        {isMaintenanceMode && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 text-[10px] font-bold tracking-wide">{t('topbar.maintenanceMode')}</span>
          </div>
        )}
      </div>

      {/* Center: Clock */}
      <div className="hidden md:flex flex-col items-center">
        <span className="text-white font-mono text-sm font-semibold tracking-wider">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-gray-500 text-[9px]">
          {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        {!locked ? (
          <button onClick={toggleLang} title={t('common.language')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white/5 text-gray-300 border border-white/10 hover:border-emerald-400/40 hover:text-emerald-400 transition">
            <span>🌐</span>
            <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
        ) : (
          <span title={t('common.englishLocked')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-300/70 border border-blue-500/20 cursor-default">
            <span>🔒</span><span>EN</span>
          </span>
        )}

        {isAdmin && (
          <>
            {isMaintenanceMode && (
              <button onClick={() => setShowDesignKit(!showDesignKit)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition shadow-lg
                  ${showDesignKit
                    ? 'bg-blue-600 text-white shadow-blue-600/30'
                    : 'bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20'}`}>
                <span>🎨</span>
                <span>{t('topbar.designStudio')}</span>
              </button>
            )}
            <button onClick={toggleMaintenance}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition
                ${isMaintenanceMode
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-amber-400 hover:border-amber-400/30'}`}>
              {isSaving ? (
                <><span className="animate-spin">⚙</span><span>{t('topbar.deploying')}</span></>
              ) : (
                <><span>🔧</span><span>{isMaintenanceMode ? t('topbar.exitMaintenance') : t('topbar.maintenance')}</span></>
              )}
            </button>
          </>
        )}

        {user && (
          <>
            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-full transition text-sm" title={t('topbar.notifications')}>
              🔔
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                <span className="text-white font-bold text-[10px]">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-xs font-semibold leading-none">{user.firstName} {user.lastName}</p>
                <p className="text-[8px] text-blue-300/60 leading-none mt-0.5 uppercase tracking-widest">{t(`role.${user.role}`)}</p>
              </div>
            </div>
            <button onClick={onLogout}
              className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 text-[10px] px-2.5 py-1.5 rounded-full border border-white/10 hover:border-red-400/30 transition font-medium">
              {t('topbar.logout')}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
