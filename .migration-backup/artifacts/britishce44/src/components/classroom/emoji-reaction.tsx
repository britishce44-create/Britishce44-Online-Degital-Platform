
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '😮', '😍', '🙌', '💯', '🥳', '🤩']

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
  y: number
}

interface EmojiReactionProps {
  onReact: (emoji: string) => void
}

export function EmojiReaction({ onReact }: EmojiReactionProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [idCounter, setIdCounter] = useState(0)

  const sendReaction = useCallback((emoji: string) => {
    onReact(emoji)
    const id = idCounter
    setIdCounter(prev => prev + 1)
    setFloating(prev => [...prev, {
      id,
      emoji,
      x: Math.random() * 60 + 20,
      y: Math.random() * 40 + 30,
    }])
    setTimeout(() => setFloating(prev => prev.filter(f => f.id !== id)), 2000)
  }, [onReact, idCounter])

  return (
    <>
      <div className="relative">
        <button onClick={() => setShowPicker(!showPicker)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-white text-[10px] font-medium transition hover:bg-white/10">
          <span className="text-lg">👍</span>
          <span>React</span>
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gold/20 p-3 grid grid-cols-6 gap-1.5 z-50"
            >
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { sendReaction(emoji); setShowPicker(false) }}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gold/10 rounded-lg transition hover:scale-125">
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {floating.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 0.5, x: `${f.x}vw` }}
            animate={{ opacity: 0, y: -200, scale: 1.5, x: `${f.x + (Math.random() - 0.5) * 10}vw` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="fixed bottom-32 z-50 text-3xl pointer-events-none"
            style={{ left: `${f.x}vw` }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  )
}
