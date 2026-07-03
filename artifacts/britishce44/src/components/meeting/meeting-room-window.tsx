
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebRTC } from '@/components/webrtc/webrtc-provider'
import { PlacementsPage } from '@/pages/placements'

/* ─── types ─────────────────────────────────────────────── */
type ResizeDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
type Panel = 'chat' | 'notes' | 'participants' | null
const REACTIONS = ['👍', '❤️', '😂', '😮', '👏', '🎉']
const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const MEETING_ROOM_ID = 8888

/* ─── inline <video> tile ────────────────────────────────── */
function VideoTile({
  stream, muted = false, label, noStream,
}: {
  stream: MediaStream | null
  muted?: boolean
  label?: string
  noStream?: React.ReactNode
}) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  if (!stream) return <>{noStream}</>
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
      aria-label={label}
    />
  )
}

/* ─── main component ─────────────────────────────────────── */
interface Props {
  studentName?: string
  onClose: () => void
  isInterview?: boolean
  isSupervisor?: boolean
  interviewNewcomerId?: string
  onPlacementTestGranted?: () => void
}

export function MeetingRoomWindow({
  studentName, onClose, isInterview, isSupervisor, interviewNewcomerId, onPlacementTestGranted,
}: Props) {
  const {
    isConnected, isMuted, isCameraOn, isScreenSharing,
    localStream, remoteParticipants,
    joinClassroom, leaveClassroom,
    toggleMic, toggleCamera, toggleScreenShare,
  } = useWebRTC()

  /* ── window geometry ── */
  const [pos,  setPos]  = useState({ x: 0,   y: 0 })
  const [size, setSize] = useState({ w: 560,  h: 440 })
  const [dragged,    setDragged]    = useState(false)
  const [minimized,  setMinimized]  = useState(false)

  /* ── meeting state ── */
  const [timer,         setTimer]         = useState(0)
  const [handRaised,    setHandRaised]    = useState(false)
  const [recording,     setRecording]     = useState(false)
  const [panel,         setPanel]         = useState<Panel>(null)
  const [showReactions, setShowReactions] = useState(false)
  const [flashReaction, setFlashReaction] = useState<string | null>(null)
  const [chatInput,     setChatInput]     = useState('')
  const [chatMessages,  setChatMessages]  = useState([
    { sender: 'System', text: 'Meeting started. You are connected.', time: '00:00' },
  ])
  const [notes, setNotes] = useState('')
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [placementTestGranted, setPlacementTestGranted] = useState(false)

  /* ── drag refs ── */
  const dragRef   = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const resizeRef = useRef<{ dir: ResizeDir; mx: number; my: number; px: number; py: number; pw: number; ph: number } | null>(null)

  /* ── placement test listener (interviewee side) ── */
  useEffect(() => {
    if (!isInterview || isSupervisor || !interviewNewcomerId) return
    const key = `placementTest_granted_${interviewNewcomerId}`
    const check = () => {
      if (localStorage.getItem(key) === 'true') {
        setPlacementTestGranted(true)
      }
    }
    check()
    const interval = setInterval(check, 1500)
    return () => clearInterval(interval)
  }, [isInterview, isSupervisor, interviewNewcomerId])

  /* ── supervisor: write grant to localStorage ── */
  useEffect(() => {
    if (!isInterview || !isSupervisor || !interviewNewcomerId) return
    const key = `placementTest_granted_${interviewNewcomerId}`
    if (placementTestGranted) {
      localStorage.setItem(key, 'true')
    }
  }, [placementTestGranted, isInterview, isSupervisor, interviewNewcomerId])

  /* ── join on mount ── */
  useEffect(() => {
    const stored = localStorage.getItem('b44_user')
    const user = stored ? JSON.parse(stored) : {}
    const userId = user.id ? String(user.id) : 'meeting-host'
    const name   = user.name || user.displayName || 'Host'
    joinClassroom(MEETING_ROOM_ID, userId, name).catch((e: unknown) => {
      setMediaError((e as Error)?.message ?? 'Could not access camera/microphone.')
    })
    return () => { leaveClassroom() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── meeting timer ── */
  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  /* ── helpers ── */
  const sendReaction = (emoji: string) => {
    setFlashReaction(emoji); setShowReactions(false)
    setTimeout(() => setFlashReaction(null), 2200)
  }
  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMessages(m => [...m, { sender: 'You', text: chatInput.trim(), time: fmtTime(timer) }])
    setChatInput('')
  }
  const togglePanel = (p: Panel) => setPanel(cur => cur === p ? null : p)
  const handleClose = () => { leaveClassroom(); onClose() }

  /* ── drag handlers ── */
  const onTitleDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    dragRef.current = { mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top }
    setDragged(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      setPos({ x: dragRef.current.px + e.clientX - dragRef.current.mx, y: dragRef.current.py + e.clientY - dragRef.current.my })
    }
    if (resizeRef.current) {
      const r = resizeRef.current
      const dx = e.clientX - r.mx, dy = e.clientY - r.my
      let { px, py, pw, ph } = r
      const MIN_W = 340, MIN_H = 260
      if (r.dir.includes('e'))  pw = Math.max(MIN_W, r.pw + dx)
      if (r.dir.includes('w'))  { const nw = Math.max(MIN_W, r.pw - dx); px = r.px + (r.pw - nw); pw = nw }
      if (r.dir.includes('s'))  ph = Math.max(MIN_H, r.ph + dy)
      if (r.dir.includes('n'))  { const nh = Math.max(MIN_H, r.ph - dy); py = r.py + (r.ph - nh); ph = nh }
      setPos({ x: px, y: py }); setSize({ w: pw, h: ph })
    }
  }
  const onPointerUp = () => { dragRef.current = null; resizeRef.current = null }
  const onHandleDown = (e: React.PointerEvent, dir: ResizeDir) => {
    e.preventDefault(); e.stopPropagation()
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    resizeRef.current = { dir, mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top, pw: size.w, ph: size.h }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  /* ── resize handles definition ── */
  const handles: Array<{ dir: ResizeDir; style: React.CSSProperties }> = [
    { dir: 'n',  style: { top: -5, left: '50%', transform: 'translateX(-50%)', width: 40, height: 10, cursor: 'ns-resize' } },
    { dir: 'ne', style: { top: -5, right: -5, width: 14, height: 14, cursor: 'nesw-resize' } },
    { dir: 'e',  style: { top: '50%', right: -5, transform: 'translateY(-50%)', width: 10, height: 40, cursor: 'ew-resize' } },
    { dir: 'se', style: { bottom: -5, right: -5, width: 14, height: 14, cursor: 'nwse-resize' } },
    { dir: 's',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 40, height: 10, cursor: 'ns-resize' } },
    { dir: 'sw', style: { bottom: -5, left: -5, width: 14, height: 14, cursor: 'nesw-resize' } },
    { dir: 'w',  style: { top: '50%', left: -5, transform: 'translateY(-50%)', width: 10, height: 40, cursor: 'ew-resize' } },
    { dir: 'nw', style: { top: -5, left: -5, width: 14, height: 14, cursor: 'nwse-resize' } },
  ]

  /* ── main video: first remote stream, else local ── */
  const mainParticipant = remoteParticipants[0] ?? null
  const mainStream = mainParticipant?.stream ?? null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 24 }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed', zIndex: 55,
        width: minimized ? 280 : size.w,
        height: minimized ? 56 : size.h,
        left:   dragged  ? pos.x  : undefined,
        top:    dragged  ? pos.y  : undefined,
        right:  !dragged ? 24     : undefined,
        bottom: !dragged ? (minimized ? 24 : '50%') : undefined,
        transform: !dragged && !minimized ? 'translateY(50%)' : undefined,
        borderRadius: 20, overflow: 'visible',
        boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(79,70,229,0.14)',
        border: '1px solid rgba(79,70,229,0.18)',
        background: '#fff',
        display: 'flex', flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* ── 8 resize handles (hidden when minimized) ── */}
      {!minimized && handles.map(h => (
        <div key={h.dir} onPointerDown={e => onHandleDown(e, h.dir)}
          style={{
            position: 'absolute', background: 'rgba(79,70,229,0.40)',
            borderRadius: 3, zIndex: 20, ...h.style,
          }}
        />
      ))}

      {/* ── HEADER ── */}
      <div
        onPointerDown={onTitleDown}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 14px', height: 56, flexShrink: 0, cursor: 'grab',
          background: 'linear-gradient(135deg,#4f46e5 0%,#4338ca 60%,#3730a3 100%)',
          borderRadius: minimized ? 18 : '18px 18px 0 0',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎥</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {recording && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block', animation: 'pulse 1s infinite', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {studentName ? `Meeting · ${studentName}` : '🏛 Academic Meeting Room'}
            </span>
          </div>
          {!minimized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)', fontVariantNumeric: 'tabular-nums' }}>⏱ {fmtTime(timer)}</span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: isConnected ? '#4ade80' : '#94a3b8',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 10, color: isConnected ? '#86efac' : 'rgba(255,255,255,0.40)' }}>
                {isConnected ? `Connected${remoteParticipants.length > 0 ? ` · ${remoteParticipants.length + 1} in room` : ''}` : 'Connecting…'}
              </span>
            </div>
          )}
        </div>

        {!minimized && (
          <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(200,168,78,0.25)', border: '1px solid rgba(200,168,78,0.45)', fontSize: 9, fontWeight: 700, color: '#fde68a', letterSpacing: 0.5, flexShrink: 0 }}>
            LIVE
          </div>
        )}

        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setMinimized(m => !m)} title={minimized ? 'Expand' : 'Minimize'}
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {minimized ? '▲' : '▼'}
          </button>
          <button onClick={handleClose} title="End meeting"
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.30)', color: '#fca5a5', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      {!minimized && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderRadius: '0 0 18px 18px' }}>

          {/* Main video column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* ── VIDEO AREA ── */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg,#eef2ff,#e0e7ff,#f0f9ff)' }}>
              {/* subtle dot grid */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: 'radial-gradient(circle,#c7d2fe 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

              {/* Main remote stream or placeholder */}
              {mainStream ? (
                <VideoTile stream={mainStream} label={mainParticipant?.name} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: '3px solid #fff', boxShadow: '0 6px 20px rgba(79,70,229,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12 }}>
                    {studentName ? studentName.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>{studentName || 'Waiting for participant…'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#22c55e' : '#f59e0b', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
                    <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                      {isConnected ? (isScreenSharing ? '🖥 Sharing screen' : 'Waiting for others to join…') : 'Connecting…'}
                    </span>
                  </div>
                  {mediaError && (
                    <div style={{ marginTop: 10, padding: '6px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 11, color: '#dc2626', maxWidth: 260, textAlign: 'center' }}>
                      ⚠ {mediaError}
                    </div>
                  )}
                </div>
              )}

              {/* Remote participant grid (when 2+ remote) */}
              {remoteParticipants.length > 1 && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 6 }}>
                  {remoteParticipants.slice(1).map(p => (
                    <div key={p.id} style={{ width: 80, height: 56, borderRadius: 10, overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', background: '#312e81', flexShrink: 0 }}>
                      <VideoTile stream={p.stream ?? null} label={p.name}
                        noStream={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.name.charAt(0)}</div>}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── PiP: local camera ── */}
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                width: 88, height: 64, borderRadius: 12, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.90)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                background: isCameraOn ? 'linear-gradient(135deg,#312e81,#4338ca)' : 'rgba(15,23,42,0.55)',
              }}>
                {isCameraOn && localStream
                  ? <VideoTile stream={localStream} muted label="You" />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, opacity: 0.5 }}>📷</div>
                }
                <span style={{ position: 'absolute', bottom: 3, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.80)', fontWeight: 600 }}>You</span>
              </div>

              {/* Floating reaction */}
              <AnimatePresence>
                {flashReaction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1.6, y: -30 }} exit={{ opacity: 0, scale: 0.8, y: -80 }}
                    transition={{ duration: 0.5 }}
                    style={{ position: 'absolute', bottom: '30%', left: '50%', transform: 'translateX(-50%)', fontSize: 36, zIndex: 10 }}
                  >{flashReaction}</motion.div>
                )}
              </AnimatePresence>

              {/* Status overlays */}
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
                {isMuted    && <Chip color="#ef4444">🔇 Muted</Chip>}
                {isScreenSharing && <Chip color="#4f46e5">🖥 Sharing</Chip>}
                {handRaised && <Chip color="#f59e0b">✋ Hand Raised</Chip>}
                {recording  && <Chip color="#ef4444">⏺ Rec {fmtTime(timer)}</Chip>}
              </div>
            </div>

            {/* ── CONTROLS BAR ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', flexShrink: 0, background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              {/* Mic */}
              <CtrlBtn active={!isMuted} activeColor="#4f46e5" inactiveColor="#ef4444" onClick={toggleMic} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? '🔇' : '🎙'}
              </CtrlBtn>

              {/* Camera */}
              <CtrlBtn active={isCameraOn} activeColor="#4f46e5" inactiveColor="#ef4444" onClick={toggleCamera} title={isCameraOn ? 'Stop Camera' : 'Start Camera'}>
                {isCameraOn ? '📷' : '🚫'}
              </CtrlBtn>

              {/* Screen share */}
              <CtrlBtn active={!isScreenSharing} activeColor="#64748b" inactiveColor="#4f46e5" onClick={() => toggleScreenShare()} title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
                🖥
              </CtrlBtn>

              <Sep />

              {/* Chat */}
              <CtrlBtn active={panel !== 'chat'} activeColor="#64748b" inactiveColor="#4f46e5" onClick={() => togglePanel('chat')} title="Chat">
                💬
                {chatMessages.length > 1 && <NotifDot n={chatMessages.length} />}
              </CtrlBtn>

              {/* Notes */}
              <CtrlBtn active={panel !== 'notes'} activeColor="#64748b" inactiveColor="#c8a84e" onClick={() => togglePanel('notes')} title="Notes">📋</CtrlBtn>

              {/* Participants */}
              <CtrlBtn active={panel !== 'participants'} activeColor="#64748b" inactiveColor="#0ea5e9" onClick={() => togglePanel('participants')} title="Participants">
                👥
                {remoteParticipants.length > 0 && <NotifDot n={remoteParticipants.length + 1} />}
              </CtrlBtn>

              {/* Hand raise */}
              <CtrlBtn active={!handRaised} activeColor="#64748b" inactiveColor="#f59e0b" onClick={() => setHandRaised(h => !h)} title={handRaised ? 'Lower Hand' : 'Raise Hand'}>✋</CtrlBtn>

              {/* Reactions picker */}
              <div style={{ position: 'relative' }}>
                <CtrlBtn active={!showReactions} activeColor="#64748b" inactiveColor="#ec4899" onClick={() => setShowReactions(r => !r)} title="Reactions">😊</CtrlBtn>
                <AnimatePresence>
                  {showReactions && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.9 }}
                      style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '6px 8px', display: 'flex', gap: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 30 }}
                    >
                      {REACTIONS.map(r => (
                        <button key={r} onClick={() => sendReaction(r)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >{r}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Record */}
              <CtrlBtn active={!recording} activeColor="#64748b" inactiveColor="#ef4444" onClick={() => setRecording(r => !r)} title={recording ? 'Stop Recording' : 'Record'}>
                {recording ? '⏹' : '⏺'}
              </CtrlBtn>

              {isInterview && isSupervisor && (
                <>
                  <Sep />
                  <button
                    onClick={() => {
                      if (onPlacementTestGranted) {
                        setPlacementTestGranted(true)
                        onPlacementTestGranted()
                      }
                    }}
                    title="Grant Placement Test"
                    style={{
                      height: 40, borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg,#D4A017,#F5C518)',
                      color: '#17125c', fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '0 12px',
                      fontWeight: 900,
                      boxShadow: '0 3px 10px rgba(212,160,23,0.35)',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    🎯 Grant Placement Test
                  </button>
                </>
              )}

              <Sep />

              {/* End call */}
              <button onClick={handleClose} title="End Meeting"
                style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(239,68,68,0.35)', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >📞</button>
            </div>
          </div>

          {/* ── SLIDE-IN SIDE PANEL ── */}
          <AnimatePresence>
            {panel && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 210, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                style={{ overflow: 'hidden', borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    {panel === 'chat' ? '💬 Chat' : panel === 'notes' ? '📋 Notes' : '👥 Participants'}
                  </span>
                  <button onClick={() => setPanel(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#94a3b8' }}>✕</button>
                </div>

                {panel === 'chat' && (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px' }}>
                      {chatMessages.map((m, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: m.sender === 'You' ? '#4f46e5' : '#64748b' }}>{m.sender}</span>
                            <span style={{ fontSize: 8, color: '#94a3b8' }}>{m.time}</span>
                          </div>
                          <div style={{ padding: '5px 8px', borderRadius: 8, fontSize: 11, color: '#1e293b', lineHeight: 1.45, background: m.sender === 'You' ? '#eef2ff' : m.sender === 'System' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${m.sender === 'You' ? '#c7d2fe' : '#e2e8f0'}` }}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px 10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 5 }}>
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                        placeholder="Type a message…"
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }} />
                      <button onClick={sendChat} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, cursor: 'pointer' }}>↑</button>
                    </div>
                  </>
                )}

                {panel === 'notes' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10 }}>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Take meeting notes here…"
                      style={{ flex: 1, resize: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', fontSize: 11, lineHeight: 1.55, outline: 'none', background: '#fafaf9', color: '#1e293b', fontFamily: 'inherit' }} />
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigator.clipboard?.writeText(notes)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 10, cursor: 'pointer', color: '#64748b' }}>📋 Copy</button>
                    </div>
                  </div>
                )}

                {panel === 'participants' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                    {/* Local (you) */}
                    <ParticipantRow name="You (Host)" online color="#4f46e5" />
                    {/* Remote */}
                    {remoteParticipants.map(p => (
                      <ParticipantRow key={p.id} name={p.name} role={p.role} online color="#22c55e" />
                    ))}
                    {remoteParticipants.length === 0 && (
                      <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Waiting for participants…</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── PLACEMENT TEST OVERLAY (interviewee side) ── */}
      {isInterview && !isSupervisor && placementTestGranted && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: '#0a1628', borderRadius: 18,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'linear-gradient(135deg,#D4A017,#F5C518)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#17125c' }}>
              🎯 Placement Test — Granted by Supervisor
            </span>
            <span style={{ fontSize: 10, color: '#17125c', opacity: 0.7 }}>
              Your answers will auto-save
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: '#f0f4ff' }}>
            <PlacementsPage />
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ─── tiny helpers ─────────────────────────────────────────── */
function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: `${color}cc`, backdropFilter: 'blur(6px)', color: '#fff', fontWeight: 700 }}>{children}</span>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />
}

function NotifDot({ n }: { n: number }) {
  return (
    <span style={{ position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
  )
}

function ParticipantRow({ name, role, online, color }: { name: string; role?: string; online: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 8, marginBottom: 4 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${color}20`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
        {name.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', margin: 0 }}>{name}</p>
        {role && <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{role}</p>}
      </div>
      <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: online ? '#22c55e' : '#94a3b8' }} />
    </div>
  )
}

function CtrlBtn({
  children, onClick, title, active, activeColor, inactiveColor,
}: {
  children: React.ReactNode; onClick: () => void; title?: string
  active: boolean; activeColor: string; inactiveColor: string
}) {
  const color = active ? activeColor : inactiveColor
  return (
    <button onClick={onClick} title={title}
      style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${active ? '#e2e8f0' : color + '50'}`, background: active ? '#f8fafc' : `${color}14`, color: active ? '#64748b' : color, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.13s', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = active ? '#f1f5f9' : `${color}22`; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? '#f8fafc' : `${color}14`; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {children}
    </button>
  )
}
