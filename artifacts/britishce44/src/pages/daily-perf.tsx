import { useState } from 'react'
import { motion } from 'framer-motion'

const CARD = 'rgba(11,22,62,0.85)'
const BORDER = 'rgba(37,99,235,0.18)'
const GOLD = '#00ae74'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKLY_DATA = [72, 85, 68, 91, 88, 94]

const CHECKLIST = [
  { label: 'Completed all homework on time', labelAr: 'أتم الواجبات في وقتها', done: true, points: 10 },
  { label: 'Active participation in class', labelAr: 'المشاركة الفعّالة في الفصل', done: true, points: 10 },
  { label: 'Achieved 80%+ on quiz', labelAr: 'حصل على 80%+ في الاختبار', done: false, points: 15 },
  { label: 'Submitted writing assignment', labelAr: 'سلّم تكليف الكتابة', done: true, points: 10 },
  { label: 'Reviewed previous lesson notes', labelAr: 'راجع ملاحظات الدرس السابق', done: false, points: 5 },
  { label: 'Attended all scheduled classes', labelAr: 'حضر جميع الحصص المقررة', done: true, points: 20 },
  { label: 'Completed extra practice', labelAr: 'أتم التمارين الإضافية', done: false, points: 10 },
  { label: 'Maintained positive behaviour', labelAr: 'حافظ على السلوك الإيجابي', done: true, points: 10 },
]

const TOP_PERFORMERS = [
  { name: 'Mona Alqaiti',      grade: 'G7', completion: 98, streak: 14, medal: '🥇' },
  { name: 'Ahmed Al-Farsi',    grade: 'G5', completion: 94, streak: 10, medal: '🥈' },
  { name: 'Sara Almahdi',      grade: 'G9', completion: 91, streak:  8, medal: '🥉' },
  { name: 'Ibrahim Almojahid', grade: 'G4', completion: 88, streak:  6, medal: '4️⃣' },
  { name: 'Nour Alqaiti',      grade: 'G6', completion: 85, streak:  5, medal: '5️⃣' },
]

const AI_NUDGES = [
  { text: 'Quiz performance is below target — recommend reviewing Unit 4 vocabulary flash-cards.', color: '#f87171', icon: '⚠️' },
  { text: 'Attendance streak is strong at 6 consecutive sessions — keep it up!', color: '#34d399', icon: '🎉' },
  { text: 'Writing submission rate improved 12% vs. last week.', color: GOLD, icon: '📈' },
]

export function DailyPerfPage() {
  const [selectedDay, setSelectedDay] = useState(5)
  const done = CHECKLIST.filter(c => c.done)
  const completionPct = Math.round((done.length / CHECKLIST.length) * 100)
  const totalPoints = done.reduce((s, c) => s + c.points, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📋 Daily Performance</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.55)' }}>
            Track and review daily student performance criteria
          </p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
          ✅ Today: {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Completion Rate', value: `${completionPct}%`, sub: `${done.length}/${CHECKLIST.length} tasks`, icon: '🎯', color: completionPct >= 75 ? '#34d399' : GOLD },
          { label: 'Points Earned',  value: totalPoints,          sub: 'of 90 possible',                         icon: '⭐', color: GOLD },
          { label: 'Attendance',     value: '96%',                sub: '6 day streak 🔥',                        icon: '📅', color: '#3b82f6' },
          { label: 'Weekly Avg',     value: `${Math.round(WEEKLY_DATA.reduce((a,b)=>a+b)/WEEKLY_DATA.length)}%`, sub: 'Last 6 days',   icon: '📈', color: '#7dd3fc' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg,transparent,${k.color},transparent)` }} />
            <span className="text-2xl">{k.icon}</span>
            <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[10px] font-semibold text-white mt-0.5">{k.label}</p>
            <p className="text-[9px] mt-0.5" style={{ color: 'rgba(147,197,253,0.4)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Today's checklist */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-5 pt-4 pb-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-sm font-black text-white">📌 Today's Performance Checklist</p>
            <span className="text-xs font-bold" style={{ color: GOLD }}>{done.length}/{CHECKLIST.length} complete</span>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {CHECKLIST.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-5 py-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={item.done
                    ? { background: 'rgba(52,211,153,0.18)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(107,114,128,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {item.done ? '✓' : '○'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: item.done ? 'rgba(255,255,255,0.85)' : 'rgba(107,114,128,0.6)' }}>
                    {item.label}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'rgba(147,197,253,0.35)', fontFamily: 'Tajawal, sans-serif' }}>
                    {item.labelAr}
                  </p>
                </div>
                <span className="text-[9px] font-bold flex-shrink-0"
                  style={{ color: item.done ? '#34d399' : 'rgba(107,114,128,0.4)' }}>
                  +{item.points}pts
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Weekly bar chart */}
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-bold text-white mb-4">📊 Weekly Completion Rate</p>
            <div className="flex items-end gap-2 h-28">
              {WEEKLY_DATA.map((val, i) => (
                <div key={i} onClick={() => setSelectedDay(i)}
                  className="flex-1 flex flex-col items-center gap-1 cursor-pointer group">
                  <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition"
                    style={{ color: val >= 85 ? '#34d399' : GOLD }}>{val}%</span>
                  <motion.div className="w-full rounded-t-lg transition-all"
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / 100) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.07 }}
                    style={{
                      background: selectedDay === i
                        ? `linear-gradient(to top, ${GOLD}90, ${GOLD})`
                        : `linear-gradient(to top, #2620a880, #2563eb)`,
                      maxHeight: '100%', minHeight: '6px',
                      boxShadow: selectedDay === i ? `0 0 10px ${GOLD}50` : undefined,
                    }} />
                  <span className="text-[8px]" style={{ color: selectedDay === i ? GOLD : 'rgba(107,114,128,0.6)' }}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top performers */}
          <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-4 pt-3 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold text-white">🏆 Top Performers Today</p>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {TOP_PERFORMERS.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-base">{p.medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    <p className="text-[9px]" style={{ color: 'rgba(147,197,253,0.45)' }}>{p.grade} · 🔥 {p.streak} day streak</p>
                  </div>
                  <span className="text-xs font-black" style={{ color: '#34d399' }}>{p.completion}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI coaching nudges */}
          <div className="space-y-2">
            {AI_NUDGES.map((n, i) => (
              <div key={i} className="rounded-xl px-3 py-2.5 flex gap-2.5 items-start"
                style={{ background: `${n.color}0d`, border: `1px solid ${n.color}25` }}>
                <span className="text-sm flex-shrink-0">{n.icon}</span>
                <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
