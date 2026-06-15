
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const QUESTIONS = [
  { q: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correct: 1 },
  { q: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
  { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1 },
  { q: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0 },
  { q: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], correct: 1 },
]

interface MonkeyBotProps {
  isOpen: boolean
  onClose: () => void
}

export function MonkeyBot({ isOpen, onClose }: MonkeyBotProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [countdown, setCountdown] = useState(15)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (!isOpen || showResult || isFinished) return
    setCountdown(15)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowResult(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, currentQ, showResult, isFinished])

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (idx === QUESTIONS[currentQ].correct) {
      setScore(prev => prev + 1)
    }
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1)
        setSelected(null)
        setShowResult(false)
        setCountdown(15)
      } else {
        setIsFinished(true)
      }
    }, 1500)
  }, [selected, currentQ])

  const restart = () => {
    setCurrentQ(0)
    setScore(0)
    setSelected(null)
    setShowResult(false)
    setCountdown(15)
    setIsFinished(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.9 }}
        className="fixed bottom-20 right-4 z-50 bg-white rounded-3xl shadow-2xl border border-gold/30 w-80 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            🐵
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">Monkey Quiz Bot</h3>
            <p className="text-[9px] text-white/70">Question {currentQ + 1}/{QUESTIONS.length}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{score}</div>
            <div className="text-[8px] text-white/60">Score</div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm ml-1">✕</button>
        </div>

        {isFinished ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-navy mb-1">Quiz Complete!</h3>
            <p className="text-sm text-gray-500 mb-1">Your score: <strong className="text-gold">{score}/{QUESTIONS.length}</strong></p>
            <p className="text-xs text-gray-400 mb-4">
              {score === QUESTIONS.length ? 'Perfect! You\'re a genius!' :
               score >= QUESTIONS.length / 2 ? 'Great job! Keep learning!' : 'Keep practicing!'}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={restart} className="bg-gold text-navy px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gold/90 transition shadow-sm">
                🔄 Play Again
              </button>
              <button onClick={onClose} className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-200 transition">
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-400">Time left</div>
              <div className={`text-sm font-bold ${countdown <= 5 ? 'text-red-500' : 'text-navy'}`}>
                {countdown}s
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
              <div className={`h-1.5 rounded-full transition-all duration-1000 ${countdown <= 5 ? 'bg-red-500' : 'bg-gold'}`}
                style={{ width: `${(countdown / 15) * 100}%` }} />
            </div>

            <p className="text-sm font-medium text-navy mb-4">{QUESTIONS[currentQ].q}</p>

            <div className="space-y-2">
              {QUESTIONS[currentQ].options.map((opt, idx) => {
                let bg = 'bg-gray-50 hover:bg-gold/10 border-gray-200'
                if (selected !== null) {
                  if (idx === QUESTIONS[currentQ].correct) bg = 'bg-green-50 border-green-400 text-green-700'
                  else if (idx === selected) bg = 'bg-red-50 border-red-400 text-red-700'
                  else bg = 'bg-gray-50 border-gray-200 opacity-50'
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)}
                    disabled={selected !== null}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-medium transition ${bg}`}>
                    <span className="inline-block w-5 h-5 rounded-full bg-gold/10 text-gold text-[9px] font-bold text-center leading-5 mr-2">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-1 mt-3">
              {QUESTIONS.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition ${idx === currentQ ? 'bg-gold w-3' : idx < currentQ ? 'bg-green-400' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
