import { ClassroomScoreboard } from "./ClassroomScoreboard"
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useWebRTC } from '../webrtc/webrtc-provider'
import { useAuth } from '../providers/auth-provider'
import type { TileParticipant } from './participant-tile'
import { apiGet, type ClassroomRoom } from '@/lib/api'
import { CurvedSidebar } from './CurvedSidebar'
import { ClassroomHeader } from './ClassroomHeader'
import { ParticipantStrip } from './ParticipantStrip'
import { MainWorkspace } from './MainWorkspace'
import { CommunicationPanel } from './CommunicationPanel'
import { FloatingControlBar } from './FloatingControlBar'
import { TimerPopup } from './timer-popup'
import { ComponentModal } from './component-modal'
import { MonkeyBot } from './monkey-bot'
import { EmojiReaction } from './emoji-reaction'
import { RecordingIndicator } from './recording-indicator'
import { TeacherPanel } from './teacher-panel'
import { PollWidget } from './poll-widget'
import { BreakoutManager } from './breakout-manager'
import { ResourceBrowser } from './resource-browser'
import { SettingsSidebar } from '@/components/settings/settings-sidebar'
import { ScreenStage } from './screen-stage'
import { FloatingMonitor } from './floating-monitor'

type WbLayout = 'whiteboard' | 'resources' | 'grid'
type NavItem = 'Board' | 'Grid' | 'Resources' | 'Chat' | 'Participants' | 'Polls' | 'Breakout' | 'Settings'

interface ChatMessage { id: string; sender: string; text: string; timestamp: number }
interface ClassroomInteriorProps { roomId: number; onClose: () => void; dir?: 'ltr' | 'rtl' }

const NAV_TO_LAYOUT: Record<NavItem, WbLayout> = {
  Board: 'whiteboard',
  Grid: 'grid',
  Resources: 'resources',
  Chat: 'whiteboard',
  Participants: 'whiteboard',
  Polls: 'whiteboard',
  Breakout: 'whiteboard',
  Settings: 'whiteboard',
}

