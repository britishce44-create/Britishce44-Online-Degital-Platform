import { useState } from 'react'

interface FloatingControlBarProps {
  isMuted: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  handRaised: boolean
  isRecording: boolean
  isTeacher: boolean
  isAdminOrSupervisor: boolean
  isInvisible: boolean
  showBreakoutManager: boolean
  showPollCreate: boolean
  activePoll: any
  showMonkey: boolean
  showModal: boolean
  showTeacherPanel: boolean
  dir?: 'ltr' | 'rtl'
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
  onToggleHand: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleBreakout: () => void
  onTogglePoll: () => void
  onToggleQuiz: () => void
  onToggleMonkey: () => void
  onToggleModal: () => void
  onToggleTeacherPanel: () => void
  onToggleInvisible: () => void
  onLeaveRoom: () => void
  recordingTime: number
}

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function FloatingControlBar({
  isMuted,
  isCameraOn,
  isScreenSharing,
  handRaised,
  isRecording,
  isTeacher,
  isAdminOrSupervisor,
  isInvisible,
  showBreakoutManager,
  showPollCreate,
  activePoll,
  showMonkey,
  showModal,
  showTeacherPanel,
  dir = 'ltr',
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onStartRecording,
  onStopRecording,
  onToggleBreakout,
  onTogglePoll,
  onToggleQuiz,
  onToggleMonkey,
  onToggleModal,
  onToggleTeacherPanel,
  onToggleInvisible,
  onLeaveRoom,
  recordingTime,
}: FloatingControlBarProps) {
  const [showPageIndicator, setShowPageIndicator] = useState(true)

  const controls = [
    { id: 'mute', icon: isMuted ? '🔇' : '🎤', label: 'Mute', active: !isMuted, onClick: onToggleMic },
    { id: 'video', icon: isCameraOn ? '📹' : '🚫', label: 'Video', active: isCameraOn, onClick: onToggleCamera },
    { id: 'share', icon: isScreenSharing ? '🖥️' : '💻', label: 'Share', active: isScreenSharing, onClick: onToggleScreenShare },
    { id: 'hand', icon: '✋', label: handRaised ? 'Lower' : 'Raise Hand', active: handRaised, onClick: onToggleHand },
    { id: 'record', icon: isRecording ? '⏹' : '🔴', label: isRecording ? `Stop (${formatTime(recordingTime)})` : 'Record', active: isRecording, onClick: isRecording ? onStopRecording : onStartRecording, isRecord: true },
    { id: 'breakout', icon: '🏠', label: 'Breakout', active: showBreakoutManager, onClick: onToggleBreakout, teacherOnly: true },
    { id: 'poll', icon: '📊', label: 'Poll', active: showPollCreate || !!activePoll, onClick: onTogglePoll, teacherOnly: true },
    { id: 'quiz', icon: '🐵', label: 'Quiz', active: showMonkey, onClick: onToggleQuiz },
    { id: 'more', icon: '📱', label: 'More', active: showModal, onClick: onToggleModal },
  ]

  // Admin/Supervisor invisibility toggle
  const invisibilityControl = isAdminOrSupervisor ? [
    { id: 'invisible', icon: isInvisible ? '👁️‍🗨️' : '👁️', label: isInvisible ? 'Appear' : 'Hide', active: !isInvisible, onClick: onToggleInvisible, isInvisibility: true },
  ] : []

  const teacherControls = [
    { id: 'teacher', icon: '👨‍🏫', label: 'Manage', active: showTeacherPanel, onClick: onToggleTeacherPanel },
  ]

  return (
    <div
      dir={dir}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-2 px-4 py-2"
      style={{
        width: 'calc(100% - 8px)',
        maxWidth: 717,
        height: 56,
        background: '#071B78',
        borderRadius: '28px',
        boxShadow: '0 12px 40px rgba(7, 27, 120, 0.3), 0 4px 16px rgba(7, 27, 120, 0.2)',
        border: '1px solid rgba(212, 175, 55, 0.15)',
        padding: '0 16px',
      }}
    >
      {/* Left: Page indicator circle */}
      {showPageIndicator && (
        <div className="flex-shrink-0 flex items-center justify-center mr-2"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37 0%, #E5B93F 100%)',
            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
          }}>
          <span className="text-[16px] font-black" style={{ color: '#071B78' }}>2</span>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        {controls.map((ctrl) => (
          !ctrl.teacherOnly && (
            <button
              key={ctrl.id}
              onClick={ctrl.onClick}
              className={`relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all min-w-[52px] max-w-[60px]`}
              style={{
                background: ctrl.active
                  ? (ctrl.isRecord ? 'linear-gradient(135deg, #E53935 0%, #c62828 100%)' : 'linear-gradient(135deg, #00875a 0%, #00ae74 100%)')
                  : 'transparent',
                color: ctrl.active ? '#FFFFFF' : '#FFFFFF',
                opacity: ctrl.active ? 1 : 0.7,
                boxShadow: ctrl.active ? (ctrl.isRecord ? '0 4px 16px rgba(229, 57, 53, 0.4)' : '0 4px 16px rgba(0, 135, 90, 0.3)') : 'none',
                border: ctrl.active ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
              }}
              title={ctrl.label}
            >
              <span className="text-[16px] leading-none">{ctrl.icon}</span>
              <span className="text-[9px] font-medium truncate whitespace-nowrap" style={{ letterSpacing: '0.02em' }}>
                {ctrl.label}
              </span>
            </button>
          )
        ))}

        {/* Admin/Supervisor Invisibility Toggle */}
        {invisibilityControl.map((ctrl) => (
          <button
            key={ctrl.id}
            onClick={ctrl.onClick}
            className={`relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all min-w-[52px] max-w-[60px]`}
            style={{
              background: ctrl.active
                ? (ctrl.isInvisibility ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #00875a 0%, #00ae74 100%)')
                : 'transparent',
              color: ctrl.active ? '#FFFFFF' : '#FFFFFF',
              opacity: ctrl.active ? 1 : 0.7,
              boxShadow: ctrl.active ? (ctrl.isInvisibility ? '0 4px 16px rgba(139, 92, 246, 0.4)' : '0 4px 16px rgba(0, 135, 90, 0.3)') : 'none',
              border: ctrl.active ? '1px solid rgba(139, 92, 246, 0.3)' : 'none',
            }}
            title={ctrl.label}
          >
            <span className="text-[16px] leading-none">{ctrl.icon}</span>
            <span className="text-[9px] font-medium truncate whitespace-nowrap" style={{ letterSpacing: '0.02em' }}>
              {ctrl.label}
            </span>
          </button>
        ))}

        {/* Teacher-only controls */}
        {isTeacher && (
          <>
            <div className="w-px h-8 mx-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
            {teacherControls.map((ctrl) => (
              <button
                key={ctrl.id}
                onClick={ctrl.onClick}
                className={`relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all min-w-[52px] max-w-[60px]`}
                style={{
                  background: ctrl.active ? 'linear-gradient(135deg, #2620a8 0%, #2563eb 100%)' : 'transparent',
                  color: ctrl.active ? '#FFFFFF' : '#FFFFFF',
                  opacity: ctrl.active ? 1 : 0.7,
                  boxShadow: ctrl.active ? '0 4px 16px rgba(37, 99, 235, 0.3)' : 'none',
                  border: ctrl.active ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
                }}
                title={ctrl.label}
              >
                <span className="text-[16px] leading-none">{ctrl.icon}</span>
                <span className="text-[9px] font-medium truncate whitespace-nowrap">{ctrl.label}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Right: Leave Room Button */}
      <button
        onClick={onLeaveRoom}
        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2 rounded-full transition-all"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #E5B93F 100%)',
          color: '#071B78',
          boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
          border: 'none',
          minWidth: 105,
          minHeight: 38,
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        <span>🚪</span>
        <span className="hidden sm:inline">Leave Room</span>
      </button>
    </div>
  )
}