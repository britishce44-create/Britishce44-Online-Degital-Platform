import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, MicOff, Mic } from 'lucide-react'

export interface StageParticipant {
  id: string
  name: string
  isTeacher?: boolean
  isLocal?: boolean
  stream?: MediaStream | null
  isMuted?: boolean
  isCameraOn?: boolean
  handRaised?: boolean
  isSharing?: boolean
}

interface ScreenStageProps {
  presenter: StageParticipant
  others: StageParticipant[]
  isTeacher: boolean
  onStop?: () => void
  onClose?: () => void
  localName?: string
}

function Video({ stream, muted, className }: { stream?: MediaStream | null; muted?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
  }, [stream])
  if (!stream) return null
  return (
    <video ref={ref} autoPlay playsInline muted={muted}
      className={`absolute inset-0 w-full h-full ${className ?? 'object-cover'}`} />
  )
}

function Avatar({ name, isTeacher }: { name: string; isTeacher?: boolean }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg"
      style={{ background: isTeacher ? 'linear-gradient(135deg,#00684a,#00ae74)' : 'linear-gradient(135deg,#2620a8,#2563eb)' }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

export function ScreenStage({ presenter, others, onStop, onClose, localName }: ScreenStageProps) {
  const p = presenter
  const presenterName = p.name || (p.isLocal ? (localName || 'You') : 'Presenter')

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(120% 100% at 50% 0%, #1d1668 0%, #120c4a 60%, #0d0834 100%)' }}>

      {/* Top status bar */}
      <div className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{ background: 'rgba(6,11,24,0.6)', borderBottom: '1px solid rgba(37,99,235,0.15)', backdropFilter: 'blur(6px)' }}>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 8px #ef4444' }} />
        <span className="text-xs font-bold text-white">🖥 {presenterName} is presenting</span>
        {onStop && (
          <button onClick={onStop}
            className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold text-white transition hover:bg-red-600"
            style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}>
            Stop presenting
          </button>
        )}
        {onClose && (
          <button onClick={onClose} title="Exit stage view"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stage — shared screen fills the space (object-contain, Centre) */}
      <div className="flex-1 relative min-h-0">
        <Video stream={presenter.stream} muted={presenter.isLocal} className="absolute inset-0 w-full h-full object-contain" />
        {!presenter.stream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Avatar name={presenterName} isTeacher={presenter.isTeacher} />
            <p className="text-sm text-white/80 font-semibold">{presenterName}</p>
            <p className="text-xs text-white/40">Sharing temporarily unavailable</p>
          </div>
        )}
      </div>

      {/* Filmstrip — other participants as small tiles at the bottom */}
      {others.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 shrink-0 overflow-x-auto custom-scroll"
          style={{ background: 'rgba(6,11,24,0.55)', borderTop: '1px solid rgba(37,99,235,0.15)', backdropFilter: 'blur(6px)' }}>
          {others.slice(0, 12).map(o => (
            <motion.div key={o.id} className="relative flex-shrink-0 rounded-xl overflow-hidden"
              style={{
                width: 96, height: 62,
                border: o.isTeacher ? '1.5px solid rgba(0,174,116,0.5)' : '1px solid rgba(63,186,235,0.25)',
                background: o.isTeacher ? 'linear-gradient(135deg,#063a28,#00ae74)' : 'linear-gradient(135deg,#2620a8,#1d1668)',
              }}>
              <Video stream={o.stream} muted className="absolute inset-0 w-full h-full object-cover" />
              {!o.stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#2620a8,#2563eb)' }}>
                    {(o.name || '?').charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 flex items-center gap-1"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                <span className="text-[8px] text-white font-semibold truncate">
                  {o.isLocal ? (localName || 'You') : (o.name || '')}
                </span>
                <span className="ml-auto">{o.isMuted ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-emerald-400" />}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}