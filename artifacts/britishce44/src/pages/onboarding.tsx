
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* New Student Onboarding — 4-step post-registration flow */
/* Steps: 1) Complete Profile  2) Academic Meeting  3) Payment Info */

interface OnboardingProps { onComplete: () => void; studentName?: string }

const COURSES = [
  'Oxford Phonics 1','Oxford Phonics 2','Oxford Phonics 3',
  'Gogo Loves English 1','Gogo Loves English 2','Gogo Loves English 3',
  'Gogo Loves English 4','Gogo Loves English 5','Gogo Loves English 6',
  'American Speakout Elementary','American Speakout Pre-Intermediate',
  'American Speakout Intermediate','American Speakout Upper-Intermediate','American Speakout Advanced',
]

const BANK_STEPS_EN = [
  'Open your Al-Rajhi Bank mobile application',
  'Go to "Transfers" → "International Transfer"',
  'Enter the IBAN: YE67KIMB6105682010003099323956',
  'Account Name: المركز البريطاني الأول (Britishce44)',
  'Enter the course fee amount',
  'Add your full name and course name in the notes',
  'Confirm the transfer and save the receipt',
  'Send a copy of the receipt to: britishce44@gmail.com',
]
const BANK_STEPS_AR = [
  'افتح تطبيق بنك الراجحي على هاتفك',
  'انتقل إلى "التحويلات" ← "تحويل دولي"',
  'أدخل رقم الآيبان: YE67KIMB6105682010003099323956',
  'اسم الحساب: المركز البريطاني الأول',
  'أدخل مبلغ رسوم الدورة',
  'أضف اسمك الكامل واسم الدورة في الملاحظات',
  'أكد التحويل واحفظ الإيصال',
  'أرسل نسخة من الإيصال إلى: britishce44@gmail.com',
]

function StepDots({total,current}:{total:number;current:number}) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} className="rounded-full transition-all duration-300"
          style={{width:i===current?'24px':'8px',height:'8px',background:i===current?'#00ae74':i<current?'rgba(0, 174, 116,0.40)':'rgba(255,255,255,0.12)'}} />
      ))}
    </div>
  )
}

