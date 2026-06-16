
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  studentName?: string
  onClose: () => void
}

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const REACTIONS = ['👍', '❤️', '😂', '😮', '👏', '🎉']

type Panel = 'chat' | 'notes' | 'participants' | null

export function MeetingRoomWindow({ studentName, onClose }: Props) {
  /* ── State ── */
  const [minimized, setMinimized] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [timer, setTimer] = useState(0)
  const [showReactions, setShowReactions] = useState(false)
  const [flashReaction, setFlashReaction] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Meeting started. You are connected.', time: '00:00' },
  ])
  const [notes, setNotes] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  /* ── Drag ── */
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragged, setDragged] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const sendReaction = (emoji: string) => {
    setFlashReaction(emoji)
    setShowReactions(false)
    setTimeout(() => setFlashReaction(null), 2200)
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMessages(m => [...m, { sender: 'You', text: chatInput.trim(), time: fmtTime(timer) }])
    setChatInput('')
  }

  const togglePanel = (p: Panel) => setPanel(cur => (cur === p ? null : p))

  /* ── Window dimensions ── */
  const W = fullscreen ? '680px' : '520px'
  const H = fullscreen ? '520px' : '420px'

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 55,
    width: minimized ? '260px' : W,
    height: minimized ? '56px' : H,
    right: dragged ? undefined : '24px',
    bottom: dragged ? undefined : minimized ? '24px' : '50%',
    left: dragged ? pos.x : undefined,
    top: dragged ? pos.y : undefined,
    transform: !dragged && !minimized ? 'translateY(50%)' : undefined,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(79,70,229,0.12)',
    border: '1px solid rgba(79,70,229,0.18)',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 24 }}
      style={style}
      onPointerMove={e => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.mx
        const dy = e.clientY - dragRef.current.my
        setPos({ x: dragRef.current.px + dx, y: dragRef.current.py + dy })
      }}
      onPointerUp={() => { dragRef.current = null }}
    >
      {/* ── Header / drag handle ── */}
      <div
        onPointerDown={e => {
          if ((e.target as HTMLElement).closest('button')) return
          const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
          dragRef.current = { mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top }
          setDragged(true)
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
          height: 56, flexShrink: 0, cursor: 'grab',
          background: 'linear-gradient(135deg,#4f46e5 0%,#4338ca 50%,#3730a3 100%)',
          borderBottom: '1px solid rgba(79,70,229,0.15)',
        }}
      >
        {/* Live dot + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
            background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🎥</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {recording && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block', animation: 'pulse 1s infinite' }} />}
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>
                {studentName ? `Meeting · ${studentName}` : '🏛 Academic Meeting Room'}
              </span>
            </div>
            {!minimized && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums' }}>
                ⏱ {fmtTime(timer)} {recording && '· ⏺ Recording'}
              </span>
            )}
          </div>
        </div>

        {/* Gold accent badge */}
        {!minimized && (
          <div style={{
            padding: '3px 10px', borderRadius: 20,
            background: 'rgba(200,168,78,0.22)', border: '1px solid rgba(200,168,78,0.40)',
            fontSize: 9, fontWeight: 700, color: '#fde68a', letterSpacing: 0.5,
          }}>LIVE</div>
        )}

        {/* Window controls */}
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Restore' : 'Expand'}
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {fullscreen ? '⊡' : '⊞'}
          </button>
          <button onClick={() => setMinimized(m => !m)} title={minimized ? 'Expand' : 'Minimize'}
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {minimized ? '▲' : '▼'}
          </button>
          <button onClick={onClose} title="End &amp; close"
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.30)', color: '#fca5a5', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      </div>

      {/* ── Body (hidden when minimized) ── */}
      {!minimized && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main video + controls column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* Video area */}
            <div style={{
              flex: 1, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(145deg,#eef2ff 0%,#e0e7ff 40%,#f0f9ff 100%)',
            }}>
              {/* Subtle grid pattern */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.4,
                backgroundImage: 'radial-gradient(circle, #c7d2fe 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />

              {/* Participant card */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', marginBottom: 12,
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  border: '3px solid #fff', boxShadow: '0 6px 20px rgba(79,70,229,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>
                  {studentName ? studentName.charAt(0).toUpperCase() : '👤'}
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>
                  {studentName || 'Participant'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                    display: 'inline-block', animation: 'pulse 1.4s infinite',
                  }} />
                  <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
                    {sharing ? '🖥 Screen sharing' : 'Connected · HD Audio'}
                  </span>
                </div>
              </div>

              {/* Floating reaction */}
              <AnimatePresence>
                {flashReaction && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1.6, y: -30 }}
                    exit={{ opacity: 0, scale: 0.8, y: -80 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute', bottom: '30%', left: '50%',
                      transform: 'translateX(-50%)', fontSize: 36, zIndex: 10,
                    }}
                  >
                    {flashReaction}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hand raised banner */}
              {handRaised && (
                <div style={{
                  position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(245,158,11,0.92)', backdropFilter: 'blur(8px)',
                  padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff',
                }}>
                  ✋ Hand Raised
                </div>
              )}

              {/* Status badges top-left */}
              <div style={{
                position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5,
              }}>
                {!micOn && (
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.85)', color: '#fff', fontWeight: 700 }}>🔇 Muted</span>
                )}
                {sharing && (
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(79,70,229,0.85)', color: '#fff', fontWeight: 700 }}>🖥 Sharing</span>
                )}
              </div>

              {/* PiP — local camera */}
              <div style={{
                position: 'absolute', bottom: 10, right: 10, width: 76, height: 54, borderRadius: 10,
                background: camOn
                  ? 'linear-gradient(135deg,#312e81,#4338ca)'
                  : 'rgba(15,23,42,0.55)',
                border: '2px solid rgba(255,255,255,0.80)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {camOn
                  ? <span style={{ fontSize: 20 }}>🙋</span>
                  : <span style={{ fontSize: 16, opacity: 0.5 }}>📷</span>}
                <span style={{
                  position: 'absolute', bottom: 3, left: 0, right: 0,
                  textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.75)', fontWeight: 600,
                }}>You</span>
              </div>
            </div>

            {/* ── Controls bar ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', flexShrink: 0,
              background: '#f8fafc', borderTop: '1px solid #e2e8f0',
            }}>
              {/* Mic */}
              <CtrlBtn
                active={micOn} activeColor="#4f46e5" inactiveColor="#ef4444"
                onClick={() => setMicOn(m => !m)} title={micOn ? 'Mute' : 'Unmute'}
              >{micOn ? '🎙' : '🔇'}</CtrlBtn>

              {/* Camera */}
              <CtrlBtn
                active={camOn} activeColor="#4f46e5" inactiveColor="#ef4444"
                onClick={() => setCamOn(m => !m)} title={camOn ? 'Stop Camera' : 'Start Camera'}
              >{camOn ? '📷' : '🚫'}</CtrlBtn>

              {/* Screen share */}
              <CtrlBtn
                active={!sharing} activeColor="#4f46e5" inactiveColor="#22c55e"
                onClick={() => setSharing(s => !s)} title={sharing ? 'Stop Sharing' : 'Share Screen'}
              >🖥</CtrlBtn>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }} />

              {/* Chat */}
              <CtrlBtn
                active={panel !== 'chat'} activeColor="#64748b" inactiveColor="#4f46e5"
                onClick={() => togglePanel('chat')} title="Chat"
              >
                💬
                {chatMessages.length > 1 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4, width: 14, height: 14,
                    borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: 8, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{chatMessages.length}</span>
                )}
              </CtrlBtn>

              {/* Notes */}
              <CtrlBtn
                active={panel !== 'notes'} activeColor="#64748b" inactiveColor="#c8a84e"
                onClick={() => togglePanel('notes')} title="Notes"
              >📋</CtrlBtn>

              {/* Participants */}
              <CtrlBtn
                active={panel !== 'participants'} activeColor="#64748b" inactiveColor="#0ea5e9"
                onClick={() => togglePanel('participants')} title="Participants"
              >👥</CtrlBtn>

              {/* Raise hand */}
              <CtrlBtn
                active={!handRaised} activeColor="#64748b" inactiveColor="#f59e0b"
                onClick={() => setHandRaised(h => !h)} title={handRaised ? 'Lower Hand' : 'Raise Hand'}
              >✋</CtrlBtn>

              {/* Reactions */}
              <div style={{ position: 'relative' }}>
                <CtrlBtn
                  active={!showReactions} activeColor="#64748b" inactiveColor="#ec4899"
                  onClick={() => setShowReactions(r => !r)} title="Reactions"
                >😊</CtrlBtn>
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.9 }}
                      style={{
                        position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: 16, padding: '6px 8px', display: 'flex', gap: 4,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                      }}
                    >
                      {REACTIONS.map(r => (
                        <button key={r} onClick={() => sendReaction(r)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', transition: 'transform 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >{r}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Record */}
              <CtrlBtn
                active={!recording} activeColor="#64748b" inactiveColor="#ef4444"
                onClick={() => setRecording(r => !r)} title={recording ? 'Stop Recording' : 'Record'}
              >{recording ? '⏹' : '⏺'}</CtrlBtn>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 2px' }} />

              {/* End call */}
              <button onClick={onClose} title="End Meeting"
                style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(239,68,68,0.35)',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(239,68,68,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(239,68,68,0.35)' }}
              >📞</button>
            </div>
          </div>

          {/* ── Side panel ── */}
          <AnimatePresence>
            {panel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                style={{
                  overflow: 'hidden', borderLeft: '1px solid #e2e8f0',
                  background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0,
                }}
              >
                {/* Panel header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    {panel === 'chat' ? '💬 Chat' : panel === 'notes' ? '📋 Notes' : '👥 Participants'}
                  </span>
                  <button onClick={() => setPanel(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#94a3b8' }}>✕</button>
                </div>

                {/* Chat panel */}
                {panel === 'chat' && (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px' }}>
                      {chatMessages.map((m, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: m.sender === 'You' ? '#4f46e5' : '#64748b' }}>{m.sender}</span>
                            <span style={{ fontSize: 8, color: '#94a3b8' }}>{m.time}</span>
                          </div>
                          <div style={{
                            padding: '5px 8px', borderRadius: 8, fontSize: 11, color: '#1e293b', lineHeight: 1.45,
                            background: m.sender === 'You' ? '#eef2ff' : m.sender === 'System' ? '#f0fdf4' : '#f8fafc',
                            border: `1px solid ${m.sender === 'You' ? '#c7d2fe' : '#e2e8f0'}`,
                          }}>{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px 10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 5 }}>
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChat()}
                        placeholder="Type a message…"
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }} />
                      <button onClick={sendChat} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, cursor: 'pointer' }}>↑</button>
                    </div>
                  </>
                )}

                {/* Notes panel */}
                {panel === 'notes' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10 }}>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Take meeting notes here…"
                      style={{
                        flex: 1, resize: 'none', border: '1px solid #e2e8f0', borderRadius: 10,
                        padding: '8px 10px', fontSize: 11, lineHeight: 1.55, outline: 'none',
                        background: '#fafaf9', color: '#1e293b', fontFamily: 'inherit',
                      }} />
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { if (notes.trim()) { navigator.clipboard?.writeText(notes); } }}
                        style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 10, cursor: 'pointer', color: '#64748b' }}>
                        📋 Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Participants panel */}
                {panel === 'participants' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                    {[
                      { name: 'You', role: 'Host', color: '#4f46e5', online: true },
                      { name: studentName || 'Student', role: 'Participant', color: '#22c55e', online: true },
                      { name: 'T. Suhair', role: 'Observer', color: '#f59e0b', online: false },
                    ].map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 8, marginBottom: 4 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${p.color}20`, border: `1.5px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                          {p.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', margin: 0 }}>{p.name}</p>
                          <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{p.role}</p>
                        </div>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: p.online ? '#22c55e' : '#94a3b8',
                        }} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

/* ── Reusable control button ── */
function CtrlBtn({
  children, onClick, title, active, activeColor, inactiveColor,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  active: boolean
  activeColor: string
  inactiveColor: string
}) {
  const color = active ? activeColor : inactiveColor
  return (
    <button onClick={onClick} title={title}
      style={{
        position: 'relative', width: 38, height: 38, borderRadius: 10,
        border: `1.5px solid ${active ? '#e2e8f0' : color + '50'}`,
        background: active ? '#f8fafc' : `${color}14`,
        color: active ? '#64748b' : color,
        fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.13s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = active ? '#f1f5f9' : `${color}22`
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? '#f8fafc' : `${color}14`
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}
