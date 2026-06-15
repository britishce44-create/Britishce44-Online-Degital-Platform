
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface TimerPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function TimerPopup({ isOpen, onClose }: TimerPopupProps) {
  const [mode, setMode] = useState<'study' | 'break'>('study')
  const [studyMinutes, setStudyMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [totalSeconds, setTotalSeconds] = useState(studyMinutes * 60)
  const [remaining, setRemaining] = useState(totalSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const t = mode === 'study' ? studyMinutes * 60 : breakMinutes * 60
    if (!isRunning) {
      setTotalSeconds(t)
      setRemaining(t)
    }
  }, [mode, studyMinutes, breakMinutes, isRunning])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference * (1 - progress)

  const handleStart = useCallback(() => {
    if (remaining <= 0) {
      const t = mode === 'study' ? studyMinutes * 60 : breakMinutes * 60
      setTotalSeconds(t)
      setRemaining(t)
    }
    setIsRunning(true)
  }, [remaining, mode, studyMinutes, breakMinutes])

  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    const t = mode === 'study' ? studyMinutes * 60 : breakMinutes * 60
    setTotalSeconds(t)
    setRemaining(t)
  }

  if (!isOpen) return null

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isMinimized ? { width: 160, height: 48 } : { opacity: 1, scale: 1 }}
      className={`fixed bottom-20 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gold/30 overflow-hidden ${isMinimized ? 'cursor-pointer' : ''}`}
      style={{ width: isMinimized ? 160 : 280 }}
    >
      {isMinimized ? (
        <div onClick={() => setIsMinimized(false)} className="flex items-center gap-2 px-3 py-2.5 h-full">
          <span className="text-sm">⏱</span>
          <span className="text-xs font-bold text-navy">{formatTime(remaining)}</span>
          <span className="text-[9px] text-gold ml-auto">{mode === 'study' ? 'Study' : 'Break'}</span>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              <button onClick={() => setMode('study')}
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition ${mode === 'study' ? 'bg-gold text-navy' : 'bg-gray-100 text-gray-500'}`}>
                📚 Study
              </button>
              <button onClick={() => setMode('break')}
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition ${mode === 'break' ? 'bg-gold text-navy' : 'bg-gray-100 text-gray-500'}`}>
                ☕ Break
              </button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsMinimized(true)} className="text-gray-400 hover:text-gray-600 text-xs">─</button>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
            </div>
          </div>

          <div className="flex justify-center mb-3">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="65" cy="65" r="54" fill="none" stroke="#00ae74" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" transform="rotate(-90 65 65)"
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
              <text x="65" y="62" textAnchor="middle" className="text-lg font-bold fill-navy" fontSize="22" fontWeight="bold">
                {formatTime(remaining)}
              </text>
              <text x="65" y="82" textAnchor="middle" fontSize="10" fill="#9ca3af">
                {mode === 'study' ? 'FOCUS' : 'REST'}
              </text>
            </svg>
          </div>

          <div className="flex justify-center gap-2 mb-3">
            {!isRunning ? (
              <button onClick={handleStart} className="bg-gold text-navy px-5 py-1.5 rounded-full text-[10px] font-bold hover:bg-gold/90 transition shadow-sm">
                ▶ Start
              </button>
            ) : (
              <button onClick={handlePause} className="bg-gold text-navy px-5 py-1.5 rounded-full text-[10px] font-bold hover:bg-gold/90 transition shadow-sm">
                ⏸ Pause
              </button>
            )}
            <button onClick={handleReset} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-[10px] font-medium hover:bg-gray-200 transition">
              ↺ Reset
            </button>
          </div>

          <div className="flex gap-2 justify-center">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-400">Study:</span>
              <input type="number" min={1} max={120} value={studyMinutes}
                onChange={e => setStudyMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 text-center border border-gold/20 rounded text-[10px] py-0.5 outline-none" disabled={isRunning} />
              <span className="text-[8px] text-gray-400">min</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-400">Break:</span>
              <input type="number" min={1} max={60} value={breakMinutes}
                onChange={e => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 text-center border border-gold/20 rounded text-[10px] py-0.5 outline-none" disabled={isRunning} />
              <span className="text-[8px] text-gray-400">min</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
