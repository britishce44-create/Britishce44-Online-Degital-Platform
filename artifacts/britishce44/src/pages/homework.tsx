import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CARD = 'rgba(11,22,62,0.85)'
const BORDER = 'rgba(37,99,235,0.18)'
const GOLD = '#00ae74'
const ROYAL = '#2563eb'

interface Assignment {
  id: string; title: string; titleAr: string; subject: string; teacher: string; grade: string
  dueDate: string; submissions: number; total: number; status: 'active'|'overdue'|'closed'
}

interface Submission {
  id: string; student: string; assignment: string; subject: string; date: string
  status: 'graded'|'pending'|'late'; grade?: number; file: string
}

const ASSIGNMENTS: Assignment[] = [
  { id:'a1', title:'Unit 5 — Reading Comprehension Essay', titleAr:'وحدة 5 — مقال القراءة والفهم', subject:'English',     teacher:'T. Suhair',  grade:'G7', dueDate:'2026-06-12', submissions:18, total:22, status:'active'  },
  { id:'a2', title:'Algebra Worksheet — Chapter 3',        titleAr:'ورقة عمل الجبر — الفصل 3',      subject:'Mathematics', teacher:'T. Hassan',  grade:'G8', dueDate:'2026-06-10', submissions:20, total:20, status:'closed'  },
  { id:'a3', title:'Science Lab Report — Photosynthesis',  titleAr:'تقرير مختبر العلوم — التمثيل',  subject:'Science',     teacher:'T. Jamal',  grade:'G6', dueDate:'2026-06-08', submissions:12, total:19, status:'overdue' },
  { id:'a4', title:'Arabic Grammar — Connective Words',    titleAr:'نحو عربي — الكلمات الرابطة',    subject:'Arabic',      teacher:'T. Amani',  grade:'G5', dueDate:'2026-06-14', submissions: 8, total:17, status:'active'  },
  { id:'a5', title:'ICT Project — Database Design',        titleAr:'مشروع تقنية — تصميم قاعدة بيانات',subject:'ICT',     teacher:'T. Nadia',  grade:'G9', dueDate:'2026-06-15', submissions: 5, total:14, status:'active'  },
]

const SUBMISSIONS: Submission[] = [
  { id:'s1', student:'Ahmed Al-Farsi',    assignment:'Unit 5 Essay',          subject:'English',     date:'2026-06-09', status:'graded',  grade:88, file:'ahmed_essay.pdf' },
  { id:'s2', student:'Mona Hassan',       assignment:'Algebra Worksheet',      subject:'Mathematics', date:'2026-06-08', status:'graded',  grade:95, file:'mona_algebra.pdf' },
  { id:'s3', student:'Omar Saleh',        assignment:'Science Lab Report',     subject:'Science',     date:'2026-06-09', status:'late',    file:'omar_lab.docx' },
  { id:'s4', student:'Sara Almahdi',      assignment:'Arabic Grammar',         subject:'Arabic',      date:'2026-06-09', status:'pending', file:'sara_arabic.pdf' },
  { id:'s5', student:'Ibrahim Almojahid', assignment:'ICT Project',            subject:'ICT',         date:'2026-06-08', status:'pending', file:'ibrahim_db.zip' },
  { id:'s6', student:'Nour Alqaiti',      assignment:'Unit 5 Essay',           subject:'English',     date:'2026-06-07', status:'graded',  grade:91, file:'nour_essay.pdf' },
]

