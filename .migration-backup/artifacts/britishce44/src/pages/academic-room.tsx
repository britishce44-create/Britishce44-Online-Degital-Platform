
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssessmentAdmin } from './academic-room-assessment'
import { EvalAdmin } from './academic-room-eval'
import { GoogleFormsSection } from './google-forms'
import { ScreenConsentViewer } from '@/components/exams/screen-consent-viewer'

/* Academic Management Room — Comprehensive center for all academic operations */

type Tab = 'overview'|'monitor'|'writer'|'intake'|'students'|'schedule'|'templates'|'archive'|'reports'|'assessment'|'teachereval'|'googleforms'

/* ── Live room monitor data ─────────────────────────────── */
interface MonRoom {
  id:string; num:number; teacher:string; level:string; students:number
  status:'live'|'exam'|'idle'; hand:boolean; arabicAlert:boolean
}
const MON_TEACHERS=['T. Suhair','T. Waad','T. Hassan','T. Jamal','T. Mona','T. Omar','T. Lina','T. Yousef']
const MON_LEVELS=['Phonics 1','Gogo 1','Gogo 3','Speakout Pre','Speakout Int','IELTS Prep','Beginner','Elementary']
const MONITOR_ROOMS:MonRoom[]=Array.from({length:24}).map((_,i)=>({
  id:`room-${i+1}`,
  num:101+i,
  teacher:MON_TEACHERS[i%MON_TEACHERS.length],
  level:MON_LEVELS[i%MON_LEVELS.length],
  students:8+((i*7)%32),
  status:i%8===0?'idle':i%5===0?'exam':'live',
  hand:i%6===0,
  arabicAlert:i%9===0,
}))
const TOTAL_ROOMS=240

const ROOM_STATUS={
  live:{color:'#34d399',label:'LIVE',labelAr:'مباشر'},
  exam:{color:'#f59e0b',label:'EXAM',labelAr:'اختبار'},
  idle:{color:'#64748b',label:'IDLE',labelAr:'خامل'},
} as const

function AudioBars({color,active}:{color:string;active:boolean}){
  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[0,1,2,3].map(i=>(
        <span key={i} className={`w-[2px] rounded-full ${active?'animate-pulse':''}`}
          style={{background:active?color:'rgba(255,255,255,0.15)',height:active?`${5+((i*3+4)%9)}px`:'3px',animationDelay:`${i*120}ms`,animationDuration:'700ms'}} />
      ))}
    </div>
  )
}
const fmtTime=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

interface Recording{id:string;name:string;dur:string;date:string;room:string}
const SEED_RECORDINGS:Recording[]=[
  {id:'rec1',name:'Monitor Session — Morning Sweep',dur:'18:42',date:'Today 09:10',room:'All rooms'},
  {id:'rec2',name:'Room 104 · Speakout Int observation',dur:'42:15',date:'Yesterday 11:00',room:'Room 104'},
  {id:'rec3',name:'Room 112 · IELTS Prep review',dur:'31:08',date:'Oct 6 14:30',room:'Room 112'},
]
interface DocNote{id:string;title:string;body:string;preview:string;date:string;words:number}
const SEED_DOCS:DocNote[]=[
  {id:'d1',title:'Weekly supervision notes',body:'Rooms 101–108 observed. Teaching pace strong in Gogo levels. Phonics 1 room needs more interactive drills. Recommend follow-up with T. Suhair on student participation.',preview:'Rooms 101–108 observed. Teaching pace strong in Gogo levels…',date:'Today 08:40',words:182},
  {id:'d2',title:'Teacher feedback — T. Waad',body:'Excellent classroom management. Suggest more speaking drills and peer activities. Students engaged throughout the Speakout Int session.',preview:'Excellent classroom management. Suggest more speaking drills…',date:'Yesterday',words:96},
]

interface Student {
  id:string; name:string; nameAr?:string; email:string; phone:string; level:string
  course:string; teacher:string; joinDate:string; status:'new'|'enrolled'|'pending-payment'|'active'|'completed'
  interviewDate?:string; paymentStatus?:'paid'|'partial'|'pending'
}

const SEED_STUDENTS: Student[] = [
  {id:'s1',name:'Ali Mohammed',nameAr:'علي محمد',email:'ali@email.com',phone:'+967770001001',level:'Beginner',course:'Oxford Phonics 1',teacher:'T. Suhair',joinDate:'2024-09-01',status:'active',paymentStatus:'paid'},
  {id:'s2',name:'Fatima Hassan',nameAr:'فاطمة حسن',email:'fatima@email.com',phone:'+967770001002',level:'Pre-Intermediate',course:'Gogo 3',teacher:'T. Waad',joinDate:'2024-09-01',status:'active',paymentStatus:'partial'},
  {id:'s3',name:'Sara Almahdi',nameAr:'سارة المهدي',email:'sara@email.com',phone:'+967770001003',level:'Intermediate',course:'Speakout Int',teacher:'T. Hassan',joinDate:'2024-09-15',status:'enrolled',paymentStatus:'pending'},
  {id:'s4',name:'Khaled Alawi',nameAr:'خالد العاوي',email:'khaled@email.com',phone:'+967770001004',level:'New',course:'TBD',teacher:'TBD',joinDate:'2024-10-01',status:'new',interviewDate:'2024-10-05 10:00'},
  {id:'s5',name:'Nour Alqaiti',nameAr:'نور القيتي',email:'nour@email.com',phone:'+967770001005',level:'Elementary',course:'Gogo 1',teacher:'T. Jamal',joinDate:'2024-09-20',status:'pending-payment',paymentStatus:'pending'},
]

