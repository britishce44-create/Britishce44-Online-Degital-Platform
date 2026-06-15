import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

type Kind = 'classroom' | 'exam' | 'message' | 'recording' | 'report' | 'user'

interface Result { id: number; kind: Kind; title: string; sub: string }

const KIND_META: Record<Kind, { icon: string; color: string; label: string }> = {
  classroom: { icon: '🚪', color: '#2563eb', label: 'Classroom' },
  exam: { icon: '📝', color: '#7dd3fc', label: 'Exam' },
  message: { icon: '💬', color: '#34d399', label: 'Message' },
  recording: { icon: '🎞️', color: '#f472b6', label: 'Recording' },
  report: { icon: '📊', color: '#67e8f9', label: 'Report' },
  user: { icon: '👤', color: '#00ae74', label: 'User' },
}

const DATA: Result[] = [
  { id: 1, kind: 'classroom', title: 'Mathematics — Grade 5', sub: 'Room #4 · Suhair Almojahid · Live now' },
  { id: 2, kind: 'classroom', title: 'English Conversation — Grade 7', sub: "Room #12 · Wa'ad Alhammadi · Scheduled 9:00 AM" },
  { id: 3, kind: 'exam', title: 'Mid-term English Exam', sub: 'Grade 7 · 40 questions · anti-cheat enabled' },
  { id: 4, kind: 'exam', title: 'Placement Test — Level 3', sub: '12 candidates · auto-graded' },
  { id: 5, kind: 'message', title: 'Re: Homework deadline', sub: 'CE4 Messenger · Sara G9 · 2h ago' },
  { id: 6, kind: 'recording', title: 'Fractions Mastery', sub: 'Mathematics G5 · 48 min · 1080p' },
  { id: 7, kind: 'recording', title: 'Past Tense Deep-Dive', sub: 'English G6 · 36 min · 720p' },
  { id: 8, kind: 'report', title: 'Daily Performance — June 9', sub: '186 students · delivered to parents' },
  { id: 9, kind: 'report', title: 'Triple Report — Grade 8', sub: 'Academic · behaviour · attendance' },
  { id: 10, kind: 'user', title: 'Ahmed Al-Sharabi', sub: 'Student · Grade 6 · Active' },
  { id: 11, kind: 'user', title: 'Nadia Alqaiti', sub: 'Teacher · ICT · 4.9★ rating' },
  { id: 12, kind: 'message', title: 'Arabic alert raised', sub: 'Classroom #1 · resolved by supervisor' },
]

const FILTERS: (Kind | 'all')[] = ['all', 'classroom', 'exam', 'message', 'recording', 'report', 'user']

export function GlobalSearchPage() {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Kind | 'all'>('all')

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    return DATA.filter(r => {
      if (filter !== 'all' && r.kind !== filter) return false
      if (!term) return true
      return r.title.toLowerCase().includes(term) || r.sub.toLowerCase().includes(term)
    })
  }, [q, filter])

  const grouped = useMemo(() => {
    const g: Partial<Record<Kind, Result[]>> = {}
    results.forEach(r => { (g[r.kind] ??= []).push(r) })
    return g
  }, [results])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-gradient-aurora">🔎 {t('nav.globalsearch')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Search everything — classrooms, exams, messages, recordings, reports & people</p>
      </div>

      <div className="rounded-2xl p-1.5 relative overflow-hidden"
        style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.3)' }}>
        <div className="absolute top-0 left-0 right-0 h-[1.5px]"
          style={{ background: 'linear-gradient(90deg,transparent,#2563eb,transparent)' }} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder="Type to search across the whole platform…"
          className="w-full bg-transparent px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-full transition-all capitalize"
            style={{ background: filter === f ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#fff' : '#94a3b8' }}>
            {f === 'all' ? 'All results' : KIND_META[f].label}
          </button>
        ))}
        <span className="text-[10px] text-gray-600 ml-auto">{results.length} results</span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-gray-400">No matches for “{q}”</p>
        </div>
      ) : (
        <div className="space-y-5">
          {(Object.keys(grouped) as Kind[]).map(kind => (
            <div key={kind}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>{KIND_META[kind].icon}</span> {KIND_META[kind].label}s
                <span className="text-gray-700">· {grouped[kind]!.length}</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {grouped[kind]!.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
                    style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${KIND_META[kind].color}22` }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: `${KIND_META[kind].color}1a`, border: `1px solid ${KIND_META[kind].color}33` }}>
                      {KIND_META[kind].icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{r.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{r.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
