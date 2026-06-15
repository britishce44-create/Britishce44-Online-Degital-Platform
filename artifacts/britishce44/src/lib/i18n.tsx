import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/components/providers/auth-provider'

export type Lang = 'en' | 'ar'

const STORAGE_KEY = 'b44_lang'

/**
 * English-only lock.
 * Students studying Basic 4 and above study fully in English — for them the
 * platform disables the Arabic translator and stays in English only.
 * Tunable single source of truth: change this threshold to match the centre's
 * level numbering (User.grade is the numeric level).
 */
export const BASIC_ENGLISH_LOCK_LEVEL = 4

export function isEnglishLocked(
  user: { role?: string; grade?: number } | null | undefined,
): boolean {
  if (!user) return false
  if (user.role !== 'student') return false
  return (user.grade ?? 0) >= BASIC_ENGLISH_LOCK_LEVEL
}

type Entry = { en: string; ar: string }

const T: Record<string, Entry> = {
  /* ── roles ── */
  'role.admin': { en: 'Admin', ar: 'مدير' },
  'role.supervisor': { en: 'Supervisor', ar: 'مشرف' },
  'role.teacher': { en: 'Teacher', ar: 'معلم' },
  'role.student': { en: 'Student', ar: 'طالب' },
  'role.parent': { en: 'Parent', ar: 'ولي أمر' },

  /* ── sidebar nav ── */
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'nav.myDashboard': { en: 'My Dashboard', ar: 'لوحتي' },
  'nav.classrooms': { en: 'Classrooms (240)', ar: 'الفصول (240)' },
  'nav.myClassrooms': { en: 'My Classrooms', ar: 'فصولي' },
  'nav.classroomsPlain': { en: 'Classrooms', ar: 'الفصول' },
  'nav.users': { en: 'Manage Users', ar: 'إدارة المستخدمين' },
  'nav.messenger': { en: 'CE4 Messenger', ar: 'ماسنجر CE4' },
  'nav.exams': { en: 'Exam System (100)', ar: 'نظام الاختبارات (100)' },
  'nav.myExams': { en: 'My Exams', ar: 'اختباراتي' },
  'nav.placement': { en: 'Placement Test', ar: 'اختبار تحديد المستوى' },
  'nav.teachereval': { en: 'AI Teacher Eval', ar: 'تقييم المعلم بالذكاء' },
  'nav.dailyperf': { en: 'Daily Performance', ar: 'الأداء اليومي' },
  'nav.myPerformance': { en: 'My Performance', ar: 'أدائي' },
  'nav.automessaging': { en: 'Auto-Messaging AI', ar: 'الرسائل الآلية الذكية' },
  'nav.marketing': { en: 'Marketing Suite', ar: 'جناح التسويق' },
  'nav.videoeditor': { en: 'AI Video Editor', ar: 'محرر الفيديو الذكي' },
  'nav.reports': { en: 'Triple Reports', ar: 'التقارير الثلاثية' },
  'nav.myReports': { en: 'My Reports', ar: 'تقاريري' },
  'nav.anticheat': { en: 'Anti-Cheat Monitor', ar: 'مراقبة الغش' },
  'nav.homework': { en: 'Homework Dropbox', ar: 'صندوق الواجبات' },
  'nav.videoarchive': { en: 'Video Archive', ar: 'أرشيف الفيديو' },
  'nav.liveanalytics': { en: 'Live Analytics', ar: 'التحليلات المباشرة' },
  'nav.academicroom': { en: 'Academic Mgmt Room', ar: 'غرفة الإدارة الأكاديمية' },
  'nav.googleforms': { en: 'From Google Forms', ar: 'من نماذج جوجل' },
  'nav.assessment': { en: 'In-Class Assessment', ar: 'تقييم داخل الصف' },
  'nav.calendar': { en: 'Academic Calendar', ar: 'التقويم الأكاديمي' },
  'nav.tasks': { en: 'Tasks Manager', ar: 'مدير المهام' },
  'nav.aidev': { en: 'AI Dev Assistant', ar: 'مساعد المطوّر الذكي' },
  'nav.settings': { en: 'Platform Settings', ar: 'إعدادات المنصة' },
  'nav.notifications': { en: 'Notification Center', ar: 'مركز الإشعارات' },
  'nav.globalsearch': { en: 'Global Search', ar: 'البحث الشامل' },
  'nav.ailearning': { en: 'AI Learning Hub', ar: 'مركز التعلّم الذكي' },
  'nav.commandcenter': { en: 'Command Center', ar: 'مركز القيادة' },
  'nav.downloadcenter': { en: 'Download Center', ar: 'مركز التحميل' },
  'nav.parentportal': { en: 'Parent Portal', ar: 'بوابة ولي الأمر' },
  'nav.compliance': { en: 'Compliance Center', ar: 'مركز الامتثال' },
  'nav.statuspage': { en: 'System Status', ar: 'حالة النظام' },

  /* ── sidebar section dividers ── */
  'section.academicTools': { en: 'Academic Tools', ar: 'الأدوات الأكاديمية' },
  'section.aiMarketing': { en: 'AI & Marketing', ar: 'الذكاء والتسويق' },
  'section.analytics': { en: 'Analytics & Reports', ar: 'التحليلات والتقارير' },
  'section.management': { en: 'Management', ar: 'الإدارة' },
  'section.platformAdmin': { en: 'Platform Admin', ar: 'إدارة المنصة' },
  'section.experience': { en: 'Experience & Insights', ar: 'التجربة والرؤى' },
  'section.trust': { en: 'Trust & Apps', ar: 'الثقة والتطبيقات' },

  /* ── chrome ── */
  'chrome.portal': { en: 'Portal', ar: 'البوابة' },
  'chrome.platformTag': { en: 'Digital School Platform', ar: 'منصة المدرسة الرقمية' },
  'topbar.notifications': { en: 'Notifications', ar: 'الإشعارات' },
  'topbar.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'topbar.maintenance': { en: 'Maintenance', ar: 'الصيانة' },
  'topbar.exitMaintenance': { en: 'Exit Maintenance', ar: 'إنهاء الصيانة' },
  'topbar.maintenanceMode': { en: 'MAINTENANCE MODE', ar: 'وضع الصيانة' },
  'topbar.designStudio': { en: 'Design Studio', ar: 'استوديو التصميم' },
  'topbar.deploying': { en: 'Deploying…', ar: 'جاري النشر…' },

  /* ── common ── */
  'common.language': { en: 'Language', ar: 'اللغة' },
  'common.english': { en: 'English', ar: 'الإنجليزية' },
  'common.arabic': { en: 'العربية', ar: 'العربية' },
  'common.englishLocked': {
    en: 'English-only for Basic 4+',
    ar: 'الإنجليزية فقط للمستوى الرابع فأعلى',
  },
}

interface I18nCtx {
  lang: Lang
  dir: 'ltr' | 'rtl'
  isRTL: boolean
  locked: boolean
  setLang: (l: Lang) => void
  toggleLang: () => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nCtx | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const locked = isEnglishLocked(user)

  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'ar' ? 'ar' : 'en'
  })

  const effective: Lang = locked ? 'en' : lang
  const dir: 'ltr' | 'rtl' = effective === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const root = document.documentElement
    root.lang = effective
    root.dir = dir
    root.classList.toggle('lang-ar', effective === 'ar')
  }, [effective, dir])

  const setLang = useCallback(
    (l: Lang) => {
      if (locked) return
      setLangState(l)
      localStorage.setItem(STORAGE_KEY, l)
    },
    [locked],
  )

  const toggleLang = useCallback(() => {
    if (locked) return
    setLangState(prev => {
      const next: Lang = prev === 'ar' ? 'en' : 'ar'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [locked])

  const t = useCallback(
    (key: string) => {
      const entry = T[key]
      if (!entry) return key
      return entry[effective] ?? entry.en
    },
    [effective],
  )

  return (
    <I18nContext.Provider
      value={{ lang: effective, dir, isRTL: dir === 'rtl', locked, setLang, toggleLang, t }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}
