import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const SKILLS = [
  { skill: 'Grammar', score: 88, color: '#34d399' },
  { skill: 'Vocabulary', score: 74, color: '#2563eb' },
  { skill: 'Listening', score: 91, color: '#67e8f9' },
  { skill: 'Speaking', score: 62, color: '#f472b6' },
  { skill: 'Reading', score: 80, color: '#00ae74' },
  { skill: 'Writing', score: 57, color: '#7dd3fc' },
]

const PLAN = [
  { day: 'Today', task: 'Speaking drill — present continuous', mins: 15, done: true, color: '#f472b6' },
  { day: 'Today', task: 'Vocabulary: 12 academic words', mins: 10, done: true, color: '#2563eb' },
  { day: 'Today', task: 'Writing: a 6-sentence paragraph', mins: 20, done: false, color: '#7dd3fc' },
  { day: 'Tomorrow', task: 'Listening: BBC short story', mins: 12, done: false, color: '#67e8f9' },
  { day: 'Tomorrow', task: 'Speaking: record & self-review', mins: 15, done: false, color: '#f472b6' },
]

const RECS = [
  { icon: '🎙️', title: 'Speaking is your biggest opportunity', body: 'You improve fastest with daily 1-minute recordings. AI noticed strong grammar but hesitation in fluency.', color: '#f472b6' },
  { icon: '✍️', title: 'Writing needs structure practice', body: 'Try the “topic → 3 reasons → conclusion” template. We added 3 guided prompts to your plan.', color: '#7dd3fc' },
  { icon: '🔥', title: '9-day streak — keep it alive!', body: 'Students with 14+ day streaks score 23% higher on placement tests on average.', color: '#00ae74' },
]

function Radar() {
  const cx = 110, cy = 110, r = 80
  const pts = SKILLS.map((s, i) => {
    const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2
    const rad = (s.score / 100) * r
    return `${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`
  }).join(' ')
  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[260px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={SKILLS.map((_, i) => {
          const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2
          return `${cx + Math.cos(a) * r * f},${cy + Math.sin(a) * r * f}`
        }).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {SKILLS.map((s, i) => {
        const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2
        return <line key={s.skill} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      })}
      <polygon points={pts} fill="rgba(37,99,235,0.25)" stroke="#2563eb" strokeWidth="2" />
      {SKILLS.map((s, i) => {
        const a = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2
        return <text key={s.skill} x={cx + Math.cos(a) * (r + 16)} y={cy + Math.sin(a) * (r + 16)}
          fill="#94a3b8" fontSize="8" textAnchor="middle" dominantBaseline="middle">{s.skill}</text>
      })}
    </svg>
  )
}

export function AiLearningPage() {
  const { t } = useI18n()
  const mastery = Math.round(SKILLS.reduce((a, s) => a + s.score, 0) / SKILLS.length)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-gradient-aurora">🧠 {t('nav.ailearning')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your personalized study plan — adaptive to how you learn</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Mastery radar */}
        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg,transparent,#2563eb,transparent)' }} />
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white">🎯 Skill Mastery</p>
            <span className="text-[9px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">Overall {mastery}%</span>
          </div>
          <Radar />
        </div>

        {/* AI recommendations */}
        <div className="md:col-span-2 space-y-3">
          {RECS.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${r.color}22` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${r.color}1a`, border: `1px solid ${r.color}33` }}>{r.icon}</div>
              <div>
                <p className="text-xs font-bold text-white">{r.title}</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{r.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Weakness breakdown */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0, 174, 116,0.18)' }}>
          <p className="text-xs font-bold text-white mb-3">📈 Where you stand</p>
          <div className="space-y-2.5">
            {SKILLS.map(s => (
              <div key={s.skill} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 w-20">{s.skill}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 1 }}
                    className="h-full rounded-full" style={{ background: s.color }} />
                </div>
                <span className="text-[10px] font-bold text-white w-8 text-right">{s.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Study plan */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(167,139,250,0.18)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(167,139,250,0.1)' }}>
            <p className="text-xs font-bold text-white">🗓️ Adaptive Study Plan</p>
            <span className="text-[9px] text-gray-500">AI-generated</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(167,139,250,0.06)' }}>
            {PLAN.map((p, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ background: p.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${p.done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                  {p.done ? '✓' : ''}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] ${p.done ? 'text-gray-500 line-through' : 'text-white'}`}>{p.task}</p>
                  <p className="text-[9px] text-gray-600">{p.day} · {p.mins} min</p>
                </div>
                <span className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: p.color }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
