import React, { useState, useEffect, useRef } from 'react'

export interface StripParticipant {
  id: string
  name: string
  stream?: MediaStream | null
  isLocal?: boolean
  isTeacher?: boolean
  isMuted?: boolean
  isCameraOn?: boolean
}

interface ParticipantStripProps {
  participants: StripParticipant[]
  dir?: 'ltr' | 'rtl'
  onParticipantClick?: (p: StripParticipant) => void
}

const VideoTile: React.FC<{ participant: StripParticipant; height: number; onClick?: () => void }> = ({
  participant,
  height,
  onClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  const hasVideo = Boolean(participant.stream && participant.isCameraOn !== false)
  // Calculate tile width dynamically based on height (4:3 aspect ratio)
  const tileWidth = Math.round((height - 16) * 1.33)

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-between rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md transition-all hover:border-amber-400 cursor-pointer shrink-0"
      style={{ width: `${Math.max(120, tileWidth)}px`, height: `${height - 16}px` }}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal} // Prevents audio loop for local mic
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 text-amber-300 font-bold text-lg">
          {participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
          <span className="text-[10px] text-slate-400 font-normal mt-1">Camera Off</span>
        </div>
      )}

      {/* Top badges: Teacher crown & Mic indicator */}
      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
        {participant.isTeacher && (
          <span className="bg-amber-500/90 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
             Host
          </span>
        )}
        <span
          className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow ${
            participant.isMuted ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-white'
          }`}
        >
          {participant.isMuted ? '' : ''}
        </span>
      </div>

      {/* Bottom overlay: Name tag */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 py-1 flex items-center justify-between z-10">
        <span className="text-[11px] font-medium text-white truncate max-w-[90px]">
          {participant.name} {participant.isLocal ? '(You)' : ''}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </div>
  )
}

export const ParticipantStrip: React.FC<ParticipantStripProps> = ({
  participants,
  onParticipantClick,
}) => {
  const [stripHeight, setStripHeight] = useState<number>(110) // default height
  const [isPopoutOpen, setIsPopoutOpen] = useState<boolean>(false)
  const isResizingRef = useRef<boolean>(false)
  const startYRef = useRef<number>(0)
  const startHeightRef = useRef<number>(110)

  // Vertical resize handle controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true
    startYRef.current = e.clientY
    startHeightRef.current = stripHeight
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return
    const deltaY = e.clientY - startYRef.current
    const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 80), 280) // Min 80px, Max 280px
    setStripHeight(newHeight)
  }

  const handleMouseUp = () => {
    isResizingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="relative w-full border-b border-slate-700/50 bg-slate-900/90 text-white transition-all">
      {/* Top Control Bar: Popout window button */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950/80 text-xs border-b border-white/5">
        <span className="text-slate-400 font-medium text-[11px]">
          Live Video Panel ({participants.length} connected)
        </span>
        <button
          onClick={() => setIsPopoutOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px] border border-amber-500/30 transition"
          title="Open in Popup Window"
        >
          <span></span>
          <span>Pop-out Window</span>
        </button>
      </div>

      {/* Scrollable Video Strip Container */}
      <div
        style={{ height: `${stripHeight}px` }}
        className="w-full flex items-center gap-3 overflow-x-auto p-2 no-scrollbar"
      >
        {participants.map((p) => (
          <VideoTile
            key={p.id}
            participant={p}
            height={stripHeight}
            onClick={() => onParticipantClick?.(p)}
          />
        ))}
      </div>

      {/* Resize Handle Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="w-full h-2 cursor-row-resize bg-slate-800/80 hover:bg-amber-500/50 flex items-center justify-center transition-colors group"
        title="Drag up or down to resize video panel"
      >
        <div className="w-10 h-0.5 rounded bg-slate-500 group-hover:bg-amber-300" />
      </div>

      {/* Pop-out Overlay Modal */}
      {isPopoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl bg-slate-950 rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-white/10">
              <h3 className="text-amber-300 font-semibold text-sm flex items-center gap-2">
                <span></span> Live Participants Grid
              </h3>
              <button
                onClick={() => setIsPopoutOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 text-xs font-bold transition"
              >
                 Close
              </button>
            </div>

            {/* Modal Video Grid */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh]">
              {participants.map((p) => (
                <div key={`modal-${p.id}`} className="aspect-video w-full rounded-xl overflow-hidden border border-slate-700">
                  <VideoTile
                    participant={p}
                    height={200}
                    onClick={() => onParticipantClick?.(p)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
