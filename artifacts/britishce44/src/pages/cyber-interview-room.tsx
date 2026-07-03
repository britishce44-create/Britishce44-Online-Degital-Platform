import { useState, useEffect } from 'react'
import { WebRTCProvider } from '@/components/webrtc/webrtc-provider'
import { MeetingRoomWindow } from '@/components/meeting/meeting-room-window'
import toast from 'react-hot-toast'

const INTERVIEW_ROOM_ID = 8888

/* ─── Quick-join name prompt ─── */
function JoinGate({ onJoin }: { onJoin: (name: string) => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name')
      return
    }
    onJoin(`${firstName.trim()} ${lastName.trim()}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #050d1f 0%, #0a1628 40%, #0f1d3a 100%)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,30,80,0.85)', backdropFilter: 'blur(32px)', border: '1px solid rgba(212,160,23,0.25)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #D4A017, #F5C518, #D4A017)' }} />
        <div className="p-8 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(212,160,23,0.12)', border: '2px solid rgba(212,160,23,0.25)' }}>
            <span className="text-5xl">🎓</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            Britishce44 Interview Room
          </h1>
          <p className="text-sm text-gray-400 mb-1">المركز البريطاني الأول — المقابلة الشخصية</p>
          <p className="text-xs text-amber-400/60 mb-6">Enter your name to join the interview</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              placeholder="First Name *"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
              style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.30)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(212,160,23,0.70)'}
              onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.30)'}
              required
            />
            <input
              placeholder="Last Name *"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
              style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.30)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(212,160,23,0.70)'}
              onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.30)'}
              required
            />
            <button type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all text-white"
              style={{ background: 'linear-gradient(135deg, #D4A017, #F5C518)', color: '#17125c', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 20px rgba(212,160,23,0.35)' }}>
              🎥 Join Interview Room
            </button>
          </form>

          <p className="text-[10px] text-gray-500 mt-4">
            You will be connected with camera and microphone. Make sure they are working.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Personal Info Form (shown below meeting) ─── */
function PersonalInfoForm({ name }: { name: string }) {
  const [form, setForm] = useState({
    age: '', city: '', country: '', gmail: '',
    callPhone: '', whatsappPhone: '', previousLevel: '', notes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition bg-white/5 border border-indigo-500/20 placeholder-gray-600 focus:border-amber-500/50"

  if (submitted) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-3 block">✅</span>
        <p className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>Information Submitted!</p>
        <p className="text-xs text-gray-400">Your details have been recorded. The supervisor will review them.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(14,30,80,0.60)', border: '1px solid rgba(212,160,23,0.15)' }}>
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
        📋 Personal Information · <span style={{ direction: 'rtl' }}>المعلومات الشخصية</span>
      </h3>
      <p className="text-xs text-gray-400 mb-4">Welcome, {name}. Please fill in your details below.</p>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); toast.success('Information saved!') }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <input placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className={inputCls} />
        <input placeholder="City / المدينة" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputCls} />
        <input placeholder="Country / البلد" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className={inputCls} />
        <input type="email" placeholder="Gmail *" value={form.gmail} onChange={e => setForm({ ...form, gmail: e.target.value })} className={inputCls} required />
        <input type="tel" placeholder="Phone Number" value={form.callPhone} onChange={e => setForm({ ...form, callPhone: e.target.value })} className={inputCls} />
        <input type="tel" placeholder="WhatsApp Number" value={form.whatsappPhone} onChange={e => setForm({ ...form, whatsappPhone: e.target.value })} className={inputCls} />
        <input placeholder="Previous English Level (e.g. Beginner, A1, A2)" value={form.previousLevel} onChange={e => setForm({ ...form, previousLevel: e.target.value })} className={inputCls} />
        <textarea placeholder="Notes / ملاحظات" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputCls} md:col-span-2`} rows={2} />
        <div className="md:col-span-2">
          <button type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm transition-all text-white"
            style={{ background: 'linear-gradient(135deg, #D4A017, #F5C518)', color: '#17125c', fontFamily: 'Cairo, sans-serif' }}>
            ✅ Submit Information
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── Main Cyber Interview Room ─── */
export function CyberInterviewRoom() {
  const [userName, setUserName] = useState<string | null>(null)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [placementGranted, setPlacementGranted] = useState(false)

  // Auto-save name to localStorage so it persists
  useEffect(() => {
    const saved = localStorage.getItem('b44_interview_name')
    if (saved) {
      setUserName(saved)
      setMeetingOpen(true)
    }
  }, [])

  const handleJoin = (name: string) => {
    setUserName(name)
    setMeetingOpen(true)
    localStorage.setItem('b44_interview_name', name)
    toast.success(`Welcome, ${name}! Connecting to the interview room...`)
  }

  const handleLeave = () => {
    setMeetingOpen(false)
    setPlacementGranted(false)
  }

  // Name entry gate
  if (!userName) {
    return <JoinGate onJoin={handleJoin} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #050d1f 0%, #0a1628 40%, #0f1d3a 100%)' }}>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: 'rgba(10,15,42,0.95)', borderBottom: '1px solid rgba(212,160,23,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #D4A017, #F5C518)' }}>
            <span className="text-sm font-black" style={{ color: '#17125c' }}>B44</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Britishce44 Interview Room</p>
            <p className="text-[10px] text-gray-400">{userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!meetingOpen && (
            <button onClick={() => setMeetingOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
              🎥 Rejoin Meeting
            </button>
          )}
          <button onClick={() => { localStorage.removeItem('b44_interview_name'); window.location.reload() }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
            style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
            ← Leave
          </button>
        </div>
      </div>

      {/* ── Meeting popup (fixed at top) ── */}
      {meetingOpen && (
        <WebRTCProvider>
          <MeetingRoomWindow
            studentName={userName}
            isInterview={true}
            interviewNewcomerId={`interview-${Date.now()}`}
            onPlacementTestGranted={() => setPlacementGranted(true)}
            onClose={handleLeave}
          />
        </WebRTCProvider>
      )}

      {/* ── Content below meeting ── */}
      <div className="flex-1 p-4 md:p-6 space-y-5 mt-2">
        {/* Status banner */}
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-emerald-400">
              {meetingOpen ? 'Meeting is active — Camera & Microphone ON' : 'Meeting disconnected — Click "Rejoin Meeting" to reconnect'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              The supervisor can see and hear you. Fill in the forms below while waiting.
            </p>
          </div>
        </div>

        {/* Placement test (only after meeting grants it) */}
        {placementGranted && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(14,30,80,0.60)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              📝 Placement Test · اختبار تحديد المستوى
            </h3>
            <p className="text-xs text-gray-400 mb-4">Your supervisor has granted access to the placement test.</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(37,99,235,0.20)' }}>
              <iframe
                src="/app?placement=1"
                className="w-full"
                style={{ height: '500px', background: '#0a1628' }}
                title="Placement Test"
              />
            </div>
          </div>
        )}

        {/* Personal info form */}
        <PersonalInfoForm name={userName} />

        {/* Instructions */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(27,62,166,0.10)', border: '1px solid rgba(37,99,235,0.12)' }}>
          <h4 className="text-xs font-bold text-indigo-300 mb-2">📌 Interview Instructions</h4>
          <ul className="space-y-1.5 text-[11px] text-gray-400">
            <li>• The meeting window is fixed at the top — your supervisor can see and hear you</li>
            <li>• Keep your camera on and microphone unmuted during the interview</li>
            <li>• Fill in your personal information below while waiting</li>
            <li>• Your supervisor will guide you through the placement test when ready</li>
            <li>• If you get disconnected, click "Rejoin Meeting" to reconnect</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
