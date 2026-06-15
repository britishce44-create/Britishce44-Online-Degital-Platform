
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/auth-provider'

/* ─────────────────────────────────────────────────── */
/*  Course data                                         */
/* ─────────────────────────────────────────────────── */

interface Course {
  id: string; title: string; series: string; level: string
  category: 'phonics' | 'kids' | 'teens'
  color: { from: string; to: string; badge: string; text: string }
  cover: { emoji: string; pattern: string }
  goals: [string, string, string, string]
  students?: number; tag?: string
}

const COURSES: Course[] = [
  /* ── Pre-diploma Phonics ── */
  {
    id: 'phonics-1', series: 'Oxford Phonics World', title: 'Oxford Phonics 1',
    level: 'Level 1', category: 'phonics',
    color: { from: '#dc2626', to: '#b91c1c', badge: '#fef2f2', text: '#dc2626' },
    cover: { emoji: '🔤', pattern: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)' },
    goals: [
      'Learn all 26 alphabet letters & their sounds',
      'Master uppercase & lowercase letter writing',
      'Associate letters with their starting sounds',
      'Build a strong phonological awareness foundation',
    ],
    students: 12, tag: 'Starter',
  },
  {
    id: 'phonics-2', series: 'Oxford Phonics World', title: 'Oxford Phonics 2',
    level: 'Level 2', category: 'phonics',
    color: { from: '#ea580c', to: '#c2410c', badge: '#fff7ed', text: '#ea580c' },
    cover: { emoji: '🅰', pattern: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)' },
    goals: [
      'Master all 5 short vowel sounds (a, e, i, o, u)',
      'Read & write 3-letter CVC words confidently',
      'Sound blending: consonant + vowel + consonant',
      'Recognise word families and rhyming patterns',
    ],
    students: 10, tag: 'Beginner',
  },
  {
    id: 'phonics-3', series: 'Oxford Phonics World', title: 'Oxford Phonics 3',
    level: 'Level 3', category: 'phonics',
    color: { from: '#d97706', to: '#b45309', badge: '#fffbeb', text: '#d97706' },
    cover: { emoji: '📖', pattern: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.15) 0%, transparent 55%)' },
    goals: [
      'Identify long vowel sounds & the silent-e rule',
      'Read words with vowel combinations (ai, ee, oa…)',
      'Transition from decoding to fluent reading',
      'Expand vocabulary through phonics patterns',
    ],
    students: 9, tag: 'Elementary',
  },

  /* ── Kids — Gogo Loves English ── */
  {
    id: 'gogo-1', series: 'Gogo Loves English', title: 'Gogo Loves English 1',
    level: 'Level 1', category: 'kids',
    color: { from: '#00ae74', to: '#15803d', badge: '#f0fdf4', text: '#00ae74' },
    cover: { emoji: '🐸', pattern: 'radial-gradient(ellipse at 25% 35%, rgba(255,255,255,0.15) 0%, transparent 55%)' },
    goals: [
      'Introduce basic greetings and everyday expressions',
      'Learn core vocabulary through songs and chants',
      'Recognise letters and simple sight words',
      'Build listening and speaking confidence from day one',
    ],
    students: 18, tag: 'Starter',
  },
  {
    id: 'gogo-2', series: 'Gogo Loves English', title: 'Gogo Loves English 2',
    level: 'Level 2', category: 'kids',
    color: { from: '#0891b2', to: '#0e7490', badge: '#ecfeff', text: '#0891b2' },
    cover: { emoji: '🌟', pattern: 'radial-gradient(ellipse at 75% 25%, rgba(255,255,255,0.12) 0%, transparent 55%)' },
    goals: [
      'Expand vocabulary with everyday objects and actions',
      'Use simple present tense sentences naturally',
      'Ask and answer basic questions with confidence',
      'Develop reading through guided graded sentences',
    ],
    students: 16, tag: 'Beginner',
  },
  {
    id: 'gogo-3', series: 'Gogo Loves English', title: 'Gogo Loves English 3',
    level: 'Level 3', category: 'kids',
    color: { from: '#2563eb', to: '#6d28d9', badge: '#f5f3ff', text: '#2563eb' },
    cover: { emoji: '🚀', pattern: 'radial-gradient(ellipse at 40% 60%, rgba(255,255,255,0.12) 0%, transparent 55%)' },
    goals: [
      'Master 200+ core vocabulary words in context',
      'Use present continuous and simple past tenses',
      'Read short paragraphs and illustrated stories',
      'Write simple sentences and short descriptions',
    ],
    students: 14, tag: 'Elementary',
  },
  {
    id: 'gogo-4', series: 'Gogo Loves English', title: 'Gogo Loves English 4',
    level: 'Level 4', category: 'kids',
    color: { from: '#db2777', to: '#be185d', badge: '#fdf2f8', text: '#db2777' },
    cover: { emoji: '🌈', pattern: 'radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.12) 0%, transparent 55%)' },
    goals: [
      'Learn comparative and superlative adjectives',
      'Expand to 350+ vocabulary words across topics',
      'Read and understand short illustrated stories',
      'Write structured sentences and short paragraphs',
    ],
    students: 13, tag: 'Pre-intermediate',
  },
  {
    id: 'gogo-5', series: 'Gogo Loves English', title: 'Gogo Loves English 5',
    level: 'Level 5', category: 'kids',
    color: { from: '#0284c7', to: '#0369a1', badge: '#eff6ff', text: '#0284c7' },
    cover: { emoji: '✨', pattern: 'radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.12) 0%, transparent 55%)' },
    goals: [
      'Use complex sentence structures with confidence',
      'Master future and past tenses in authentic context',
      'Develop reading fluency with longer graded texts',
      'Express opinions, feelings, and ideas in writing',
    ],
    students: 11, tag: 'Intermediate',
  },
  {
    id: 'gogo-6', series: 'Gogo Loves English', title: 'Gogo Loves English 6',
    level: 'Level 6', category: 'kids',
    color: { from: '#00ae74', to: '#047857', badge: '#f0fdf4', text: '#00ae74' },
    cover: { emoji: '🏆', pattern: 'radial-gradient(ellipse at 70% 70%, rgba(255,255,255,0.12) 0%, transparent 55%)' },
    goals: [
      'Communicate in a wide range of real-life situations',
      'Consolidate all grammar from Gogo levels 1–5',
      'Read and interpret extended texts independently',
      'Write with accuracy, variety, and creativity',
    ],
    students: 10, tag: 'Upper-intermediate',
  },

  /* ── Teens & Adults — American Speakout ── */
  {
    id: 'speakout-elem', series: 'American Speakout', title: 'Speakout Elementary',
    level: 'Elementary', category: 'teens',
    color: { from: '#1d4ed8', to: '#1e40af', badge: '#eff6ff', text: '#1d4ed8' },
    cover: { emoji: '🗣', pattern: 'radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)' },
    goals: [
      'Communicate basic needs and personal information',
      'Master present/past tenses and key grammar structures',
      'Build survival vocabulary for everyday English life',
      'Develop real-world listening with BBC video content',
    ],
    students: 8, tag: 'A1–A2',
  },
  {
    id: 'speakout-pre', series: 'American Speakout', title: 'Speakout Pre-Intermediate',
    level: 'Pre-Intermediate', category: 'teens',
    color: { from: '#2620a8', to: '#3730a3', badge: '#eef2ff', text: '#2620a8' },
    cover: { emoji: '💬', pattern: 'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' },
    goals: [
      'Talk about experiences using present perfect tense',
      'Express opinions and discuss familiar topics fluently',
      'Read and understand authentic texts with confidence',
      'Use BBC real English for practical communication',
    ],
    students: 9, tag: 'A2–B1',
  },
  {
    id: 'speakout-int', series: 'American Speakout', title: 'Speakout Intermediate',
    level: 'Intermediate', category: 'teens',
    color: { from: '#3b82f6', to: '#3b5bdb', badge: '#eef2ff', text: '#3b82f6' },
    cover: { emoji: '🎯', pattern: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' },
    goals: [
      'Discuss complex topics with confidence and accuracy',
      'Master conditionals, modals, and passive voice',
      'Listen to and comprehend natural-speed English speech',
      'Write formal and informal texts effectively',
    ],
    students: 7, tag: 'B1–B2',
  },
  {
    id: 'speakout-upper', series: 'American Speakout', title: 'Speakout Upper-Intermediate',
    level: 'Upper-Intermediate', category: 'teens',
    color: { from: '#2563eb', to: '#6d28d9', badge: '#f5f3ff', text: '#2563eb' },
    cover: { emoji: '📡', pattern: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' },
    goals: [
      'Express nuanced ideas in professional contexts',
      'Master advanced grammar: inversion and cleft sentences',
      'Engage with authentic BBC documentary content',
      'Write cohesive essays and professional communications',
    ],
    students: 6, tag: 'B2–C1',
  },
  {
    id: 'speakout-adv', series: 'American Speakout', title: 'Speakout Advanced',
    level: 'Advanced', category: 'teens',
    color: { from: '#312e81', to: '#1e1b4b', badge: '#eef2ff', text: '#2620a8' },
    cover: { emoji: '🎓', pattern: 'radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)' },
    goals: [
      'Achieve near-native fluency and idiomatic expression',
      'Discuss abstract and academic topics with precision',
      'Analyse and evaluate complex BBC documentary content',
      'Write at a full academic and professional standard',
    ],
    students: 5, tag: 'C1–C2',
  },
]

const CAT_CONFIG = {
  phonics: { label: 'Pre-Diploma Phonics', emoji: '🔤', color: '#dc2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.15)' },
  kids:    { label: 'Kids English',        emoji: '🐸', color: '#00ae74', bg: 'rgba(22,163,74,0.06)',  border: 'rgba(22,163,74,0.15)' },
  teens:   { label: 'Teens & Adults',      emoji: '🎓', color: '#3b82f6', bg: 'rgba(63, 186, 235,0.06)', border: 'rgba(63, 186, 235,0.15)' },
}

/* ─────────────────────────────────────────────────── */
/*  Book Cover Card                                     */
/* ─────────────────────────────────────────────────── */

function CourseCard({ course }: { course: Course }) {
  const [flipped, setFlipped] = useState(false)
  const c = course.color

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        background: 'white',
        border: `1px solid ${c.from}22`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px ${c.from}10`,
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${c.from}22, 0 0 0 1px ${c.from}20`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px ${c.from}10`}
      onClick={() => setFlipped(f => !f)}>

      {/* ── Book Cover ── */}
      <div className="relative h-44 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${c.from} 0%, ${c.to} 100%)` }}>

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-60" style={{ background: course.cover.pattern }} />

        {/* Spine accent */}
        <div className="absolute left-0 top-0 bottom-0 w-2.5 opacity-30"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)' }} />

        {/* Halftone dots overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }} />

        {/* Top row */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">
            {course.series}
          </span>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {course.tag}
          </span>
        </div>

        {/* Central emoji icon */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl"
            style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
            {course.cover.emoji}
          </div>
        </div>

        {/* Bottom title bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}>
          <p className="text-white font-black text-sm leading-tight drop-shadow">{course.title}</p>
          <p className="text-white/60 text-[9px] mt-0.5">{course.level}</p>
        </div>

        {/* Student count badge */}
        <div className="absolute top-3 left-4">
          {/* overridden above — level pill instead */}
        </div>
      </div>

      {/* ── Goals section ── */}
      <div className="px-4 py-3.5 space-y-2">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: c.from }}>
          📌 Top Learning Goals
        </p>
        {course.goals.map((goal, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
              style={{ background: `${c.from}14`, color: c.from }}>
              {i + 1}
            </div>
            <p className="text-[10px] text-gray-600 leading-snug">{goal}</p>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 pb-3.5 flex items-center justify-between">
        <span className="text-[9px] text-gray-400 flex items-center gap-1">
          <span>👥</span> {course.students} students enrolled
        </span>
        <button className="text-[9px] font-bold px-3 py-1.5 rounded-full transition"
          style={{ background: `${c.from}12`, color: c.from, border: `1px solid ${c.from}20` }}
          onClick={e => e.stopPropagation()}>
          View Course →
        </button>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────── */
/*  Courses Section                                     */
/* ─────────────────────────────────────────────────── */

function CoursesSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'phonics' | 'kids' | 'teens'>('all')

  const filtered = activeCategory === 'all' ? COURSES : COURSES.filter(c => c.category === activeCategory)
  const grouped = {
    phonics: filtered.filter(c => c.category === 'phonics'),
    kids:    filtered.filter(c => c.category === 'kids'),
    teens:   filtered.filter(c => c.category === 'teens'),
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            📚 Our Courses
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {COURSES.length} books across 3 programmes · {COURSES.reduce((a, c) => a + (c.students || 0), 0)} students enrolled
          </p>
        </div>
        {/* Category filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {([
            { id: 'all', label: 'All Courses', emoji: '📖' },
            { id: 'phonics', label: 'Phonics', emoji: '🔤' },
            { id: 'kids', label: 'Kids', emoji: '🐸' },
            { id: 'teens', label: 'Teens & Adults', emoji: '🎓' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setActiveCategory(f.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition"
              style={activeCategory === f.id ? {
                background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                color: '#fff', boxShadow: '0 2px 10px rgba(63, 186, 235,0.3)',
              } : {
                background: '#f3f4f6', color: '#6b7280',
              }}>
              <span>{f.emoji}</span>{f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render each category group */}
      {(['phonics', 'kids', 'teens'] as const).map(cat => {
        const books = grouped[cat]
        if (!books.length) return null
        const cfg = CAT_CONFIG[cat]
        return (
          <div key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-4 pb-2"
              style={{ borderBottom: `1.5px solid ${cfg.border}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                {cfg.emoji}
              </div>
              <div>
                <h4 className="text-sm font-black" style={{ color: cfg.color }}>{cfg.label}</h4>
                <p className="text-[10px] text-gray-400">{books.length} {books.length === 1 ? 'book' : 'books'}</p>
              </div>
              <div className="ml-auto h-px flex-1 max-w-xs" style={{ background: `linear-gradient(to right, ${cfg.border}, transparent)` }} />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {books.map((course, i) => (
                <motion.div key={course.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}>
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────────── */
/*  Existing helper components                          */
/* ─────────────────────────────────────────────────── */

const STAT_COLORS = [
  { from: '#3b82f6', to: '#2563eb', glow: 'rgba(63, 186, 235,0.20)' },
  { from: '#0891b2', to: '#0e7490', glow: 'rgba(8,145,178,0.20)' },
  { from: '#00ae74', to: '#00875a', glow: 'rgba(0, 174, 116,0.20)' },
  { from: '#00ae74', to: '#047857', glow: 'rgba(5,150,105,0.20)' },
]

function StatCard({ label, value, icon, idx, sub }: { label: string; value: string; icon: string; idx: number; sub?: string }) {
  const c = STAT_COLORS[idx % STAT_COLORS.length]
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-default"
      style={{ background: 'white', border: '1px solid rgba(230,235,255,0.9)', boxShadow: '0 2px 12px rgba(8,15,34,0.06)' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = `0 8px 28px ${c.glow}`
        el.style.borderColor = c.from + '40'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 2px 12px rgba(8,15,34,0.06)'
        el.style.borderColor = 'rgba(230,235,255,0.9)'
      }}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10"
        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
          style={{ background: `${c.from}18`, border: `1px solid ${c.from}25` }}>
          {icon}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ color: c.from, background: `${c.from}12` }}>Live</span>
      </div>
      <p className="text-3xl font-black mb-0.5"
        style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </p>
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {sub && <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function QuickActionBtn({ label, color }: { label: string; color: string }) {
  return (
    <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
      style={{ background: `${color}10`, border: `1px solid ${color}25`, color, boxShadow: `0 2px 8px ${color}10` }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}20` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}10` }}>
      {label}
    </button>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────── */
/*  Center Info Section — Logo + Arabic floating cards  */
/* ─────────────────────────────────────────────────── */

const ARABIC_CARDS = [
  {
    id: 'why', emoji: '🏆', color: { from: '#00875a', to: '#00ae74', glow: 'rgba(0, 174, 116,0.18)', border: 'rgba(0, 174, 116,0.25)' },
    titleAr: 'لماذا نحن الأفضل؟',
    subtitleAr: 'الأفضل في تعليم اللغة الإنجليزية عن بُعد',
    titleEn: 'Why We\'re the Best',
    items: [
      { ar: 'جودة التعليم', en: 'منهج متطور ومدربين مؤهلين مع التركيز على التفاعل' },
      { ar: 'التكنولوجيا الحديثة', en: 'أحدث التقنيات لجعل التعليم ممتعاً وفعالاً' },
      { ar: 'التواصل الدائم', en: 'تواصل مستمر مع أولياء الأمور وتقارير مفصلة' },
      { ar: 'المنهج المعتمد دولياً', en: 'منهج معترف به من مؤسسات دولية معروفة' },
      { ar: 'الأسعار المناسبة', en: 'أسعار مناسبة ومتاحة لجميع الطلاب' },
      { ar: 'الدعم الفني 24/7', en: 'فريق دعم فني متخصص على مدار الساعة' },
      { ar: 'البرامج الخاصة', en: 'برامج مصممة لتلبية احتياجات الطلاب الخاصة' },
      { ar: 'شهادات الامتياز', en: 'شهادة إضافية للطلاب ذوي النتائج الممتازة' },
    ],
  },
  {
    id: 'services', emoji: '🎓', color: { from: '#1d4ed8', to: '#3b82f6', glow: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.25)' },
    titleAr: 'خدماتنا',
    subtitleAr: 'المركز البريطاني الأول أونلاين',
    titleEn: 'Our Services',
    items: [
      { ar: 'دورات اللغة الإنجليزية', en: 'لجميع المستويات من المبتدئ إلى المتقدم بمنهج متكامل' },
      { ar: 'تحضير IELTS & TOEFL', en: 'دورات متخصصة لتحضير الطلاب للامتحانات الدولية' },
      { ar: 'دورات الموظفين والأعمال', en: 'برامج للغة الإنجليزية التجارية والمهنية' },
      { ar: 'دورات مكثفة', en: 'برامج مكثفة لتحسين اللغة بسرعة مع التركيز على المحادثة' },
      { ar: 'دبلوم ICDL', en: 'شهادة معتمدة دولياً في مهارات الحاسب مع تدريب عملي' },
    ],
  },
  {
    id: 'features', emoji: '✨', color: { from: '#00ae74', to: '#00ae74', glow: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.25)' },
    titleAr: 'مميزاتنا',
    subtitleAr: 'ما يجعلنا الأفضل والمختلف',
    titleEn: 'Our Unique Features',
    items: [
      { ar: 'تعليم لجميع الأعمار', en: 'من 6 سنوات فما فوق، بمنهج يناسب احتياجات كل طالب' },
      { ar: 'كادر مبدع ذو خبرة', en: 'مدربون مؤهلون بشهادات دولية معترف بها' },
      { ar: 'أحدث المناهج التعليمية', en: 'منهج متطور ومتجدد يركز على التفاعل والتعلم النشط' },
      { ar: 'تطبيقات Multimedia', en: 'فيديوهات وصور وألعاب تعليمية تجعل التعلم ممتعاً' },
      { ar: 'تقنية Shadowing', en: 'تقنية فعالة لتحسين النطق والاستماع والمحادثة' },
    ],
  },
  {
    id: 'diploma', emoji: '📜', color: { from: '#2563eb', to: '#3b82f6', glow: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.25)' },
    titleAr: 'دبلوم اللغة الإنجليزية',
    subtitleAr: 'دورات لجميع المستويات',
    titleEn: 'English Diploma Courses',
    items: [
      { ar: 'دورات المبتدئ', en: 'Fly High 1a/1b · Fly High 2a/2b · Fly High 3a/3b' },
      { ar: 'دورات الأطفال', en: 'Oxford Phonics 1 · Oxford Phonics 2 · Oxford Phonics 3' },
      { ar: 'المتوسط والمتقدم', en: 'Level 1–5 (A, B, C) · 15 مستوى شامل' },
      { ar: 'دبلوم الأطفال', en: 'Basic 1–6 Kids · Kids Levels 1–4 (a, b, c)' },
      { ar: 'الأطفال الكبار', en: 'Gogo Loves English 1–6 · American Speakout كل المستويات' },
    ],
  },
]

function CenterInfoSection() {
  return (
    <div className="space-y-6">
      {/* Logo banner */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #17125c 0%, #241c80 40%, #162050 70%, #1d1668 100%)',
          border: '1px solid rgba(0, 174, 116,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(0, 174, 116,0.9) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0, 174, 116,0.12), transparent)', filter: 'blur(20px)' }} />

        <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
          {/* Logo */}
          <div className="shrink-0 relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '2px solid rgba(0, 174, 116,0.40)', boxShadow: '0 8px 32px rgba(0, 174, 116,0.20)' }}>
              <img src="/center-logo.png" alt="المركز البريطاني الأول"
                className="w-full h-full object-contain bg-white p-2" />
            </div>
          </div>

          {/* Center text */}
          <div className="flex-1 text-center md:text-right" dir="rtl">
            <p className="text-xs text-amber-400/60 uppercase tracking-[0.2em] mb-1">BRITISHCE44</p>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1"
              style={{ fontFamily: 'Cairo, sans-serif' }}>
              المركز البريطاني الأول
            </h2>
            <p className="text-base text-amber-400/90 font-semibold mb-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}>
              التعليم أونلاين
            </p>
            <p className="text-sm text-white/50" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              الأفضل في تعليم اللغة الإنجليزية عن بعد
            </p>
            <div className="flex items-center gap-4 mt-3 justify-center md:justify-start flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />تعز · اليمن
              </span>
              <span className="text-[10px] text-white/30">·</span>
              <span className="text-[10px] text-indigo-300/60">The First British Center for Online Education</span>
            </div>
          </div>

          {/* Stats side */}
          <div className="shrink-0 grid grid-cols-2 gap-3 text-center">
            {[
              { n: '50+', ar: 'طالب مسجل' },
              { n: '9', ar: 'مدرس متخصص' },
              { n: '14', ar: 'كتاباً دراسياً' },
              { n: '240', ar: 'فصل دراسي' },
            ].map(s => (
              <div key={s.n} className="px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl font-black text-amber-400">{s.n}</p>
                <p className="text-[10px] text-white/50 mt-0.5" style={{ fontFamily: 'Cairo, sans-serif' }}>{s.ar}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Arabic info cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ARABIC_CARDS.map((card, cardIdx) => (
          <motion.div key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cardIdx * 0.08, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl overflow-hidden cursor-default"
            style={{
              background: 'white',
              border: `1px solid ${card.color.border}`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px ${card.color.border}`,
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px ${card.color.glow}, 0 0 0 1px ${card.color.border}`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px ${card.color.border}`}>

            {/* Card header */}
            <div className="relative overflow-hidden px-5 py-4"
              style={{ background: `linear-gradient(135deg, ${card.color.from} 0%, ${card.color.to} 100%)` }}>
              {/* Halftone overlay */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
              <div className="absolute top-0 right-0 w-24 h-24 opacity-20 rounded-bl-full"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4), transparent)' }} />

              <div className="relative flex items-center justify-between" dir="rtl">
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">{card.titleEn}</p>
                  <h3 className="text-xl font-black text-white leading-tight"
                    style={{ fontFamily: 'Cairo, sans-serif' }}>{card.titleAr}</h3>
                  <p className="text-[11px] text-white/70 mt-0.5"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}>{card.subtitleAr}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>
                  {card.emoji}
                </div>
              </div>
            </div>

            {/* Card body — list items */}
            <div className="px-5 py-4 space-y-2.5" dir="rtl">
              {card.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                    style={{ background: `${card.color.from}14`, color: card.color.from, border: `1px solid ${card.color.from}20` }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight"
                      style={{ fontFamily: 'Cairo, sans-serif' }}>{item.ar}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.en}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Card footer */}
            <div className="px-5 pb-4 flex items-center justify-between" dir="rtl">
              <span className="text-[9px] text-gray-400" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                المركز البريطاني الأول · BRITISHCE44
              </span>
              <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full"
                style={{ color: card.color.from, background: `${card.color.from}10`, border: `1px solid ${card.color.from}20` }}>
                اليمن · تعز
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────── */
/*  Dashboard page                                      */
/* ─────────────────────────────────────────────────── */

export function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === 'admin' || user?.role === 'supervisor') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d1668 0%, #131f40 50%, #1a2550 100%)', border: '1px solid rgba(63, 186, 235,0.20)', boxShadow: '0 8px 32px rgba(8,15,34,0.25)' }}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(63, 186, 235,1) 1px, transparent 1px), linear-gradient(90deg, rgba(63, 186, 235,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at right, #3b82f6, transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                style={{ background: 'linear-gradient(135deg, #00875a, #00ae74)', color: '#17125c', boxShadow: '0 4px 16px rgba(0, 174, 116,0.30)' }}>B</div>
              <div>
                <p className="text-xs text-indigo-300/50 uppercase tracking-widest">Admin Control Panel</p>
                <h2 className="text-xl font-bold text-white leading-tight">Welcome back, {user.firstName}</h2>
              </div>
            </div>
            <p className="text-sm text-gray-400">Britishce44 Online Digital School · Taiz, Yemen · All systems operational</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Platform Online</span>
              <span className="flex items-center gap-1.5 text-[10px] text-indigo-400"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />240 Classrooms Ready</span>
              <span className="flex items-center gap-1.5 text-[10px] text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />AI Systems Active</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value="60+" icon="👥" idx={0} sub="Active accounts" />
          <StatCard label="Students" value="50" icon="🎓" idx={1} sub="Enrolled" />
          <StatCard label="Teachers" value="9" icon="👩‍🏫" idx={2} sub="Active faculty" />
          <StatCard label="Classrooms" value="240" icon="🚪" idx={3} sub="WebRTC enabled" />
        </div>

        {/* Quick actions + overview */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
            <SectionHeader title="⚡ Quick Actions" sub="Most-used admin tools" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '👥 Manage Users', color: '#3b82f6' }, { label: '🚪 Classrooms', color: '#2563eb' },
                { label: '💬 CE4 Messenger', color: '#00ae74' }, { label: '📝 Exam System', color: '#00ae74' },
                { label: '⭐ Teacher Eval', color: '#0891b2' }, { label: '⚙️ Settings', color: '#6b7280' },
              ].map(b => <QuickActionBtn key={b.label} label={b.label} color={b.color} />)}
            </div>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
            <SectionHeader title="📋 Platform Overview" sub="Real-time platform status" />
            <div className="space-y-2.5">
              {[
                { icon: '🎓', label: 'Students', value: '50 enrolled', color: '#0891b2' },
                { icon: '👩‍🏫', label: 'Teachers', value: '9 active', color: '#3b82f6' },
                { icon: '🚪', label: 'Classrooms', value: '240 rooms · WebRTC', color: '#2563eb' },
                { icon: '📝', label: 'Exams', value: '100 tests · AI proctored', color: '#00ae74' },
                { icon: '🛡️', label: 'Anti-Cheat', value: 'Active · Real-time', color: '#e11d48' },
                { icon: '📊', label: 'Reports', value: 'Triple reports enabled', color: '#00ae74' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}>{item.icon}</div>
                  <span className="text-xs font-semibold text-gray-700 flex-1">{item.label}</span>
                  <span className="text-[10px] font-medium" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER INFO ── */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
          <CenterInfoSection />
        </div>

        {/* ── COURSES SECTION ── */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
          <CoursesSection />
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
          <SectionHeader title="🔔 Recent Activity" sub="Latest platform events" />
          <div className="space-y-2">
            {[
              { icon: '✅', text: 'Class A1 — English session completed', time: '2 min ago', color: '#00ae74' },
              { icon: '📝', text: 'Exam #47 submitted by 12 students', time: '8 min ago', color: '#3b82f6' },
              { icon: '👤', text: 'New student registered: Sara Ahmed', time: '15 min ago', color: '#0891b2' },
              { icon: '⭐', text: 'Teacher evaluation report generated', time: '1 hr ago', color: '#00ae74' },
              { icon: '📢', text: 'Marketing newsletter sent · 340 recipients', time: '2 hr ago', color: '#2563eb' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5" style={{ background: `${a.color}12` }}>{a.icon}</div>
                <p className="text-xs text-gray-700 flex-1">{a.text}</p>
                <span className="text-[9px] text-gray-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (user?.role === 'teacher') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d1668, #1a2550)', border: '1px solid rgba(63, 186, 235,0.20)', boxShadow: '0 8px 32px rgba(8,15,34,0.25)' }}>
          <h2 className="text-xl font-bold text-white">👩‍🏫 Teacher Dashboard</h2>
          <p className="text-sm text-indigo-300/60 mt-1">Welcome back, {user.firstName} · Ready to teach</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="My Classes" value="8" icon="🚪" idx={0} />
          <StatCard label="Students" value="24" icon="🎓" idx={1} />
          <StatCard label="Homework" value="6" icon="📄" idx={2} sub="Pending review" />
          <StatCard label="Exams" value="3" icon="📝" idx={3} sub="This week" />
        </div>
        <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
          <SectionHeader title="🎯 Today's Schedule" />
          <div className="space-y-2">
            {['09:00 — English Grammar · Class A1', '11:00 — Reading & Writing · Class B2', '14:00 — Conversation Practice · Class C3'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-sm text-gray-700">{s}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Center info for teacher */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
          <CenterInfoSection />
        </div>
        {/* Courses for teacher */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
          <CoursesSection />
        </div>
      </div>
    )
  }

  /* Student / Parent */
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1d1668, #241c80)', border: '1px solid rgba(63, 186, 235,0.20)', boxShadow: '0 8px 32px rgba(8,15,34,0.25)' }}>
        <h2 className="text-xl font-bold text-white">
          {user?.role === 'parent' ? '👨‍👩‍👧 Parent Dashboard' : '🎓 Student Dashboard'}
        </h2>
        <p className="text-sm text-indigo-300/60 mt-1">Welcome, {user?.firstName} · Britishce44 Digital School</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="My Courses" value="5" icon="📚" idx={0} />
        <StatCard label="Completed" value="12" icon="✅" idx={1} />
        <StatCard label="Upcoming" value="3" icon="📅" idx={2} sub="This week" />
        <StatCard label="Grade" value="A+" icon="⭐" idx={3} />
      </div>
      {/* Center info for student/parent */}
      <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
        <CenterInfoSection />
      </div>
      {/* Courses for student/parent */}
      <div className="rounded-2xl p-5 bg-white border border-gray-100/80" style={{ boxShadow: '0 2px 12px rgba(8,15,34,0.05)' }}>
        <CoursesSection />
      </div>
    </div>
  )
}
