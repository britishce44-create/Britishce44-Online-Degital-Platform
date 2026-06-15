import { useState } from 'react'
import { motion } from 'framer-motion'

type ReportView = 'parent' | 'teacher' | 'management'

const STUDENTS = [
  { name: 'Ahmed Nasser', grade: 'G5', attendance: 94, avgGrade: 87, assignments: { done: 12, total: 15 }, rank: 3 },
  { name: 'Mona Alqaiti', grade: 'G7', attendance: 98, avgGrade: 92, assignments: { done: 15, total: 15 }, rank: 1 },
  { name: 'Sara Almahdi', grade: 'G9', attendance: 89, avgGrade: 78, assignments: { done: 11, total: 15 }, rank: 5 },
  { name: 'Ibrahim Almojahid', grade: 'G4', attendance: 91, avgGrade: 83, assignments: { done: 13, total: 15 }, rank: 4 },
]

const TEACHERS = [
  { name: 'Suhair Almojahid', subject: 'Mathematics', classAvg: 85, evalScore: 91, lessons: { done: 48, total: 50 }, rating: 4.8 },
  { name: "Wa'ad Alhammadi", subject: 'English', classAvg: 82, evalScore: 88, lessons: { done: 46, total: 50 }, rating: 4.6 },
  { name: 'Jamal Alshameeri', subject: 'Science', classAvg: 79, evalScore: 84, lessons: { done: 44, total: 50 }, rating: 4.4 },
  { name: 'Hassan Almakhlafi', subject: 'History', classAvg: 86, evalScore: 90, lessons: { done: 49, total: 50 }, rating: 4.7 },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const ACTIVITY = [72, 85, 69, 91, 88, 94]

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold text-white w-8 text-right">{value}{max === 100 ? '%' : ''}</span>
    </div>
  )
}

function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values)
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-t transition-all"
            style={{ height: `${(v / max) * 100}%`, background: 'linear-gradient(to top,#2620a8,#2563eb)' }} />
          <span className="text-[7px] text-gray-600">{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  )
}

function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

const VIEW_CONFIG: Record<ReportView, { label: string; emoji: string; accent: string }> = {
  parent:     { label: 'Parent Report',     emoji: '👨‍👩‍👧', accent: '#34d399' },
  teacher:    { label: 'Teacher Report',    emoji: '🧑‍🏫',   accent: '#3b82f6' },
  management: { label: 'Management Report', emoji: '🏢',     accent: '#00ae74' },
}

