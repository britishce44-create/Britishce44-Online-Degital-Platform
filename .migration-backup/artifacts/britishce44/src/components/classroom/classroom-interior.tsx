
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useWebRTC } from '../webrtc/webrtc-provider'
import { useAuth } from '../providers/auth-provider'
import { ParticipantTile } from './participant-tile'
import type { TileParticipant } from './participant-tile'
import { MonitorStrip } from './monitor-strip'
import { SidePanel } from './side-panel'
import { WhiteboardArea } from './whiteboard-area'
import { TimerPopup } from './timer-popup'
import { ComponentModal } from './component-modal'
import { MonkeyBot } from './monkey-bot'
import { EmojiReaction } from './emoji-reaction'
import { RecordingIndicator } from './recording-indicator'
import { TeacherPanel } from './teacher-panel'
import { PollWidget } from './poll-widget'
import { BreakoutManager } from './breakout-manager'
import { ResourceBrowser } from './resource-browser'

type WbLayout = 'whiteboard' | 'resources' | 'grid'

interface ChatMessage { id: string; sender: string; text: string; timestamp: number }
interface ClassroomInteriorProps { roomId: number; onClose: () => void; dir?: 'ltr' | 'rtl' }

const DEFAULT_STRIP_H = 160

export function ClassroomInterior({ roomId, onClose, dir = 'ltr' }: ClassroomInteriorProps) {
  const { user } = useAuth()
  const {
    isConnected, isMuted, isCameraOn, isScreenSharing, localStream, remoteParticipants,
    joinClassroom, leaveClassroom, toggleMic, toggleCamera, toggleScreenShare,
  } = useWebRTC()

  const [seconds, setSeconds] = useState(0)
  const [handRaised, setHandRaised] = useState(false)
  const [sideTab, setSideTab] = useState<'chat' | 'participants' | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', sender: 'System', text: '👋 Welcome to the classroom!', timestamp: Date.now() }
  ])
  const [showTimer, setShowTimer] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showMonkey, setShowMonkey] = useState(false)
  const [fullscreenTile, setFullscreenTile] = useState<string | null>(null)
  const [wbLayout, setWbLayout] = useState<WbLayout>('whiteboard')
  const [showBreakoutManager, setShowBreakoutManager] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingQuality] = useState('1080p')
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  const [roomLocked, setRoomLocked] = useState(false)
  const [showTeacherPanel, setShowTeacherPanel] = useState(false)
  const [showPollCreate, setShowPollCreate] = useState(false)
  const [activePoll, setActivePoll] = useState<any>(null)
  const [liveResults, setLiveResults] = useState<any>(null)
  const [arabicAlertBanner, setArabicAlertBanner] = useState<{ student: string; phrase: string } | null>(null)
  const [stripHeight, setStripHeight] = useState(DEFAULT_STRIP_H)
  const [stripCollapsed, setStripCollapsed] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const joinedRef = useRef(false)
  const chatIdCounter = useRef(1)

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Guest'
  const userId = user?.id || user?.email || 'guest'
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!isRecording || isRecordingPaused) return
    const t = setInterval(() => setRecordingTime(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [isRecording, isRecordingPaused])

  useEffect(() => {
    if (!user || joinedRef.current) return
    joinedRef.current = true
    joinClassroom(roomId, userId, userName).catch((err: Error) => setJoinError(err.message))
    return () => { leaveClassroom(); joinedRef.current = false }
  }, [user, roomId, userId, userName, joinClassroom, leaveClassroom])

  useEffect(() => {
    if (!arabicAlertBanner) return
    const t = setTimeout(() => setArabicAlertBanner(null), 5000)
    return () => clearTimeout(t)
  }, [arabicAlertBanner])

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const allParticipants: TileParticipant[] = useMemo(() => {
    const list: TileParticipant[] = []
    if (user) {
      list.push({
        id: 'local', name: userName, role: user.role,
        isTeacher: user.role === 'teacher' || user.role === 'admin',
        isLocal: true, stream: localStream, isMuted, isCameraOn, handRaised,
      })
    }
    remoteParticipants.forEach(p => {
      list.push({ id: p.id, name: p.name || p.userId, role: 'student', stream: p.stream, isMuted: false, isCameraOn: true })
    })
    return list
  }, [user, userName, localStream, remoteParticipants, isMuted, isCameraOn, handRaised])

  const handleSendMessage = useCallback((text: string) => {
    const id = String(chatIdCounter.current++)
    setMessages(prev => [...prev, { id, sender: userName, text, timestamp: Date.now() }])
  }, [userName])

  const handleReact = useCallback((emoji: string) => {
    const id = String(chatIdCounter.current++)
    setMessages(prev => [...prev, { id, sender: 'System', text: `${userName} reacted ${emoji}`, timestamp: Date.now() }])
  }, [userName])

  const handleWbSync = useCallback((_json: string) => {}, [])

  const handleStartRecording = useCallback(() => {
    setIsRecording(true); setRecordingTime(0); setIsRecordingPaused(false)
  }, [])
  const handleStopRecording = useCallback(() => {
    setIsRecording(false); setRecordingTime(0); setIsRecordingPaused(false)
  }, [])

  const handleCreatePoll = useCallback((question: string, options: string[]) => {
    setActivePoll({
      id: `poll-${Date.now()}`, question,
      options: options.map(text => ({ id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, votes: 0 })),
      totalVotes: 0, isActive: true,
    })
    setShowPollCreate(false)
  }, [])

  const handleVote = useCallback((pollId: string, optionId: string) => {
    if (!activePoll) return
    const updated = {
      ...activePoll,
      options: activePoll.options.map((o: any) => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
      totalVotes: activePoll.totalVotes + 1,
    }
    setActivePoll(updated)
    setLiveResults({
      id: updated.id,
      options: updated.options.map((o: any) => ({
        text: o.text, votes: o.votes,
        percent: updated.totalVotes > 0 ? Math.round((o.votes / updated.totalVotes) * 100) : 0,
      })),
      totalVotes: updated.totalVotes,
    })
  }, [activePoll])

  const handleEndPoll = useCallback((_pollId: string) => { setActivePoll(null) }, [])

  const toggleAttendance = useCallback((id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const effectiveStripH = stripCollapsed ? 36 : stripHeight

  return (
    <div dir={dir} className="flex flex-col h-full overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: '#1d1668', border: '1px solid rgba(63, 186, 235,0.15)' }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-2.5 shrink-0 relative"
        style={{ background: '#17125c', borderBottom: '1px solid rgba(63, 186, 235,0.12)' }}>
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-indigo-500/60 via-sky-500/40 to-emerald-500/40" />
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shadow-sm"
            style={{ background: 'linear-gradient(135deg,#00875a,#00ae74)', color: '#17125c' }}>BC</div>
          <div>
            <h2 className="font-bold text-white text-sm">Classroom {roomId}</h2>
            <p className="text-[9px] flex items-center gap-1.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ boxShadow: isConnected ? '0 0 6px #34d399' : '0 0 6px #fbbf24' }} />
              {isConnected ? 'Live' : 'Connecting…'} · {formatTime(seconds)}
              {isTeacher && (
                <span className="ml-1 text-amber-400/70">
                  · {allParticipants.filter(p => !p.isTeacher).length} students
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <RecordingIndicator isRecording={isRecording} elapsed={recordingTime} quality={recordingQuality}
            isPaused={isRecordingPaused} isTeacher={isTeacher}
            onPause={() => setIsRecordingPaused(true)} onResume={() => setIsRecordingPaused(false)} onStop={handleStopRecording} />

          {isTeacher && (
            <button onClick={() => setShowBreakoutManager(!showBreakoutManager)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition
                ${showBreakoutManager ? 'bg-orange-500/20 text-orange-300' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              🏠 Breakout
            </button>
          )}

          <button onClick={() => setShowTimer(!showTimer)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition
              ${showTimer ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
            ⏱ Timer
          </button>

          {/* Layout buttons */}
          {(['whiteboard', 'grid', 'resources'] as WbLayout[]).map(l => (
            <button key={l} onClick={() => setWbLayout(l)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-medium transition
                ${wbLayout === l ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {l === 'whiteboard' ? '✏ Board' : l === 'grid' ? '⊞ Grid' : '🖥 Resources'}
            </button>
          ))}

          <button onClick={() => setSideTab(sideTab === 'chat' ? null : 'chat')}
            className={`p-1.5 rounded-full transition text-sm ${sideTab === 'chat' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
            💬
          </button>
          <button onClick={() => setSideTab(sideTab === 'participants' ? null : 'participants')}
            className={`p-1.5 rounded-full transition text-sm ${sideTab === 'participants' ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
            👥
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400/60 hover:text-red-300 transition text-xs">✕</button>
        </div>
      </header>

      {/* ── Alert banners ── */}
      {joinError && (
        <div className="px-4 py-1.5 text-xs flex items-center gap-2 shrink-0"
          style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
          <span>⚠</span>
          <span>Camera/mic unavailable — participating without video. {joinError}</span>
        </div>
      )}
      {arabicAlertBanner && (
        <div className="px-4 py-1.5 text-xs flex items-center gap-2 shrink-0 animate-pulse"
          style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
          <span>🛑</span>
          <span><strong>{arabicAlertBanner.student}</strong> spoke Arabic: <em dir="rtl">{arabicAlertBanner.phrase}</em></span>
          <button className="ml-auto text-[9px] text-red-400 hover:text-white" onClick={() => setArabicAlertBanner(null)}>✕</button>
        </div>
      )}

      {/* ── MONITOR STRIP (always at top, hidden in Resources mode for full space) ── */}
      {wbLayout !== 'resources' && (
        !stripCollapsed ? (
          <MonitorStrip
            participants={allParticipants}
            isTeacher={isTeacher}
            stripHeight={stripHeight}
            onStripHeightChange={setStripHeight}
          />
        ) : (
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
            style={{ background: '#1d1668', borderBottom: '1px solid rgba(63, 186, 235,0.10)', height: 36 }}>
            <span className="text-[9px] text-gray-600">Monitor strip hidden · {allParticipants.length} online</span>
            {isTeacher && (
              <button onClick={() => setStripCollapsed(false)}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 transition">
                ▲ Show monitors
              </button>
            )}
          </div>
        )
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Strip collapse control for teacher */}
          {isTeacher && !stripCollapsed && (
            <div className="flex justify-center py-1 shrink-0"
              style={{ background: 'rgba(8,15,34,0.8)' }}>
              <button onClick={() => setStripCollapsed(true)}
                className="text-[8px] text-gray-700 hover:text-gray-400 transition flex items-center gap-1 px-3 py-0.5 rounded-full hover:bg-white/5">
                ▼ Collapse monitor strip
              </button>
            </div>
          )}

          {/* ── WHITEBOARD mode ── */}
          {wbLayout === 'whiteboard' && (
            <div className="flex-1 overflow-hidden">
              <WhiteboardArea onSyncDraw={handleWbSync} />
            </div>
          )}

          {/* ── GRID mode: participant tiles ── */}
          {wbLayout === 'grid' && (
            <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-2 p-2 min-h-0"
              style={{ background: 'rgba(26, 19, 92,0.6)' }}>
              {allParticipants.map(p => (
                <ParticipantTile key={p.id} participant={p}
                  onDoubleClick={() => setFullscreenTile(fullscreenTile === p.id ? null : p.id)}
                  className={fullscreenTile === p.id ? 'col-span-4 row-span-2 row-start-1 z-10' : ''}
                  style={fullscreenTile && fullscreenTile !== p.id ? { display: 'none' } : undefined} />
              ))}
              {allParticipants.length === 0 && (
                <div className="col-span-4 row-span-2 flex flex-col items-center justify-center gap-2">
                  <div className="text-4xl">👥</div>
                  <p className="text-sm text-gray-500">Waiting for participants…</p>
                  <p className="text-xs text-gray-600">Students will appear here when they join</p>
                </div>
              )}
              {isTeacher && allParticipants.length > 0 && (
                <div className="absolute bottom-2 right-2 z-20">
                  <div className="bg-black/60 backdrop-blur rounded-xl px-3 py-1.5 border border-white/10">
                    <p className="text-[9px] text-gray-400 mb-1">Attendance</p>
                    {allParticipants.filter(p => !p.isTeacher).map(p => (
                      <div key={p.id} className="flex items-center gap-2 py-0.5">
                        <button onClick={() => toggleAttendance(p.id)}
                          className={`w-3 h-3 rounded border transition ${attendance[p.id] ? 'bg-emerald-500 border-emerald-400' : 'border-gray-600 hover:border-gray-400'}`} />
                        <span className="text-[9px] text-gray-400">{p.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESOURCES mode ── */}
          {wbLayout === 'resources' && (
            <div className="flex-1 overflow-hidden">
              <ResourceBrowser onMinimize={() => setWbLayout('whiteboard')} />
            </div>
          )}
        </div>

        {/* ── Side panels ── */}
        {sideTab && (
          <SidePanel tab={sideTab} messages={messages} participants={allParticipants}
            onSendMessage={handleSendMessage} onClose={() => setSideTab(null)} />
        )}
        {showTeacherPanel && (
          <TeacherPanel isOpen={showTeacherPanel} onClose={() => setShowTeacherPanel(false)}
            participants={allParticipants}
            onMuteAll={() => {}} onSpotlight={() => {}} onLockRoom={setRoomLocked} onEject={() => {}}
            roomLocked={roomLocked} />
        )}
      </div>

      {/* ── Control bar ── */}
      <div className="h-14 flex items-center justify-center gap-1 px-3 shrink-0 relative"
        style={{ background: 'linear-gradient(to right,#17125c,#1d1668)', borderTop: '1px solid rgba(0, 174, 116,0.1)' }}>
        {/* Subtle glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        {[
          { icon: isMuted ? '🔇' : '🎤', label: isMuted ? 'Unmute' : 'Mute', active: !isMuted, onClick: toggleMic },
          { icon: isCameraOn ? '📹' : '🚫', label: isCameraOn ? 'Camera' : 'Cam Off', active: isCameraOn, onClick: toggleCamera },
          { icon: isScreenSharing ? '🖥️' : '💻', label: isScreenSharing ? 'Stop' : 'Share', active: isScreenSharing, onClick: toggleScreenShare },
          { icon: '✋', label: handRaised ? 'Lower' : 'Hand', active: handRaised, onClick: () => setHandRaised(!handRaised) },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[9px] font-medium transition
              ${btn.active
                ? 'text-[#17125c] font-bold shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/8'}`}
            style={btn.active ? { background: 'linear-gradient(135deg,#00875a,#00ae74)', boxShadow: '0 2px 10px rgba(0, 174, 116,0.25)' } : {}}>
            <span className="text-base leading-none">{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}

        {isTeacher && (
          <>
            <div className="w-px h-8 bg-white/10 mx-0.5" />
            <button onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[9px] font-medium transition
                ${isRecording ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}>
              <span className="text-base">{isRecording ? '⏹' : '🔴'}</span>
              <span>{isRecording ? 'Stop' : 'Record'}</span>
            </button>
            <button onClick={() => setShowTeacherPanel(!showTeacherPanel)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[9px] font-medium transition
                ${showTeacherPanel ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}>
              <span className="text-base">👨‍🏫</span>
              <span>Manage</span>
            </button>
            <button onClick={() => setShowPollCreate(!showPollCreate)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[9px] font-medium transition
                ${showPollCreate || activePoll ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}>
              <span className="text-base">📊</span>
              <span>Poll</span>
            </button>
          </>
        )}

        <EmojiReaction onReact={handleReact} />

        <button onClick={() => setShowMonkey(!showMonkey)}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[9px] font-medium transition
            ${showMonkey ? 'text-[#17125c] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}
          style={showMonkey ? { background: 'linear-gradient(135deg,#00875a,#00ae74)' } : {}}>
          <span className="text-base">🐵</span>
          <span>Quiz</span>
        </button>

        <button onClick={() => setShowModal(true)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 text-[9px] font-medium transition">
          <span className="text-base">📱</span>
          <span>More</span>
        </button>

        <button onClick={onClose}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-red-400/60 hover:text-red-300 hover:bg-red-500/10 text-[9px] font-medium transition ml-auto">
          <span className="text-base">🚪</span>
          <span>Leave</span>
        </button>
      </div>

      {/* ── Floating overlays ── */}
      {showBreakoutManager && (
        <BreakoutManager teacherName={userName}
          onArabicAlert={alert => setArabicAlertBanner({ student: alert.student, phrase: alert.phrase })} />
      )}

      <PollWidget isOpen={showPollCreate || !!activePoll}
        onClose={() => { setShowPollCreate(false); setActivePoll(null) }}
        isTeacher={isTeacher} activePoll={activePoll} liveResults={liveResults}
        onCreatePoll={handleCreatePoll} onVote={handleVote} onEndPoll={handleEndPoll} />

      <TimerPopup isOpen={showTimer} onClose={() => setShowTimer(false)} />
      <ComponentModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <MonkeyBot isOpen={showMonkey} onClose={() => setShowMonkey(false)} />
    </div>
  )
}
