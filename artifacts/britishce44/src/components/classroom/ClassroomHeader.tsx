import { useState, useEffect } from 'react'

interface ClassroomHeaderProps {
  roomId: number
  isConnected: boolean
  seconds: number
  participantCount: number
  isTeacher: boolean
  teacherName?: string
  dir?: 'ltr' | 'rtl'
  onToggleBreakout?: () => void
  showBreakoutManager?: boolean
  onToggleTimer?: () => void
  showTimer?: boolean
  onLayoutChange?: (layout: 'whiteboard' | 'grid' | 'resources') => void
  currentLayout?: 'whiteboard' | 'grid' | 'resources'
  onToggleChat?: () => void
  onToggleParticipants?: () => void
  onOpenSettings?: () => void
  onClose?: () => void
  showChat?: boolean
  showParticipants?: boolean
}

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function ClassroomHeader({
  roomId,
  isConnected,
  seconds,
  participantCount,
  isTeacher,
  teacherName = 'Teacher',
  dir = 'ltr',
  onToggleBreakout,
  showBreakoutManager,
  onToggleTimer,
  showTimer,
  onLayoutChange,
  currentLayout = 'whiteboard',
  onToggleChat,
  onToggleParticipants,
  onOpenSettings,
  onToggleScoreboard,
  onClose,
  showChat,
  showParticipants,
}: ClassroomHeaderProps) {
  return (
    <header
      dir={dir}
      className="flex items-center justify-between px-5 py-3 shrink-0 relative"
      style={{
        background: '#FAF8F1',
        borderBottom: '1px solid rgba(7, 27, 120, 0.06)',
        minHeight: 65,
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg, #071B78 0%, #D4AF37 50%, #071B78 100%)' }} />

      {/* Left: Room Title + Slogan */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <h1 className="font-bold text-[24px] leading-tight text-[#071B78] whitespace-nowrap" style={{ letterSpacing: '-0.02em' }}>
          Room {roomId}
        </h1>

        {/* Slogan Pill */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 176, height: 31 }}>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: '#FFFDF7',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              boxShadow: '0 1px 3px rgba(7, 27, 120, 0.04)',
            }}>
            <span style={{ color: '#D4AF37', fontSize: 14 }}>🏆</span>
            <span className="text-[12px] font-medium" style={{ color: '#071B78', whiteSpace: 'nowrap' }}>
              Together we build your success
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Status */}
      <div className="flex items-center gap-3 justify-center flex-shrink-0 mx-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: '#FFFDF7',
            border: '1px solid rgba(7, 27, 120, 0.06)',
            boxShadow: '0 1px 4px rgba(7, 27, 120, 0.04)',
          }}>
          {/* LIVE indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex items-center">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00A86B', boxShadow: '0 0 6px #00A86B' }} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping" style={{ background: '#00A86B', opacity: 0.5 }} />
            </span>
            <span className="text-[11px] font-bold tracking-wider" style={{ color: '#00A86B' }}>LIVE</span>
          </div>

          <div className="w-px h-4" style={{ background: 'rgba(7, 27, 120, 0.1)' }} />

          {/* Time */}
          <span className="text-[12px] font-mono font-medium tabular-nums" style={{ color: '#071B78' }}>
            {formatTime(seconds)}
          </span>

          <div className="w-px h-4" style={{ background: 'rgba(7, 27, 120, 0.1)' }} />

          {/* Participant count */}
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#071B78', opacity: 0.6 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[12px] font-medium" style={{ color: '#071B78' }}>
              {participantCount} present
            </span>
          </div>
        </div>
      </div>

      {/* Right: Layout tabs + Teacher Card + Actions */}
      <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
        {/* Layout Tabs */}
        <div className="flex items-center gap-1 bg-white/50 rounded-full px-1 py-1" style={{ border: '1px solid rgba(7, 27, 120, 0.06)' }}>
          {(['whiteboard', 'grid', 'resources'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => onLayoutChange?.(layout)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all`}
              style={{
                background: currentLayout === layout ? '#071B78' : 'transparent',
                color: currentLayout === layout ? '#FFFFFF' : '#071B78',
                boxShadow: currentLayout === layout ? '0 2px 8px rgba(7, 27, 120, 0.25)' : 'none',
                border: currentLayout === layout ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
              }}
            >
              {layout === 'whiteboard' && '✏ Board'}
              {layout === 'grid' && '⊞ Grid'}
              {layout === 'resources' && '🖥 Resources'}
            </button>
          ))}
        </div>

        <div className="w-px h-6" style={{ background: 'rgba(7, 27, 120, 0.1)', margin: '0 4px' }} />

        {/* Teacher Card */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(7, 27, 120, 0.06)',
            boxShadow: '0 2px 8px rgba(7, 27, 120, 0.04)',
            minWidth: 110,
            minHeight: 54,
          }}>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium" style={{ color: '#071B78', opacity: 0.7 }}>Teacher</span>
            <span className="text-[10px] font-medium" style={{ color: '#D4AF37' }}>Host</span>
          </div>
          <div className="relative ml-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #071B78 0%, #0A2A92 100%)' }}>
              {teacherName.charAt(0).toUpperCase()}
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: '#00A86B', boxShadow: '0 0 4px #00A86B' }} />
          </div>
        </div>

        <div className="w-px h-6" style={{ background: 'rgba(7, 27, 120, 0.1)', margin: '0 4px' }} />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {isTeacher && onToggleBreakout && (
            <button
              onClick={onToggleBreakout}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all`}
              style={{
                background: showBreakoutManager ? 'rgba(255, 159, 0, 0.15)' : 'transparent',
                color: showBreakoutManager ? '#FF9F00' : '#071B78',
                opacity: showBreakoutManager ? 1 : 0.7,
              }}
            >
              🏠 Breakout
            </button>
          )}

          {onToggleTimer && (
            <button
              onClick={onToggleTimer}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all`}
              style={{
                background: showTimer ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                color: showTimer ? '#D4AF37' : '#071B78',
                opacity: showTimer ? 1 : 0.7,
              }}
            >
              ⏱ Timer
            </button>
          )}

          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`p-2 rounded-full transition-all text-[14px]`}
              style={{
                background: showChat ? 'rgba(7, 27, 120, 0.1)' : 'transparent',
                color: showChat ? '#071B78' : '#071B78',
                opacity: showChat ? 1 : 0.5,
              }}
            >
              💬
            </button>
          )}

          {onToggleParticipants && (
            <button
              onClick={onToggleParticipants}
              className={`p-2 rounded-full transition-all text-[14px]`}
              style={{
                background: showParticipants ? 'rgba(7, 27, 120, 0.1)' : 'transparent',
                color: showParticipants ? '#071B78' : '#071B78',
                opacity: showParticipants ? 1 : 0.5,
              }}
            >
              👥
            </button>
          )}

          {onOpenSettings && (
            <>
            <button
            onClick={onToggleScoreboard}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition bg-slate-900/80 text-amber-300 border-amber-500/30 hover:bg-slate-800"
          >
             <span>Scores</span>
          </button>
          <button onClick={onOpenSettings} className="p-2 rounded-full text-[14px] text-[#071B78]/50 hover:text-[#071B78] hover:bg-[#071B78]/5 transition-all" title="Settings">
              ⚙️
            </button>
            </>
          )}

          {onClose && (
            <button onClick={onClose} className="p-2 rounded-full text-[14px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Close">
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  )
}