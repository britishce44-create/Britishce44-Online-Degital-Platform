
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { OnboardingFlow } from '@/pages/onboarding'
import toast from 'react-hot-toast'
import { playWelcomeVoice } from '@/lib/welcome-voice'
import { isEnglishLocked } from '@/lib/i18n'

/* Background photo slideshow images from britishce4.com */
const BG_PHOTOS = [
  '/site_girl2.jpg',
  '/site_boy2.jpg',
  '/site_2.jpg',
  '/site_nicebooks.jpg',
  '/site_motdrbeen.jpg',
  '/site_modrbeen.jpg',
  '/site_sultan.jpg',
  '/site_alglobal.jpg',
  '/site_schoolahly.jpg',
]

function PhotoMosaic() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % BG_PHOTOS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slideshow full-screen photo */}
      {BG_PHOTOS.map((src, i) => (
        <div key={src} className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === currentSlide ? 1 : 0 }}>
          <img src={src} alt="" className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.50) saturate(0.8)' }} />
        </div>
      ))}

      {/* Photo grid overlay (decorative corners) */}
      <div className="absolute top-0 left-0 w-48 h-32 overflow-hidden opacity-20 rounded-br-3xl hidden lg:block">
        <img src={BG_PHOTOS[1]} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-0 right-0 w-48 h-32 overflow-hidden opacity-20 rounded-bl-3xl hidden lg:block">
        <img src={BG_PHOTOS[3]} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 left-0 w-48 h-32 overflow-hidden opacity-20 rounded-tr-3xl hidden lg:block">
        <img src={BG_PHOTOS[4]} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-0 right-0 w-48 h-32 overflow-hidden opacity-20 rounded-tl-3xl hidden lg:block">
        <img src={BG_PHOTOS[6]} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Royal blue gradient overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(8,16,50,0.62) 0%, rgba(11,26,80,0.55) 40%, rgba(16,32,90,0.68) 100%)' }} />
      {/* Royal blue / gold glow accents */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(27,62,166,0.22), transparent)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-60 h-60 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 174, 116,0.20), transparent)', filter: 'blur(60px)' }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,1) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {BG_PHOTOS.map((_, i) => (
          <button key={i} onClick={() => setCurrentSlide(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentSlide ? '20px' : '6px',
              height: '6px',
              background: i === currentSlide ? '#00ae74' : 'rgba(255,255,255,0.3)',
            }} />
        ))}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('britishce44@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [onboardingName, setOnboardingName] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    try {
      await login(email, password)
      try {
        const stored = JSON.parse(localStorage.getItem('b44_user') || 'null')
        const lang = isEnglishLocked(stored) ? 'en' : (localStorage.getItem('b44_lang') === 'ar' ? 'ar' : 'en')
        playWelcomeVoice(lang)
      } catch {}
      toast.success('Welcome to Britishce44!')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally { setLoading(false) }
  }

  if (onboardingName !== null) {
    return <OnboardingFlow studentName={onboardingName} onComplete={() => setOnboardingName(null)} />
  }

  if (showRegister) return <RegisterForm onBack={() => setShowRegister(false)} onRegistered={(name) => { setShowRegister(false); setOnboardingName(name) }} />

  return (
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <PhotoMosaic />

      {/* Left branding panel (desktop only) */}
      <div className="hidden lg:flex flex-col items-center justify-center absolute left-0 top-0 bottom-0 w-[42%] z-10 px-12">
        <img src="/center-logo.png" alt="المركز البريطاني الأول" className="w-52 h-52 object-contain drop-shadow-2xl mb-6" />
        <h1 className="text-3xl font-black text-white text-center leading-tight mb-2 drop-shadow-lg"
          style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
          المركز البريطاني الأول
        </h1>
        <p className="text-base text-emerald-400/90 text-center font-semibold mb-1 drop-shadow"
          style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl' }}>
          التعليم أونلاين
        </p>
        <p className="text-sm text-white/50 text-center mt-1">The First British Center for Online Education</p>
        <p className="text-xs text-white/30 text-center mt-0.5">Yemen · Taiz · Est. 2020</p>

        {/* Feature badges */}
        <div className="mt-8 space-y-3 w-full max-w-xs">
          {[
            { icon: '🎓', ar: 'تعليم لجميع المستويات', en: 'All English levels' },
            { icon: '🌐', ar: 'تعلم عن بُعد', en: 'Online learning' },
            { icon: '🏆', ar: 'مناهج معتمدة دولياً', en: 'Internationally certified' },
            { icon: '🤖', ar: 'تقنية الذكاء الاصطناعي', en: 'AI-powered platform' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(27,62,166,0.18)', border: '1px solid rgba(37,99,235,0.25)', backdropFilter: 'blur(8px)' }}>
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-sm font-bold text-white leading-tight" style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>{f.ar}</p>
                <p className="text-[10px] text-white/40">{f.en}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm lg:ml-auto lg:mr-16 animate-slide-up">
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(14,30,80,0.82)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(37,99,235,0.28)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />

          <div className="p-8">
            {/* Logo + title */}
            <div className="text-center mb-7">
              <div className="relative inline-block mb-4">
                <img src="/center-logo.png" alt="Logo" className="w-20 h-20 object-contain mx-auto drop-shadow-xl rounded-xl lg:hidden" />
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl lg:flex hidden"
                  style={{ background: 'linear-gradient(135deg, #00684a, #00ae74, #34d399)', boxShadow: '0 8px 24px rgba(0, 174, 116,0.40)' }}>
                  <span className="text-[#17125c] font-black text-xl">B44</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2"
                  style={{ borderColor: '#241c80', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'Cairo, sans-serif' }}>
                المركز البريطاني الأول
              </h1>
              <p className="text-xs text-indigo-300/60 mt-0.5">Britishce44 · Online Digital School</p>
              <p className="text-[10px] text-sky-300/60 mt-0.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>تعز · اليمن</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-300/70 mb-1.5 uppercase tracking-widest">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                  style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.30)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0, 174, 116,0.70)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.30)'}
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-300/70 mb-1.5 uppercase tracking-widest">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                  style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.30)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0, 174, 116,0.70)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(37,99,235,0.30)'}
                  placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all mt-2"
                style={{
                  background: loading ? 'rgba(0, 174, 116,0.55)' : 'linear-gradient(135deg, #00684a, #00ae74, #34d399)',
                  color: '#17125c',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(0, 174, 116,0.35)',
                  fontFamily: 'Cairo, sans-serif',
                }}>
                {loading ? '⚙ جاري تسجيل الدخول…' : '→ تسجيل الدخول / Sign In'}
              </button>

              <div className="text-center pt-1">
                <button type="button" onClick={() => setShowRegister(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  طالب جديد أو ولي أمر؟ سجل هنا · New? Register Here
                </button>
              </div>

              <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(27,62,166,0.12)', border: '1px solid rgba(37,99,235,0.18)' }}>
                <p className="text-[9px] text-blue-300/70 text-center font-mono">
                  Demo Admin: britishce44@gmail.com / admin123
                </p>
                <p className="text-[9px] text-gray-600 text-center font-mono mt-0.5">
                  Teacher: suhair.almojahid / teacher123
                </p>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-[9px] text-gray-600 mt-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          المركز البريطاني الأول · Britishce44 Platform v2.1 · Taiz, Yemen · Est. 2020
        </p>
      </div>
    </div>
  )
}

function RegisterForm({ onBack, onRegistered }: { onBack: () => void; onRegistered?: (name: string) => void }) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    role: 'student', phone: '', address: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Please fill all required fields'); return
    }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register({ ...form, role: form.role as 'admin' | 'supervisor' | 'teacher' | 'student' | 'parent' })
      toast.success('Account created! Starting your registration journey…')
      if (onRegistered) {
        onRegistered(`${form.firstName} ${form.lastName}`)
      } else {
        onBack()
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition bg-white/5 border border-indigo-500/20 placeholder-gray-600 focus:border-indigo-500/50"

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <PhotoMosaic />
      <div className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,30,80,0.82)', backdropFilter: 'blur(32px)', border: '1px solid rgba(37,99,235,0.25)', boxShadow: '0 32px 64px rgba(0,0,0,0.40)' }}>
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" />
        <div className="p-6">
          <h2 className="text-lg font-bold text-white mb-5 text-center" style={{ fontFamily: 'Cairo, sans-serif' }}>
            🎓 تسجيل طالب / ولي أمر جديد
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-sm">
            <input placeholder="First Name *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={`${inputCls} col-span-1`} />
            <input placeholder="Last Name *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={`${inputCls} col-span-1`} />
            <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${inputCls} col-span-2`} />
            <input type="password" placeholder="Password *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${inputCls} col-span-1`} />
            <input type="password" placeholder="Confirm Password *" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className={`${inputCls} col-span-1`} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className={`${inputCls} col-span-2 bg-[#241c80]`}>
              <option value="student">Student / طالب</option>
              <option value="parent">Parent / ولي أمر</option>
            </select>
            <input placeholder="Phone Number / رقم الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`${inputCls} col-span-2`} />
            <textarea placeholder="Address / العنوان" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className={`${inputCls} col-span-2`} rows={2} />
            <div className="flex gap-3 col-span-2 mt-2">
              <button type="button" onClick={onBack}
                className="flex-1 rounded-xl py-2.5 text-sm text-gray-400 hover:text-white transition border border-white/10 hover:border-white/20">
                ← Back to Login
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold transition"
                style={{ background: 'linear-gradient(135deg, #00684a, #00ae74)', color: '#17125c', fontFamily: 'Cairo, sans-serif' }}>
                {loading ? '⚙ جاري التسجيل…' : '✅ تسجيل'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
