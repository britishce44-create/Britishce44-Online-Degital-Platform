import { PageKey } from './dashboard-layout'
import { useMaintenanceMode } from '../maintenance/maintenance-provider'
import { useI18n } from '@/lib/i18n'

interface NavItem { page: PageKey; icon: string; label: string; color?: string }
interface SidebarProps {
  userRole: string; currentPage: PageKey; onNavigate: (page: PageKey) => void
  isOpen: boolean; onClose: () => void
}

const adminItems: NavItem[] = [
  { page: 'dashboard', icon: '🏠', label: 'nav.dashboard', color: 'from-blue-500 to-blue-600' },
  { page: 'classrooms', icon: '🚪', label: 'nav.classrooms', color: 'from-blue-600 to-blue-700' },
  { page: 'users', icon: '👥', label: 'nav.users', color: 'from-sky-500 to-sky-600' },
  { page: 'ce4messenger', icon: '💬', label: 'nav.messenger', color: 'from-emerald-500 to-emerald-600' },
  { page: 'examsystem', icon: '📝', label: 'nav.exams', color: 'from-sky-500 to-sky-600' },
  { page: 'placementtest', icon: '🎯', label: 'nav.placement', color: 'from-orange-500 to-orange-600' },
  { page: 'teachereval', icon: '⭐', label: 'nav.teachereval', color: 'from-yellow-500 to-yellow-600' },
  { page: 'dailyperf', icon: '📋', label: 'nav.dailyperf', color: 'from-cyan-500 to-cyan-600' },
  { page: 'assessment', icon: '✍️', label: 'nav.assessment', color: 'from-sky-500 to-cyan-600' },
  { page: 'automessaging', icon: '🤖', label: 'nav.automessaging', color: 'from-sky-500 to-sky-600' },
  { page: 'marketing', icon: '📢', label: 'nav.marketing', color: 'from-pink-500 to-pink-600' },
  { page: 'videoeditor', icon: '🎬', label: 'nav.videoeditor', color: 'from-rose-500 to-rose-600' },
  { page: 'reports', icon: '📊', label: 'nav.reports', color: 'from-teal-500 to-teal-600' },
  { page: 'anticheat', icon: '🛡️', label: 'nav.anticheat', color: 'from-red-500 to-red-600' },
  { page: 'homework', icon: '📄', label: 'nav.homework', color: 'from-lime-500 to-lime-600' },
  { page: 'videoarchive', icon: '🎞️', label: 'nav.videoarchive', color: 'from-fuchsia-500 to-fuchsia-600' },
  { page: 'liveanalytics', icon: '📈', label: 'nav.liveanalytics', color: 'from-green-500 to-green-600' },
  { page: 'commandcenter', icon: '📊', label: 'nav.commandcenter', color: 'from-indigo-500 to-indigo-600' },
  { page: 'globalsearch', icon: '🔎', label: 'nav.globalsearch', color: 'from-blue-500 to-blue-600' },
  { page: 'notifications', icon: '🔔', label: 'nav.notifications', color: 'from-sky-500 to-blue-600' },
  { page: 'ailearning', icon: '🧠', label: 'nav.ailearning', color: 'from-violet-500 to-purple-600' },
  { page: 'parentportal', icon: '👨‍👩‍👧', label: 'nav.parentportal', color: 'from-pink-500 to-rose-600' },
  { page: 'academicroom', icon: '🏛️', label: 'nav.academicroom', color: 'from-emerald-500 to-teal-600' },
  { page: 'googleforms', icon: '📋', label: 'nav.googleforms', color: 'from-violet-500 to-purple-600' },
  { page: 'calendar', icon: '📅', label: 'nav.calendar', color: 'from-blue-500 to-indigo-600' },
  { page: 'tasks', icon: '✅', label: 'nav.tasks', color: 'from-emerald-500 to-green-600' },
  { page: 'aidev', icon: '🧠', label: 'nav.aidev', color: 'from-blue-500 to-indigo-600' },
  { page: 'settings', icon: '⚙️', label: 'nav.settings', color: 'from-gray-500 to-gray-600' },
  { page: 'compliance', icon: '🛡️', label: 'nav.compliance', color: 'from-emerald-500 to-teal-600' },
  { page: 'statuspage', icon: '🟢', label: 'nav.statuspage', color: 'from-green-500 to-emerald-600' },
  { page: 'downloadcenter', icon: '⬇️', label: 'nav.downloadcenter', color: 'from-blue-500 to-cyan-600' },
]

const teacherItems: NavItem[] = [
  { page: 'dashboard', icon: '🏠', label: 'nav.dashboard', color: 'from-blue-500 to-blue-600' },
  { page: 'classrooms', icon: '🚪', label: 'nav.myClassrooms', color: 'from-blue-600 to-blue-700' },
  { page: 'dailyperf', icon: '📋', label: 'nav.myPerformance', color: 'from-cyan-500 to-cyan-600' },
  { page: 'assessment', icon: '✍️', label: 'nav.assessment', color: 'from-sky-500 to-cyan-600' },
  { page: 'reports', icon: '📊', label: 'nav.myReports', color: 'from-teal-500 to-teal-600' },
  { page: 'calendar', icon: '📅', label: 'nav.calendar', color: 'from-blue-500 to-indigo-600' },
  { page: 'tasks', icon: '✅', label: 'nav.tasks', color: 'from-emerald-500 to-green-600' },
  { page: 'homework', icon: '📄', label: 'nav.homework', color: 'from-lime-500 to-lime-600' },
  { page: 'ce4messenger', icon: '💬', label: 'nav.messenger', color: 'from-emerald-500 to-emerald-600' },
  { page: 'videoarchive', icon: '🎞️', label: 'nav.videoarchive', color: 'from-fuchsia-500 to-fuchsia-600' },
  { page: 'globalsearch', icon: '🔎', label: 'nav.globalsearch', color: 'from-blue-500 to-blue-600' },
  { page: 'notifications', icon: '🔔', label: 'nav.notifications', color: 'from-sky-500 to-blue-600' },
  { page: 'statuspage', icon: '🟢', label: 'nav.statuspage', color: 'from-green-500 to-emerald-600' },
  { page: 'downloadcenter', icon: '⬇️', label: 'nav.downloadcenter', color: 'from-blue-500 to-cyan-600' },
]

