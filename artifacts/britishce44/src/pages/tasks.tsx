import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { apiGet, apiPatch, ApiError, type Task } from '@/lib/api'

const TYPE_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  assessment_reminder: { label: 'Assessment', color: '#3FBAEB', icon: '📋' },
  milestone: { label: 'Milestone', color: '#00AE74', icon: '🎯' },
  default: { label: 'Task', color: '#94a3b8', icon: '✅' },
}
const typeFor = (t: string | null) => TYPE_LABEL[t ?? 'default'] ?? TYPE_LABEL.default

const todayKey = () => new Date().toISOString().slice(0, 10)

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiGet<{ tasks: Task[] }>('/tasks')
      setTasks(d.tasks)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = async (t: Task) => {
    const next = t.status === 'done' ? 'pending' : 'done'
    setBusyId(t.id)
    try {
      await apiPatch(`/tasks/${t.id}`, { status: next })
      setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const counts = useMemo(() => ({
    pending: tasks.filter(t => t.status === 'pending').length,
    done: tasks.filter(t => t.status === 'done').length,
    all: tasks.length,
  }), [tasks])

  const visible = useMemo(() => {
    const list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
    return [...list].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
  }, [tasks, filter])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">✅ Tasks Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assessment reminders and action items — generated automatically around each milestone.</p>
        </div>
        <button onClick={load}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white"
          style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.3)' }}>↻ Refresh</button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>
      )}

      <div className="flex gap-2">
        {(['pending', 'done', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-[11px] font-bold px-3.5 py-2 rounded-xl transition capitalize"
            style={{
              background: filter === f ? 'rgba(63,186,235,0.22)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#fff' : '#94a3b8',
              border: `1px solid ${filter === f ? 'rgba(63,186,235,0.4)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            {f} · {counts[f]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
        {loading && <div className="px-4 py-8 text-center text-[11px] text-gray-500">Loading…</div>}
        {!loading && visible.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">No {filter === 'all' ? '' : filter} tasks.</div>
        )}
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {visible.map((t, i) => {
            const tp = typeFor(t.type)
            const overdue = t.status === 'pending' && t.dueDate != null && t.dueDate < todayKey()
            const done = t.status === 'done'
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="px-4 py-3 flex items-start gap-3">
                <button onClick={() => toggle(t)} disabled={busyId === t.id}
                  className="w-5 h-5 rounded-md mt-0.5 flex-shrink-0 flex items-center justify-center transition"
                  style={{
                    background: done ? '#00ae74' : 'transparent',
                    border: `1.5px solid ${done ? '#00ae74' : 'rgba(255,255,255,0.25)'}`,
                  }}>
                  {done && <span className="text-white text-[10px]">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${done ? 'text-gray-500 line-through' : 'text-white'}`}>{t.title}</p>
                  {t.description && <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${tp.color}1a`, color: tp.color }}>{tp.icon} {tp.label}</span>
                    {t.dueDate && (
                      <span className="text-[9px]" style={{ color: overdue ? '#f87171' : '#94a3b8' }}>
                        {overdue ? '⚠ overdue · ' : 'due '}{t.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => toggle(t)} disabled={busyId === t.id}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition disabled:opacity-40"
                  style={{
                    background: done ? 'rgba(148,163,184,0.12)' : 'rgba(0,174,116,0.15)',
                    color: done ? '#94a3b8' : '#34d399',
                    border: `1px solid ${done ? 'rgba(148,163,184,0.25)' : 'rgba(0,174,116,0.3)'}`,
                  }}>
                  {done ? 'Reopen' : 'Mark done'}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
