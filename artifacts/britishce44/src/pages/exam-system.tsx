
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScreenConsentViewer } from '@/components/exams/screen-consent-viewer'

/* ─── Types ─────────────────────────────────────────── */
export type ExamStatus = 'draft' | 'approved' | 'scheduled' | 'live' | 'closed'
export interface Exam {
  id:string; title:string; model:string; type:string; points:number; duration:number
  level:string; status:ExamStatus; questions:number; createdBy?:string
  scheduledDate?:string; scheduledTime?:string; classrooms?:string[]; students?:string[]
  aiMonitor?:boolean; reminders?:boolean
}
export interface Question { id:string; text:string; type:'mcq'|'truefalse'|'short'|'essay'|'matching'; options?:string[]; answer?:string; points:number }

export const STATUS_CFG: Record<ExamStatus,{label:string;color:string;bg:string}> = {
  draft:     {label:'Draft',     color:'#64748b',bg:'rgba(100,116,139,0.12)'},
  approved:  {label:'Approved',  color:'#34d399',bg:'rgba(52,211,153,0.12)'},
  scheduled: {label:'Scheduled', color:'#60a5fa',bg:'rgba(129,140,248,0.12)'},
  live:      {label:'🔴 Live',    color:'#f87171',bg:'rgba(248,113,113,0.15)'},
  closed:    {label:'Closed',    color:'#6b7280',bg:'rgba(107,114,128,0.12)'},
}

const SEED_EXAMS: Exam[] = [
  ...['A','B','C','D','E','F','G','H','I','J'].flatMap((m,mi)=>
    ['Quiz 1 — Reading+Listening','Quiz 2 — Grammar+Speaking','Speaking+Description','Final — All Sections','Midterm — Written'].map((type,ti)=>({
      id:`${m}${ti+1}`, title:`Exam ${m}${ti+1}`, model:m, type, points:[20,30,20,30,25][ti],
      duration:30, level:['Phonics','Gogo 1-3','Gogo 4-6','Speakout Elem','Speakout Pre-Int','Speakout Int','Speakout Upper','Speakout Adv'][Math.floor(Math.random()*8)],
      status:(['draft','approved','scheduled','live','closed'] as ExamStatus[])[Math.floor(Math.random()*5)],
      questions:ti===3?50:ti===4?40:20, createdBy:'Admin',
      aiMonitor:true, reminders:true,
    }))
  )
]

/* ─── Bakery question types ─────────────────────────── */
export const Q_TYPES = [
  {id:'mcq',        icon:'⭕',label:'Multiple Choice',    labelAr:'اختيار من متعدد'},
  {id:'truefalse',  icon:'✅',label:'True / False',       labelAr:'صح أو خطأ'},
  {id:'short',      icon:'✏️',label:'Short Answer',       labelAr:'إجابة قصيرة'},
  {id:'essay',      icon:'📄',label:'Long Essay',          labelAr:'مقالة'},
  {id:'matching',   icon:'🔗',label:'Matching',            labelAr:'مطابقة'},
  {id:'fillblank',  icon:'⬜',label:'Fill in the Blank',  labelAr:'أكمل الفراغ'},
  {id:'ordering',   icon:'🔢',label:'Ordering / Ranking', labelAr:'ترتيب'},
  {id:'rating',     icon:'⭐',label:'Rating Scale',       labelAr:'مقياس التقييم'},
]