const TEMPLATES = [
  {id:'t1',title:'Student Registration Form',titleAr:'نموذج التسجيل',emoji:'📋',category:'Registration',uses:245},
  {id:'t2',title:'Placement Test — Beginner',titleAr:'اختبار تحديد المستوى — مبتدئ',emoji:'🎯',category:'Assessment',uses:128},
  {id:'t3',title:'Parent Consent Form',titleAr:'نموذج موافقة ولي الأمر',emoji:'👪',category:'Registration',uses:89},
  {id:'t4',title:'Monthly Progress Report',titleAr:'تقرير التقدم الشهري',emoji:'📊',category:'Reports',uses:312},
  {id:'t5',title:'Teacher Evaluation Sheet',titleAr:'نموذج تقييم المدرس',emoji:'⭐',category:'Evaluation',uses:156},
  {id:'t6',title:'Course Completion Certificate',titleAr:'شهادة إتمام الدورة',emoji:'🎓',category:'Certificates',uses:67},
  {id:'t7',title:'Homework Assignment Sheet',titleAr:'ورقة الواجب المنزلي',emoji:'📝',category:'Academic',uses:421},
  {id:'t8',title:'Class Attendance Register',titleAr:'سجل الحضور',emoji:'✅',category:'Academic',uses:378},
]

const STATUS_CFG = {
  'new':              {color:'#60a5fa',bg:'rgba(129,140,248,0.12)',label:'New',labelAr:'جديد'},
  'enrolled':         {color:'#38bdf8',bg:'rgba(56,189,248,0.12)',label:'Enrolled',labelAr:'مسجل'},
  'pending-payment':  {color:'#f59e0b',bg:'rgba(245,158,11,0.12)',label:'Pending Payment',labelAr:'في انتظار الدفع'},
  'active':           {color:'#34d399',bg:'rgba(52,211,153,0.12)',label:'Active',labelAr:'نشط'},
  'completed':        {color:'#7dd3fc',bg:'rgba(167,139,250,0.12)',label:'Completed',labelAr:'مكتمل'},
}
const PAY_CFG = {
  paid:    {color:'#34d399',label:'Paid',labelAr:'مدفوع'},
  partial: {color:'#f59e0b',label:'Partial',labelAr:'جزئي'},
  pending: {color:'#f87171',label:'Pending',labelAr:'معلق'},
}

