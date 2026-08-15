import { useState, useRef, useEffect } from 'react'
import { ParticipantQuickControls } from './ParticipantQuickControls'

interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: number
}

interface TileParticipant {
  id: string
  name: string
  role: string
  isTeacher?: boolean
  isLocal?: boolean
  stream?: MediaStream | null
  isMuted?: boolean
  isCameraOn?: boolean
  handRaised?: boolean
  isPresenter?: boolean
  permissions?: Record<string, string>
  status?: 'expected' | 'active' | 'inactive' | 'disconnected' | 'removed' | 'transferred'
}

interface CommunicationPanelProps {
  activeTab: 'chat' | 'participants'
  onTabChange: (tab: 'chat' | 'participants') => void
  messages: ChatMessage[]
  participants: TileParticipant[]
  onSendMessage: (text: string) => void
  onClose: () => void
  isTeacher: boolean
  currentClassroomId: number
  classrooms: Array<{ id: number; label: string; roomId: number }>
  onSetParticipantStatus: (participantId: string, status: string) => void
  onForcePermission: (participantId: string, feature: string, action: string) => void
  onAssignPresenter: (participantId: string) => void
  onRemovePresenter: (participantId: string) => void
  onMoveParticipant: (participantId: string, toClassroomId: number, isTemporary?: boolean, reason?: string) => void
  onTransferToRoom1: (participantId: string, reason?: string) => void
  onLockClassroom: (locked: boolean, reason?: string) => void
  dir?: 'ltr' | 'rtl'
}

export function CommunicationPanel({
  activeTab,
  onTabChange,
  messages,
  participants,
  onSendMessage,
  onClose,
  isTeacher,
  currentClassroomId,
  classrooms,
  onSetParticipantStatus,
  onForcePermission,
  onAssignPresenter,
  onRemovePresenter,
  onMoveParticipant,
  onTransferToRoom1,
  onLockClassroom,
  dir = 'ltr',
}: CommunicationPanelProps) {
  const [msg, setMsg] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<TileParticipant | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    onSendMessage(msg.trim())
    setMsg('')
  }

  const teacher = participants.find(p => p.isTeacher)
  const students = participants.filter(p => !p.isTeacher)

  const handleParticipantClick = (p: TileParticipant) => {
    if (isTeacher) {
      setSelectedParticipant(p)
    }
  }

  const handleParticipantClose = () => {
    setSelectedParticipant(null)
  }

  return (
    <div
      dir={dir}
      className="relative flex flex-col shrink-0"
      style={{
        width: '18%',
        minWidth: 137,
        maxWidth: 180,
        height: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(7, 27, 120, 0.08), 0 1px 3px rgba(7, 27, 120, 0.04)',
        border: '1px solid rgba(7, 27, 120, 0.06)',
        margin: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-3 border-b" style={{ borderColor: 'rgba(7, 27, 120, 0.06)' }}>
        {(['chat', 'participants'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-2 px-3 rounded-xl text-[12px] font-medium transition-all relative`}
            style={{
              background: activeTab === tab ? 'transparent' : 'transparent',
              color: activeTab === tab ? '#071B78' : '#071B78',
              opacity: activeTab === tab ? 1 : 0.5,
            }}
          >
            {tab === 'chat' ? '💬 Chat' : '👥 Participants'}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] rounded-t"
                style={{ background: '#071B78' }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-3">
        {activeTab === 'chat' ? (
          <div className="space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-8" style={{ color: '#071B78', opacity: 0.4 }}>
                <p className="text-xs">No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'System' ? 'justify-center' : ''}`}>
                <div className={`${m.sender === 'System' ? 'bg-gray-100 text-gray-500 text-[10px] px-3 py-1 rounded-full' : 'bg-[#FFFDF7] border rounded-xl px-3 py-2 max-w-[85%]'}`}
                  style={{
                    borderColor: m.sender !== 'System' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  }}>
                  {m.sender !== 'System' && (
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold" style={{ color: '#071B78' }}>{m.sender}</span>
                      <span className="text-[8px] ml-2" style={{ color: '#071B78', opacity: 0.5 }}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: '#071B78' }}>{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[10px] font-semibold px-2 py-1 uppercase tracking-wider" style={{ color: '#071B78', opacity: 0.5 }}>
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </div>
            {teacher && (
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
                style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #E5B93F 100%)' }}>
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate" style={{ color: '#071B78' }}>{teacher.name}</span>
                    <span className="text-[10px]">👑</span>
                    {teacher.isLocal && <span className="text-[9px] px-1.5 rounded-full font-medium" style={{ background: '#FFFDF7', color: '#D4AF37' }}>you</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${teacher.isMuted ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span className="text-[9px]" style={{ color: '#071B78', opacity: 0.6 }}>{teacher.isMuted ? 'Muted' : 'Audio on'}</span>
                    {teacher.handRaised && <span className="text-[10px]">✋</span>}
                  </div>
                </div>
              </div>
            )}
            {students.map((p) => (
              <div
                key={p.id}
                onClick={() => handleParticipantClick(p)}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition ${isTeacher ? 'cursor-pointer hover:bg-[#071B78]/5' : ''} ${selectedParticipant?.id === p.id ? 'bg-[#071B78]/10' : ''}`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #071B78 0%, #0A2A92 100%)' }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate" style={{ color: '#071B78' }}>{p.name}</span>
                    {p.isLocal && <span className="text-[9px] px-1.5 rounded-full font-medium" style={{ background: '#FFFDF7', color: '#D4AF37' }}>you</span>}
                    {p.isPresenter && <span className="text-[10px]">🎤</span>}
                    {p.status && p.status !== 'active' && (
                      <span className="text-[9px] px-1.5 rounded-full font-medium capitalize"
                        style={{
                          background: p.status === 'removed' || p.status === 'transferred' ? 'rgba(239,68,68,0.12)' : 'rgba(212,175,55,0.15)',
                          color: p.status === 'removed' || p.status === 'transferred' ? '#FCA5A5' : '#D4AF37',
                        }}>
                        {p.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.isMuted ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span className="text-[9px]" style={{ color: '#071B78', opacity: 0.6 }}>{p.isMuted ? 'Muted' : 'Audio on'}</span>
                    {p.handRaised && <span className="text-[10px]">✋</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSubmit} className="p-3 border-t" style={{ borderColor: 'rgba(7, 27, 120, 0.06)', background: 'rgba(7, 27, 120, 0.02)' }}>
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-3.5 py-2 text-xs outline-none transition bg-white placeholder-gray-300"
              style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#071B78' }}
            />
            <button type="submit"
              className="px-4 py-2 rounded-full text-xs font-bold transition shadow-sm"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #E5B93F 100%)', color: '#071B78' }}>
              Send
            </button>
          </div>
        </form>
      )}

      {/* Teacher quick controls for a selected participant */}
      {selectedParticipant && (
        <ParticipantQuickControls
          selectedParticipant={selectedParticipant}
          onClose={handleParticipantClose}
          isTeacher={isTeacher}
          currentClassroomId={currentClassroomId}
          classrooms={classrooms}
          onSetStatus={onSetParticipantStatus}
          onForcePermission={onForcePermission}
          onAssignPresenter={onAssignPresenter}
          onRemovePresenter={onRemovePresenter}
          onMoveParticipant={onMoveParticipant}
          onTransferToRoom1={onTransferToRoom1}
          onLockClassroom={onLockClassroom}
          dir={dir}
        />
      )}
    </div>
  )
}