const STATUS_CFG = {
  active:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Active'  },
  overdue: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Overdue' },
  closed:  { color: '#4b5563', bg: 'rgba(75,85,99,0.12)',    label: 'Closed'  },
  graded:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Graded'  },
  pending: { color: GOLD,      bg: 'rgba(0, 174, 116,0.12)',  label: 'Pending' },
  late:    { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Late'    },
}

type ViewTab = 'assignments' | 'submissions' | 'upload'

export function HomeworkPage() {
  const [tab, setTab] = useState<ViewTab>('assignments')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [dragOver, setDragOver] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const subjects = ['All', ...Array.from(new Set(ASSIGNMENTS.map(a => a.subject)))]
  const filteredAssign = subjectFilter === 'All' ? ASSIGNMENTS : ASSIGNMENTS.filter(a => a.subject === subjectFilter)

  const totalSub = SUBMISSIONS.length
  const graded = SUBMISSIONS.filter(s => s.status === 'graded').length
  const pending = SUBMISSIONS.filter(s => s.status === 'pending').length

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files).map(f => f.name)
    setUploaded(p => [...p, ...files])
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📚 Homework Dropbox</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.55)' }}>
            Manage assignments, track submissions and grade student work
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Assignments',   value: ASSIGNMENTS.length, icon: '📋', color: ROYAL      },
          { label: 'Submissions',   value: totalSub,           icon: '📤', color: '#34d399'   },
          { label: 'Pending Grade', value: pending,            icon: '⏳', color: GOLD        },
          { label: 'Graded',        value: graded,             icon: '✅', color: '#7dd3fc'   },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg,transparent,${k.color},transparent)` }} />
            <span className="text-xl">{k.icon}</span>
            <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] font-semibold text-white mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(11,22,62,0.60)', border: `1px solid ${BORDER}` }}>
        {(['assignments', 'submissions', 'upload'] as ViewTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
            style={tab === t ? {
              background: 'linear-gradient(135deg,#2620a8,#2563eb)', color: '#fff',
              boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
            } : { color: 'rgba(147,197,253,0.55)' }}>
            {t === 'assignments' ? '📋 Assignments' : t === 'submissions' ? '📥 Submissions' : '📤 Upload'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {tab === 'assignments' && (
            <div className="space-y-3">
              {/* Subject filter */}
              <div className="flex gap-2 flex-wrap">
                {subjects.map(s => (
                  <button key={s} onClick={() => setSubjectFilter(s)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={subjectFilter === s ? {
                      background: 'linear-gradient(135deg,#2620a8,#2563eb)', color: '#fff',
                    } : {
                      background: CARD, color: 'rgba(147,197,253,0.6)', border: `1px solid ${BORDER}`,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
              {filteredAssign.map((a, i) => {
                const cfg = STATUS_CFG[a.status]
                const pct = Math.round((a.submissions / a.total) * 100)
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-bold text-white">{a.title}</p>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <p className="text-[9px]" style={{ color: 'rgba(147,197,253,0.4)', fontFamily: 'Tajawal, sans-serif' }}>{a.titleAr}</p>
                        <div className="flex gap-3 mt-1 text-[10px]" style={{ color: 'rgba(147,197,253,0.5)' }}>
                          <span>{a.subject}</span><span>·</span><span>{a.grade}</span>
                          <span>·</span><span>{a.teacher}</span>
                          <span>·</span><span>Due {a.dueDate}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black" style={{ color: '#34d399' }}>{a.submissions}<span className="text-xs font-normal text-gray-600">/{a.total}</span></p>
                        <p className="text-[9px] text-gray-600">submitted</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#34d399' : pct >= 50 ? GOLD : '#f87171' }} />
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: pct >= 80 ? '#34d399' : GOLD }}>{pct}%</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {tab === 'submissions' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <p className="text-sm font-bold text-white">Recent Submissions</p>
                <span className="text-xs" style={{ color: 'rgba(147,197,253,0.45)' }}>{SUBMISSIONS.length} total</span>
              </div>
              <div className="divide-y" style={{ borderColor: BORDER }}>
                {SUBMISSIONS.map((s, i) => {
                  const cfg = STATUS_CFG[s.status]
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="px-5 py-3.5 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                        style={{ background: 'rgba(37,99,235,0.12)', color: ROYAL }}>
                        {s.file.endsWith('.pdf') ? '📄' : s.file.endsWith('.zip') ? '📦' : '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{s.student}</p>
                        <p className="text-[9px]" style={{ color: 'rgba(147,197,253,0.45)' }}>{s.assignment} · {s.subject} · {s.date}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {s.grade !== undefined && (
                          <span className="text-sm font-black" style={{ color: s.grade >= 85 ? '#34d399' : GOLD }}>{s.grade}%</span>
                        )}
                        <span className="text-[9px] px-2 py-1 rounded-full font-bold"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {s.status === 'pending' && (
                          <button className="text-[9px] px-2 py-1 rounded-full font-bold transition"
                            style={{ background: 'rgba(37,99,235,0.18)', color: ROYAL, border: `1px solid ${ROYAL}30` }}>
                            Grade →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="rounded-2xl p-12 text-center cursor-pointer transition-all"
                style={{
                  background: dragOver ? 'rgba(37,99,235,0.12)' : CARD,
                  border: `2px dashed ${dragOver ? ROYAL : BORDER}`,
                  boxShadow: dragOver ? `0 0 24px rgba(37,99,235,0.18)` : undefined,
                }}>
                <input ref={fileRef} type="file" multiple className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []).map(f => f.name)
                    setUploaded(p => [...p, ...files])
                  }} />
                <div className="text-5xl mb-4">📤</div>
                <p className="text-base font-bold text-white">Drag & drop files here</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(147,197,253,0.45)' }}>
                  or click to browse
                </p>
                <p className="text-xs mt-2" style={{ color: 'rgba(147,197,253,0.30)' }}>PDF, DOC, DOCX, ZIP, images — max 50 MB each</p>
                <div className="mt-5 px-5 py-2 rounded-full text-xs font-bold inline-block"
                  style={{ background: 'linear-gradient(135deg,#2620a8,#2563eb)', color: '#fff' }}>
                  Browse Files
                </div>
              </div>

              {uploaded.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <p className="text-xs font-bold text-white">✅ Uploaded Files ({uploaded.length})</p>
                  </div>
                  <div className="divide-y" style={{ borderColor: BORDER }}>
                    {uploaded.map((f, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-base">📄</span>
                          <p className="text-xs text-white">{f}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>Uploaded</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
