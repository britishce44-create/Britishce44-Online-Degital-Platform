
import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'
import { MaintenanceProvider } from '@/components/maintenance/maintenance-provider'
import { DesignStudioKit } from '@/components/maintenance/design-studio-kit'
import { DashboardPage } from '@/pages/dashboard'
import { ClassroomsPage } from '@/pages/classrooms'
import { MessengerPage } from '@/pages/messenger'
import { ExamSystemPage } from '@/pages/exam-system'
import { HomeworkPage } from '@/pages/homework'
import { VideoArchivePage } from '@/pages/video-archive'
import { TeacherEvalPage } from '@/pages/teacher-eval'
import { DailyPerfPage } from '@/pages/daily-perf'
import { ReportsPage } from '@/pages/reports'
import { AnticheatPage } from '@/pages/anticheat'
import { PlacementsPage } from '@/pages/placements'
import { SettingsPage } from '@/pages/settings'
import { UsersPage } from '@/pages/users'
import { LiveAnalyticsPage } from '@/pages/live-analytics'
import { AiDevPage } from '@/pages/ai-dev'
import { MarketingPage } from '@/pages/marketing'
import { AutoMessagingPage } from '@/pages/auto-messaging'
import { VideoEditorPage } from '@/pages/video-editor'
import { AcademicRoomPage } from '@/pages/academic-room'
import { GoogleFormsPage } from '@/pages/google-forms'
import { AssessmentPage } from '@/pages/assessment'
import { CalendarPage } from '@/pages/calendar'
import { TasksPage } from '@/pages/tasks'
import { NotificationsPage } from '@/pages/notifications'
import { GlobalSearchPage } from '@/pages/global-search'
import { AiLearningPage } from '@/pages/ai-learning'
import { CommandCenterPage } from '@/pages/command-center'
import { DownloadCenterPage } from '@/pages/download-center'
import { ParentPortalPage } from '@/pages/parent-portal'
import { CompliancePage } from '@/pages/compliance'
import { StatusPage } from '@/pages/status-page'
import { ClassroomRoom } from '@/components/classroom/classroom-room'

export type PageKey =
  | 'dashboard' | 'classrooms' | 'users' | 'teachers' | 'students' | 'mystudents'
  | 'ce4messenger' | 'examsystem' | 'placementtest' | 'teachereval' | 'dailyperf'
  | 'automessaging' | 'marketing' | 'videoeditor' | 'reports' | 'anticheat'
  | 'subscriptions' | 'liveanalytics' | 'homework' | 'chat' | 'meetlive'
  | 'videoarchive' | 'examroom' | 'aidev' | 'settings' | 'academicroom'
  | 'notifications' | 'globalsearch' | 'ailearning' | 'commandcenter'
  | 'downloadcenter' | 'parentportal' | 'compliance' | 'statuspage'
  | 'assessment' | 'calendar' | 'tasks' | 'googleforms'

function DashboardInner() {
  const { user, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [classroomOpen, setClassroomOpen] = useState<number | null>(null)

  const renderPage = () => {
    if (classroomOpen !== null) {
      return <ClassroomRoom roomId={classroomOpen} onClose={() => setClassroomOpen(null)} />
    }
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'classrooms': return <ClassroomsPage onEnterClassroom={(id) => setClassroomOpen(id)} />
      case 'users': return <UsersPage />
      case 'ce4messenger': return <MessengerPage />
      case 'examsystem': return <ExamSystemPage />
      case 'placementtest': return <PlacementsPage />
      case 'teachereval': return <TeacherEvalPage />
      case 'dailyperf': return <DailyPerfPage />
      case 'homework': return <HomeworkPage />
      case 'videoarchive': return <VideoArchivePage />
      case 'reports': return <ReportsPage />
      case 'anticheat': return <AnticheatPage />
      case 'liveanalytics': return <LiveAnalyticsPage />
      case 'settings': return <SettingsPage />
      case 'aidev': return <AiDevPage />
      case 'marketing': return <MarketingPage />
      case 'automessaging': return <AutoMessagingPage />
      case 'videoeditor': return <VideoEditorPage />
      case 'academicroom': return <AcademicRoomPage />
      case 'googleforms': return <GoogleFormsPage />
      case 'assessment': return <AssessmentPage />
      case 'calendar': return <CalendarPage />
      case 'tasks': return <TasksPage />
      case 'notifications': return <NotificationsPage />
      case 'globalsearch': return <GlobalSearchPage />
      case 'ailearning': return <AiLearningPage />
      case 'commandcenter': return <CommandCenterPage />
      case 'downloadcenter': return <DownloadCenterPage />
      case 'parentportal': return <ParentPortalPage />
      case 'compliance': return <CompliancePage />
      case 'statuspage': return <StatusPage />
      default: return <DashboardPage />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-futuristic">
      <TopBar
        user={user}
        onLogout={logout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          userRole={user?.role || 'student'}
          currentPage={currentPage}
          onNavigate={(page) => { setCurrentPage(page); setSidebarOpen(false) }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto custom-scroll relative">
          {/* Subtle grid overlay for futuristic feel */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: 'linear-gradient(rgba(63, 186, 235,1) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 186, 235,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }} />
          <div className="relative z-10 p-4 md:p-6">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Design Studio Kit — floats over everything */}
      <DesignStudioKit />
    </div>
  )
}

export function DashboardLayout() {
  return (
    <MaintenanceProvider>
      <DashboardInner />
    </MaintenanceProvider>
  )
}
