import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GraduationCap, Video, Sparkles } from 'lucide-react'

export type SettingsTab = 'classroom' | 'meeting' | 'features'

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
  defaultTab?: SettingsTab
}

const NAVY = '#17125c'
const ROYAL = '#2620a8'
const BLUE = '#2563eb'
const GOLD = '#00ae74'

const inputCls = "px-3 py-1.5 rounded-xl text-sm text-white focus:outline-none focus:ring-1"
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(37,99,235,0.22)', minWidth: 120 } as const

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

interface SettingRowProps { label: string; hint?: string; children: React.ReactNode }
function SettingRow({ label, hint, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-white/85">{label}</p>
        {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-1 first:pt-0">
      <span className="text-sm">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(147,197,253,0.7)' }}>{title}</span>
    </div>
  )
}

const STORAGE_KEY = 'b44_settings_sidebar'

interface SettingsState {
  autoRecord: boolean
  liveAttendance: boolean
  allowUpload: boolean
  maxStudents: number
  videoQuality: string
  defaultLayout: string
  englishOnlyLevel: string

  micOnByDefault: boolean
  cameraOnByDefault: boolean
  backgroundBlur: boolean
  noiseSuppression: boolean
  joinGreeting: boolean
  echoCancellation: boolean
  handRaiseTimeout: number

  aiAntiCheat: boolean
  arabicDetection: boolean
  quizBot: boolean
  timerWidget: boolean
  breakoutRooms: boolean
  whiteboardSync: boolean
  resourcePanel: boolean
  pollReactions: boolean
}

const DEFAULT_STATE: SettingsState = {
  autoRecord: false,
  liveAttendance: true,
  allowUpload: true,
  maxStudents: 40,
  videoQuality: '1080p',
  defaultLayout: 'whiteboard',
  englishOnlyLevel: 'Basic 4',

  micOnByDefault: true,
  cameraOnByDefault: true,
  backgroundBlur: false,
  noiseSuppression: true,
  joinGreeting: true,
  echoCancellation: true,
  handRaiseTimeout: 30,

  aiAntiCheat: true,
  arabicDetection: true,
  quizBot: true,
  timerWidget: true,
  breakoutRooms: true,
  whiteboardSync: true,
  resourcePanel: true,
  pollReactions: true,
}

function loadState(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_STATE
}

export function SettingsSidebar({ open, onClose, defaultTab = 'classroom' }: SettingsSidebarProps) {
  const [tab, setTab] = useState<SettingsTab>(defaultTab)
  const [state, setState] = useState<SettingsState>(loadState)

  useEffect(() => {
    if (open) {
      setTab(defaultTab)
      setState(loadState())
    }
  }, [open, defaultTab])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const set = <K extends keyof SettingsState>(k: K, v: SettingsState[K]) =>
    setState(prev => ({ ...prev, [k]: v }))

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'classroom', label: 'Classroom', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'meeting', label: 'Meeting', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'features', label: 'Features', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          />
          {/* Panel */}
          <motion.aside
            initial={{ x: 380, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.8, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[340px] max-w-[90vw] flex flex-col"
            style={{ background: 'linear-gradient(160deg,#17125c 0%,#1d1668 100%)', borderLeft: '1px solid rgba(37,99,235,0.2)', boxShadow: '-12px 0 40px rgba(0,0,0,0.45)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
              style={{ borderBottom: '1px solid rgba(37,99,235,0.15)', background: 'rgba(6,11,24,0.5)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg,#2620a8,#2563eb)', boxShadow: '0 2px 10px rgba(37,99,235,0.35)' }}>
                  ⚙️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Settings</h3>
                  <p className="text-[9px]" style={{ color: 'rgba(147,197,253,0.55)' }}>Classrooms · Meetings · Features</p>
                </div>
              </div>
              <button onClick={onClose} title="Close settings"
                className="p-1.5 rounded-lg transition text-gray-500 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(37,99,235,0.1)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${tab === t.id ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  style={tab === t.id ? {
                    background: 'linear-gradient(135deg,#2620a8,#2563eb)',
                    boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
                  } : { border: '1px solid rgba(37,99,235,0.15)' }}>
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scroll px-4 pb-6">
              <AnimatePresence mode="wait">
                {tab === 'classroom' && (
                  <motion.div key="classroom" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <SectionLabel icon="🏫" title="Session" />
                    <SettingRow label="Auto-record sessions" hint="Save every classroom automatically">
                      <Toggle checked={state.autoRecord} onChange={v => set('autoRecord', v)} />
                    </SettingRow>
                    <SettingRow label="Live attendance tracking" hint="AI marks attendance from camera">
                      <Toggle checked={state.liveAttendance} onChange={v => set('liveAttendance', v)} />
                    </SettingRow>
                    <SettingRow label="Student file upload" hint="Students can submit homework in class">
                      <Toggle checked={state.allowUpload} onChange={v => set('allowUpload', v)} />
                    </SettingRow>

                    <SectionLabel icon="🎛️" title="Defaults" />
                    <SettingRow label="Default layout">
                      <select className={inputCls} value={state.defaultLayout} onChange={e => set('defaultLayout', e.target.value)} style={inputStyle}>
                        <option value="whiteboard">Whiteboard</option>
                        <option value="grid">Grid view</option>
                        <option value="resources">Resources</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Video quality">
                      <select className={inputCls} value={state.videoQuality} onChange={e => set('videoQuality', e.target.value)} style={inputStyle}>
                        <option>Auto</option><option>1080p</option><option>720p</option><option>480p</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Max students / room">
                      <input type="number" value={state.maxStudents} onChange={e => set('maxStudents', +e.target.value)}
                        className={inputCls} style={{ ...inputStyle, minWidth: 80 }} />
                    </SettingRow>
                    <SettingRow label="English-only from">
                      <select className={inputCls} value={state.englishOnlyLevel} onChange={e => set('englishOnlyLevel', e.target.value)} style={inputStyle}>
                        <option>Basic 3</option><option>Basic 4</option><option>Basic 5</option><option>Intermediate</option>
                      </select>
                    </SettingRow>
                  </motion.div>
                )}

                {tab === 'meeting' && (
                  <motion.div key="meeting" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <SectionLabel icon="🎥" title="Media" />
                    <SettingRow label="Mic on by default">
                      <Toggle checked={state.micOnByDefault} onChange={v => set('micOnByDefault', v)} />
                    </SettingRow>
                    <SettingRow label="Camera on by default">
                      <Toggle checked={state.cameraOnByDefault} onChange={v => set('cameraOnByDefault', v)} />
                    </SettingRow>
                    <SettingRow label="Background blur" hint="Soft-focus the room behind you">
                      <Toggle checked={state.backgroundBlur} onChange={v => set('backgroundBlur', v)} />
                    </SettingRow>
                    <SettingRow label="Noise suppression" hint="Filter background noise">
                      <Toggle checked={state.noiseSuppression} onChange={v => set('noiseSuppression', v)} />
                    </SettingRow>
                    <SettingRow label="Echo cancellation">
                      <Toggle checked={state.echoCancellation} onChange={v => set('echoCancellation', v)} />
                    </SettingRow>

                    <SectionLabel icon="✋" title="Interaction" />
                    <SettingRow label="Join welcome voice" hint="Spoken greeting on join">
                      <Toggle checked={state.joinGreeting} onChange={v => set('joinGreeting', v)} />
                    </SettingRow>
                    <SettingRow label="Hand-raise timeout (sec)">
                      <input type="number" value={state.handRaiseTimeout} onChange={e => set('handRaiseTimeout', +e.target.value)}
                        className={inputCls} style={{ ...inputStyle, minWidth: 80 }} />
                    </SettingRow>
                  </motion.div>
                )}

                {tab === 'features' && (
                  <motion.div key="features" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    <SectionLabel icon="🛡️" title="Safety" />
                    <SettingRow label="AI anti-cheat monitor" hint="Detects suspicious exam behavior">
                      <Toggle checked={state.aiAntiCheat} onChange={v => set('aiAntiCheat', v)} />
                    </SettingRow>
                    <SettingRow label="Arabic language detection" hint="Alert when a student speaks Arabic">
                      <Toggle checked={state.arabicDetection} onChange={v => set('arabicDetection', v)} />
                    </SettingRow>

                    <SectionLabel icon="🧩" title="Learning tools" />
                    <SettingRow label="Quiz bot (Monkey)" hint="In-class trivia quizzes">
                      <Toggle checked={state.quizBot} onChange={v => set('quizBot', v)} />
                    </SettingRow>
                    <SettingRow label="Timer widget" hint="Pomodoro study/break timer">
                      <Toggle checked={state.timerWidget} onChange={v => set('timerWidget', v)} />
                    </SettingRow>
                    <SettingRow label="Breakout rooms">
                      <Toggle checked={state.breakoutRooms} onChange={v => set('breakoutRooms', v)} />
                    </SettingRow>
                    <SettingRow label="Whiteboard sync" hint="Share drawings with the class">
                      <Toggle checked={state.whiteboardSync} onChange={v => set('whiteboardSync', v)} />
                    </SettingRow>
                    <SettingRow label="Resource panel" hint="Embeds & teaching websites">
                      <Toggle checked={state.resourcePanel} onChange={v => set('resourcePanel', v)} />
                    </SettingRow>
                    <SettingRow label="Polls & reactions">
                      <Toggle checked={state.pollReactions} onChange={v => set('pollReactions', v)} />
                    </SettingRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(37,99,235,0.15)', background: 'rgba(6,11,24,0.5)' }}>
              <button onClick={onClose}
                className="w-full py-2 rounded-xl text-sm font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg,#2563eb,#2620a8)', boxShadow: '0 2px 12px rgba(37,99,235,0.35)' }}>
                Done
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export const SETTINGS_NAVY = NAVY
export const SETTINGS_ROYAL = ROYAL
export const SETTINGS_BLUE = BLUE
export const SETTINGS_GOLD = GOLD