/* ─── Settings Modal ───────────────────────────────── */
export function ExamSettingsModal({exam,onSave,onClose}:{exam:Exam;onSave:(e:Exam)=>void;onClose:()=>void}) {
  const [f,setF]=useState({...exam})
  const inp="w-full rounded-lg px-3 py-2 text-sm text-[#150d79] outline-none bg-[#f1f5f9] border border-slate-200 focus:border-[#3FBAEB] placeholder-slate-400 transition"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,12,60,0.45)',backdropFilter:'blur(8px)'}}>
      <motion.div initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.94}}
        className="w-full max-w-2xl rounded-2xl overflow-auto shadow-2xl" style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',maxHeight:'92vh'}}>
        <div className="h-0.5 bg-gradient-to-r from-amber-400 via-indigo-500 to-violet-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black text-[#150d79]">⚙️ Exam Settings</h3>
              <p className="text-xs text-slate-500">{exam.title} — Configure schedule, users & AI monitor</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Exam Title</label>
              <input className={inp} value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Status</label>
              <select className={`${inp} bg-white`} value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value as ExamStatus}))}>
                {(Object.keys(STATUS_CFG) as ExamStatus[]).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" className={inp} value={f.scheduledDate??''} onChange={e=>setF(p=>({...p,scheduledDate:e.target.value}))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Start Time</label>
              <input type="time" className={inp} value={f.scheduledTime??''} onChange={e=>setF(p=>({...p,scheduledTime:e.target.value}))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Duration (minutes)</label>
              <input type="number" className={inp} value={f.duration} onChange={e=>setF(p=>({...p,duration:Number(e.target.value)}))} min={5} max={180} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Level</label>
              <input className={inp} value={f.level} onChange={e=>setF(p=>({...p,level:e.target.value}))} placeholder="e.g. Speakout Int" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#150d79]/70 uppercase tracking-widest mb-1.5">Classrooms (comma-separated IDs)</label>
              <input className={inp} value={f.classrooms?.join(', ')??''} onChange={e=>setF(p=>({...p,classrooms:e.target.value.split(',').map(s=>s.trim())}))} placeholder="e.g. A1, B2, C3" />
            </div>
          </div>

          {/* Reminders + AI Monitor */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 rounded-xl" style={{background:'#f8fafc',border:'1px solid rgba(21,13,121,0.08)'}}>
              <p className="text-xs font-black text-slate-700 mb-3">🔔 Automated Reminders</p>
              <p className="text-[9px] text-slate-500 mb-3">Sent 24h before the exam to all assigned users via:</p>
              {[['📱','WhatsApp Message','whatsapp'],['✉️','Gmail Email','gmail'],['🤖','AI Voice Call (CE4)','ai-call']].map(([icon,label,key])=>(
                <div key={key} className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{background:f.reminders?'#3b82f6':'#f1f5f9',border:`1px solid ${f.reminders?'#3b82f6':'rgba(21,13,121,0.12)'}`}}>
                    {f.reminders&&<span className="text-[7px] text-white">✓</span>}
                  </div>
                  <span className="text-sm">{icon}</span>
                  <span className="text-[10px] text-slate-600">{label}</span>
                </div>
              ))}
              <button onClick={()=>setF(p=>({...p,reminders:!p.reminders}))}
                className="mt-2 text-[10px] font-semibold px-3 py-1.5 rounded-full w-full transition"
                style={{background:f.reminders?'rgba(0,174,116,0.12)':'#f1f5f9',color:f.reminders?'#00ae74':'#64748b'}}>
                {f.reminders?'✅ Reminders ON':'Enable Reminders'}
              </button>
            </div>
            <div className="p-4 rounded-xl" style={{background:'#f8fafc',border:'1px solid rgba(21,13,121,0.08)'}}>
              <p className="text-xs font-black text-slate-700 mb-3">🛡 AI Anti-Cheat Monitor</p>
              <div className="space-y-2 text-[9px] text-slate-500 mb-3">
                <p>📹 Camera + 🎙 Microphone activated</p>
                <p>🔊 Voice warning in Arabic &amp; English</p>
                <p>🚨 3 warnings → expelled to Academic Room</p>
                <p>🔴 Noisy environment → screen turns red 5s</p>
                <p>🔇 All noise isolated except user &amp; teacher</p>
              </div>
              <button onClick={()=>setF(p=>({...p,aiMonitor:!p.aiMonitor}))}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-full w-full transition"
                style={{background:f.aiMonitor?'rgba(225,29,72,0.12)':'#f1f5f9',color:f.aiMonitor?'#e11d48':'#64748b'}}>
                {f.aiMonitor?'🛡 AI Monitor ON':'Enable AI Monitor'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 hover:border-slate-300 transition">Cancel</button>
            <button onClick={()=>onSave(f)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#17125c',boxShadow:'0 4px 20px rgba(245,158,11,0.25)'}}>
              💾 Save Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── PDF Import Modal ──────────────────────────────── */
export function PdfImportModal({onClose}:{onClose:()=>void}) {
  const [step,setStep]=useState<'upload'|'preview'|'done'>('upload')
  const [file,setFile]=useState<string|null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(15,12,60,0.45)',backdropFilter:'blur(8px)'}}>
      <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)'}}>
        <div className="h-0.5 bg-gradient-to-r from-violet-500 to-amber-400" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-[#150d79]">📄 AI PDF → Forms Converter</h3>
              <p className="text-[10px] text-slate-500">Upload a test PDF · AI extracts all questions automatically</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
          </div>

          {step==='upload'&&(
            <div>
              <div className="border-2 border-dashed rounded-2xl p-10 text-center mb-4 transition hover:border-indigo-500/60 cursor-pointer"
                style={{borderColor:'rgba(63, 186, 235,0.25)',background:'rgba(63, 186, 235,0.03)'}}
                onClick={()=>{setFile('sample_exam.pdf');setStep('preview')}}>
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm font-bold text-slate-700">Drop PDF exam file here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse — AI will extract all questions</p>
              </div>
              <div className="flex gap-2">
                {['Template A (Quiz 1)','Template B (Speaking)','Oxford Phonics Test'].map(t=>(
                  <button key={t} onClick={()=>{setFile(t);setStep('preview')}}
                    className="flex-1 py-2 rounded-xl text-[10px] font-semibold transition"
                    style={{background:'rgba(63, 186, 235,0.10)',color:'#0369a1',border:'1px solid rgba(63, 186, 235,0.20)'}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step==='preview'&&(
            <div>
              <div className="p-3 rounded-xl mb-4" style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.20)'}}>
                <p className="text-xs font-bold text-emerald-600">✅ AI Analysis Complete — {file}</p>
                <p className="text-[10px] text-slate-500 mt-1">Found 25 questions · 20 MCQ · 3 True/False · 2 Essay</p>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
                {Array.from({length:5}).map((_,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background:'#f8fafc',border:'1px solid rgba(21,13,121,0.08)'}}>
                    <span className="text-[10px] font-black text-slate-400 flex-shrink-0 mt-0.5">Q{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-700 leading-snug">Sample extracted question {i+1} from the PDF document…</p>
                      <p className="text-[9px] text-indigo-500 mt-1">MCQ · 2 pts</p>
                    </div>
                    <button className="text-[9px] text-slate-400 hover:text-slate-700 transition flex-shrink-0">✏️</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep('upload')} className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 transition">← Back</button>
                <button onClick={()=>setStep('done')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff'}}>
                  Import to Tests Archive →
                </button>
              </div>
            </div>
          )}

          {step==='done'&&(
            <div className="text-center py-6">
              <p className="text-5xl mb-4">✅</p>
              <p className="text-lg font-black text-[#150d79]">Import Successful!</p>
              <p className="text-sm text-slate-500 mt-1">25 questions imported to the Tests Archive</p>
              <button onClick={onClose}
                className="mt-5 px-6 py-2.5 rounded-xl text-sm font-bold"
                style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff'}}>
                View in Archive
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Tests Bakery (Form Builder) ──────────────────── */
function TestsBakery() {
  const [questions,setQuestions]=useState<Question[]>([])
  const [testTitle,setTestTitle]=useState('')
  const [showPdfImport,setShowPdfImport]=useState(false)

  const addQ=(type:Question['type'])=>{
    const nq:Question={id:`q${Date.now()}`,text:'',type,options:type==='mcq'?['Option A','Option B','Option C','Option D']:undefined,points:2}
    setQuestions(p=>[...p,nq])
  }
  const updateQ=(id:string,data:Partial<Question>)=>setQuestions(p=>p.map(q=>q.id===id?{...q,...data}:q))
  const delQ=(id:string)=>setQuestions(p=>p.filter(q=>q.id!==id))
  const inp="w-full rounded-lg px-3 py-2 text-sm text-[#150d79] outline-none bg-[#f1f5f9] border border-slate-200 focus:border-[#3FBAEB] placeholder-slate-400 transition"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-4" style={{background:'linear-gradient(135deg,#00805a,#0a85c2)',border:'1px solid rgba(21,13,121,0.08)'}}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-white">🧁 Tests Bakery</h3>
            <p className="text-[10px] text-white/80">Advanced form builder · Like Google Forms + Microsoft Forms + KoboToolbox</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowPdfImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
              style={{background:'rgba(139,92,246,0.15)',color:'#bae6fd',border:'1px solid rgba(139,92,246,0.25)'}}>
              📄 Import PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
              style={{background:'rgba(52,211,153,0.15)',color:'#34d399',border:'1px solid rgba(52,211,153,0.25)'}}>
              💾 Save Test
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition"
              style={{background:'rgba(0, 174, 116,0.15)',color:'#00ae74',border:'1px solid rgba(0, 174, 116,0.25)'}}>
              👁 Preview
            </button>
          </div>
        </div>
        <input value={testTitle} onChange={e=>setTestTitle(e.target.value)} placeholder="Test title… / عنوان الاختبار"
          className="w-full rounded-xl px-4 py-3 text-base font-bold text-white outline-none"
          style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(139,92,246,0.25)'}} />
      </div>

      {/* Question type palette */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {Q_TYPES.map(qt=>(
          <button key={qt.id} onClick={()=>addQ(qt.id as Question['type'])}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition hover:-translate-y-0.5"
            style={{background:'#ffffff',border:'1px solid #e2e8f0'}}>
            <span className="text-2xl">{qt.icon}</span>
            <p className="text-[9px] font-bold text-slate-700 text-center leading-tight">{qt.label}</p>
            <p className="text-[7px] text-slate-400 text-center" style={{fontFamily:'Tajawal,sans-serif'}}>{qt.labelAr}</p>
          </button>
        ))}
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {questions.length===0&&(
          <div className="py-12 text-center rounded-2xl" style={{border:'2px dashed rgba(21,13,121,0.15)'}}>
            <p className="text-3xl mb-2">➕</p>
            <p className="text-sm text-slate-500">Click a question type above to add your first question</p>
          </div>
        )}
        {questions.map((q,i)=>(
          <motion.div key={q.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
            className="rounded-2xl p-4" style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{background:'rgba(63, 186, 235,0.20)',color:'#0369a1'}}>
                  {i+1}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.15)',color:'#6d28d9'}}>
                  {Q_TYPES.find(t=>t.id===q.type)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={q.points} onChange={e=>updateQ(q.id,{points:Number(e.target.value)})} min={1}
                  className="w-12 rounded-lg px-2 py-1 text-xs text-center outline-none"
                  style={{background:'rgba(0, 174, 116,0.10)',border:'1px solid rgba(0, 174, 116,0.20)',color:'#00ae74'}} />
                <span className="text-[9px] text-slate-400">pts</span>
                <button onClick={()=>delQ(q.id)} className="p-1 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/15 transition">🗑</button>
              </div>
            </div>
            <textarea value={q.text} onChange={e=>updateQ(q.id,{text:e.target.value})}
              rows={2} placeholder="Enter question text… / اكتب السؤال هنا"
              className="w-full rounded-xl px-3 py-2 text-sm text-[#150d79] placeholder-slate-400 outline-none resize-none mb-3"
              style={{background:'#f1f5f9',border:'1px solid #e2e8f0'}} />
            {q.type==='mcq'&&(
              <div className="grid grid-cols-2 gap-2">
                {(q.options||[]).map((opt,oi)=>(
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 flex-shrink-0">{String.fromCharCode(65+oi)}</span>
                    <input value={opt} onChange={e=>updateQ(q.id,{options:q.options?.map((o,i)=>i===oi?e.target.value:o)})}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs text-[#150d79] placeholder-slate-400 outline-none"
                      style={{background:'#f1f5f9',border:'1px solid #e2e8f0'}}
                      placeholder={`Option ${String.fromCharCode(65+oi)}`} />
                  </div>
                ))}
              </div>
            )}
            {q.type==='truefalse'&&(
              <div className="flex gap-3">
                {['True ✅','False ❌'].map(o=>(
                  <button key={o} onClick={()=>updateQ(q.id,{answer:o})}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition"
                    style={{background:q.answer===o?'rgba(63, 186, 235,0.20)':'#f1f5f9',border:`1px solid ${q.answer===o?'rgba(63, 186, 235,0.40)':'#e2e8f0'}`,color:q.answer===o?'#0369a1':'#475569'}}>
                    {o}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showPdfImport&&<PdfImportModal onClose={()=>setShowPdfImport(false)} />}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────── */
export function ExamSystemPage() {
  const [exams,setExams]=useState<Exam[]>(SEED_EXAMS)
  const [tab,setTab]=useState<'bank'|'bakery'|'schedule'|'results'>('bank')
  const [modelFilter,setModelFilter]=useState<string>('all')
  const [statusFilter,setStatusFilter]=useState<string>('all')
  const [search,setSearch]=useState('')
  const [settingsExam,setSettingsExam]=useState<Exam|null>(null)
  const [showPdfImport,setShowPdfImport]=useState(false)
  const [viewer,setViewer]=useState<{name:string;ctx:string}|null>(null)

  const models=['A','B','C','D','E','F','G','H','I','J']
  const filtered=exams.filter(e=>{
    const ms=e.title.toLowerCase().includes(search.toLowerCase())||e.type.toLowerCase().includes(search.toLowerCase())
    const mm=modelFilter==='all'||e.model===modelFilter
    const sm=statusFilter==='all'||e.status===statusFilter
    return ms&&mm&&sm
  })

  const saveExam=(e:Exam)=>{
    setExams(p=>p.map(x=>x.id===e.id?e:x))
    setSettingsExam(null)
  }
  const deleteExam=(id:string)=>setExams(p=>p.filter(e=>e.id!==id))
  const approveExam=(id:string)=>setExams(p=>p.map(e=>e.id===id?{...e,status:'approved' as ExamStatus}:e))

  const statusCounts=Object.keys(STATUS_CFG).reduce((a,s)=>({...a,[s]:exams.filter(e=>e.status===s).length}),{} as Record<string,number>)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{background:'linear-gradient(135deg,#150d79 0%,#2620a8 55%,#3FBAEB 100%)',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 10px 30px rgba(21,13,121,0.12)'}}>
        <div className="absolute inset-0 opacity-[0.12]"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',backgroundSize:'32px 32px'}} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-white">📝 Exam System</h2>
            <p className="text-xs text-white/80 mt-0.5">{exams.length} exams · 10 models · AI anti-cheat · Auto-schedule</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>setShowPdfImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{background:'rgba(139,92,246,0.15)',color:'#bae6fd',border:'1px solid rgba(139,92,246,0.25)'}}>
              📄 Import PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{background:'rgba(0, 174, 116,0.15)',color:'#00ae74',border:'1px solid rgba(0, 174, 116,0.25)'}}>
              ➕ New Exam
            </button>
          </div>
        </div>
        {/* Status pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(Object.keys(STATUS_CFG) as ExamStatus[]).map(s=>(
            <button key={s} onClick={()=>setStatusFilter(v=>v===s?'all':s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition"
              style={{background:statusFilter===s?STATUS_CFG[s].bg:'rgba(255,255,255,0.92)',color:STATUS_CFG[s].color,border:`1px solid ${STATUS_CFG[s].color}${statusFilter===s?'35':'18'}`}}>
              {STATUS_CFG[s].label} <span className="opacity-60">{statusCounts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['bank','📚 Exam Bank'],['bakery','🧁 Tests Bakery'],['schedule','📅 Schedule'],['results','📊 Results']] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition"
            style={{background:tab===t?'linear-gradient(135deg,#f59e0b,#d97706)':'#ffffff',color:tab===t?'#17125c':'#475569',boxShadow:tab===t?'0 4px 16px rgba(245,158,11,0.25)':undefined,border:tab!==t?'1px solid #e2e8f0':undefined}}>
            {label}
          </button>
        ))}
      </div>

      {/* EXAM BANK */}
      {tab==='bank'&&(
        <div className="space-y-4">
          {/* Search + model filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exams…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none placeholder-slate-400"
                style={{background:'#f1f5f9',border:'1px solid #e2e8f0',color:'#150d79'}} />
            </div>
            <select value={modelFilter} onChange={e=>setModelFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{background:'#ffffff',border:'1px solid #e2e8f0',color:'#334155'}}>
              <option value="all">All Models</option>
              {models.map(m=><option key={m} value={m}>Model {m}</option>)}
            </select>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.slice(0,30).map(e=>{
              const sc=STATUS_CFG[e.status]
              return (
                <motion.div key={e.id} whileHover={{y:-2}}
                  className="rounded-2xl overflow-hidden cursor-default"
                  style={{background:'#ffffff',border:`1px solid ${sc.color}25`,boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
                  <div className="h-0.5" style={{background:`linear-gradient(to right,${sc.color}60,transparent)`}} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-black text-[#150d79] leading-tight">{e.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{e.type}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                    </div>
                    <div className="flex gap-3 text-[9px] text-slate-500 mb-3">
                      <span>🏷 Model {e.model}</span>
                      <span>⏱ {e.duration}min</span>
                      <span>❓ {e.questions}q</span>
                      <span>⭐ {e.points}pts</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={()=>setSettingsExam(e)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition"
                        style={{background:'rgba(63, 186, 235,0.12)',color:'#0369a1',border:'1px solid rgba(63, 186, 235,0.20)'}}>
                        ⚙️ Settings
                      </button>
                      <button onClick={()=>setViewer({name:'Selected student',ctx:e.title})}
                        className="py-1.5 px-2 rounded-lg text-[10px] font-semibold transition"
                        style={{background:'rgba(124,58,237,0.10)',color:'#6d28d9',border:'1px solid rgba(124,58,237,0.20)'}}
                        title="View screen with student consent">
                        🖥️
                      </button>
                      {e.status==='draft'&&(
                        <button onClick={()=>approveExam(e.id)}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition"
                          style={{background:'rgba(0,174,116,0.12)',color:'#00ae74',border:'1px solid rgba(0,174,116,0.20)'}}>
                          ✅ Approve
                        </button>
                      )}
                      <button onClick={()=>deleteExam(e.id)}
                        className="py-1.5 px-2 rounded-lg text-[10px] transition hover:bg-red-500/15 text-red-400/50 hover:text-red-400">
                        🗑
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 text-center">Showing {Math.min(30,filtered.length)} of {filtered.length} exams</p>
        </div>
      )}

      {/* TESTS BAKERY */}
      {tab==='bakery'&&<TestsBakery />}

      {/* SCHEDULE */}
      {tab==='schedule'&&(
        <div className="space-y-3">
          <div className="rounded-2xl p-4 mb-4"
            style={{background:'rgba(63, 186, 235,0.08)',border:'1px solid rgba(63, 186, 235,0.20)'}}>
            <p className="text-xs font-bold text-[#150d79] mb-1">📅 Upcoming Scheduled Exams</p>
            <p className="text-[10px] text-slate-500">Exams auto-open at their scheduled time for assigned users. AI Monitor activates automatically.</p>
          </div>
          {exams.filter(e=>e.status==='scheduled'||e.status==='live').map(e=>{
            const sc=STATUS_CFG[e.status]
            return (
              <div key={e.id} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{background:'#ffffff',border:`1px solid ${sc.color}25`,boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
                  style={{background:`${sc.color}12`,border:`1px solid ${sc.color}25`}}>
                  <p className="text-[8px] font-bold" style={{color:sc.color}}>Exam</p>
                  <p className="text-lg font-black text-[#150d79] leading-none">{e.model}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#150d79]">{e.title}</p>
                  <p className="text-[10px] text-slate-500">{e.scheduledDate??'TBD'} at {e.scheduledTime??'TBD'} · {e.duration}min · {e.level}</p>
                  <div className="flex gap-2 mt-1">
                    {e.aiMonitor&&<span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{background:'rgba(248,113,113,0.12)',color:'#f87171'}}>🛡 AI Monitor</span>}
                    {e.reminders&&<span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{background:'rgba(52,211,153,0.12)',color:'#34d399'}}>🔔 Reminders</span>}
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                <button onClick={()=>setSettingsExam(e)} className="p-2 rounded-xl hover:bg-indigo-500/15 text-indigo-400 transition">⚙️</button>
              </div>
            )
          })}
        </div>
      )}

      {/* RESULTS */}
      {tab==='results'&&(
        <div className="rounded-2xl p-8 text-center" style={{background:'#ffffff',border:'1px solid rgba(21,13,121,0.08)',boxShadow:'0 1px 3px rgba(21,13,121,0.06)'}}>
          <p className="text-4xl mb-3">📊</p>
          <p className="text-lg font-black text-[#150d79]">Results Dashboard</p>
          <p className="text-sm text-slate-500 mt-1">Grade distributions, AI cheating reports, student performance analytics coming here.</p>
        </div>
      )}

      <AnimatePresence>
        {settingsExam&&<ExamSettingsModal exam={settingsExam} onSave={saveExam} onClose={()=>setSettingsExam(null)} />}
        {showPdfImport&&<PdfImportModal onClose={()=>setShowPdfImport(false)} />}
        {viewer&&<ScreenConsentViewer studentName={viewer.name} contextLabel={viewer.ctx} onClose={()=>setViewer(null)} />}
      </AnimatePresence>
    </div>
  )
}