export function ReportsPage() {
  const [view, setView] = useState<ReportView>('management')
  const [selectedStudent, setSelectedStudent] = useState(STUDENTS[0])
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📊 Triple Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Parent · Teacher · Management — all in one place</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition"
          style={{ background: 'rgba(0, 174, 116,0.1)', color: '#00ae74', border: '1px solid rgba(0, 174, 116,0.2)' }}>
          📥 Export All PDFs
        </button>
      </div>

      {/* View selector */}
      <div className="flex gap-2">
        {(Object.entries(VIEW_CONFIG) as [ReportView, typeof VIEW_CONFIG['parent']][]).map(([key, cfg]) => (
          <button key={key} onClick={() => setView(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
            style={view === key ? {
              background: `${cfg.accent}15`, color: cfg.accent,
              border: `1px solid ${cfg.accent}35`, boxShadow: `0 2px 12px ${cfg.accent}15`,
            } : {
              background: 'rgba(26, 19, 92,0.6)', color: 'rgba(156,163,175,0.7)',
              border: '1px solid rgba(37,99,235,0.12)',
            }}>
            <span>{cfg.emoji}</span>{cfg.label}
          </button>
        ))}
      </div>

      {/* ── PARENT REPORT ── */}
      {view === 'parent' && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Student selector */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <div className="px-4 py-3 text-xs font-bold text-emerald-400 border-b" style={{ borderColor: 'rgba(52,211,153,0.1)' }}>
              Select Student
            </div>
            {STUDENTS.map(s => (
              <button key={s.name} onClick={() => setSelectedStudent(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b"
                style={{
                  borderColor: 'rgba(52,211,153,0.06)',
                  background: selectedStudent.name === s.name ? 'rgba(52,211,153,0.06)' : 'transparent',
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#00ae74,#34d399)', color: '#fff' }}>
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{s.name}</p>
                  <p className="text-[9px] text-gray-500">{s.grade} · Rank #{s.rank}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Report detail */}
          <div className="md:col-span-2 space-y-3">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">{selectedStudent.name}</h3>
                  <p className="text-[10px] text-gray-500">{selectedStudent.grade} · Academic Year 2025–2026</p>
                </div>
                <button className="text-[10px] text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition">
                  📥 PDF Report
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <StatBadge value={`${selectedStudent.attendance}%`} label="Attendance" color="#34d399" />
                <StatBadge value={`${selectedStudent.avgGrade}%`} label="Avg Grade" color="#3b82f6" />
                <StatBadge value={`${selectedStudent.assignments.done}/${selectedStudent.assignments.total}`} label="Assignments" color="#00ae74" />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Mathematics', score: 92, color: '#2563eb' },
                  { label: 'English', score: selectedStudent.avgGrade + 3, color: '#34d399' },
                  { label: 'Science', score: selectedStudent.avgGrade - 5, color: '#00ae74' },
                  { label: 'Arabic', score: selectedStudent.avgGrade + 1, color: '#7dd3fc' },
                  { label: 'History', score: selectedStudent.avgGrade - 2, color: '#67e8f9' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 w-24 flex-shrink-0">{s.label}</span>
                    <MiniBar value={Math.min(100, s.score)} color={s.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEACHER REPORT ── */}
      {view === 'teacher' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <div className="px-4 py-3 text-xs font-bold border-b" style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.12)' }}>
              Select Teacher
            </div>
            {TEACHERS.map(t => (
              <button key={t.name} onClick={() => setSelectedTeacher(t)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition border-b"
                style={{ borderColor: 'rgba(37,99,235,0.08)', background: selectedTeacher.name === t.name ? 'rgba(37,99,235,0.08)' : 'transparent' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#2620a8,#2563eb)', color: '#fff' }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{t.name.split(' ')[0]}</p>
                  <p className="text-[9px] text-gray-500">{t.subject} · ⭐ {t.rating}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="md:col-span-2 rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{selectedTeacher.name}</h3>
                <p className="text-[10px] text-gray-500">{selectedTeacher.subject} Teacher · H2 2025</p>
              </div>
              <button className="text-[10px] px-3 py-1.5 rounded-lg border transition" style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.25)' }}>
                📥 PDF Report
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <StatBadge value={`${selectedTeacher.classAvg}%`} label="Class Average" color="#3b82f6" />
              <StatBadge value={`${selectedTeacher.evalScore}%`} label="AI Eval Score" color="#34d399" />
              <StatBadge value={`${selectedTeacher.lessons.done}/${selectedTeacher.lessons.total}`} label="Lessons Done" color="#00ae74" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-2">Monthly Activity</p>
              <MiniChart values={ACTIVITY} />
            </div>
            <div className="space-y-2">
              {[
                { label: 'Student Engagement', value: 88, color: '#2563eb' },
                { label: 'Lesson Quality', value: selectedTeacher.evalScore, color: '#34d399' },
                { label: 'Assignment Grading Speed', value: 76, color: '#00ae74' },
                { label: 'Communication', value: 91, color: '#7dd3fc' },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 w-44 flex-shrink-0">{m.label}</span>
                  <MiniBar value={m.value} color={m.color} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGEMENT REPORT ── */}
      {view === 'management' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Students',  value: '240', change: '+18', color: '#3b82f6', emoji: '🎓' },
              { label: 'Active Teachers', value: '9',   change: '+2',  color: '#34d399', emoji: '👨‍🏫' },
              { label: 'Revenue (YTD)',   value: '$24.5K', change: '+15%', color: '#00ae74', emoji: '💰' },
              { label: 'Avg Platform Score', value: '87%', change: '+3%', color: '#67e8f9', emoji: '📈' },
            ].map(k => (
              <div key={k.label} className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${k.color}20` }}>
                <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                  style={{ background: `linear-gradient(90deg,transparent,${k.color},transparent)` }} />
                <p className="text-2xl mb-1">{k.emoji}</p>
                <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] text-gray-500">{k.label}</p>
                <p className="text-[9px] text-emerald-400 mt-1">↑ {k.change} this month</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly activity chart */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
              <p className="text-xs font-bold text-white mb-3">📊 6-Month Activity</p>
              <div className="flex items-end gap-2 h-20">
                {ACTIVITY.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t"
                      style={{ height: `${v}%`, background: `linear-gradient(to top,#2620a8,#2563eb)`, boxShadow: i === ACTIVITY.length - 1 ? '0 0 8px rgba(37,99,235,0.5)' : undefined }} />
                    <span className="text-[8px] text-gray-600">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geography */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
              <p className="text-xs font-bold text-white mb-3">🌍 Geographic Reach</p>
              <div className="space-y-2.5">
                {[
                  { country: 'Yemen', pct: 78, color: '#2563eb' },
                  { country: 'Saudi Arabia', pct: 12, color: '#00ae74' },
                  { country: 'UAE', pct: 6, color: '#34d399' },
                  { country: 'Other', pct: 4, color: '#6b7280' },
                ].map(g => (
                  <div key={g.country} className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 w-20 flex-shrink-0">{g.country}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${g.pct}%` }} transition={{ duration: 1, delay: 0.2 }}
                        style={{ background: g.color }} />
                    </div>
                    <span className="text-[10px] font-bold text-white w-8 text-right">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0, 174, 116,0.18)' }}>
            <div className="px-5 py-3 text-xs font-bold border-b" style={{ color: '#00ae74', borderColor: 'rgba(0, 174, 116,0.10)' }}>
              💰 Revenue Breakdown
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              {[
                { label: 'Tuition Fees', amount: '$18,400', pct: 75, color: '#00ae74' },
                { label: 'Exam Fees', amount: '$3,200', pct: 13, color: '#3b82f6' },
                { label: 'Materials', amount: '$2,900', pct: 12, color: '#34d399' },
              ].map(r => (
                <div key={r.label} className="text-center space-y-2">
                  <p className="text-lg font-black" style={{ color: r.color }}>{r.amount}</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                  <p className="text-[9px] text-gray-500">{r.label} ({r.pct}%)</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
