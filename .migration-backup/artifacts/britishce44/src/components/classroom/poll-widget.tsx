
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface PollData {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  isActive: boolean
}

interface LiveResults {
  id: string
  options: { text: string; votes: number; percent: number }[]
  totalVotes: number
}

interface PollWidgetProps {
  isOpen: boolean
  onClose: () => void
  isTeacher: boolean
  activePoll: PollData | null
  liveResults: LiveResults | null
  onCreatePoll: (question: string, options: string[]) => void
  onVote: (pollId: string, optionId: string) => void
  onEndPoll: (pollId: string) => void
}

export function PollWidget({ isOpen, onClose, isTeacher, activePoll, liveResults, onCreatePoll, onVote, onEndPoll }: PollWidgetProps) {
  const [question, setQuestion] = useState('')
  const [optInputs, setOptInputs] = useState(['', ''])
  const [votedOption, setVotedOption] = useState<string | null>(null)

  const addOption = () => setOptInputs(prev => [...prev, ''])

  const removeOption = (idx: number) => {
    if (optInputs.length <= 2) return
    setOptInputs(prev => prev.filter((_, i) => i !== idx))
  }

  const handleCreate = () => {
    const opts = optInputs.map(o => o.trim()).filter(Boolean)
    if (!question.trim() || opts.length < 2) return
    onCreatePoll(question.trim(), opts)
    setQuestion('')
    setOptInputs(['', ''])
  }

  const handleVote = (optionId: string) => {
    if (votedOption) return
    setVotedOption(optionId)
    onVote(activePoll!.id, optionId)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.9 }}
      className="fixed bottom-20 right-4 z-50 bg-white rounded-3xl shadow-2xl border border-gold/30 w-80 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>📊</span> {isTeacher ? 'Create Poll' : 'Poll'}
        </h3>
        <button onClick={onClose} className="text-white/60 hover:text-white text-sm">✕</button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {isTeacher && !activePoll && (
          <div className="space-y-3">
            <input value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Ask a question..." className="w-full border border-gold/20 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold" />
            {optInputs.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400 w-4">{String.fromCharCode(65 + idx)}</span>
                <input value={val} onChange={e => {
                  const next = [...optInputs]
                  next[idx] = e.target.value
                  setOptInputs(next)
                }} placeholder={`Option ${idx + 1}`}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-gold" />
                {optInputs.length > 2 && (
                  <button onClick={() => removeOption(idx)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={addOption} className="text-[10px] text-gold font-medium hover:underline">+ Add option</button>
              <button onClick={handleCreate}
                className="ml-auto bg-purple-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-purple-600 transition shadow-sm">
                📢 Launch Poll
              </button>
            </div>
          </div>
        )}

        {activePoll && (
          <div>
            <p className="text-sm font-bold text-navy mb-3">{activePoll.question}</p>
            <div className="space-y-2 mb-3">
              {activePoll.options.map(opt => {
                const percent = activePoll.totalVotes > 0 ? Math.round((opt.votes / activePoll.totalVotes) * 100) : 0
                const isSelected = votedOption === opt.id
                return (
                  <button key={opt.id} onClick={() => handleVote(opt.id)}
                    disabled={votedOption !== null}
                    className={`w-full text-left relative overflow-hidden rounded-xl border transition
                      ${isSelected ? 'border-purple-400 bg-purple-50' : votedOption ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'}`}>
                    <div className="absolute inset-0 bg-purple-100/50 transition-all duration-500" style={{ width: `${percent}%` }} />
                    <div className="relative flex items-center justify-between px-3 py-2.5">
                      <span className="text-xs font-medium text-navy flex items-center gap-2">
                        {isSelected && <span className="text-purple-500">✓</span>}
                        {opt.text}
                      </span>
                      {votedOption && (
                        <span className="text-[10px] font-bold text-purple-600">{percent}%</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{activePoll.totalVotes} vote{activePoll.totalVotes !== 1 ? 's' : ''}</span>
              {liveResults && (
                <span className="text-purple-500 font-medium">Live</span>
              )}
            </div>
          </div>
        )}

        {liveResults && !activePoll?.isActive && (
          <div className="text-center py-4">
            <p className="text-sm font-bold text-navy mb-1">📊 Final Results</p>
            {liveResults.options.map(opt => (
              <div key={opt.text} className="flex items-center justify-between py-1 text-xs">
                <span>{opt.text}</span>
                <span className="font-bold text-purple-600">{opt.percent}% ({opt.votes})</span>
              </div>
            ))}
          </div>
        )}

        {isTeacher && activePoll && (
          <button onClick={() => onEndPoll(activePoll.id)}
            className="mt-3 w-full bg-red-50 border border-red-200 text-red-500 px-3 py-2 rounded-xl text-[10px] font-bold hover:bg-red-100 transition">
            🛑 End Poll
          </button>
        )}

        {!activePoll && !isTeacher && (
          <div className="text-center py-6 text-gray-400 text-xs">
            No active poll right now
          </div>
        )}
      </div>
    </motion.div>
  )
}
