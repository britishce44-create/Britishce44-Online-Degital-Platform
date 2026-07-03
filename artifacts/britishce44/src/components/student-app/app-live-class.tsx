import { useState } from 'react'
import { useAppState } from './app-provider'

export function AppLiveClass() {
  const { student, online } = useAppState()
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)

  if (!online) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <span className="text-5xl mb-4">📡</span>
        <h2 className="text-lg font-black text-white mb-2">You are Offline</h2>
        <p className="text-sm text-gray-400 text-center max-w-xs mb-4">Connect to the internet to join your live class.</p>
        <button onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white transition"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          ↻ Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Video area (placeholder) */}
      <div className="flex-1 relative m-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #1e1b4b, #312e81)' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-4xl text-white mb-4 shadow-xl">
            {student?.name?.charAt(0) || '?'}
          </div>
          <p className="text-white font-bold text-lg">{student?.name || 'Student'}</p>
          {student?.classroomNum && <p className="text-indigo-300 text-sm mt-1">Room {student.classroomNum}</p>}
          <p className="text-gray-400 text-xs mt-4">
            {camOn ? '📷 Camera on' : '📷 Camera off'}
            {' · '}
            {micOn ? '🎙 Mic on' : '🎙 Mic off'}
          </p>
        </div>
        {/* Self-view */}
        {camOn && (
          <div className="absolute bottom-4 right-4 w-24 h-36 rounded-xl overflow-hidden border-2 border-white/20"
            style={{ background: '#1a1a2e' }}>
            <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-3">
        <button onClick={() => setMicOn(v => !v)}
          className="w-14 h-14 rounded-full text-xl transition active:scale-90"
          style={{ background: micOn ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.10)', border: `2px solid ${micOn ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.20)'}` }}>
          {micOn ? '🎙' : '🔇'}
        </button>
        <button onClick={() => setCamOn(v => !v)}
          className="w-14 h-14 rounded-full text-xl transition active:scale-90"
          style={{ background: camOn ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.10)', border: `2px solid ${camOn ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.20)'}` }}>
          {camOn ? '📷' : '🚫'}
        </button>
        <button
          className="w-14 h-14 rounded-full text-xl transition active:scale-90"
          style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.25)' }}>
          📞
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-500 px-4 pb-2">
        Full WebRTC classroom integration connects when you join a scheduled class.
        Microphone, camera, screen share, and chat are available in the full classroom window.
      </p>
    </div>
  )
}
