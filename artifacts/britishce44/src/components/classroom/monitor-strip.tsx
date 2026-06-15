import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

export interface MonitorParticipant {
  id: string; name: string; isTeacher?: boolean; isLocal?: boolean
  stream?: MediaStream | null; isMuted?: boolean; isCameraOn?: boolean; handRaised?: boolean
}

interface MonitorStripProps {
  participants: MonitorParticipant[]
  isTeacher: boolean
  stripHeight: number
  onStripHeightChange: (h: number) => void
}

const PRESET_BGS = [
  { id: 'default', label: 'Dark Navy', css: '#241c80' },
  { id: 'space',   label: 'Deep Space', css: 'linear-gradient(135deg,#17125c 0%,#281f6e 50%,#1d1668 100%)' },
  { id: 'ocean',   label: 'Ocean Depth', css: 'linear-gradient(135deg,#241c80 0%,#1e3a8a 100%)' },
  { id: 'forest',  label: 'Emerald', css: 'linear-gradient(135deg,#052e16 0%,#00684a 100%)' },
  { id: 'royal',   label: 'Royal Violet', css: 'linear-gradient(135deg,#150529 0%,#4c1d95 100%)' },
  { id: 'crimson', label: 'Crimson', css: 'linear-gradient(135deg,#1c0000 0%,#7f1d1d 100%)' },
  { id: 'amber',   label: 'Amber', css: 'linear-gradient(135deg,#1c0f00 0%,#92400e 100%)' },
  { id: 'cyber',   label: 'Cyber', css: 'linear-gradient(135deg,#042f2e 0%,#164e63 100%)' },
  { id: 'aurora',  label: 'Aurora', css: 'linear-gradient(135deg,#241c80 0%,#281f6e 33%,#042f2e 66%,#241c80 100%)' },
]

interface MonitorTileProps {
  participant: MonitorParticipant; bg?: string; height: number
  isLarge?: boolean; isTeacher: boolean
  onBgClick?: () => void
}

function MonitorTile({ participant: p, bg, height, isLarge, isTeacher, onBgClick }: MonitorTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    if (el && p.stream) { el.srcObject = p.stream; setVideoReady(true) }
  }, [p.stream])

  const w = isLarge ? Math.round(height * 1.55) : Math.round(height * 0.85)

  return (
    <div className="relative flex-shrink-0 rounded-xl overflow-hidden group select-none"
      style={{
        width: w, height: height - 16,
        background: bg || (p.isTeacher ? 'linear-gradient(135deg,#281f6e,#241c80)' : 'linear-gradient(135deg,#241c80,#17125c)'),
        border: p.isTeacher ? '1.5px solid rgba(0, 174, 116,0.45)' : '1px solid rgba(63, 186, 235,0.2)',
        boxShadow: p.isTeacher
          ? '0 4px 20px rgba(0, 174, 116,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}>

      {/* Video */}
      {p.stream ? (
        <video ref={attachVideo} autoPlay playsInline muted={p.isLocal}
          className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`rounded-full flex items-center justify-center font-black text-white shadow-xl
            ${p.isTeacher ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}
            style={{ width: Math.round(height * 0.32), height: Math.round(height * 0.32), fontSize: Math.round(height * 0.14) }}>
            {p.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Scanline overlay for futuristic feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)' }} />

      {/* Top indicators */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${p.isMuted ? 'bg-red-500' : 'bg-emerald-400'}`}
          style={{ boxShadow: p.isMuted ? '0 0 4px #ef4444' : '0 0 4px #34d399' }} />
        {(p.isCameraOn === false && !p.isLocal) && (
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ boxShadow: '0 0 4px #fb923c' }} />
        )}
      </div>

      {/* Teacher badge */}
      {p.isTeacher && (
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
          style={{ background: 'linear-gradient(135deg,#00875a,#00ae74)', color: '#17125c' }}>
          👑 Teacher
        </div>
      )}

      {/* Hand raised */}
      {p.handRaised && (
        <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 0.8, repeat: Infinity }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xl z-10">✋</motion.div>
      )}

      {/* Name bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-medium truncate" style={{ fontSize: Math.max(8, Math.round(height * 0.075)) }}>
            {p.name.split(' ')[0]}
          </span>
          {p.isLocal && <span className="text-[7px] text-amber-300 bg-amber-400/15 px-1 rounded">You</span>}
        </div>
      </div>

      {/* Background change button (teacher only) */}
      {isTeacher && (
        <button onClick={onBgClick}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-20">
          <div className="bg-black/50 backdrop-blur rounded-full px-2 py-1 text-[9px] text-white flex items-center gap-1">
            🎨 BG
          </div>
        </button>
      )}
    </div>
  )
}

