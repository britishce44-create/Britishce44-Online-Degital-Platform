import { useState, useEffect, useRef } from 'react'
import { useAppState } from './app-provider'

interface ChatMsg {
  id: string; sender: string; text: string; time: string; isMe: boolean
}

export function AppChat() {
  const { student } = useAppState()
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'sys', sender: 'System', text: 'Welcome to the Britishce44 Student Chat', time: new Date().toLocaleTimeString(), isMe: false },
  ])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    const msg: ChatMsg = {
      id: `m-${Date.now()}`,
      sender: student?.name || 'Me',
      text: input.trim(),
      time: new Date().toLocaleTimeString(),
      isMe: true,
    }
    setMessages(prev => [...prev, msg])
    setInput('')
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        <span className="text-sm font-bold text-white flex-1">Messages</span>
        <span className="text-[10px] text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.isMe
              ? 'rounded-br-md'
              : 'rounded-bl-md'}`}
              style={{
                background: m.isMe ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,0.06)',
              }}>
              {!m.isMe && <p className="text-[9px] font-bold text-golden-bright mb-0.5">{m.sender}</p>}
              <p className="text-sm text-white">{m.text}</p>
              <p className={`text-[9px] mt-1 ${m.isMe ? 'text-blue-200' : 'text-gray-500'}`}>{m.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-blue-500/30 transition" />
        <button onClick={send}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          Send
        </button>
      </div>
    </div>
  )
}