export function ClassroomInterior({ roomId, onClose, dir = 'ltr' }: ClassroomInteriorProps) {
  const { user } = useAuth()
  const {
    isConnected, isMuted, isCameraOn, isScreenSharing, localStream, remoteParticipants,
    joinClassroom, leaveClassroom, toggleMic, toggleCamera, toggleScreenShare,
    isInvisible, setInvisible, toggleInvisible,
    setParticipantStatus, forcePermission, assignPresenter, removePresenter,
    moveParticipant, transferToRoom1, lockClassroom,
  } = useWebRTC()

  const [seconds, setSeconds] = useState(0)
  const [handRaised, setHandRaised] = useState(false)
  const [sideTab, setSideTab] = useState<'chat' | 'participants' | null>('chat')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', sender: 'System', text: '👋 Welcome to the classroom!', timestamp: Date.now() }
  ])
  const [showTimer, setShowTimer] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showMonkey, setShowMonkey] = useState(false)
  const [wbLayout, setWbLayout] = useState<WbLayout>('whiteboard')
  const [showBreakoutManager, setShowBreakoutManager] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
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
  const [activeNavItem, setActiveNavItem] = useState<NavItem>('Board')
  const [classrooms, setClassrooms] = useState<Array<{ id: number; label: string; roomId: number }>>([])
  const joinedRef = useRef(false)
  const chatIdCounter = useRef(1)

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Guest'
  const userId = user?.id || user?.email || 'guest'
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor'

  useEffect(() => {
    apiGet<{ classrooms: ClassroomRoom[] }>('/classrooms')
      .then(r => setClassrooms(r.classrooms.map(c => ({
        id: c.id,
        label: c.label || c.courseName || `Room ${c.roomId ?? c.id}`,
        roomId: c.roomId ?? c.id,
      }))))
      .catch(() => {})
  }, [])

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
    
    // For admin/supervisor, check if they want to be visible
    if (isAdminOrSupervisor && isInvisible) {
      // Just mark as connected without joining WebRTC
      // The WebRTC provider handles this internally
    }
    
    joinClassroom(roomId, userId, userName).catch((err: Error) => setJoinError(err.message))
    return () => { leaveClassroom(); joinedRef.current = false }
  }, [user, roomId, userId, userName, joinClassroom, leaveClassroom, isAdminOrSupervisor, isInvisible])

  useEffect(() => {
    if (!arabicAlertBanner) return
    const t = setTimeout(() => setArabicAlertBanner(null), 5000)
    return () => clearTimeout(t)
  }, [arabicAlertBanner])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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
      list.push({
        id: p.id, name: p.name || p.userId, role: 'student', stream: p.stream,
        isMuted: p.isMuted ?? false, isCameraOn: p.isCameraOn ?? true,
        isPresenter: p.isPresenter, status: p.status, permissions: p.permissions,
      })
    })
    return list
  }, [user, userName, localStream, remoteParticipants, isMuted, isCameraOn, handRaised])

  const remoteSharer = remoteParticipants.find(p => p.isSharing) ?? null
  const activePresenter = isScreenSharing
    ? { id: 'local', name: userName, isTeacher, isLocal: true, stream: localStream, isMuted, isCameraOn, isSharing: true }
    : remoteSharer
      ? { id: remoteSharer.id, name: remoteSharer.name, role: remoteSharer.role, stream: remoteSharer.stream, isMuted: remoteSharer.isMuted, isCameraOn: remoteSharer.isCameraOn, isSharing: true }
      : null
  const stageOthers = activePresenter ? allParticipants.filter(p => p.id !== activePresenter.id) : []

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

  const handleNavigate = useCallback((item: NavItem) => {
    setActiveNavItem(item)
    const layout = NAV_TO_LAYOUT[item]
    if (layout) setWbLayout(layout)
    if (item === 'Chat') setSideTab('chat')
    if (item === 'Participants') setSideTab('participants')
    if (item === 'Polls') setShowPollCreate(true)
    if (item === 'Breakout') setShowBreakoutManager(true)
    if (item === 'Settings') setSettingsOpen(true)
  }, [])

  return (
    <div dir={dir} className="relative flex h-full w-full overflow-hidden min-h-0" style={{ background: '#FAF8F1' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c8.284 0 15-6.716 15-15S38.284 0 30 0 15 6.716 15 15s6.716 15 15 15zm0 0c8.284 0 15-6.716 15-15S38.284 0 30 0 15 6.716 15 15s6.716 15 15 15z' fill='none' stroke='%23071B78' stroke-width='0.5'/%3E%3C/svg%3E")`, backgroundSize: '120px 120px' }} />

      {/* Left Sidebar */}
      <CurvedSidebar
        activeItem={activeNavItem}
        onNavigate={handleNavigate}
        dir={dir}
      />

      {/* Main Classroom Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative min-h-0" style={{ marginLeft: '4px' }}>
        {/* Header */}
        <ClassroomHeader
          roomId={roomId}
          isConnected={isConnected}
          seconds={seconds}
          participantCount={allParticipants.filter(p => !p.isTeacher).length}
          isTeacher={isTeacher}
          teacherName={userName}
          dir={dir}
          onToggleBreakout={() => setShowBreakoutManager(!showBreakoutManager)}
          showBreakoutManager={showBreakoutManager}
          onToggleTimer={() => setShowTimer(!showTimer)}
          showTimer={showTimer}
          onLayoutChange={setWbLayout}
          currentLayout={wbLayout}
          onToggleChat={() => setSideTab(sideTab === 'chat' ? null : 'chat')}
          onToggleParticipants={() => setSideTab(sideTab === 'participants' ? null : 'participants')}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleScoreboard={() => setShowScoreboard(!showScoreboard)}
          showScoreboard={showScoreboard}
          onClose={onClose}
          showChat={sideTab === 'chat'}
          showParticipants={sideTab === 'participants'}
        />

        {/* Alert banners */}
        {joinError && (
          <div className="px-5 py-1.5 text-xs flex items-center gap-2 shrink-0 mx-4"
            style={{ background: 'rgba(251, 191, 54, 0.08)', border: '1px solid rgba(251, 191, 54, 0.2)', borderRadius: '8px', color: '#FBBF24', marginTop: 4 }}>
            <span>⚠</span>
            <span>Camera/mic unavailable — participating without video. {joinError}</span>
          </div>
        )}
        {arabicAlertBanner && (
          <div className="px-5 py-1.5 text-xs flex items-center gap-2 shrink-0 mx-4 animate-pulse"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', color: '#FCA5A5', marginTop: 4 }}>
            <span>🛑</span>
            <span><strong>{arabicAlertBanner.student}</strong> spoke Arabic: <em dir="rtl">{arabicAlertBanner.phrase}</em></span>
            <button className="ml-auto text-[9px] text-red-400 hover:text-white" onClick={() => setArabicAlertBanner(null)}>✕</button>
          </div>
        )}

        {/* Participant Strip */}
        <ParticipantStrip
          participants={allParticipants.map(p => ({
            ...p,
            stream: p.isLocal ? localStream : (p.stream || p.mediaStream || null),
            isCameraOn: p.isLocal ? (isCameraOn && localStream) : (p.isCameraOn !== false && (p.stream || p.mediaStream))
          }))}
          dir={dir}
          onParticipantClick={() => {}}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden min-h-0" style={{ marginTop: '4px' }}>
          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative min-h-0">
            {/* Screen Stage Overlay */}
            {activePresenter && (
              <div className="absolute inset-0 z-20">
                <ScreenStage presenter={activePresenter} others={stageOthers} isTeacher={isTeacher}
                  onStop={activePresenter.isLocal ? toggleScreenShare : undefined} />
              </div>
            )}

            {/* Main Workspace */}
            <MainWorkspace
              layout={wbLayout}
              onLayoutChange={setWbLayout}
              participants={allParticipants}
              isTeacher={isTeacher}
              localStream={localStream}
              remoteParticipants={remoteParticipants}
              dir={dir}
              onSyncDraw={handleWbSync}
              activePresenter={activePresenter}
              stageOthers={stageOthers}
              onStopScreenShare={toggleScreenShare}
            />
          </div>

          {/* Right Communication Panel */}
          {sideTab && (
            <CommunicationPanel
              activeTab={sideTab}
              onTabChange={setSideTab}
              messages={messages}
              participants={allParticipants}
              onSendMessage={handleSendMessage}
              onClose={() => setSideTab(null)}
              isTeacher={isTeacher}
              currentClassroomId={roomId}
              classrooms={classrooms}
              onSetParticipantStatus={setParticipantStatus}
              onForcePermission={forcePermission}
              onAssignPresenter={assignPresenter}
              onRemovePresenter={removePresenter}
              onMoveParticipant={moveParticipant}
              onTransferToRoom1={transferToRoom1}
              onLockClassroom={lockClassroom}
              dir={dir}
            />
          )}

          {/* Teacher Panel */}
          {showTeacherPanel && (
            <TeacherPanel
              isOpen={showTeacherPanel}
              onClose={() => setShowTeacherPanel(false)}
              participants={allParticipants}
              onMuteAll={() => {}}
              onSpotlight={() => {}}
              onLockRoom={setRoomLocked}
              onEject={() => {}}
              roomLocked={roomLocked}
            />
          )}
        </div>
      </div>

      {/* Floating Control Bar */}
      <FloatingControlBar
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        isScreenSharing={isScreenSharing}
        handRaised={handRaised}
        isRecording={isRecording}
        isTeacher={isTeacher}
        isAdminOrSupervisor={isAdminOrSupervisor}
        isInvisible={isInvisible}
        showBreakoutManager={showBreakoutManager}
        showPollCreate={showPollCreate}
        activePoll={activePoll}
        showMonkey={showMonkey}
        showModal={showModal}
        showTeacherPanel={showTeacherPanel}
        dir={dir}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleHand={() => setHandRaised(!handRaised)}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onToggleBreakout={() => setShowBreakoutManager(!showBreakoutManager)}
        onTogglePoll={() => setShowPollCreate(!showPollCreate)}
        onToggleQuiz={() => setShowMonkey(!showMonkey)}
        onToggleMonkey={() => setShowMonkey(!showMonkey)}
        onToggleModal={() => setShowModal(!showModal)}
        onToggleTeacherPanel={() => setShowTeacherPanel(!showTeacherPanel)}
        onToggleInvisible={toggleInvisible}
        onLeaveRoom={onClose}
        recordingTime={recordingTime}
      />

      {/* Floating Overlays */}
      {showBreakoutManager && (
        <BreakoutManager teacherName={userName}
          onArabicAlert={alert => setArabicAlertBanner({ student: alert.student, phrase: alert.phrase })} />
      )}

      <PollWidget
        isOpen={showPollCreate || !!activePoll}
        onClose={() => { setShowPollCreate(false); setActivePoll(null) }}
        isTeacher={isTeacher}
        activePoll={activePoll}
        liveResults={liveResults}
        onCreatePoll={handleCreatePoll}
        onVote={handleVote}
        onEndPoll={handleEndPoll} />

      <TimerPopup isOpen={showTimer} onClose={() => setShowTimer(false)} />
      <ComponentModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <MonkeyBot isOpen={showMonkey} onClose={() => setShowMonkey(false)} />
      <SettingsSidebar open={settingsOpen} onClose={() => setSettingsOpen(false)} defaultTab="classroom" />

      {/* Floating Monitor for screen sharing */}
      <FloatingMonitor
        active={!!activePresenter}
        participants={allParticipants.map(p => ({ id: p.id, name: p.name, stream: p.stream ?? null, isLocal: !!p.isLocal }))}
        localStream={localStream}
        localName={userName}
      />
    
      {/* Floating Gamification Scoreboard */}
      <ClassroomScoreboard
        isOpen={showScoreboard}
        onClose={() => setShowScoreboard(false)}
      />
    </div>
  )
}