export function AcademicRoomPage() {
  const [tab,setTab]=useState<Tab>('overview')
  const [students,setStudents]=useState<Student[]>(SEED_STUDENTS)
  const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState<string>('all')
  const [showInterview,setShowInterview]=useState(false)
  const [selectedStudent,setSelectedStudent]=useState<Student|null>(null)
  const [meetingActive,setMeetingActive]=useState(false)
  const [meetingMinimized,setMeetingMinimized]=useState(false)
  const [screenViewer,setScreenViewer]=useState<{name:string;ctx:string}|null>(null)

  // ── Ghost monitor + recorder ──
  const [ghostMic,setGhostMic]=useState(false)
  const [ghostCam,setGhostCam]=useState(false)
  const [focusedRoom,setFocusedRoom]=useState<MonRoom|null>(null)
  const [roomSearch,setRoomSearch]=useState('')
  const [recording,setRecording]=useState(false)
  const [recSecs,setRecSecs]=useState(0)
  const [recordings,setRecordings]=useState<Recording[]>(SEED_RECORDINGS)

  useEffect(()=>{
    if(!recording) return
    const t=setInterval(()=>setRecSecs(s=>s+1),1000)
    return ()=>clearInterval(t)
  },[recording])

  const toggleRecord=()=>{
    if(recording){
      if(recSecs>2){
        setRecordings(p=>[{
          id:`rec-${Date.now()}`,
          name:focusedRoom?`Room ${focusedRoom.num} · ${focusedRoom.level}`:'Monitor Session — Live Sweep',
          dur:fmtTime(recSecs),date:'Just now',room:focusedRoom?`Room ${focusedRoom.num}`:'All rooms',
        },...p])
      }
      setRecording(false);setRecSecs(0)
    } else { setRecording(true);setRecSecs(0) }
  }

  const visibleRooms=MONITOR_ROOMS.filter(r=>{
    const q=roomSearch.toLowerCase()
    return !q||String(r.num).includes(q)||r.teacher.toLowerCase().includes(q)||r.level.toLowerCase().includes(q)
  })
  const liveCount=MONITOR_ROOMS.filter(r=>r.status==='live').length

  // ── Text writer ──
  const [docTitle,setDocTitle]=useState('Untitled note')
  const [docBody,setDocBody]=useState('')
  const [docs,setDocs]=useState<DocNote[]>(SEED_DOCS)
  const [docSaved,setDocSaved]=useState(false)
  const taRef=useRef<HTMLTextAreaElement>(null)
  const wordCount=docBody.trim()?docBody.trim().split(/\s+/).length:0

  const wrapSel=(before:string,after=before)=>{
    const ta=taRef.current; if(!ta) return
    const s=ta.selectionStart, e=ta.selectionEnd
    const sel=docBody.slice(s,e)||'text'
    const next=docBody.slice(0,s)+before+sel+after+docBody.slice(e)
    setDocBody(next)
    requestAnimationFrame(()=>{ta.focus();ta.setSelectionRange(s+before.length,s+before.length+sel.length)})
  }
  const prefixLine=(p:string)=>{
    const ta=taRef.current; if(!ta) return
    const s=ta.selectionStart
    const lineStart=docBody.lastIndexOf('\n',s-1)+1
    const next=docBody.slice(0,lineStart)+p+docBody.slice(lineStart)
    setDocBody(next)
    requestAnimationFrame(()=>{ta.focus();ta.setSelectionRange(s+p.length,s+p.length)})
  }
  const saveDoc=()=>{
    if(!docBody.trim()) return
    setDocs(p=>[{id:`d-${Date.now()}`,title:docTitle||'Untitled note',body:docBody,preview:docBody.slice(0,90),date:'Just now',words:wordCount},...p])
    setDocSaved(true);setTimeout(()=>setDocSaved(false),2000)
  }

  const filtered=students.filter(s=>{
    const q=search.toLowerCase()
    return (s.name.toLowerCase().includes(q)||s.course.toLowerCase().includes(q))
      &&(statusFilter==='all'||s.status===statusFilter)
  })

  const tabs: {id:Tab;label:string;labelAr:string;emoji:string}[] = [
    {id:'overview',label:'Overview',labelAr:'نظرة عامة',emoji:'📊'},
    {id:'monitor',label:'Live Monitor',labelAr:'المراقبة المباشرة',emoji:'👁'},
    {id:'writer',label:'Text Writer',labelAr:'محرر النصوص',emoji:'✍️'},
    {id:'intake',label:'New Intake',labelAr:'القبول الجديد',emoji:'🎓'},
    {id:'students',label:'All Students',labelAr:'جميع الطلاب',emoji:'👥'},
    {id:'schedule',label:'Schedule',labelAr:'الجدول',emoji:'📅'},
    {id:'templates',label:'Templates',labelAr:'النماذج',emoji:'📋'},
    {id:'googleforms',label:'From Google Forms',labelAr:'من نماذج جوجل',emoji:'📋'},
    {id:'archive',label:'Archive',labelAr:'الأرشيف',emoji:'🗂'},
    {id:'reports',label:'Reports',labelAr:'التقارير',emoji:'📈'},
    {id:'assessment',label:'In-Class Reports',labelAr:'تقارير الأداء',emoji:'✍️'},
    {id:'teachereval',label:'Teacher Evaluation',labelAr:'تقييم المعلمين',emoji:'⭐'},
  ]

  const statusCounts=Object.keys(STATUS_CFG).reduce((a,s)=>({...a,[s]:students.filter(st=>st.status===s).length}),{} as Record<string,number>)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{background:'linear-gradient(135deg,#17125c 0%,#1d1668 50%,#17125c 100%)',border:'1px solid rgba(0, 174, 116,0.22)',boxShadow:'0 8px 32px rgba(0,0,0,0.35)'}}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{backgroundImage:'radial-gradient(circle, rgba(0, 174, 116,0.9) 1px, transparent 1px)',backgroundSize:'20px 20px'}} />
        <div className="absolute top-0 right-0 w-48 h-full pointer-events-none opacity-10"
          style={{background:'radial-gradient(ellipse at right,#00875a,transparent)'}} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img src="/center-logo.png" alt="BC" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-lg" />
              <div>
                <h2 className="text-xl font-black text-white">🏛 Academic Management Room</h2>
                <p className="text-xs text-amber-400/50" style={{fontFamily:'Tajawal,sans-serif'}}>غرفة الإدارة الأكاديمية · المركز البريطاني الأول</p>
              </div>
            </div>
            <p className="text-xs text-white/30 mt-1">Complete academic control · Student intake · Schedules · Templates · Reports</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>{setMeetingActive(true);setMeetingMinimized(false)}}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
              style={{background:'linear-gradient(135deg,#00ae74,#00ae74)',color:'#fff',boxShadow:'0 4px 16px rgba(16,185,129,0.25)'}}>
              🎥 Start Meeting
            </button>
            <button onClick={()=>setTab('intake')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold"
              style={{background:'linear-gradient(135deg,#00875a,#00ae74)',color:'#17125c',boxShadow:'0 4px 16px rgba(0, 174, 116,0.25)'}}>
              ➕ New Intake
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {Object.entries(statusCounts).map(([s,n])=>{
            const sc=(STATUS_CFG as any)[s]
            return (
              <button key={s} onClick={()=>setStatusFilter(v=>v===s?'all':s)}
                className="p-3 rounded-xl text-center transition"
                style={{background:statusFilter===s?sc.bg:`${sc.color}08`,border:`1px solid ${statusFilter===s?sc.color+'35':sc.color+'15'}`}}>
                <p className="text-xl font-black" style={{color:sc.color}}>{n}</p>
                <p className="text-[9px] font-bold mt-0.5" style={{color:sc.color}}>{sc.label}</p>
                <p className="text-[8px] text-white/25" style={{fontFamily:'Tajawal,sans-serif'}}>{sc.labelAr}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition flex-shrink-0"
            style={{background:tab===t.id?'linear-gradient(135deg,#00875a,#00ae74)':' rgba(255,255,255,0.04)',color:tab===t.id?'#17125c':'rgba(255,255,255,0.45)',boxShadow:tab===t.id?'0 4px 16px rgba(0, 174, 116,0.22)':undefined,border:tab!==t.id?'1px solid rgba(255,255,255,0.07)':undefined}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* FROM GOOGLE FORMS — full section under Academic Room control */}
      {tab==='googleforms'&&<GoogleFormsSection/>}

      {/* IN-CLASS ASSESSMENT MANAGEMENT */}
      {tab==='assessment'&&<AssessmentAdmin/>}

      {/* TEACHER PERFORMANCE EVALUATION MANAGEMENT */}
      {tab==='teachereval'&&<EvalAdmin/>}

      {/* OVERVIEW */}
      {tab==='overview'&&(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {title:'New Applications',titleAr:'الطلبات الجديدة',value:students.filter(s=>s.status==='new').length,icon:'📥',color:'#60a5fa',action:'Review Now'},
            {title:'Pending Interviews',titleAr:'مقابلات معلقة',value:students.filter(s=>s.status==='new'&&s.interviewDate).length,icon:'🎥',color:'#38bdf8',action:'Schedule'},
            {title:'Active Students',titleAr:'الطلاب النشطون',value:students.filter(s=>s.status==='active').length,icon:'🎓',color:'#34d399',action:'View All'},
            {title:'Pending Payments',titleAr:'دفعات معلقة',value:students.filter(s=>s.paymentStatus==='pending').length,icon:'💳',color:'#f59e0b',action:'Follow Up'},
            {title:'Templates Available',titleAr:'النماذج المتاحة',value:TEMPLATES.length,icon:'📋',color:'#7dd3fc',action:'Open Library'},
            {title:'Today\'s Classes',titleAr:'فصول اليوم',value:12,icon:'🚪',color:'#f87171',action:'View Schedule'},
          ].map((stat,i)=>(
            <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
              whileHover={{y:-3}} className="rounded-2xl p-5 cursor-default"
              style={{background:'rgba(8,14,32,0.90)',border:`1px solid ${stat.color}18`,boxShadow:`0 4px 20px rgba(0,0,0,0.15)`}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow=`0 8px 28px ${stat.color}15`}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.15)'}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{background:`${stat.color}12`,border:`1px solid ${stat.color}20`}}>{stat.icon}</div>
                <button className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition"
                  style={{background:`${stat.color}10`,color:stat.color,border:`1px solid ${stat.color}20`}}>
                  {stat.action} →
                </button>
              </div>
              <p className="text-3xl font-black mb-0.5" style={{color:stat.color}}>{stat.value}</p>
              <p className="text-sm font-bold text-white/70">{stat.title}</p>
              <p className="text-[10px] text-white/30 mt-0.5" style={{fontFamily:'Tajawal,sans-serif'}}>{stat.titleAr}</p>
            </motion.div>
          ))}

          {/* Recent activity */}
          <div className="col-span-full rounded-2xl p-5" style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <p className="text-sm font-black text-white mb-4">🔔 Recent Academic Activity</p>
            <div className="space-y-2.5">
              {[
                {text:'New student application received — Khaled Alawi',time:'5 min ago',color:'#60a5fa',textAr:'استلام طلب تسجيل جديد'},
                {text:'Payment confirmed — Sara Almahdi (Speakout Int)',time:'20 min ago',color:'#34d399',textAr:'تأكيد الدفع'},
                {text:'Interview scheduled — Nour Alqaiti — Oct 8 at 11:00',time:'1 hr ago',color:'#38bdf8',textAr:'جدولة المقابلة'},
                {text:'Placement test completed — Ali Mohammed — Level B1',time:'2 hr ago',color:'#00ae74',textAr:'إتمام اختبار تحديد المستوى'},
                {text:'Course assigned — Fatima Hassan → Speakout Pre-Int',time:'3 hr ago',color:'#7dd3fc',textAr:'تعيين الدورة'},
              ].map((a,i)=>(
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{background:a.color}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70">{a.text}</p>
                    <p className="text-[9px] text-white/25 mt-0.5" style={{fontFamily:'Tajawal,sans-serif'}}>{a.textAr}</p>
                  </div>
                  <span className="text-[9px] text-white/25 flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIVE MONITOR — all rooms on one screen + ghost mode */}
      {tab==='monitor'&&(
        <div className="space-y-4">
          {/* Ghost mode + recorder control bar */}
          <div className="rounded-2xl p-4 relative overflow-hidden"
            style={{background:'linear-gradient(135deg,#1d1668,#241c80)',border:`1px solid ${(ghostMic||ghostCam)?'rgba(239,68,68,0.4)':'rgba(37,99,235,0.3)'}`}}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{background:(ghostMic||ghostCam)?'rgba(239,68,68,0.15)':'rgba(37,99,235,0.15)',border:`1px solid ${(ghostMic||ghostCam)?'rgba(239,68,68,0.35)':'rgba(37,99,235,0.35)'}`}}>
                  {(ghostMic||ghostCam)?'🔴':'👻'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">Ghost Monitor Mode</p>
                  {!ghostMic&&!ghostCam&&(
                    <p className="text-[11px] text-emerald-400">You are invisible &amp; muted — watching silently. No room can see or hear you.</p>
                  )}
                  {(ghostMic||ghostCam)&&(
                    <p className="text-[11px] text-red-400 font-bold">
                      ⚠ You are now visible to rooms — {ghostMic&&'mic LIVE'}{ghostMic&&ghostCam&&' · '}{ghostCam&&'camera LIVE'}
                    </p>
                  )}
                  <p className="text-[9px] text-white/30" style={{fontFamily:'Tajawal,sans-serif'}}>وضع المراقبة الصامتة · غير مرئي حتى تشغّل المايك أو الكاميرا</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={()=>setGhostMic(v=>!v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                  style={{background:ghostMic?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)',color:ghostMic?'#f87171':'rgba(255,255,255,0.6)',border:`1px solid ${ghostMic?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.1)'}`}}>
                  {ghostMic?'🎙 Mic ON':'🔇 Reveal Mic'}
                </button>
                <button onClick={()=>setGhostCam(v=>!v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                  style={{background:ghostCam?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)',color:ghostCam?'#f87171':'rgba(255,255,255,0.6)',border:`1px solid ${ghostCam?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.1)'}`}}>
                  {ghostCam?'📷 Cam ON':'🚫 Reveal Camera'}
                </button>
                <div className="w-px h-7 bg-white/10" />
                <button onClick={toggleRecord}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                  style={{background:recording?'rgba(239,68,68,0.2)':'rgba(0, 174, 116,0.15)',color:recording?'#f87171':'#00ae74',border:`1px solid ${recording?'rgba(239,68,68,0.45)':'rgba(0, 174, 116,0.35)'}`}}>
                  {recording?<><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Stop · {fmtTime(recSecs)}</>:'⏺ Record'}
                </button>
              </div>
            </div>
          </div>

          {/* Search + counters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">🔍</span>
              <input value={roomSearch} onChange={e=>setRoomSearch(e.target.value)} placeholder="Filter rooms by number, teacher or level…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'white'}} />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{liveCount} live</span>
              <span className="text-white/30">Monitoring {TOTAL_ROOMS} rooms · showing {visibleRooms.length}</span>
            </div>
          </div>

          {/* Room wall */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleRooms.map(r=>{
              const sc=ROOM_STATUS[r.status]
              return (
                <motion.button key={r.id} onClick={()=>setFocusedRoom(r)}
                  whileHover={{y:-3}} className="rounded-2xl overflow-hidden text-left"
                  style={{background:'rgba(8,14,32,0.9)',border:`1px solid ${sc.color}22`}}>
                  {/* feed */}
                  <div className="relative h-24" style={{background:'linear-gradient(135deg,#17125c,#241c80)'}}>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-50">{r.status==='idle'?'💤':'🎥'}</div>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black"
                      style={{background:'rgba(0,0,0,0.5)',color:sc.color}}>
                      {r.status!=='idle'&&<span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:sc.color}} />}{sc.label}
                    </div>
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      {r.hand&&<span className="text-[10px]" title="Raised hand">✋</span>}
                      {r.arabicAlert&&<span className="text-[9px] px-1 rounded bg-red-500/30 text-red-300 font-bold" title="Arabic detected">ع</span>}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5"><AudioBars color={sc.color} active={r.status==='live'} /></div>
                  </div>
                  {/* meta */}
                  <div className="p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-white">Room {r.num}</p>
                      <span className="text-[9px] text-white/35">👤 {r.students}</span>
                    </div>
                    <p className="text-[10px] text-white/45 truncate">{r.teacher}</p>
                    <p className="text-[9px] truncate" style={{color:sc.color}}>{r.level}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Recordings */}
          <div className="rounded-2xl p-4" style={{background:'rgba(8,14,32,0.9)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <p className="text-sm font-black text-white mb-3">🎞 Recorded Sessions <span className="text-white/30 font-normal text-xs">· {recordings.length}</span></p>
            <div className="space-y-2">
              {recordings.map(rec=>(
                <div key={rec.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition"
                  style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:'rgba(0, 174, 116,0.12)',border:'1px solid rgba(0, 174, 116,0.22)'}}>▶</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{rec.name}</p>
                    <p className="text-[9px] text-white/35">{rec.room} · {rec.date}</p>
                  </div>
                  <span className="text-[10px] text-white/45 flex-shrink-0">{rec.dur}</span>
                  <button className="text-white/25 hover:text-blue-400 transition text-sm flex-shrink-0" title="Download">⬇</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEXT WRITER */}
      {tab==='writer'&&(
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Editor */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{background:'rgba(8,14,32,0.9)',border:'1px solid rgba(37,99,235,0.18)'}}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(6,11,24,0.5)'}}>
              <input value={docTitle} onChange={e=>setDocTitle(e.target.value)}
                className="flex-1 bg-transparent text-sm font-bold text-white outline-none" placeholder="Document title…" />
              <span className="text-[10px] text-white/30">{wordCount} words</span>
            </div>
            {/* toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b flex-wrap" style={{borderColor:'rgba(255,255,255,0.05)'}}>
              {[
                {l:'B',fn:()=>wrapSel('**'),cls:'font-black'},
                {l:'I',fn:()=>wrapSel('*'),cls:'italic'},
                {l:'U',fn:()=>wrapSel('__'),cls:'underline'},
                {l:'H',fn:()=>prefixLine('# '),cls:'font-black'},
                {l:'•',fn:()=>prefixLine('- '),cls:''},
                {l:'1.',fn:()=>prefixLine('1. '),cls:''},
                {l:'❝',fn:()=>prefixLine('> '),cls:''},
              ].map(b=>(
                <button key={b.l} onClick={b.fn}
                  className={`w-8 h-8 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition ${b.cls}`}>{b.l}</button>
              ))}
              <div className="flex-1" />
              <button onClick={saveDoc}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition"
                style={{background:docSaved?'linear-gradient(135deg,#00ae74,#00684a)':'linear-gradient(135deg,#2563eb,#2620a8)',color:'#fff'}}>
                {docSaved?'✓ Saved':'💾 Save'}
              </button>
            </div>
            <textarea ref={taRef} value={docBody} onChange={e=>setDocBody(e.target.value)}
              placeholder="Write supervision notes, teacher feedback, memos or any document here…"
              className="w-full px-4 py-3 text-sm text-white/85 outline-none resize-none leading-relaxed"
              style={{background:'transparent',minHeight:380,fontFamily:'inherit'}} />
          </div>

          {/* Saved docs */}
          <div className="rounded-2xl p-4" style={{background:'rgba(8,14,32,0.9)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <p className="text-sm font-black text-white mb-3">📄 Saved Documents <span className="text-white/30 font-normal text-xs">· {docs.length}</span></p>
            <div className="space-y-2">
              {docs.map(d=>(
                <button key={d.id} onClick={()=>{setDocTitle(d.title);setDocBody(d.body)}}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/[0.03] transition"
                  style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white truncate">{d.title}</p>
                    <span className="text-[9px] text-white/30 flex-shrink-0">{d.words}w</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{d.preview}</p>
                  <p className="text-[9px] text-white/25 mt-1">{d.date}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW INTAKE */}
      {tab==='intake'&&(
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(63, 186, 235,0.15)'}}>
            <p className="text-sm font-black text-white mb-1">🎓 New Student Intake Flow</p>
            <p className="text-xs text-white/40 mb-5">Manage the full journey from first contact to enrollment</p>

            {/* Flow steps */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                {step:1,label:'Application\nReceived',labelAr:'استلام الطلب',icon:'📥',color:'#60a5fa'},
                {step:2,label:'Interview\nScheduled',labelAr:'جدولة المقابلة',icon:'📅',color:'#38bdf8'},
                {step:3,label:'Level\nAssessed',labelAr:'تحديد المستوى',icon:'🎯',color:'#00ae74'},
                {step:4,label:'Course\nAssigned',labelAr:'تعيين الدورة',icon:'📚',color:'#34d399'},
              ].map(s=>(
                <div key={s.step} className="p-4 rounded-2xl text-center"
                  style={{background:`${s.color}0a`,border:`1px solid ${s.color}20`}}>
                  <p className="text-2xl mb-2">{s.icon}</p>
                  <p className="text-xs font-black text-white whitespace-pre-line leading-snug">{s.label}</p>
                  <p className="text-[9px] text-white/30 mt-1" style={{fontFamily:'Tajawal,sans-serif'}}>{s.labelAr}</p>
                </div>
              ))}
            </div>

            {/* New applications */}
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">📥 Pending Applications</p>
            {students.filter(s=>s.status==='new'||s.status==='pending-payment').map(s=>{
              const sc=(STATUS_CFG as any)[s.status]
              return (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl mb-2 hover:bg-white/[0.03] transition"
                  style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{background:'rgba(63, 186, 235,0.15)',color:'#93c5fd'}}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{s.name}</p>
                    <p className="text-[10px] text-white/40">{s.phone} · {s.email}</p>
                    {s.interviewDate&&<p className="text-[9px] text-indigo-400 mt-0.5">🗓 Interview: {s.interviewDate}</p>}
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                    style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                  <div className="flex gap-2">
                    <button onClick={()=>{setSelectedStudent(s);setMeetingActive(true)}}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-semibold"
                      style={{background:'rgba(16,185,129,0.15)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)'}}>
                      🎥 Meet
                    </button>
                    <button onClick={()=>setStudents(p=>p.map(x=>x.id===s.id?{...x,status:'enrolled'}:x))}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-semibold"
                      style={{background:'rgba(56,189,248,0.15)',color:'#38bdf8',border:'1px solid rgba(56,189,248,0.25)'}}>
                      ✅ Enroll
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ALL STUDENTS */}
      {tab==='students'&&(
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'white'}} />
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)'}}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="hidden md:grid px-4 py-3 text-[9px] font-bold uppercase tracking-widest border-b"
              style={{gridTemplateColumns:'1fr 1fr 80px 100px 80px 110px 100px',borderColor:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.25)'}}>
              <div>Student</div><div>Course</div><div>Level</div><div>Teacher</div><div>Status</div><div>Payment</div><div>Actions</div>
            </div>
            {filtered.map(s=>{
              const sc=(STATUS_CFG as any)[s.status]
              const pc=s.paymentStatus?PAY_CFG[s.paymentStatus]:null
              return (
                <div key={s.id} className="grid md:grid-cols-1 px-4 py-3 border-b hover:bg-white/[0.025] transition"
                  style={{borderColor:'rgba(255,255,255,0.04)'}}>
                  <div className="hidden md:grid items-center gap-3"
                    style={{gridTemplateColumns:'1fr 1fr 80px 100px 80px 110px 100px'}}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{background:'rgba(63, 186, 235,0.15)',color:'#93c5fd'}}>{s.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                        <p className="text-[9px] text-white/30 truncate" style={{fontFamily:'Tajawal,sans-serif'}}>{s.nameAr}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/55 truncate">{s.course}</p>
                    <p className="text-[10px] text-white/40">{s.level}</p>
                    <p className="text-[10px] text-white/40 truncate">{s.teacher}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full w-fit" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                    {pc?<span className="text-[9px] font-bold px-2 py-0.5 rounded-full w-fit" style={{background:`${pc.color}12`,color:pc.color}}>{pc.label}</span>:<span className="text-[9px] text-white/20">—</span>}
                    <div className="flex gap-1">
                      <button onClick={()=>{setSelectedStudent(s);setMeetingActive(true)}}
                        className="p-1 rounded-lg text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/15 transition text-sm" title="Meet">🎥</button>
                      <button className="p-1 rounded-lg text-indigo-400/60 hover:text-indigo-400 hover:bg-indigo-500/15 transition text-sm" title="Edit">✏️</button>
                    </div>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                      style={{background:'rgba(63, 186, 235,0.15)',color:'#93c5fd'}}>{s.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <p className="text-xs text-white/40">{s.course} · {s.teacher}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {tab==='templates'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-white/70">📋 Template Library — {TEMPLATES.length} templates</p>
            <button className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff'}}>
              ➕ New Template
            </button>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {TEMPLATES.map((t,i)=>(
              <motion.div key={t.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                whileHover={{y:-2}} className="rounded-2xl p-4 cursor-default"
                style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="text-3xl mb-3">{t.emoji}</div>
                <p className="text-sm font-bold text-white leading-snug mb-0.5">{t.title}</p>
                <p className="text-[10px] text-white/35 mb-2" style={{fontFamily:'Tajawal,sans-serif'}}>{t.titleAr}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{background:'rgba(63, 186, 235,0.12)',color:'#93c5fd'}}>{t.category}</span>
                  <span className="text-[9px] text-white/25">{t.uses} uses</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold" style={{background:'rgba(63, 186, 235,0.10)',color:'#93c5fd',border:'1px solid rgba(63, 186, 235,0.18)'}}>Use</button>
                  <button className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold" style={{background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.40)',border:'1px solid rgba(255,255,255,0.07)'}}>Edit</button>
                  <button onClick={()=>setScreenViewer({name:'Selected student',ctx:t.title})}
                    className="py-1.5 px-2 rounded-lg text-[10px] font-semibold transition"
                    style={{background:'rgba(124,58,237,0.12)',color:'#c4b5fd',border:'1px solid rgba(124,58,237,0.25)'}}
                    title="View screen with student consent">🖥️</button>
                  <button className="py-1.5 px-2 rounded-lg text-[10px] text-white/25 hover:text-red-400 transition">🗑</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE */}
      {tab==='schedule'&&(
        <div className="rounded-2xl p-6 text-center" style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(255,255,255,0.06)'}}>
          <p className="text-5xl mb-4">📅</p>
          <p className="text-lg font-black text-white/60">Academic Calendar</p>
          <p className="text-sm text-white/30 mt-1">Full weekly/monthly class schedule with teacher assignments coming here.</p>
        </div>
      )}

      {/* ARCHIVE */}
      {tab==='archive'&&(
        <div className="rounded-2xl p-6 text-center" style={{background:'rgba(8,14,32,0.90)',border:'1px solid rgba(255,255,255,0.06)'}}>
          <p className="text-5xl mb-4">🗂</p>
          <p className="text-lg font-black text-white/60">Academic Archive</p>
          <p className="text-sm text-white/30 mt-1">Completed courses, graduated students, historical records and certificates.</p>
        </div>
      )}

      {/* REPORTS */}
      {tab==='reports'&&(
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {title:'Enrollment Report',titleAr:'تقرير التسجيل',emoji:'📊',color:'#3b82f6'},
            {title:'Payment Report',titleAr:'تقرير المدفوعات',emoji:'💰',color:'#00ae74'},
            {title:'Academic Progress',titleAr:'التقدم الأكاديمي',emoji:'📈',color:'#34d399'},
            {title:'Teacher Performance',titleAr:'أداء المدرسين',emoji:'⭐',color:'#7dd3fc'},
          ].map(r=>(
            <div key={r.title} className="rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition"
              style={{background:'rgba(8,14,32,0.90)',border:`1px solid ${r.color}18`}}>
              <p className="text-3xl mb-3">{r.emoji}</p>
              <p className="text-base font-black text-white">{r.title}</p>
              <p className="text-xs text-white/35 mt-0.5" style={{fontFamily:'Tajawal,sans-serif'}}>{r.titleAr}</p>
              <button className="mt-4 px-4 py-2 rounded-xl text-xs font-bold"
                style={{background:`${r.color}12`,color:r.color,border:`1px solid ${r.color}20`}}>
                Generate Report →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ghost-view focus modal — silently watch & listen to one room */}
      <AnimatePresence>
        {focusedRoom&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{background:'rgba(2,6,15,0.82)',backdropFilter:'blur(4px)'}}
            onClick={()=>setFocusedRoom(null)}>
            <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{background:'#1d1668',border:`1px solid ${(ghostMic||ghostCam)?'rgba(239,68,68,0.4)':'rgba(37,99,235,0.35)'}`,boxShadow:'0 24px 64px rgba(0,0,0,0.6)'}}>
              {/* header */}
              <div className="flex items-center gap-2 px-4 py-3" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{background:ROOM_STATUS[focusedRoom.status].color}} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">Room {focusedRoom.num} · {focusedRoom.level}</p>
                  <p className="text-[10px] text-white/40">{focusedRoom.teacher} · 👤 {focusedRoom.students} students</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 rounded-full"
                  style={{background:(ghostMic||ghostCam)?'rgba(239,68,68,0.15)':'rgba(52,211,153,0.12)',color:(ghostMic||ghostCam)?'#f87171':'#34d399'}}>
                  {(ghostMic||ghostCam)?'🔴 VISIBLE':'👻 GHOST'}
                </span>
                <button onClick={()=>setFocusedRoom(null)} className="text-white/40 hover:text-red-400 transition text-sm ml-1">✕</button>
              </div>
              {/* feed */}
              <div className="relative h-72" style={{background:'linear-gradient(135deg,#17125c,#241c80)'}}>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-5xl mb-2">{focusedRoom.status==='idle'?'💤':'🎥'}</p>
                  <p className="text-xs text-white/40">Watching &amp; listening · {focusedRoom.teacher}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400">
                    🎧 Audio in <AudioBars color="#34d399" active={focusedRoom.status==='live'} />
                  </div>
                </div>
                {focusedRoom.hand&&<div className="absolute top-3 right-3 text-lg" title="Raised hand">✋</div>}
                {ghostCam&&(
                  <div className="absolute bottom-3 right-3 w-20 h-14 rounded-lg flex items-center justify-center text-xl"
                    style={{background:'rgba(0,0,0,0.55)',border:'1px solid rgba(239,68,68,0.4)'}}>📷</div>
                )}
              </div>
              {/* controls */}
              <div className="flex items-center justify-between gap-3 px-4 py-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                <p className="text-[10px] flex-1 min-w-0" style={{color:(ghostMic||ghostCam)?'#f87171':'#34d399'}}>
                  {(ghostMic||ghostCam)?'⚠ The room can now sense you':'You are invisible & muted — turn on mic or camera to join in'}
                </p>
                <button onClick={()=>setGhostMic(v=>!v)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition"
                  style={{background:ghostMic?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)',color:ghostMic?'#f87171':'rgba(255,255,255,0.6)',border:`1px solid ${ghostMic?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.1)'}`}}>
                  {ghostMic?'🎙 Mic ON':'🔇 Unmute'}
                </button>
                <button onClick={()=>setGhostCam(v=>!v)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition"
                  style={{background:ghostCam?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)',color:ghostCam?'#f87171':'rgba(255,255,255,0.6)',border:`1px solid ${ghostCam?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.1)'}`}}>
                  {ghostCam?'📷 Cam ON':'🚫 Camera'}
                </button>
                <button onClick={toggleRecord}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition"
                  style={{background:recording?'rgba(239,68,68,0.2)':'rgba(0, 174, 116,0.15)',color:recording?'#f87171':'#00ae74',border:`1px solid ${recording?'rgba(239,68,68,0.45)':'rgba(0, 174, 116,0.35)'}`}}>
                  {recording?`⏹ ${fmtTime(recSecs)}`:'⏺ Rec'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating meeting room */}
      <AnimatePresence>
        {meetingActive&&(
          <motion.div initial={{opacity:0,scale:0.85,y:40}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.85,y:40}}
            className="fixed z-50 shadow-2xl rounded-2xl overflow-hidden"
            style={{
              bottom:meetingMinimized?'20px':'50%',right:'20px',
              width:meetingMinimized?'220px':'480px',
              height:meetingMinimized?'52px':'320px',
              transform:meetingMinimized?undefined:'translateY(50%)',
              background:'#1d1668',border:'1px solid rgba(52,211,153,0.35)',
              boxShadow:'0 24px 64px rgba(0,0,0,0.60)',
            }}>
            {/* Meeting header */}
            <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
              style={{background:'linear-gradient(135deg,rgba(5,150,105,0.25),rgba(16,185,129,0.15))',borderBottom:'1px solid rgba(52,211,153,0.15)'}}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-emerald-400 truncate">🎥 Academic Meeting Room</p>
                {selectedStudent&&<p className="text-[9px] text-white/40 truncate">{selectedStudent.name}</p>}
              </div>
              <button onClick={()=>setMeetingMinimized(m=>!m)} className="text-white/40 hover:text-white transition text-xs">{meetingMinimized?'⬆':'⬇'}</button>
              <button onClick={()=>{setMeetingActive(false);setSelectedStudent(null)}} className="text-white/40 hover:text-red-400 transition text-xs">✕</button>
            </div>

            {!meetingMinimized&&(
              <div className="flex flex-col h-full">
                {/* Video area */}
                <div className="flex-1 relative" style={{background:'linear-gradient(135deg,#17125c,#241c80)'}}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl mb-2">🎥</p>
                      <p className="text-xs text-white/40">Camera feed · Academic interview room</p>
                      {selectedStudent&&<p className="text-xs text-emerald-400 mt-1">{selectedStudent.name}</p>}
                    </div>
                  </div>
                  {/* Local camera PiP */}
                  <div className="absolute bottom-2 right-2 w-16 h-12 rounded-lg"
                    style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.10)'}}>
                    <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                  </div>
                </div>
                {/* Meeting controls */}
                <div className="flex items-center justify-center gap-3 px-4 py-3 flex-shrink-0" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                  {[{icon:'🎙',label:'Mute'},{icon:'📷',label:'Camera'},{icon:'💬',label:'Chat'},{icon:'📋',label:'Notes'},{icon:'📞',label:'End',red:true}].map(btn=>(
                    <button key={btn.label} title={btn.label}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition hover:scale-110"
                      style={{background:btn.red?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.06)',border:`1px solid ${btn.red?'rgba(239,68,68,0.40)':'rgba(255,255,255,0.10)'}`}}
                      onClick={()=>{if(btn.red){setMeetingActive(false);setSelectedStudent(null)}}}>
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consent-gated student screen viewer */}
      <AnimatePresence>
        {screenViewer&&<ScreenConsentViewer studentName={screenViewer.name} contextLabel={screenViewer.ctx} onClose={()=>setScreenViewer(null)} />}
      </AnimatePresence>
    </div>
  )
}