const studentItems: NavItem[] = [
  { page: 'dashboard', icon: '🏠', label: 'nav.myDashboard', color: 'from-blue-500 to-blue-600' },
  { page: 'classrooms', icon: '🚪', label: 'nav.classroomsPlain', color: 'from-blue-600 to-blue-700' },
  { page: 'ailearning', icon: '🧠', label: 'nav.ailearning', color: 'from-violet-500 to-purple-600' },
  { page: 'examsystem', icon: '📝', label: 'nav.myExams', color: 'from-sky-500 to-sky-600' },
  { page: 'placementtest', icon: '🎯', label: 'nav.placement', color: 'from-orange-500 to-orange-600' },
  { page: 'homework', icon: '📄', label: 'nav.homework', color: 'from-lime-500 to-lime-600' },
  { page: 'ce4messenger', icon: '💬', label: 'nav.messenger', color: 'from-emerald-500 to-emerald-600' },
  { page: 'globalsearch', icon: '🔎', label: 'nav.globalsearch', color: 'from-blue-500 to-blue-600' },
  { page: 'notifications', icon: '🔔', label: 'nav.notifications', color: 'from-sky-500 to-blue-600' },
  { page: 'downloadcenter', icon: '⬇️', label: 'nav.downloadcenter', color: 'from-blue-500 to-cyan-600' },
]

const parentItems: NavItem[] = [
  { page: 'dashboard', icon: '🏠', label: 'nav.myDashboard', color: 'from-blue-500 to-blue-600' },
  { page: 'parentportal', icon: '👨‍👩‍👧', label: 'nav.parentportal', color: 'from-pink-500 to-rose-600' },
  { page: 'ce4messenger', icon: '💬', label: 'nav.messenger', color: 'from-emerald-500 to-emerald-600' },
  { page: 'notifications', icon: '🔔', label: 'nav.notifications', color: 'from-sky-500 to-blue-600' },
  { page: 'reports', icon: '📊', label: 'nav.reports', color: 'from-teal-500 to-teal-600' },
  { page: 'statuspage', icon: '🟢', label: 'nav.statuspage', color: 'from-green-500 to-emerald-600' },
  { page: 'downloadcenter', icon: '⬇️', label: 'nav.downloadcenter', color: 'from-blue-500 to-cyan-600' },
]

const SECTION_DIVIDERS: Partial<Record<PageKey, string>> = {
  examsystem: 'section.academicTools',
  automessaging: 'section.aiMarketing',
  reports: 'section.analytics',
  commandcenter: 'section.experience',
  academicroom: 'section.management',
  aidev: 'section.platformAdmin',
  compliance: 'section.trust',
}

export function Sidebar({ userRole, currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const items = userRole === 'admin' || userRole === 'supervisor' ? adminItems
    : userRole === 'teacher' ? teacherItems
    : userRole === 'parent' ? parentItems
    : studentItems

  const { isMaintenanceMode, setShowDesignKit, showDesignKit } = useMaintenanceMode()
  const { t } = useI18n()
  const isAdmin = userRole === 'admin' || userRole === 'supervisor'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        w-64 flex-shrink-0 flex flex-col z-20 transition-transform duration-300
        bg-[#17125c] border-r border-white/5
        fixed lg:relative h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-2xl shadow-black/50
      `}>

        {/* Brand header */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <span className="text-white font-black text-sm">B</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">Britishce44</p>
              <p className="text-[9px] text-blue-300/50 mt-0.5">
                {t(`role.${userRole}`)} {t('chrome.portal')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scroll space-y-0.5">
          {items.map(item => {
            const divider = SECTION_DIVIDERS[item.page]
            const isActive = currentPage === item.page
            return (
              <div key={item.page}>
                {divider && (
                  <div className="px-3 pt-4 pb-1.5">
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{t(divider)}</p>
                  </div>
                )}
                <button
                  onClick={() => { onNavigate(item.page); onClose() }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-700/70 to-blue-600/40 text-white shadow-lg shadow-blue-600/10'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition
                    ${isActive
                      ? `bg-gradient-to-br ${item.color || 'from-blue-500 to-blue-600'} shadow-sm`
                      : 'bg-white/5 group-hover:bg-white/10'}`}>
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-medium truncate flex-1">{t(item.label)}</span>
                  {isActive && <span className="w-1 h-5 rounded-full bg-emerald-400 flex-shrink-0" />}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Maintenance mode tools in sidebar */}
        {isMaintenanceMode && isAdmin && (
          <div className="px-2 pb-2 shrink-0">
            <button onClick={() => setShowDesignKit(!showDesignKit)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all
                ${showDesignKit
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20'}`}>
              <span className="text-base">🎨</span>
              <span className="text-[11px] font-bold">{t('topbar.designStudio')}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0
              ${userRole === 'admin' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                : userRole === 'teacher' ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                : 'bg-gradient-to-br from-emerald-400 to-emerald-600'}`}>
              {userRole.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">{t(`role.${userRole}`)}</p>
              <p className="text-[8px] text-gray-600">Platform v2.1</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
