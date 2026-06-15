
import { motion } from 'framer-motion'

interface RecordingIndicatorProps {
  isRecording: boolean
  elapsed: number
  quality?: string
  onPause?: () => void
  onStop?: () => void
  isTeacher?: boolean
  isPaused?: boolean
  onResume?: () => void
}

export function RecordingIndicator({ isRecording, elapsed, quality = '1080p', onPause, onStop, isTeacher, isPaused, onResume }: RecordingIndicatorProps) {
  if (!isRecording) return null

  const formatElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-300/30 shadow-sm"
    >
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-red-500 inline-block"
      />
      <span className="text-[10px] font-bold text-red-600 tabular-nums">
        REC {formatElapsed(elapsed)}
      </span>
      <span className="text-[8px] text-red-400 bg-red-100 px-1 rounded">{quality}</span>
      {isTeacher && (
        <div className="flex gap-1 ml-1">
          {isPaused ? (
            <button onClick={onResume}
              className="text-[9px] text-green-600 hover:bg-green-50 px-1.5 py-0.5 rounded">▶</button>
          ) : (
            <button onClick={onPause}
              className="text-[9px] text-amber-600 hover:bg-amber-50 px-1.5 py-0.5 rounded">⏸</button>
          )}
          <button onClick={onStop}
            className="text-[9px] text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded font-bold">⏹</button>
        </div>
      )}
    </motion.div>
  )
}
