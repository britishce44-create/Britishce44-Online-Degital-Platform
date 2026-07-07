import { useEffect, useRef, useCallback, useState } from 'react'
import { apiPost } from '@/lib/api'

/* ── Classroom Anti-Cheat Detection Hook ──
   Ported from the quiz anti-cheat pattern (student-quiz.tsx) + classroom-specific
   monitoring. Activated by teacher/admin toggle. Detects:
   - Tab switching (visibilitychange)
   - Window blur (leaving the classroom window)
   - Copy/paste/cut (clipboard ban)
   - PrintScreen / Ctrl+P (screenshot ban)
   - Camera turned off (face_off)
   - Arabic speech detection (Web Speech API, ar-SA)
   All violations are logged to the server + trigger voice warnings (3 strikes).

   Returns: { violations, warningCount, blocked, arabicPhrases, startMonitoring, stopMonitoring }
*/

export interface ArabicPhrase {
  arabic: string
  english: string
  timestamp: string
}

interface Violation {
  eventType: string
  timestamp: string
  details?: Record<string, unknown>
}

const WARNING_MESSAGES = [
  {
    ar: 'تحذير أول: يمنع الغش أو استخدام اللغة العربية. اعتمد على نفسك، فالنجاح الحقيقي يأتي من جهدك أنت.',
    en: 'Warning 1: Cheating or Arabic usage is not allowed. Rely on yourself — true success comes from your own effort.',
  },
  {
    ar: 'تحذير ثاني: هذا هو إنذارك الأخير. توقف فوراً عن أي محاولة غش أو استخدام العربية.',
    en: 'Warning 2: This is your final warning. Stop any cheating or Arabic usage immediately.',
  },
  {
    ar: 'تحذير ثالث: تم تجاوز الحد المسموح. سيتم نقلك للتحدث مع المشرف الأكاديمي.',
    en: 'Warning 3: You have exceeded the allowed limit. You will be moved to speak with the academic supervisor.',
  },
]

const WISE_ADVICE = [
  'النجاح الحقيقي يأتي من جهدك أنت، وليس من نسخ إجابات الآخرين',
  'True success comes from your own effort, not from copying others\' answers',
]

function speakWarning(message: string, lang: 'ar-SA' | 'en-US') {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.volume = 1
    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]))
    if (match) utterance.voice = match
    window.speechSynthesis.speak(utterance)
  } catch {}
}

