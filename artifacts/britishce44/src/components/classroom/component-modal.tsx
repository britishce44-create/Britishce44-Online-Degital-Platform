
import { motion, AnimatePresence } from 'framer-motion'

interface ModalCard {
  icon: string
  title: string
  description: string
  color: string
}

const CARDS: ModalCard[] = [
  { icon: '🧮', title: 'Calculator', description: 'Scientific calculator', color: 'from-blue-400 to-blue-600' },
  { icon: '📝', title: 'Notes', description: 'Quick note taking', color: 'from-green-400 to-green-600' },
  { icon: '📚', title: 'Dictionary', description: 'Look up words', color: 'from-purple-400 to-purple-600' },
  { icon: '🧪', title: 'Lab Tools', description: 'Virtual experiments', color: 'from-cyan-400 to-cyan-600' },
  { icon: '🎮', title: 'Games', description: 'Educational games', color: 'from-orange-400 to-orange-600' },
  { icon: '📊', title: 'Charts', description: 'Data visualization', color: 'from-pink-400 to-pink-600' },
  { icon: '🌍', title: 'Maps', description: 'Geography explorer', color: 'from-teal-400 to-teal-600' },
  { icon: '🎵', title: 'Music', description: 'Music tools', color: 'from-rose-400 to-rose-600' },
  { icon: '🔬', title: 'Science', description: 'Science lab', color: 'from-indigo-400 to-indigo-600' },
  { icon: '📖', title: 'Library', description: 'E-books & resources', color: 'from-amber-400 to-amber-600' },
  { icon: '✏️', title: 'Drawing', description: 'Freehand drawing', color: 'from-lime-400 to-lime-600' },
  { icon: '🧩', title: 'Puzzles', description: 'Brain teasers', color: 'from-violet-400 to-violet-600' },
]

interface ComponentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComponentModal({ isOpen, onClose }: ComponentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl border border-gold/20 p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-navy">🧰 Learning Tools</h2>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {CARDS.map(card => (
                <motion.button
                  key={card.title}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br border border-gray-100 shadow-sm hover:shadow-md transition"
                  style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg shadow-sm`}>
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-bold text-navy text-center leading-tight">{card.title}</span>
                  <span className="text-[8px] text-gray-400 text-center">{card.description}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
