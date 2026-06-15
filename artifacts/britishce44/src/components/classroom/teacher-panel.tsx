
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TileParticipant } from './participant-tile'

interface TeacherPanelProps {
  isOpen: boolean
  onClose: () => void
  participants: TileParticipant[]
  onMuteAll: () => void
  onSpotlight: (userId: string) => void
  onLockRoom: (locked: boolean) => void
  onEject: (userId: string) => void
  roomLocked: boolean
}

export function TeacherPanel({ isOpen, onClose, participants, onMuteAll, onSpotlight, onLockRoom, onEject, roomLocked }: TeacherPanelProps) {
  const teachers = participants.filter(p => p.isTeacher)
  const students = participants.filter(p => !p.isTeacher)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="w-80 bg-white border-l border-gold/20 flex flex-col shadow-2xl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-gradient-to-r from-navy/5 to-transparent">
            <span className="text-sm font-bold text-navy">👨‍🏫 Teacher Desktop</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center text-sm">✕</button>
          </div>

          <div className="p-3 space-y-2 border-b border-gray-100">
            <h3 className="text-[10px] font-bold text-navy uppercase tracking-wider">Room Controls</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onMuteAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[10px] font-medium hover:bg-red-100 transition">
                🔇 Mute All
              </button>
              <button onClick={() => onLockRoom(!roomLocked)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-medium transition
                  ${roomLocked ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                {roomLocked ? '🔒 Unlock' : '🔓 Lock'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll">
            <h3 className="text-[10px] font-bold text-navy uppercase tracking-wider">
              Participants ({participants.length})
            </h3>
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${p.isTeacher ? 'bg-gold' : 'bg-navy/50'}`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-navy truncate">{p.name}</span>
                    {p.isTeacher && <span className="text-[9px] text-gold">👑</span>}
                    {p.isLocal && <span className="text-[8px] text-gold bg-gold/10 px-1 rounded">you</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.isMuted ? 'bg-red-400' : 'bg-green-400'}`} />
                    <span className="text-[9px] text-gray-400">{p.isMuted ? 'Muted' : 'Live'}</span>
                    {p.handRaised && <span className="text-[10px]">✋</span>}
                  </div>
                </div>
                {!p.isLocal && !p.isTeacher && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => onSpotlight(p.id)} title="Spotlight"
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gold/20 text-gray-400 hover:text-gold text-xs">⭐</button>
                    <button onClick={() => onEject(p.id)} title="Eject"
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 text-xs">🚫</button>
                  </div>
                )}
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No participants yet</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