export function useClassroomAntiCheat(sessionId: number | null, active: boolean, studentName: string) {
  const [violations, setViolations] = useState<Violation[]>([])
  const [warningCount, setWarningCount] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const [arabicPhrases, setArabicPhrases] = useState<ArabicPhrase[]>([])
  const [showWarning, setShowWarning] = useState<{ ar: string; en: string; count: number } | null>(null)

  const warningCountRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const cameraCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logViolation = useCallback(async (eventType: string, details?: Record<string, unknown>) => {
    if (!sessionId) return
    const count = warningCountRef.current + 1
    warningCountRef.current = count
    setWarningCount(count)

    const violation: Violation = { eventType, timestamp: new Date().toISOString(), details }
    setViolations(v => [...v, violation])

    // Log to server
    try {
      await apiPost(`/classroom-sessions/${sessionId}/anti-cheat/log`, {
        studentName,
        eventType,
        details,
        warningCount: count,
        blocked: count >= 3,
      })
    } catch {}

    // Show warning + speak
    if (count <= 3) {
      const msg = WARNING_MESSAGES[count - 1]
      setShowWarning({ ar: msg.ar, en: msg.en, count })
      speakWarning(msg.ar, 'ar-SA')
      setTimeout(() => speakWarning(msg.en, 'en-US'), 3000)
      // Auto-hide after 6 seconds
      setTimeout(() => setShowWarning(null), 6000)
    }

    // Block after 3
    if (count >= 3) {
      setBlocked(true)
      try {
        await apiPost(`/classroom-sessions/${sessionId}/block-student`, { studentName })
      } catch {}
      // Redirect to blocked room (9999)
      setTimeout(() => {
        window.location.href = `${window.location.origin}/?room=9999`
      }, 2000)
    }
  }, [sessionId, studentName])

  // Tab switch detection
  useEffect(() => {
    if (!active || blocked) return
    const handler = () => {
      if (document.hidden) logViolation('tab_switch', { visibilityState: document.visibilityState })
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [active, blocked, logViolation])

  // Window blur detection
  useEffect(() => {
    if (!active || blocked) return
    const handler = () => logViolation('window_blur', { focused: false })
    window.addEventListener('blur', handler)
    return () => window.removeEventListener('blur', handler)
  }, [active, blocked, logViolation])

  // Copy/paste/cut ban
  useEffect(() => {
    if (!active || blocked) return
    const prevent = (e: Event) => {
      e.preventDefault()
      logViolation('copy_paste', { action: e.type })
      return false
    }
    document.addEventListener('copy', prevent)
    document.addEventListener('paste', prevent)
    document.addEventListener('cut', prevent)
    return () => {
      document.removeEventListener('copy', prevent)
      document.removeEventListener('paste', prevent)
      document.removeEventListener('cut', prevent)
    }
  }, [active, blocked, logViolation])

  // PrintScreen / Ctrl+P ban
  useEffect(() => {
    if (!active || blocked) return
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('').catch(() => {})
        logViolation('screenshot', { key: e.key })
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        logViolation('screenshot', { key: 'Ctrl+P' })
      }
    }
    window.addEventListener('keydown', keyHandler)
    return () => window.removeEventListener('keydown', keyHandler)
  }, [active, blocked, logViolation])

  // Arabic speech detection (Web Speech API)
  useEffect(() => {
    if (!active || blocked) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return // Not supported on this browser

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'ar-SA'

    recognition.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim()
        if (event.results[i].isFinal && transcript) {
          // Detect Arabic characters
          if (/[\u0600-\u06FF]/.test(transcript)) {
            // Translate via API
            let english = ''
            try {
              const r = await apiPost<{ result: string }>('/ai/whiteboard', { action: 'translate', text: transcript, lang: 'ar→en' })
              english = r.result || ''
            } catch {}

            const phrase: ArabicPhrase = {
              arabic: transcript,
              english,
              timestamp: new Date().toISOString(),
            }
            setArabicPhrases(p => [...p, phrase])

            // Log as suspicious_audio
            logViolation('suspicious_audio', { phrase: transcript, translation: english })
          }
        }
      }
    }

    recognition.onerror = () => { /* ignore — restart below */ }
    recognition.onend = () => {
      // Auto-restart if still active
      if (active && !blocked) {
        try { recognition.start() } catch {}
      }
    }

    try { recognition.start() } catch {}
    recognitionRef.current = recognition

    return () => {
      try { recognition.stop() } catch {}
      recognitionRef.current = null
    }
  }, [active, blocked, logViolation])

  // Camera-off detection
  const setCameraTrack = useCallback((track: MediaStreamTrack | null) => {
    cameraTrackRef.current = track
  }, [])

  useEffect(() => {
    if (!active || blocked) return
    cameraCheckRef.current = setInterval(() => {
      const track = cameraTrackRef.current
      if (track) {
        if (!track.enabled || track.readyState === 'ended') {
          logViolation('face_off', { enabled: track.enabled, readyState: track.readyState })
        }
      }
    }, 5000)
    return () => { if (cameraCheckRef.current) clearInterval(cameraCheckRef.current) }
  }, [active, blocked, logViolation])

  const clearViolations = useCallback(() => {
    setViolations([])
    setWarningCount(0)
    warningCountRef.current = 0
    setBlocked(false)
    setArabicPhrases([])
    setShowWarning(null)
  }, [])

  return {
    violations,
    warningCount,
    blocked,
    arabicPhrases,
    showWarning,
    setCameraTrack,
    clearViolations,
  }
}