export function MonitorStrip({ participants, isTeacher, stripHeight, onStripHeightChange }: MonitorStripProps) {
  const [monitorBgs, setMonitorBgs] = useState<Record<string, string>>({})
  const [stripBg, setStripBg] = useState('linear-gradient(180deg,#1d1668 0%,#241c80 100%)')
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customUploadUrl, setCustomUploadUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const teacher = participants.find(p => p.isTeacher)
  const students = participants.filter(p => !p.isTeacher)

  const applyBg = useCallback((css: string) => {
    if (selectedId === '__strip__') {
      setStripBg(css)
    } else if (selectedId) {
      setMonitorBgs(prev => ({ ...prev, [selectedId]: css }))
    }
  }, [selectedId])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const css = `url(${url}) center/cover no-repeat`
    setCustomUploadUrl(url)
    applyBg(css)
  }, [applyBg])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isTeacher) return
    e.preventDefault()
    const startY = e.clientY
    const startH = stripHeight
    const onMove = (ev: MouseEvent) => {
      onStripHeightChange(Math.max(100, Math.min(320, startH + ev.clientY - startY)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [isTeacher, stripHeight, onStripHeightChange])

  return (
    <div className="relative shrink-0 overflow-hidden"
      style={{ height: stripHeight, background: stripBg }}>

      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500/40 via-indigo-500/40 to-violet-500/40" />

      {/* Header row */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Monitor Strip</span>
          <span className="flex items-center gap-1 text-[8px] text-emerald-400/70">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            {participants.length} online
          </span>
        </div>
        {isTeacher && (
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button onClick={() => { setSelectedId('__strip__'); setShowBgPicker(true) }}
              className="text-[8px] bg-white/8 text-white/60 hover:text-white px-2 py-0.5 rounded-full border border-white/10 hover:border-indigo-400/40 transition backdrop-blur-sm">
              🎨 Strip BG
            </button>
          </div>
        )}
      </div>

      {/* Monitor tiles */}
      <div className="absolute inset-x-0 top-6 bottom-3 flex items-center gap-2 px-3 overflow-x-auto custom-scroll">
        {/* Teacher first (larger) */}
        {teacher && (
          <>
            <MonitorTile participant={teacher} bg={monitorBgs[teacher.id]} height={stripHeight - 16}
              isLarge isTeacher={isTeacher}
              onBgClick={isTeacher ? () => { setSelectedId(teacher.id); setShowBgPicker(true) } : undefined} />
            <div className="w-px self-stretch bg-indigo-500/15 shrink-0 my-2" />
          </>
        )}

        {/* Students */}
        {students.length > 0 ? students.map(p => (
          <MonitorTile key={p.id} participant={p} bg={monitorBgs[p.id]} height={stripHeight - 16}
            isTeacher={isTeacher}
            onBgClick={isTeacher ? () => { setSelectedId(p.id); setShowBgPicker(true) } : undefined} />
        )) : (
          !teacher && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-gray-600">Waiting for participants to join…</p>
            </div>
          )
        )}
      </div>

      {/* Resize handle (teacher only) */}
      {isTeacher && (
        <div className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize group z-20 flex items-end justify-center pb-0.5"
          onMouseDown={handleResizeMouseDown}>
          <div className="w-16 h-1 rounded-full bg-white/10 group-hover:bg-indigo-400/60 transition" />
        </div>
      )}

      {/* BG Picker popup */}
      {showBgPicker && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 right-2 z-50 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#241c80', border: '1px solid rgba(63, 186, 235,0.25)', width: 280 }}>
          <div className="px-3 pt-3 pb-2 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-white">
                {selectedId === '__strip__' ? '🎨 Strip Background' : `🖼 Monitor: ${participants.find(p => p.id === selectedId)?.name?.split(' ')[0] || selectedId}`}
              </p>
              <p className="text-[8px] text-gray-500 mt-0.5">Choose preset or upload from PC</p>
            </div>
            <button onClick={() => setShowBgPicker(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>

          <div className="p-3 space-y-3">
            {/* Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_BGS.map(bg => (
                <button key={bg.id} onClick={() => applyBg(bg.css)}
                  className="relative h-10 rounded-lg border border-white/10 hover:border-indigo-400/50 overflow-hidden group transition"
                  style={{ background: bg.css }}>
                  <span className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-[7px] text-white bg-black/50 px-1 rounded">{bg.label}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Upload */}
            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-gray-500 mb-1.5">Upload from PC</p>
              <input ref={fileRef} type="file" accept="image/*"
                onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className="w-full py-2 rounded-xl border border-dashed border-indigo-500/30 text-[10px] text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/5 transition flex items-center justify-center gap-1.5">
                <span>📁</span> Choose Image File
              </button>
              {customUploadUrl && (
                <div className="mt-1.5 h-10 rounded-lg overflow-hidden border border-white/10">
                  <img src={customUploadUrl} className="w-full h-full object-cover" alt="Custom BG" />
                </div>
              )}
            </div>

            {/* Reset */}
            <button onClick={() => {
              if (selectedId === '__strip__') setStripBg('linear-gradient(180deg,#1d1668 0%,#241c80 100%)')
              else if (selectedId) setMonitorBgs(prev => { const n = { ...prev }; delete n[selectedId]; return n })
            }} className="w-full py-1.5 text-[9px] text-gray-500 hover:text-red-400 transition">
              ↺ Reset to default
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
