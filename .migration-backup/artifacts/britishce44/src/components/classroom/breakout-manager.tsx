import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebRTC } from '../webrtc/webrtc-provider'

type Tab = 'rooms' | 'monitor' | 'anticheat' | 'reports'

interface Violation {
  id: string; time: string; student: string; type: string; detail: string; room: string
}
interface ReportEntry {
  id: string; studentName: string; teacherName: string; date: string; room: string
  englishPercent: number; arabicCount: number; violations: string[]
  participation: number; sttWords: number; behavior: string; recommendations: string
}
interface ArabicAlert {
  student: string; phrase: string; translation: string; time: string
}

const ACTIVITIES = [
  'Complete the worksheet', 'Watch the video clip', 'Write 5 sentences',
  'Listen and answer', 'Role play dialogue', 'Grammar exercise',
  'Reading comprehension', 'Vocabulary matching', 'Pronunciation drill',
  'Describe the picture', 'Fill in the blanks', 'Peer discussion',
]

const MOCK_STUDENTS: Record<number, { name: string; englishPct: number; speaking: boolean; arabicAlerts: number; participation: number; sttWords: number }[]> = {
  0: [
    { name: 'Ahmed Al-Mansouri', englishPct: 72, speaking: true, arabicAlerts: 2, participation: 65, sttWords: 120 },
    { name: 'Fatima Al-Rashidi', englishPct: 88, speaking: false, arabicAlerts: 0, participation: 82, sttWords: 210 },
    { name: 'Omar Bin Suleiman', englishPct: 55, speaking: true, arabicAlerts: 4, participation: 48, sttWords: 80 },
    { name: 'Layla Al-Hashimi', englishPct: 91, speaking: false, arabicAlerts: 1, participation: 90, sttWords: 280 },
  ],
  1: [
    { name: 'Khalid Al-Zahrawi', englishPct: 68, speaking: true, arabicAlerts: 3, participation: 60, sttWords: 95 },
    { name: 'Nour Al-Beiruti', englishPct: 78, speaking: false, arabicAlerts: 1, participation: 75, sttWords: 160 },
    { name: 'Yousef Al-Otaibi', englishPct: 62, speaking: true, arabicAlerts: 2, participation: 55, sttWords: 110 },
  ],
  2: [
    { name: 'Reem Al-Sabhan', englishPct: 85, speaking: false, arabicAlerts: 0, participation: 88, sttWords: 240 },
    { name: 'Tariq Al-Ghamdi', englishPct: 74, speaking: true, arabicAlerts: 1, participation: 70, sttWords: 140 },
  ],
}

const ARABIC_PHRASES = [
  { ar: 'أنا لا أفهم', en: 'I don\'t understand' },
  { ar: 'كيف أقول هذا', en: 'How do I say this' },
  { ar: 'ممكن تعيد', en: 'Can you repeat' },
  { ar: 'لا أعرف الإجابة', en: 'I don\'t know the answer' },
  { ar: 'هذا صعب جداً', en: 'This is very difficult' },
]

interface BreakoutManagerProps {
  teacherName: string
  onArabicAlert?: (alert: ArabicAlert) => void
}

