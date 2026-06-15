import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/providers/auth-provider'
import { apiGet, type GoogleStatus } from '@/lib/api'

const BLUE = '#2563eb'
const GOLD = '#00ae74'

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }
function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button onClick={() => !disabled && onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
      disabled={disabled}
      style={{ background: checked ? 'linear-gradient(135deg,#2563eb,#2620a8)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(37,99,235,0.25)' }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? '18px' : '2px' }} />
    </button>
  )
}

interface SectionCardProps { icon: string; title: string; titleAr?: string; children: React.ReactNode; span?: boolean }
function SectionCard({ icon, title, titleAr, children, span }: SectionCardProps) {
  return (
    <div className={`rounded-2xl overflow-hidden ${span ? 'md:col-span-2' : ''}`}
      style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.14)' }}>
      <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(37,99,235,0.1)', background: 'rgba(6,11,24,0.5)' }}>
        <h3 className="font-bold text-white text-sm flex items-center gap-2"><span>{icon}</span>{title}</h3>
        {titleAr && <span className="text-[10px] text-white/30" style={{ fontFamily: 'Tajawal,sans-serif' }}>{titleAr}</span>}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-white/80">{label}</p>
        {hint && <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

const inputCls = "px-3 py-1.5 rounded-xl text-sm text-white focus:outline-none focus:ring-1"
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(37,99,235,0.22)', minWidth: 130 } as const

export function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // Security
  const [twoFactor, setTwoFactor] = useState(true)
  const [aiAntiCheat, setAiAntiCheat] = useState(true)
  const [arabicDetection, setArabicDetection] = useState(true)
  const [autoLogout, setAutoLogout] = useState(30)
  // Notifications
  const [emailReports, setEmailReports] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [smsAlerts, setSmsAlerts] = useState(false)
  // Classroom
  const [liveAttendance, setLiveAttendance] = useState(true)
  const [recordByDefault, setRecordByDefault] = useState(false)
  const [allowStudentUpload, setAllowStudentUpload] = useState(true)
  // Localization / institution
  const [language, setLanguage] = useState('Bilingual')
  const [timezone, setTimezone] = useState('AST (UTC+3)')
  // Branding & appearance
  const [rtlDefault, setRtlDefault] = useState(true)
  const [welcomeVoice, setWelcomeVoice] = useState(true)
  const [accent, setAccent] = useState(BLUE)
  // Academic policy
  const [englishLockLevel, setEnglishLockLevel] = useState('Basic 4')
  const [passMark, setPassMark] = useState(60)
  const [attendanceMin, setAttendanceMin] = useState(75)
  // AI features (single state object — no hooks inside loops)
  const [aiFeatures, setAiFeatures] = useState<Record<string, boolean>>({
    teacherEval: true, autoMessaging: true, videoEditor: false, examGen: true, placement: true,
  })
  const toggleAi = (k: string) => isAdmin && setAiFeatures(p => ({ ...p, [k]: !p[k] }))

  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  // Live Google (Gmail / Drive / Calendar) connection status
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  useEffect(() => {
    apiGet<GoogleStatus>('/google/status').then(setGoogle).catch(() => setGoogle(null))
  }, [])

  const aiItems = [
    { key: 'teacherEval', label: 'AI Teacher Evaluation', hint: 'Automatically grade teacher performance' },
    { key: 'autoMessaging', label: 'Auto-Messaging AI', hint: 'AI sends progress alerts to parents' },
    { key: 'videoEditor', label: 'AI Video Editor', hint: 'Auto-edit and trim classroom recordings' },
    { key: 'examGen', label: 'Smart Exam Generator', hint: 'AI generates exam questions from syllabus' },
    { key: 'placement', label: 'Placement Test AI', hint: 'Adaptive placement test powered by AI' },
  ]

  const integrations = [
    { name: 'Gmail (Reports)', ar: 'جيميل', desc: google ? `Sender: ${google.sender}` : 'Outbound parent & teacher reports', icon: '✉️', connected: !!google?.gmail, color: '#ea4335' },
    { name: 'Google Drive', ar: 'جوجل درايف', desc: 'Archive of every report by term', icon: '📁', connected: !!google?.drive, color: '#0F9D58' },
    { name: 'Google Calendar', ar: 'تقويم جوجل', desc: 'Assessment milestone events', icon: '📅', connected: !!google?.calendar, color: '#4285F4' },
    { name: 'Payment Gateway', ar: 'بوابة الدفع', desc: 'Collect fees online', icon: '💳', connected: false, color: '#34d399' },
    { name: 'WhatsApp Business', ar: 'واتساب للأعمال', desc: 'Parent & student messaging', icon: '💬', connected: false, color: '#25D366' },
    { name: 'SMS Gateway', ar: 'بوابة الرسائل', desc: 'Critical alerts via SMS', icon: '📱', connected: false, color: '#f87171' },
  ]

  const roles = [
    { name: 'Admin', ar: 'مدير', count: 4, perms: 'Full control', color: '#f87171' },
    { name: 'Supervisor', ar: 'مشرف', count: 9, perms: 'Oversight + reports', color: GOLD },
    { name: 'Teacher', ar: 'مدرس', count: 62, perms: 'Classrooms + grading', color: BLUE },
    { name: 'Student', ar: 'طالب', count: 1840, perms: 'Learn + submit', color: '#34d399' },
    { name: 'Parent', ar: 'ولي أمر', count: 1210, perms: 'View child progress', color: '#7dd3fc' },
  ]

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">⚙️ Platform Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure Britishce44 system-wide settings {!isAdmin && '(View only — Admin access required)'}
          </p>
        </div>
        <motion.button onClick={handleSave}
          whileTap={{ scale: 0.95 }}
          disabled={!isAdmin}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40"
          style={{ background: saved ? 'linear-gradient(135deg,#00ae74,#00684a)' : 'linear-gradient(135deg,#2563eb,#2620a8)', color: '#fff', boxShadow: '0 2px 12px rgba(37,99,235,0.35)' }}>
          {saved ? '✓ Saved!' : '💾 Save Changes'}
        </motion.button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* Institution Info */}
        <SectionCard icon="🏫" title="Institution Info" titleAr="معلومات المركز">
          <SettingRow label="School Name">
            <input className={inputCls} defaultValue="The First British Center" style={inputStyle} readOnly={!isAdmin} />
          </SettingRow>
          <SettingRow label="City / Country">
            <input className={inputCls} defaultValue="Taiz, Yemen" style={inputStyle} readOnly={!isAdmin} />
          </SettingRow>
          <SettingRow label="Timezone">
            <select className={inputCls} value={timezone} onChange={e => setTimezone(e.target.value)} style={inputStyle} disabled={!isAdmin}>
              <option>AST (UTC+3)</option><option>UTC+0</option><option>UTC+1</option><option>UTC+4</option>
            </select>
          </SettingRow>
          <SettingRow label="Platform Language">
            <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle} disabled={!isAdmin}>
              <option>English</option><option>Arabic</option><option>Bilingual</option>
            </select>
          </SettingRow>
          <SettingRow label="Max Classrooms">
            <input type="number" defaultValue={240} className={inputCls} style={{ ...inputStyle, minWidth: 80 }} readOnly={!isAdmin} />
          </SettingRow>
        </SectionCard>

        {/* Branding & Appearance */}
        <SectionCard icon="🎨" title="Branding & Appearance" titleAr="الهوية والمظهر">
          <SettingRow label="Center Logo" hint="Shown across the platform & reports">
            <button className="text-[10px] px-2.5 py-1 rounded-lg transition" style={{ color: BLUE, border: `1px solid ${BLUE}40`, background: `${BLUE}10` }}>Upload →</button>
          </SettingRow>
          <SettingRow label="Accent Color" hint="Primary brand color">
            <div className="flex items-center gap-2">
              {[BLUE, GOLD, '#2563eb', '#00ae74'].map(c => (
                <button key={c} onClick={() => isAdmin && setAccent(c)}
                  className="w-6 h-6 rounded-full transition" aria-label={`accent ${c}`}
                  style={{ background: c, border: accent === c ? '2px solid #fff' : '2px solid transparent', boxShadow: accent === c ? `0 0 0 2px ${c}` : 'none' }} />
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Arabic RTL by Default" hint="Right-to-left layout for Arabic UI">
            <Toggle checked={rtlDefault} onChange={setRtlDefault} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Login Welcome Voice" hint="Play a spoken welcome on each login">
            <Toggle checked={welcomeVoice} onChange={setWelcomeVoice} disabled={!isAdmin} />
          </SettingRow>
        </SectionCard>

        {/* Security */}
        <SectionCard icon="🔐" title="Security & Access" titleAr="الأمان والوصول">
          <SettingRow label="Two-Factor Auth" hint="All admin accounts must confirm OTP on login">
            <Toggle checked={twoFactor} onChange={setTwoFactor} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="AI Anti-Cheat Monitor" hint="Detects suspicious exam behavior via camera">
            <Toggle checked={aiAntiCheat} onChange={setAiAntiCheat} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Arabic Language Detection" hint="Auto-alert teacher when student speaks Arabic">
            <Toggle checked={arabicDetection} onChange={setArabicDetection} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Auto-Logout (minutes)" hint="Inactive sessions will be logged out">
            <input type="number" value={autoLogout} onChange={e => setAutoLogout(+e.target.value)}
              className={inputCls} style={{ ...inputStyle, minWidth: 80 }} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="IP Whitelist" hint="Restrict to specific network ranges">
            <button className="text-[10px] px-2 py-1 rounded-lg transition" style={{ color: BLUE, border: `1px solid ${BLUE}40` }}>Configure →</button>
          </SettingRow>
        </SectionCard>

        {/* Academic Policy */}
        <SectionCard icon="📐" title="Academic Policy" titleAr="السياسة الأكاديمية">
          <SettingRow label="English-Only From" hint="Students at/above this level use English only">
            <select className={inputCls} value={englishLockLevel} onChange={e => setEnglishLockLevel(e.target.value)} style={inputStyle} disabled={!isAdmin}>
              <option>Basic 3</option><option>Basic 4</option><option>Basic 5</option><option>Intermediate</option>
            </select>
          </SettingRow>
          <SettingRow label="Exam Pass Mark (%)" hint="Minimum score to pass">
            <input type="number" value={passMark} onChange={e => setPassMark(+e.target.value)} className={inputCls} style={{ ...inputStyle, minWidth: 80 }} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Min Attendance (%)" hint="Required to advance a level">
            <input type="number" value={attendanceMin} onChange={e => setAttendanceMin(+e.target.value)} className={inputCls} style={{ ...inputStyle, minWidth: 80 }} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Grading Scale">
            <select className={inputCls} style={inputStyle} disabled={!isAdmin}>
              <option>A–F Letter</option><option>0–100 Percent</option><option>CEFR (A1–C2)</option>
            </select>
          </SettingRow>
          <SettingRow label="Default Term Length">
            <select className={inputCls} style={inputStyle} disabled={!isAdmin}>
              <option>8 weeks</option><option>12 weeks</option><option>16 weeks</option>
            </select>
          </SettingRow>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon="🔔" title="Notifications" titleAr="الإشعارات">
          <SettingRow label="Email Reports" hint="Weekly performance reports via email">
            <Toggle checked={emailReports} onChange={setEmailReports} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Push Notifications" hint="Browser & mobile push alerts">
            <Toggle checked={pushNotif} onChange={setPushNotif} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="SMS Alerts" hint="Critical alerts sent via SMS gateway">
            <Toggle checked={smsAlerts} onChange={setSmsAlerts} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Notification Email">
            <input className={inputCls} defaultValue="admin@britishce44.edu" style={inputStyle} readOnly={!isAdmin} />
          </SettingRow>
        </SectionCard>

        {/* Classroom Settings */}
        <SectionCard icon="🎓" title="Classroom Defaults" titleAr="إعدادات الفصول">
          <SettingRow label="Auto-Record Sessions" hint="All classroom sessions are saved automatically">
            <Toggle checked={recordByDefault} onChange={setRecordByDefault} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Live Attendance Tracking" hint="AI marks attendance from camera">
            <Toggle checked={liveAttendance} onChange={setLiveAttendance} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Student File Upload" hint="Students can upload homework in classroom">
            <Toggle checked={allowStudentUpload} onChange={setAllowStudentUpload} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Max Students / Room">
            <input type="number" defaultValue={40} className={inputCls} style={{ ...inputStyle, minWidth: 80 }} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Default Video Quality">
            <select className={inputCls} style={inputStyle} disabled={!isAdmin}>
              <option>1080p</option><option>720p</option><option>480p</option><option>Auto</option>
            </select>
          </SettingRow>
        </SectionCard>

        {/* AI Settings */}
        <SectionCard icon="🤖" title="AI Features" titleAr="ميزات الذكاء الاصطناعي">
          {aiItems.map(item => (
            <SettingRow key={item.key} label={item.label} hint={item.hint}>
              <Toggle checked={aiFeatures[item.key]} onChange={() => toggleAi(item.key)} disabled={!isAdmin} />
            </SettingRow>
          ))}
        </SectionCard>

        {/* Storage & Backup */}
        <SectionCard icon="💾" title="Storage & Backup" titleAr="التخزين والنسخ">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Storage used</span><span className="text-white font-bold">142 GB / 500 GB</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: '28%', background: 'linear-gradient(90deg,#2563eb,#2620a8)' }} />
            </div>
            <p className="text-[10px] text-gray-600">28% used · 358 GB remaining</p>
          </div>
          <SettingRow label="Auto-Backup">
            <Toggle checked={true} onChange={() => {}} disabled={!isAdmin} />
          </SettingRow>
          <SettingRow label="Backup Frequency">
            <select className={inputCls} style={inputStyle} disabled={!isAdmin}>
              <option>Daily</option><option>Weekly</option><option>Hourly</option>
            </select>
          </SettingRow>
          <SettingRow label="Retention Period">
            <select className={inputCls} style={inputStyle} disabled={!isAdmin}>
              <option>90 days</option><option>180 days</option><option>1 year</option><option>Forever</option>
            </select>
          </SettingRow>
          {isAdmin && (
            <button className="w-full py-2 rounded-xl text-sm font-medium transition text-emerald-400 hover:text-emerald-300"
              style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)' }}>
              🗄 Run Manual Backup Now
            </button>
          )}
        </SectionCard>

        {/* Integrations */}
        <SectionCard icon="🔌" title="Integrations" titleAr="التكاملات" span>
          <div className="grid sm:grid-cols-2 gap-3">
            {integrations.map(ig => (
              <div key={ig.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${ig.color}14`, border: `1px solid ${ig.color}25` }}>{ig.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{ig.name}</p>
                  <p className="text-[10px] text-white/35 truncate">{ig.desc}</p>
                </div>
                {ig.connected
                  ? <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>● Connected</span>
                  : <button className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: `${BLUE}14`, color: BLUE, border: `1px solid ${BLUE}30` }}>Connect</button>}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Roles & Permissions */}
        <SectionCard icon="🛡️" title="Roles & Permissions" titleAr="الأدوار والصلاحيات" span>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map(r => (
              <div key={r.name} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${r.color}20` }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-black" style={{ color: r.color }}>{r.name}</p>
                  <span className="text-[10px] text-white/40">{r.count} users</span>
                </div>
                <p className="text-[10px] text-white/45">{r.perms}</p>
                <p className="text-[9px] text-white/25 mt-0.5" style={{ fontFamily: 'Tajawal,sans-serif' }}>{r.ar}</p>
                {isAdmin && <button className="mt-2 w-full py-1 rounded-lg text-[10px] font-semibold transition" style={{ background: `${r.color}10`, color: r.color, border: `1px solid ${r.color}25` }}>Manage →</button>}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Danger zone */}
      {isAdmin && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <h3 className="text-sm font-bold text-red-400">⚠ Danger Zone</h3>
          <div className="flex flex-wrap gap-3">
            {['Clear All Sessions', 'Reset Exam Results', 'Wipe Recordings', 'Factory Reset'].map(action => (
              <button key={action}
                className="px-4 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-white transition"
                style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
                {action}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
