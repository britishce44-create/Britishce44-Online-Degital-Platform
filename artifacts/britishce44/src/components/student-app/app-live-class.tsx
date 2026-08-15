import { useState, useMemo } from 'react'
import { useAppState } from './app-provider'

function isAssignmentActive(a: {
  schedule: { startTime: string; endTime: string; days: number[] | null; frequency: string } | null
  earlyLoginAllowance: number
}): boolean {
  const sched = a.schedule
  if (!sched) return true // no schedule => always joinable (permanent assignment)
  const now = new Date()
  const todayDow = now.getDay() // 0=Sun..6=Sat
  if (sched.days && sched.days.length && !sched.days.includes(todayDow)) return false
  const [sh, sm] = sched.startTime.split(':').map(Number)
  const [eh, em] = sched.endTime.split(':').map(Number)
  const start = sh * 60 + (sm || 0)
  const end = eh * 60 + (em || 0)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const early = Math.max(0, a.earlyLoginAllowance || 0)
  return nowMin >= start - early && nowMin <= end
}

export function AppLiveClass() {
  const { student, classes, assignments, online } = useAppState()
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)

  // Find the currently-active scheduled class (today, within start–end time)
  const activeClass = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const nowMin = now.getHours() * 60 + now.getMinutes()
    return classes.find(c => {
      if (c.date !== today) return false
      const [sh, sm] = c.startTime.split(':').map(Number)
      const [eh, em] = c.endTime.split(':').map(Number)
      const start = sh * 60 + (sm || 0)
      const end = eh * 60 + (em || 0)
      return nowMin >= start && nowMin <= end
    })
  }, [classes])

  // Find the active classroom assignment (authoritative source for permitted rooms)
  const activeAssignment = useMemo(
    () => assignments.find(a => a.status === 'active' && isAssignmentActive(a)) || null,
    [assignments]
  )

  // The room to join: active assignment room first, then active scheduled class,
  // then the student's assigned room number.
  const joinRoom = (() => {
    if (activeAssignment?.roomId && activeAssignment.roomId > 0) return activeAssignment.roomId
    if (activeClass) {
      if (activeClass.courseId) return activeClass.courseId
      const r = Number(activeClass.room)
      if (!isNaN(r) && r > 0) return r
    }
    return student?.classroomNum || 0
  })()

  const joinLiveClass = () => {
    if (!joinRoom) return
    // Open the full classroom (with WebRTC) in a new tab.
    // The join URL uses ?room=N which routes through the main app's
    // ClassroomRoom → WebRTCProvider → joinClassroom(roomId).
    const url = `${window.location.origin}/?room=${joinRoom}`
    window.open(url, '_blank')
  }

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
      {/* Video area */}
      <div className="flex-1 relative m-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(145deg, #1e1b4b, #312e81)' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-4xl text-white mb-4 shadow-xl">
            {student?.name?.charAt(0) || '?'}
          </div>
          <p className="text-white font-bold text-lg">{student?.name || 'Student'}</p>
          {activeAssignment ? (
            <div className="text-center mt-2">
              <p className="text-indigo-300 text-sm">{activeAssignment.classroomLabel || `Classroom ${activeAssignment.classroomId}`}</p>
              <p className="text-indigo-300/70 text-xs">Room {activeAssignment.roomId}</p>
              {activeAssignment.schedule && (
                <p className="text-indigo-300/50 text-xs">{activeAssignment.schedule.startTime}–{activeAssignment.schedule.endTime}</p>
              )}
            </div>
          ) : activeClass ? (
            <div className="text-center mt-2">
              <p className="text-indigo-300 text-sm">{activeClass.name}</p>
              <p className="text-indigo-300/70 text-xs">{activeClass.teacher} · Room {activeClass.room}</p>
              <p className="text-indigo-300/50 text-xs">{activeClass.startTime}–{activeClass.endTime}</p>
            </div>
          ) : student?.classroomNum ? (
            <p className="text-indigo-300 text-sm mt-1">Room {student.classroomNum}</p>
          ) : (
            <p className="text-gray-400 text-xs mt-1">No active class right now</p>
          )}
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

      {/* Join button — opens the full WebRTC classroom */}
      {joinRoom > 0 && (
        <div className="px-4 mb-2">
          <button
            onClick={joinLiveClass}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition active:scale-95"
            style={{ background: 'linear-gradient(135deg,#3FBAEB,#2563eb)', boxShadow: '0 4px 16px rgba(63,186,235,0.3)' }}>
            {activeAssignment || activeClass ? '🔴 Join Live Class →' : 'Enter Classroom →'}
          </button>
        </div>
      )}

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
        {activeAssignment || activeClass
          ? 'Your class is live now. Tap "Join Live Class" to enter the full classroom with video, audio, and chat.'
          : 'Join a scheduled class from the Schedule tab when it\'s time. The full classroom opens with video, audio, and chat.'}
      </p>
    </div>
  )
}
