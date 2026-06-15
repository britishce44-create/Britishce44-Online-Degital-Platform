
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

export interface TileParticipant {
  id: string
  name: string
  role: string
  isTeacher?: boolean
  isLocal?: boolean
  stream?: MediaStream | null
  isMuted?: boolean
  isCameraOn?: boolean
  handRaised?: boolean
}

interface ParticipantTileProps {
  participant: TileParticipant
  className?: string
  style?: React.CSSProperties
  onDoubleClick?: () => void
}

export function ParticipantTile({ participant, className = '', style, onDoubleClick }: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const p = participant

  useEffect(() => {
    if (videoRef.current && p.stream) {
      videoRef.current.srcObject = p.stream
      setVideoLoaded(true)
    }
  }, [p.stream])

  const hasVideo = p.isLocal || (p.stream && p.isCameraOn !== false)

  return (
    <motion.div
      layout
      onDoubleClick={onDoubleClick}
      className={`relative rounded-xl overflow-hidden bg-navy/5 border select-none
        ${p.isTeacher ? 'border-2 border-gold shadow-gold/20' : 'border-gray-200'}
        ${className}`}
      style={style}
    >
      {p.isLocal && p.stream ? (
        <video ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover" />
      ) : p.stream && p.isCameraOn !== false ? (
        <video ref={videoRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      {!videoLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-navy/10 to-gold/10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg
            ${p.isTeacher ? 'bg-gold' : 'bg-navy/60'}`}>
            {p.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute top-1.5 left-1.5 flex gap-1">
        <div className={`w-2 h-2 rounded-full ${p.isMuted ? 'bg-red-500' : 'bg-green-400'} shadow-sm`} title={p.isMuted ? 'Muted' : 'Audio on'} />
        {(p.isCameraOn === false || (!p.stream && !p.isLocal)) && (
          <div className="w-2 h-2 rounded-full bg-red-400 shadow-sm" title="Camera off" />
        )}
      </div>

      {p.isTeacher && (
        <div className="absolute top-1.5 right-1.5 bg-gold text-navy text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
          👑 Teacher
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-[10px] font-medium truncate max-w-[80%]">
            {p.name}
          </span>
          {p.isLocal && <span className="text-[8px] text-gold bg-navy/60 px-1 rounded">You</span>}
          {p.isLocal && (
            <span className="ml-auto text-[9px] text-gray-300">
              {window.innerWidth > 768 ? 'HD' : ''}
            </span>
          )}
        </div>
      </div>

      {p.handRaised && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: [0, -10, 0], opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl z-20"
        >
          ✋
        </motion.div>
      )}
    </motion.div>
  )
}