export function BreakoutManager({ teacherName, onArabicAlert }: BreakoutManagerProps) {
  const { breakouts, createBreakout, currentBreakoutId, joinBreakout, leaveBreakout } = useWebRTC()
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [tab, setTab] = useState<Tab>('rooms')
  const [newRoomName, setNewRoomName] = useState('')
  const [autoClose, setAutoClose] = useState(30)
  const [monitoringRoom, setMonitoringRoom] = useState<number | null>(null)
  const [activityInputs, setActivityInputs] = useState<Record<string, string>>({})
  const [sentActivities, setSentActivities] = useState<{ roomId: string; text: string; time: string }[]>([])
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(false)
  const [blockCopyPaste, setBlockCopyPaste] = useState(false)
  const [detectArabic, setDetectArabic] = useState(false)
  const [monitorCamera, setMonitorCamera] = useState(false)
  const [violations, setViolations] = useState<Violation[]>([])
  const [reports, setReports] = useState<ReportEntry[]>([])
  const [arabicAlerts, setArabicAlerts] = useState<ArabicAlert[]>([])
  const [pendingRepeat, setPendingRepeat] = useState<ArabicAlert | null>(null)
  const [monitorAll, setMonitorAll] = useState(false)
  const copyBlockerRef = useRef<((e: Event) => void) | null>(null)
  const arabicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logViolation = useCallback((student: string, type: string, detail: string, room = 'Main') => {
    setViolations(prev => [{
      id: Date.now().toString(), time: new Date().toLocaleTimeString(),
      student, type, detail, room
    }, ...prev.slice(0, 49)])
  }, [])

  const triggerArabicDetection = useCallback(() => {
    const phrase = ARABIC_PHRASES[Math.floor(Math.random() * ARABIC_PHRASES.length)]
    const students = MOCK_STUDENTS[0]
    const student = students[Math.floor(Math.random() * students.length)]
    const alert: ArabicAlert = {
      student: student.name, phrase: phrase.ar,
      translation: phrase.en, time: new Date().toLocaleTimeString()
    }
    setArabicAlerts(prev => [alert, ...prev.slice(0, 19)])
    setPendingRepeat(alert)
    logViolation(student.name, '🇸🇦 Arabic Speech', `Said: "${phrase.ar}" → Translate: "${phrase.en}"`)
    onArabicAlert?.(alert)
  }, [logViolation, onArabicAlert])

  const toggleAntiCheat = useCallback(() => {
    const next = !antiCheatEnabled
    setAntiCheatEnabled(next)
    if (next && detectArabic) {
      arabicIntervalRef.current = setInterval(triggerArabicDetection, 15000 + Math.random() * 10000)
    } else {
      if (arabicIntervalRef.current) { clearInterval(arabicIntervalRef.current); arabicIntervalRef.current = null }
    }
  }, [antiCheatEnabled, detectArabic, triggerArabicDetection])

  const toggleCopyPaste = useCallback(() => {
    const next = !blockCopyPaste
    setBlockCopyPaste(next)
    if (next) {
      const handler = (e: Event) => {
        e.preventDefault()
        logViolation('Local Student', '📋 Copy-Paste Blocked', `Attempted ${e.type} operation`)
      }
      copyBlockerRef.current = handler
      document.addEventListener('copy', handler)
      document.addEventListener('paste', handler)
      document.addEventListener('cut', handler)
    } else {
      if (copyBlockerRef.current) {
        document.removeEventListener('copy', copyBlockerRef.current)
        document.removeEventListener('paste', copyBlockerRef.current)
        document.removeEventListener('cut', copyBlockerRef.current)
        copyBlockerRef.current = null
      }
    }
  }, [blockCopyPaste, logViolation])

  const toggleArabicDetect = useCallback(() => {
    const next = !detectArabic
    setDetectArabic(next)
    if (next && antiCheatEnabled) {
      arabicIntervalRef.current = setInterval(triggerArabicDetection, 15000 + Math.random() * 10000)
    } else {
      if (arabicIntervalRef.current) { clearInterval(arabicIntervalRef.current); arabicIntervalRef.current = null }
    }
  }, [detectArabic, antiCheatEnabled, triggerArabicDetection])

  useEffect(() => () => {
    if (copyBlockerRef.current) {
      document.removeEventListener('copy', copyBlockerRef.current)
      document.removeEventListener('paste', copyBlockerRef.current)
      document.removeEventListener('cut', copyBlockerRef.current)
    }
    if (arabicIntervalRef.current) clearInterval(arabicIntervalRef.current)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newRoomName.trim()) return
    await createBreakout(newRoomName.trim(), autoClose)
    setNewRoomName('')
  }, [newRoomName, autoClose, createBreakout])

  const sendActivity = useCallback((roomId: string) => {
    const text = activityInputs[roomId]?.trim()
    if (!text) return
    setSentActivities(prev => [{ roomId, text, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 49)])
    setActivityInputs(prev => ({ ...prev, [roomId]: '' }))
  }, [activityInputs])

  const generateReports = useCallback((roomIdx: number) => {
    const students = MOCK_STUDENTS[roomIdx] || MOCK_STUDENTS[0]
    const roomName = breakouts[roomIdx]?.name || 'Main Room'
    const date = new Date().toLocaleDateString()
    students.forEach(s => {
      const entry: ReportEntry = {
        id: `${s.name}-${date}-${roomIdx}`,
        studentName: s.name, teacherName, date, room: roomName,
        englishPercent: s.englishPct, arabicCount: s.arabicAlerts,
        violations: violations.filter(v => v.student === s.name).map(v => v.type),
        participation: s.participation, sttWords: s.sttWords,
        behavior: s.arabicAlerts > 2 ? 'Needs improvement' : s.arabicAlerts > 0 ? 'Satisfactory' : 'Excellent',
        recommendations: s.englishPct < 65
          ? `Urgent: ${s.name} must increase English speaking time. Schedule 1:1 session. Avoid Arabic entirely in class.`
          : s.arabicAlerts > 1
          ? `Good progress. Remind ${s.name.split(' ')[0]} to use English exclusively. Practice speaking drills.`
          : `Excellent English usage. Encourage ${s.name.split(' ')[0]} to mentor peers. Consider leadership role.`
      }
      setReports(prev => [entry, ...prev.filter(r => r.id !== entry.id)])
    })
  }, [breakouts, violations, teacherName])

  const exportCSV = useCallback(() => {
    const header = 'Student,Teacher,Date,Room,English%,ArabicUses,Violations,Participation,STT Words,Behavior,Recommendations'
    const rows = reports.map(r =>
      `"${r.studentName}","${r.teacherName}","${r.date}","${r.room}",${r.englishPercent},${r.arabicCount},${r.violations.length},${r.participation},${r.sttWords},"${r.behavior}","${r.recommendations}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `britishce44-reports-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }, [reports])

  if (!isOpen) return null

  if (isMinimized) {
    return (
      <motion.div drag dragMomentum={false}
        className="fixed bottom-24 left-4 z-50 bg-navy text-white rounded-2xl shadow-2xl cursor-pointer select-none"
        onClick={() => setIsMinimized(false)}>
        <div className="flex items-center gap-2 px-4 py-2.5">
          <span>🏠</span>
          <span className="text-xs font-bold">Breakout Rooms</span>
          {breakouts.length > 0 && <span className="bg-gold text-navy text-[9px] font-black px-1.5 py-0.5 rounded-full">{breakouts.length}</span>}
          {antiCheatEnabled && <span className="bg-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">🛡</span>}
          {violations.length > 0 && <span className="bg-red-400 text-[8px] px-1.5 py-0.5 rounded-full">⚠{violations.length}</span>}
          <span className="text-[10px] text-white/40 ml-1">▲ Open</span>
        </div>
      </motion.div>
    )
  }

  const TABS = [
    { key: 'rooms' as Tab, label: 'Rooms', icon: '🏠' },
    { key: 'monitor' as Tab, label: 'Monitor', icon: '👁' },
    { key: 'anticheat' as Tab, label: 'Anti-Cheat', icon: '🛡', badge: violations.length },
    { key: 'reports' as Tab, label: 'Reports', icon: '📊', badge: reports.length },
  ]

  return (
    <>
      {/* Arabic Repeat Prompt */}
      <AnimatePresence>
        {pendingRepeat && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-2xl shadow-2xl border-2 border-red-300 p-4 w-96">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛑</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-red-600 mb-1">Arabic Detected — {pendingRepeat.time}</p>
                <p className="text-sm font-bold text-navy mb-1">{pendingRepeat.student}</p>
                <div className="bg-red-50 rounded-lg p-2 mb-2">
                  <p className="text-xs text-gray-500">Said in Arabic:</p>
                  <p className="text-sm font-bold text-red-700 font-arabic" dir="rtl">{pendingRepeat.phrase}</p>
                  <p className="text-xs text-gray-500 mt-1">Translation: <span className="font-medium text-navy">"{pendingRepeat.translation}"</span></p>
                </div>
                <p className="text-[10px] text-gray-600 bg-green-50 rounded p-2 border border-green-200">
                  🗣 Ask student to say: <strong>"{pendingRepeat.translation}"</strong> in English
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => {
                    logViolation(pendingRepeat.student, '✅ Corrected', `Repeated in English: "${pendingRepeat.translation}"`)
                    setPendingRepeat(null)
                  }} className="flex-1 bg-green-500 text-white rounded-lg py-1.5 text-[10px] font-bold hover:bg-green-600 transition">
                    ✓ Student Repeated
                  </button>
                  <button onClick={() => {
                    logViolation(pendingRepeat.student, '❌ Refused', `Refused to repeat: "${pendingRepeat.translation}"`)
                    setPendingRepeat(null)
                  }} className="flex-1 bg-red-100 text-red-600 rounded-lg py-1.5 text-[10px] font-bold hover:bg-red-200 transition">
                    ✗ Refused
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div drag dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 left-4 z-50 w-[420px] bg-white rounded-2xl shadow-2xl border border-gold/20 flex flex-col overflow-hidden"
        style={{ maxHeight: '72vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-navy to-navy/90 shrink-0 cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-2">
            <span>🏠</span>
            <span className="text-xs font-bold text-white">Breakout Room Manager</span>
            {antiCheatEnabled && <span className="bg-red-500 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full animate-pulse">🛡 LIVE</span>}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setIsMinimized(true)} title="Minimize"
              className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white text-xs">━</button>
            <button onClick={() => setIsOpen(false)} title="Close"
              className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white text-xs">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 bg-gray-50">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-[9px] font-bold flex flex-col items-center gap-0.5 transition relative
                ${tab === t.key ? 'text-navy border-b-2 border-gold bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-sm">{t.icon}</span>
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-[7px] font-black px-1 rounded-full leading-tight">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scroll">

          {/* ─── ROOMS TAB ─── */}
          {tab === 'rooms' && (
            <div className="p-3 space-y-3">
              <div className="flex gap-1.5">
                <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                  placeholder="Room name..." onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold" />
                <input type="number" value={autoClose} min={5} max={120}
                  onChange={e => setAutoClose(+e.target.value)}
                  className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none text-center" title="Auto-close (min)" />
                <button onClick={handleCreate}
                  className="bg-gold text-navy px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gold/90 transition shrink-0">
                  + Create
                </button>
              </div>

              {breakouts.length > 1 && (
                <button onClick={() => setMonitorAll(!monitorAll)}
                  className={`w-full py-1.5 rounded-xl text-[10px] font-bold border transition
                    ${monitorAll ? 'bg-navy text-white border-navy' : 'border-navy text-navy hover:bg-navy/5'}`}>
                  {monitorAll ? '✓ Monitoring All Rooms Together' : '👁 Monitor All Rooms Together'}
                </button>
              )}

              {breakouts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs space-y-1">
                  <div className="text-3xl">🏠</div>
                  <p>Create a breakout room above.</p>
                  <p className="text-[9px]">Students can join rooms for group activities.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {breakouts.map((b, i) => {
                    const students = MOCK_STUDENTS[i % 3] || MOCK_STUDENTS[0]
                    const isWatching = monitoringRoom === i
                    return (
                      <div key={b.id} className={`border-2 rounded-xl overflow-hidden transition
                        ${isWatching ? 'border-gold' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                          <div>
                            <span className="text-xs font-bold text-navy">{b.name}</span>
                            <span className="text-[9px] text-gray-400 ml-2">{students.length} students</span>
                            {currentBreakoutId === b.id && <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full ml-1">You're here</span>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setMonitoringRoom(isWatching ? null : i)}
                              className={`text-[9px] px-2 py-0.5 rounded-full border transition font-medium
                                ${isWatching ? 'bg-gold text-navy border-gold' : 'border-gray-300 text-gray-500 hover:border-gold hover:text-gold'}`}>
                              {isWatching ? '👁 Live' : '👁 Watch'}
                            </button>
                            <button onClick={() => generateReports(i)}
                              className="text-[9px] px-2 py-0.5 rounded-full border border-gray-300 text-gray-500 hover:border-blue-400 transition">📊</button>
                            <button onClick={() => currentBreakoutId === b.id ? leaveBreakout() : joinBreakout(b.id)}
                              className={`text-[9px] px-2 py-0.5 rounded-full border transition
                                ${currentBreakoutId === b.id ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-300 text-gray-500 hover:border-orange-400'}`}>
                              {currentBreakoutId === b.id ? 'Leave' : 'Enter'}
                            </button>
                          </div>
                        </div>

                        {(isWatching || monitorAll) && (
                          <div className="p-2 space-y-2">
                            <div className="grid grid-cols-2 gap-1.5">
                              {students.map((s, si) => (
                                <div key={si} className="bg-navy/5 rounded-lg p-2 flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${s.englishPct > 80 ? 'bg-green-500' : s.englishPct > 65 ? 'bg-amber-500' : 'bg-red-400'}`}>
                                    {s.name.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-semibold text-navy truncate">{s.name.split(' ')[0]}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                                        <div className={`h-1 rounded-full ${s.englishPct > 80 ? 'bg-green-400' : s.englishPct > 65 ? 'bg-amber-400' : 'bg-red-400'}`}
                                          style={{ width: `${s.englishPct}%` }} />
                                      </div>
                                      <span className="text-[8px] text-gray-400 shrink-0">{s.englishPct}%</span>
                                    </div>
                                    {s.arabicAlerts > 0 && <span className="text-[7px] text-red-400">🇸🇦 ×{s.arabicAlerts}</span>}
                                  </div>
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.speaking ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} title={s.speaking ? 'Speaking' : 'Silent'} />
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-1.5">
                              <input value={activityInputs[b.id] || ''}
                                onChange={e => setActivityInputs(prev => ({ ...prev, [b.id]: e.target.value }))}
                                placeholder="Type or pick an activity..."
                                className="flex-1 border border-orange-200 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-orange-400"
                                onKeyDown={e => e.key === 'Enter' && sendActivity(b.id)} />
                              <button onClick={() => sendActivity(b.id)}
                                className="bg-orange-500 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-bold hover:bg-orange-600 transition shrink-0">
                                Send
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {ACTIVITIES.slice(0, 5).map(a => (
                                <button key={a}
                                  onClick={() => { setActivityInputs(prev => ({ ...prev, [b.id]: a })); setTimeout(() => sendActivity(b.id), 10) }}
                                  className="text-[8px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full hover:bg-blue-100 transition">
                                  {a}
                                </button>
                              ))}
                            </div>

                            {sentActivities.filter(a => a.roomId === b.id).slice(0, 2).map((a, ai) => (
                              <div key={ai} className="text-[9px] bg-orange-50 border border-orange-100 rounded px-2 py-1 text-orange-700">
                                ✓ {a.time}: {a.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── MONITOR TAB ─── */}
          {tab === 'monitor' && (
            <div className="p-3 space-y-3">
              <p className="text-[10px] text-gray-500">Watch all breakout rooms live. Click any room to focus and send activities.</p>
              {breakouts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  <div className="text-3xl mb-2">👁</div>
                  <p>Create rooms in the Rooms tab first.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {breakouts.map((b, i) => {
                      const students = MOCK_STUDENTS[i % 3] || MOCK_STUDENTS[0]
                      const avgEng = Math.round(students.reduce((a, s) => a + s.englishPct, 0) / students.length)
                      return (
                        <div key={b.id} onClick={() => { setMonitoringRoom(i); setTab('rooms') }}
                          className="border-2 border-gray-200 hover:border-gold rounded-xl overflow-hidden cursor-pointer transition">
                          <div className="bg-navy/5 px-2 py-1.5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-navy truncate">{b.name}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full
                              ${antiCheatEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {antiCheatEnabled ? '🛡' : '○'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-0.5 p-1">
                            {students.slice(0, 4).map((s, si) => (
                              <div key={si} className={`rounded h-10 flex flex-col items-center justify-center relative
                                ${s.arabicAlerts > 0 ? 'bg-red-50' : 'bg-navy/5'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white
                                  ${s.englishPct > 80 ? 'bg-green-400' : s.englishPct > 65 ? 'bg-amber-400' : 'bg-red-400'}`}>
                                  {s.name.charAt(0)}
                                </div>
                                {s.speaking && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                                {s.arabicAlerts > 0 && <div className="absolute top-0.5 left-0.5 text-[7px]">🇸🇦</div>}
                              </div>
                            ))}
                          </div>
                          <div className="px-2 py-1.5 flex items-center justify-between">
                            <span className="text-[8px] text-gray-400">{students.length} students</span>
                            <div className="flex items-center gap-1">
                              <div className="w-12 h-1 bg-gray-200 rounded-full">
                                <div className={`h-1 rounded-full ${avgEng > 80 ? 'bg-green-400' : avgEng > 65 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${avgEng}%` }} />
                              </div>
                              <span className="text-[8px] text-gray-500">{avgEng}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Arabic alerts in monitor */}
                  {arabicAlerts.length > 0 && (
                    <div className="border border-red-200 rounded-xl p-2 bg-red-50">
                      <p className="text-[9px] font-bold text-red-700 mb-1.5">🇸🇦 Recent Arabic Detections</p>
                      <div className="space-y-1">
                        {arabicAlerts.slice(0, 3).map((a, i) => (
                          <div key={i} className="text-[9px] flex items-start gap-1.5">
                            <span className="text-[8px] text-gray-400 shrink-0">{a.time}</span>
                            <span className="font-medium text-navy shrink-0">{a.student.split(' ')[0]}:</span>
                            <span className="text-red-600 italic" dir="rtl">{a.phrase}</span>
                            <span className="text-gray-500">→ "{a.translation}"</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── ANTI-CHEAT TAB ─── */}
          {tab === 'anticheat' && (
            <div className="p-3 space-y-3">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-red-700">🛡 AI Anti-Cheat Engine</span>
                  <button onClick={toggleAntiCheat}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition shadow-sm
                      ${antiCheatEnabled ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'}`}>
                    {antiCheatEnabled ? '● ACTIVE' : '○ OFF'}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'copy', label: 'Block Copy-Paste & Cut', desc: 'Prevents clipboard operations', icon: '📋', active: blockCopyPaste, toggle: toggleCopyPaste },
                    { key: 'arabic', label: 'Detect Arabic Speech', desc: 'STT monitoring — alerts & corrects', icon: '🇸🇦', active: detectArabic, toggle: toggleArabicDetect },
                    { key: 'camera', label: 'Camera Supervision', desc: 'Monitor students via camera feed', icon: '📷', active: monitorCamera, toggle: () => setMonitorCamera(!monitorCamera) },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                      <span className="text-sm">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-navy">{item.label}</div>
                        <div className="text-[9px] text-gray-400">{item.desc}</div>
                      </div>
                      <button onClick={item.toggle}
                        className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${item.active ? 'bg-red-500' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              {detectArabic && antiCheatEnabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-amber-700 mb-1">🎤 Arabic Detection Protocol</p>
                  <ol className="text-[9px] text-amber-700 space-y-0.5 list-decimal list-inside">
                    <li>System detects Arabic speech via STT</li>
                    <li>Alert pops up with Arabic phrase + translation</li>
                    <li>Teacher asks student to repeat in English</li>
                    <li>Violation is logged to the daily report</li>
                    <li>Accumulated count tracked per student</li>
                  </ol>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-navy">Violation Log ({violations.length})</span>
                  <button onClick={() => setViolations([])} className="text-[9px] text-red-400 hover:text-red-600">Clear all</button>
                </div>
                {violations.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-[10px]">No violations yet. Enable Anti-Cheat to start monitoring.</div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {violations.slice(0, 30).map(v => (
                      <div key={v.id} className="bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-red-600">{v.type}</span>
                          <span className="text-[8px] text-gray-400">{v.time}</span>
                        </div>
                        <div className="text-[9px] font-medium text-navy mt-0.5">{v.student}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{v.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── REPORTS TAB ─── */}
          {tab === 'reports' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-navy">Daily Class Reports</span>
                  <div className="text-[9px] text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => generateReports(0)}
                    className="text-[9px] bg-gold text-navy px-2.5 py-1.5 rounded-full font-bold hover:bg-gold/90 transition">
                    Generate
                  </button>
                  {reports.length > 0 && (
                    <button onClick={exportCSV}
                      className="text-[9px] bg-navy text-white px-2.5 py-1.5 rounded-full font-bold hover:bg-navy/90 transition">
                      ⬇ CSV
                    </button>
                  )}
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs space-y-2">
                  <div className="text-4xl">📊</div>
                  <p>Click Generate or click 📊 in a room to create reports.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-navy">{r.studentName}</div>
                          <div className="text-[9px] text-gray-400">
                            {r.teacherName} · {r.room} · {r.date}
                          </div>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0
                          ${r.englishPercent >= 80 ? 'bg-green-100 text-green-700' :
                            r.englishPercent >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {r.englishPercent}% EN
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[9px]">
                        {[
                          { label: 'Participation', value: `${r.participation}%`, color: 'bg-blue-50 text-blue-600' },
                          { label: 'Arabic Uses', value: r.arabicCount, color: `${r.arabicCount > 2 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}` },
                          { label: 'Violations', value: r.violations.length, color: `${r.violations.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'}` },
                          { label: 'STT Words', value: r.sttWords, color: 'bg-purple-50 text-purple-600' },
                        ].map((m, mi) => (
                          <div key={mi} className={`${m.color} rounded-lg p-1.5 text-center`}>
                            <div className="font-bold">{m.value}</div>
                            <div className="text-[7px] opacity-70">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-[9px] flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded-full font-medium
                          ${r.behavior === 'Excellent' ? 'bg-green-100 text-green-700' :
                            r.behavior === 'Satisfactory' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {r.behavior}
                        </span>
                        <span className="text-gray-400 text-[8px]">Behavior</span>
                      </div>
                      <div className="bg-navy/5 rounded-lg p-2">
                        <p className="text-[8px] text-gray-400 font-semibold mb-0.5 uppercase tracking-wide">📝 Recommendations</p>
                        <p className="text-[9px] text-navy leading-relaxed">{r.recommendations}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reports.length > 0 && (
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-3">
                  <p className="text-[9px] font-bold text-blue-700 mb-1">📁 Archive & Supervisor Access</p>
                  <p className="text-[9px] text-blue-600">
                    Reports are accumulated daily per student and per teacher.
                    Individual reports with recommendations are automatically archived
                    and available for supervisor review interviews.
                  </p>
                  <button onClick={exportCSV} className="mt-2 text-[9px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition">
                    📤 Send to Supervisor Archive
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
