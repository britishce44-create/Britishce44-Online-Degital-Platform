import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onOpenLogin: () => void
}

export function PlatformAccessButton({ onOpenLogin }: Props) {
  const [showOptions, setShowOptions] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Options menu */}
      {showOptions && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-2xl p-2 shadow-2xl mb-1"
          style={{
            background: 'linear-gradient(135deg, #0a1a4a, #1e3a8a)',
            border: '1px solid rgba(255,255,255,0.08)',
            minWidth: 220,
          }}>
          <button
            onClick={() => { onOpenLogin(); setShowOptions(false) }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition flex items-center gap-3">
            <span className="text-lg">🎓</span>
            <div>
              <div>Student Login</div>
              <div className="text-[10px] text-gray-400 font-normal">Study, quizzes, classes</div>
            </div>
          </button>
          <button
            onClick={() => { onOpenLogin(); setShowOptions(false) }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition flex items-center gap-3">
            <span className="text-lg">👨‍🏫</span>
            <div>
              <div>Teacher Login</div>
              <div className="text-[10px] text-gray-400 font-normal">Manage classes, evaluations</div>
            </div>
          </button>
          <button
            onClick={() => { onOpenLogin(); setShowOptions(false) }}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/5 transition flex items-center gap-3">
            <span className="text-lg">👤</span>
            <div>
              <div>New Student Application</div>
              <div className="text-[10px] text-gray-400 font-normal">Apply & meet the supervisor</div>
            </div>
          </button>
          <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="px-4 py-2 text-[10px] text-gray-500 font-medium text-center">
            Britishce44 Online Digital Platform
          </div>
        </motion.div>
      )}

      {/* Main button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowOptions(!showOptions)}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg, #D4A017, #F5C518)',
          boxShadow: '0 4px 24px rgba(212,160,23,0.4)',
        }}>
        <span className="text-xl font-black text-[#0a1a4a]">B44</span>
        {/* Notification dot */}
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0a1a4a]"></span>
      </motion.button>

      {/* Label */}
      {!showOptions && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-bold px-3 py-1 rounded-full text-golden-bright"
          style={{ background: 'rgba(10,26,74,0.8)', border: '1px solid rgba(212,160,23,0.2)' }}>
          Platform Access
        </motion.span>
      )}
    </div>
  )
}
