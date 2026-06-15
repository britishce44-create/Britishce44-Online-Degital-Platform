
import { useState, useRef, useEffect } from 'react'
import type { TileParticipant } from './participant-tile'

interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: number
}

interface SidePanelProps {
  tab: 'chat' | 'participants'
  messages: ChatMessage[]
  participants: TileParticipant[]
  onSendMessage: (text: string) => void
  onClose: () => void
}

export function SidePanel({ tab, messages, participants, onSendMessage, onClose }: SidePanelProps) {
  const [msg, setMsg] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    onSendMessage(msg.trim())
    setMsg('')
  }

  return (
    <div className="w-80 bg-white border-l border-gold/20 flex flex-col shadow-xl animate-slide-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-gradient-to-r from-navy/5 to-transparent">
        <span className="text-sm font-bold text-navy">
          {tab === 'chat' ? '💬 Chat' : '👥 Participants'}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center text-sm transition">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll">
        {tab === 'chat' ? (
          <div className="p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-xs py-8">
                No messages yet. Say hello!
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'System' ? 'justify-center' : ''}`}>
                <div className={`${m.sender === 'System' ? 'bg-gray-100 text-gray-500 text-[10px] px-3 py-1 rounded-full' : 'bg-gold/10 border border-gold/20 rounded-xl px-3 py-2 max-w-[85%]'}`}>
                  {m.sender !== 'System' && (
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-navy">{m.sender}</span>
                      <span className="text-[8px] text-gray-400 ml-2">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-navy/80">{m.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            <div className="text-[10px] text-gray-400 font-semibold px-2 py-1 uppercase tracking-wider">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </div>
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 hover:bg-navy/5 rounded-lg transition group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                  ${p.isTeacher ? 'bg-gold' : 'bg-navy/50'}`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-navy truncate">{p.name}</span>
                    {p.isTeacher && <span className="text-[10px]">👑</span>}
                    {p.isLocal && <span className="text-[9px] text-gold bg-gold/10 px-1.5 rounded-full">you</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.isMuted ? 'bg-red-400' : 'bg-green-400'}`} />
                    <span className="text-[9px] text-gray-400">{p.isMuted ? 'Muted' : 'Audio on'}</span>
                    {p.handRaised && <span className="text-[10px]">✋</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tab === 'chat' && (
        <form onSubmit={handleSubmit} className="p-3 border-t border-gold/10 bg-navy/[0.02]">
          <div className="flex gap-2">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gold/30 rounded-full px-3.5 py-2 text-xs outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition bg-white placeholder-gray-300"
            />
            <button type="submit"
              className="bg-gold text-navy px-4 py-2 rounded-full text-xs font-bold hover:bg-gold/90 transition shadow-sm">
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