export function OnboardingFlow({ onComplete, studentName='Student' }: OnboardingProps) {
  const [step,setStep]=useState(0)
  const [profile,setProfile]=useState({
    fullName:'',nameAr:'',dob:'',phone:'',whatsapp:'',city:'',
    guardian:'',guardianPhone:'',course:'',levelGuess:'beginner',
    heardFrom:'',goals:'',
  })
  const [meetingJoined,setMeetingJoined]=useState(false)
  const [meetingDone,setMeetingDone]=useState(false)
  const [assignedInfo,setAssignedInfo]=useState({course:'',teacher:'',schedule:'',startDate:''})
  const inp="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-amber-400/60 placeholder-white/25 transition"

  const STEPS = ['Complete Your Profile','Academic Interview','Course & Schedule','Payment Information']

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{background:'linear-gradient(160deg,#17125c 0%,#241c80 50%,#17125c 100%)'}}>
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{backgroundImage:'linear-gradient(rgba(0, 174, 116,1) 1px, transparent 1px), linear-gradient(90deg,rgba(0, 174, 116,1) 1px, transparent 1px)',backgroundSize:'40px 40px'}} />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{background:'radial-gradient(circle,rgba(0, 174, 116,0.10),transparent)',filter:'blur(60px)'}} />

      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/center-logo.png" alt="BC" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-xl rounded-xl bg-white p-1" />
          <h1 className="text-2xl font-black text-white" style={{fontFamily:'Cairo,sans-serif'}}>مرحباً بك في المركز البريطاني الأول</h1>
          <p className="text-sm text-amber-400/70 mt-0.5">Welcome, {studentName}! Complete your registration.</p>
          <div className="mt-4"><StepDots total={STEPS.length} current={step} /></div>
          <p className="text-xs text-white/30 mt-2">Step {step+1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 0: PROFILE ────────────────────── */}
          {step===0&&(
            <motion.div key="profile" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              className="rounded-2xl overflow-hidden"
              style={{background:'rgba(8,14,35,0.88)',backdropFilter:'blur(24px)',border:'1px solid rgba(0, 174, 116,0.22)',boxShadow:'0 32px 80px rgba(0,0,0,0.50)'}}>
              <div className="h-0.5 bg-gradient-to-r from-amber-400 via-indigo-500 to-violet-500" />
              <div className="p-6">
                <h2 className="text-lg font-black text-white mb-1">📋 Complete Your Profile</h2>
                <p className="text-xs text-white/40 mb-5" style={{fontFamily:'Tajawal,sans-serif'}}>أكمل بياناتك الشخصية</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Full Name (English) *</label>
                    <input className={inp} value={profile.fullName} onChange={e=>setProfile(p=>({...p,fullName:e.target.value}))} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5" style={{fontFamily:'Tajawal,sans-serif'}}>الاسم بالعربي *</label>
                    <input className={inp} dir="rtl" value={profile.nameAr} onChange={e=>setProfile(p=>({...p,nameAr:e.target.value}))} placeholder="الاسم الكامل بالعربي" style={{fontFamily:'Tajawal,sans-serif'}} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Date of Birth</label>
                    <input type="date" className={inp} value={profile.dob} onChange={e=>setProfile(p=>({...p,dob:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Phone / WhatsApp *</label>
                    <input className={inp} value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} placeholder="+967 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">City / المدينة</label>
                    <input className={inp} value={profile.city} onChange={e=>setProfile(p=>({...p,city:e.target.value}))} placeholder="Taiz, Sana'a, Aden…" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Parent/Guardian Name</label>
                    <input className={inp} value={profile.guardian} onChange={e=>setProfile(p=>({...p,guardian:e.target.value}))} placeholder="Parent full name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Interested Course</label>
                    <select className={`${inp} bg-[#1d1668]`} value={profile.course} onChange={e=>setProfile(p=>({...p,course:e.target.value}))}>
                      <option value="">Select a course…</option>
                      {COURSES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Current English Level</label>
                    <select className={`${inp} bg-[#1d1668]`} value={profile.levelGuess} onChange={e=>setProfile(p=>({...p,levelGuess:e.target.value}))}>
                      <option value="beginner">Beginner / مبتدئ</option>
                      <option value="elementary">Elementary</option>
                      <option value="pre-int">Pre-Intermediate</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="upper-int">Upper Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">How did you hear about us? / كيف عرفتنا؟</label>
                    <input className={inp} value={profile.heardFrom} onChange={e=>setProfile(p=>({...p,heardFrom:e.target.value}))} placeholder="WhatsApp, social media, friend…" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-1.5">Your Learning Goals / أهدافك</label>
                    <textarea className={`${inp} resize-none`} rows={2} value={profile.goals} onChange={e=>setProfile(p=>({...p,goals:e.target.value}))} placeholder="What do you want to achieve with English?" />
                  </div>
                </div>

                <button onClick={()=>setStep(1)} disabled={!profile.fullName||!profile.phone}
                  className="w-full mt-5 py-3 rounded-xl font-bold text-sm transition"
                  style={{background:profile.fullName&&profile.phone?'linear-gradient(135deg,#00875a,#00ae74)':'rgba(255,255,255,0.08)',color:profile.fullName&&profile.phone?'#17125c':'rgba(255,255,255,0.25)',fontFamily:'Cairo,sans-serif'}}>
                  حفظ ومتابعة → Submit & Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: ACADEMIC MEETING ──────────── */}
          {step===1&&(
            <motion.div key="meeting" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              className="rounded-2xl overflow-hidden"
              style={{background:'rgba(8,14,35,0.88)',backdropFilter:'blur(24px)',border:'1px solid rgba(16,185,129,0.22)',boxShadow:'0 32px 80px rgba(0,0,0,0.50)'}}>
              <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
              <div className="p-6">
                <h2 className="text-lg font-black text-white mb-1">🎥 Academic Interview Room</h2>
                <p className="text-xs text-white/40 mb-1" style={{fontFamily:'Tajawal,sans-serif'}}>غرفة المقابلة الأكاديمية</p>
                <p className="text-xs text-white/35 mb-5">Our academic coordinator will speak with you to assess your level, recommend the right course, and give you the schedule details.</p>

                {!meetingJoined ? (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4"
                      style={{background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.15))',border:'1px solid rgba(52,211,153,0.25)'}}>
                      🎥
                    </div>
                    <p className="text-white/60 text-sm mb-1">Academic Interview Room</p>
                    <p className="text-white/30 text-xs mb-6" style={{fontFamily:'Tajawal,sans-serif'}}>ستتحدث مع المنسق الأكاديمي لتحديد مستواك وتحديد دورتك</p>
                    <button onClick={()=>setMeetingJoined(true)}
                      className="px-8 py-3 rounded-xl font-bold text-sm"
                      style={{background:'linear-gradient(135deg,#00ae74,#00ae74)',color:'#fff',boxShadow:'0 4px 20px rgba(16,185,129,0.30)'}}>
                      🟢 Join Academic Meeting / انضم للمقابلة
                    </button>
                  </div>
                ) : !meetingDone ? (
                  <div>
                    {/* Simulated meeting room */}
                    <div className="rounded-2xl overflow-hidden mb-4" style={{background:'#17125c',border:'1px solid rgba(52,211,153,0.20)'}}>
                      <div className="relative h-48 flex items-center justify-center" style={{background:'linear-gradient(135deg,#1d1668,#241c80)'}}>
                        <div className="text-center">
                          <p className="text-4xl mb-2">👩‍💼</p>
                          <p className="text-sm text-emerald-400 font-semibold">Academic Coordinator</p>
                          <p className="text-xs text-white/35 mt-1 animate-pulse">● Live</p>
                        </div>
                        <div className="absolute bottom-3 right-3 w-16 h-12 rounded-xl flex items-center justify-center"
                          style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.10)'}}>
                          <span className="text-2xl">👤</span>
                        </div>
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[9px] text-white/50">Recording</span>
                        </div>
                      </div>
                      {/* Controls */}
                      <div className="flex items-center justify-center gap-3 px-4 py-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                        {[{icon:'🎙',label:'Mute'},{icon:'📷',label:'Camera'},{icon:'💬',label:'Chat'},{icon:'📋',label:'Notes'}].map(c=>(
                          <button key={c.label} title={c.label}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm hover:scale-110 transition"
                            style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.10)'}}>
                            {c.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Simulated coordinator message */}
                    <div className="p-4 rounded-xl mb-4" style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(52,211,153,0.15)'}}>
                      <p className="text-sm text-emerald-400 font-bold mb-1">👩‍💼 Academic Coordinator:</p>
                      <p className="text-xs text-white/60">"Hello! Welcome to Britishce44. Based on your application, I recommend you start with <strong className='text-white'>{profile.course||'Speakout Elementary'}</strong>. Classes are on <strong className='text-white'>Sat–Mon–Wed at 5:00 PM</strong>, starting <strong className='text-white'>next week</strong>."</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mb-1.5">Assigned Course</label>
                        <input className={`${inp} border-emerald-500/20`} value={assignedInfo.course||profile.course} onChange={e=>setAssignedInfo(p=>({...p,course:e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mb-1.5">Schedule</label>
                        <input className={`${inp} border-emerald-500/20`} value={assignedInfo.schedule} onChange={e=>setAssignedInfo(p=>({...p,schedule:e.target.value}))} placeholder="e.g. Sat-Mon-Wed 5PM" />
                      </div>
                    </div>
                    <button onClick={()=>{setMeetingDone(true)}}
                      className="w-full mt-4 py-3 rounded-xl font-bold text-sm"
                      style={{background:'linear-gradient(135deg,#00875a,#00ae74)',color:'#17125c',fontFamily:'Cairo,sans-serif'}}>
                      ✅ End Meeting & Continue / إنهاء المقابلة والمتابعة
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-5xl mb-3">✅</p>
                    <p className="text-lg font-black text-emerald-400">Interview Completed!</p>
                    <p className="text-sm text-white/50 mt-1">Your course and schedule have been confirmed by the academic team.</p>
                    <div className="mt-4 p-4 rounded-xl text-left" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.15)'}}>
                      <p className="text-xs font-bold text-emerald-400 mb-2">📚 Your Assignment:</p>
                      <p className="text-sm text-white/70">Course: <strong className="text-white">{assignedInfo.course||profile.course}</strong></p>
                      <p className="text-sm text-white/70 mt-1">Schedule: <strong className="text-white">{assignedInfo.schedule||'Sat-Mon-Wed 5:00 PM'}</strong></p>
                    </div>
                    <button onClick={()=>setStep(2)}
                      className="w-full mt-5 py-3 rounded-xl font-bold text-sm"
                      style={{background:'linear-gradient(135deg,#00875a,#00ae74)',color:'#17125c'}}>
                      Continue to Payment Info →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: PAYMENT INFO ─────────────── */}
          {step===2&&(
            <motion.div key="payment" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              className="rounded-2xl overflow-hidden"
              style={{background:'rgba(8,14,35,0.88)',backdropFilter:'blur(24px)',border:'1px solid rgba(0, 174, 116,0.22)',boxShadow:'0 32px 80px rgba(0,0,0,0.50)'}}>
              <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-1">
                  <img src="/center-logo.png" alt="BC" className="w-10 h-10 object-contain rounded-xl bg-white p-0.5" />
                  <div>
                    <h2 className="text-lg font-black text-white">💳 Payment Information</h2>
                    <p className="text-xs text-amber-400/60" style={{fontFamily:'Tajawal,sans-serif'}}>معلومات الدفع — طريقة دفع الرسوم</p>
                  </div>
                </div>
                <p className="text-xs text-white/35 mb-5">Please transfer the course fees using one of the methods below. / يرجى تحويل رسوم الدورة باستخدام إحدى الطرق التالية.</p>

                {/* Video placeholder */}
                <div className="rounded-2xl overflow-hidden mb-5 cursor-pointer hover:opacity-90 transition"
                  style={{background:'linear-gradient(135deg,#1d1668,#241c80)',border:'1px solid rgba(0, 174, 116,0.20)'}}>
                  <div className="h-32 flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{background:'rgba(0, 174, 116,0.15)',border:'2px solid rgba(0, 174, 116,0.30)'}}>
                      <span className="text-xl text-amber-400">▶</span>
                    </div>
                    <p className="text-xs text-amber-400/70 font-semibold">Watch: How to pay — كيفية الدفع</p>
                    <p className="text-[9px] text-white/25">Video explanation coming soon — سيتم إضافة الفيديو قريباً</p>
                  </div>
                </div>

                {/* Account cards */}
                <div className="space-y-4 mb-5">
                  {/* Al-Rajhi */}
                  <div className="rounded-2xl p-4" style={{background:'linear-gradient(135deg,rgba(45,15,0,0.8),rgba(60,20,0,0.6))',border:'1px solid rgba(0, 174, 116,0.20)'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{background:'rgba(0, 174, 116,0.15)'}}>🏦</div>
                      <div>
                        <p className="text-sm font-black text-white">Al-Rajhi Bank / بنك الراجحي</p>
                        <p className="text-[10px] text-amber-400/60">International Transfer / تحويل دولي</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div><p className="text-white/30 text-[9px]">Account (SAR)</p><p className="font-mono font-bold text-white">3099323956</p></div>
                      <div><p className="text-white/30 text-[9px]">Account (USD)</p><p className="font-mono font-bold text-white">3054034228</p></div>
                      <div className="col-span-2"><p className="text-white/30 text-[9px]">IBAN</p><p className="font-mono font-bold text-amber-400 text-[10px]">YE67KIMB6105682010003099323956</p></div>
                      <div className="col-span-2"><p className="text-white/30 text-[9px]">Account Name / اسم الحساب</p><p className="font-bold text-white" style={{fontFamily:'Tajawal,sans-serif'}}>المركز البريطاني الأول (Britishce44)</p></div>
                    </div>
                    {/* How-to steps */}
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/50 mb-2">How to Transfer / كيف تحول</p>
                    <div className="grid md:grid-cols-2 gap-x-4 gap-y-1">
                      {BANK_STEPS_EN.map((s,i)=>(
                        <div key={i} className="flex items-start gap-2 text-[9px] text-white/45">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 font-black" style={{background:'rgba(0, 174, 116,0.12)',color:'#00ae74'}}>{i+1}</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Al-Kuraimi */}
                  <div className="rounded-2xl p-4" style={{background:'linear-gradient(135deg,rgba(0,30,60,0.8),rgba(0,20,45,0.6))',border:'1px solid rgba(56,189,248,0.15)'}}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{background:'rgba(56,189,248,0.12)'}}>🏛</div>
                      <div>
                        <p className="text-sm font-black text-white">Al-Kuraimi Bank / بنك الكريمي</p>
                        <p className="text-[10px] text-sky-400/60" style={{fontFamily:'Tajawal,sans-serif'}}>التحويل المحلي</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><p className="text-white/30 text-[9px]">Account Name</p><p className="font-bold text-white">Sultan Mohammed Ahmed</p></div>
                      <div><p className="text-white/30 text-[9px]">Account No.</p><p className="font-mono font-bold text-sky-400">102-682-271112-02280975-000</p></div>
                    </div>
                  </div>
                </div>

                {/* Arabic instructions */}
                <div className="p-4 rounded-xl mb-5" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}} dir="rtl">
                  <p className="text-xs font-black text-amber-400 mb-3" style={{fontFamily:'Cairo,sans-serif'}}>تعليمات الدفع بالعربي:</p>
                  <div className="space-y-1.5">
                    {BANK_STEPS_AR.map((s,i)=>(
                      <div key={i} className="flex items-start gap-2 text-[10px] text-white/50" style={{fontFamily:'Tajawal,sans-serif'}}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-black text-[9px]" style={{background:'rgba(0, 174, 116,0.12)',color:'#00ae74'}}>{i+1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl mb-5" style={{background:'rgba(0, 174, 116,0.06)',border:'1px solid rgba(0, 174, 116,0.15)'}}>
                  <p className="text-[10px] text-amber-400/80">
                    ⚠️ After payment, send your receipt to <strong>britishce44@gmail.com</strong> with your name and course.
                    Your account will be activated within 24 hours.
                  </p>
                  <p className="text-[10px] text-amber-400/60 mt-1" style={{fontFamily:'Tajawal,sans-serif'}}>
                    بعد الدفع، أرسل إيصالك إلى البريد الإلكتروني مع اسمك واسم الدورة. سيتم تفعيل حسابك خلال 24 ساعة.
                  </p>
                </div>

                <button onClick={()=>setStep(3)}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{background:'linear-gradient(135deg,#00875a,#00ae74)',color:'#17125c',fontFamily:'Cairo,sans-serif',boxShadow:'0 4px 20px rgba(0, 174, 116,0.25)'}}>
                  ✅ I understand — Take me to my dashboard / فهمت — اذهب إلى لوحتي
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: DONE ─────────────────────── */}
          {step===3&&(
            <motion.div key="done" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
              className="rounded-2xl overflow-hidden text-center"
              style={{background:'rgba(8,14,35,0.88)',backdropFilter:'blur(24px)',border:'1px solid rgba(52,211,153,0.22)',boxShadow:'0 32px 80px rgba(0,0,0,0.50)'}}>
              <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-400" />
              <div className="p-8">
                <img src="/center-logo.png" alt="BC" className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-xl rounded-2xl bg-white p-1" />
                <p className="text-5xl mb-4">🎉</p>
                <h2 className="text-2xl font-black text-white mb-1" style={{fontFamily:'Cairo,sans-serif'}}>مبروك! تسجيلك مكتمل</h2>
                <p className="text-base text-emerald-400 font-bold mb-2">Congratulations! Your registration is complete!</p>
                <p className="text-sm text-white/45 mb-6">Welcome to Britishce44 — The First British Center for Online Education. Your academic journey starts now!</p>
                <div className="p-4 rounded-xl mb-6 text-left" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.15)'}}>
                  <p className="text-xs font-bold text-emerald-400 mb-2">✅ What happens next:</p>
                  <p className="text-xs text-white/50">1. Send your payment receipt to britishce44@gmail.com</p>
                  <p className="text-xs text-white/50 mt-1">2. Your account will be activated within 24 hours</p>
                  <p className="text-xs text-white/50 mt-1">3. You will receive a WhatsApp message with your class schedule</p>
                  <p className="text-xs text-white/50 mt-1" style={{fontFamily:'Tajawal,sans-serif'}}>4. ستصلك رسالة واتساب بتفاصيل الفصل الدراسي</p>
                </div>
                <button onClick={onComplete}
                  className="w-full py-3.5 rounded-xl font-black text-base"
                  style={{background:'linear-gradient(135deg,#00875a,#00ae74,#ffd166)',color:'#17125c',boxShadow:'0 8px 24px rgba(0, 174, 116,0.30)',fontFamily:'Cairo,sans-serif'}}>
                  🚀 Go to My Dashboard / الانتقال إلى لوحتي
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
