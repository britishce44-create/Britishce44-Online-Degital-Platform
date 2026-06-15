import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { apiGet, apiPost, ApiError, type AppNotification } from '@/lib/api'

type Channel = 'inapp' | 'email' | 'sms' | 'whatsapp' | 'telegram'

const CHANNELS: { key: Channel; icon: string; label: string; color: string; on: boolean }[] = [
  { key: 'inapp', icon: '🔔', label: 'In-App', color: '#2563eb', on: true },
  { key: 'email', icon: '📧', label: 'Email', color: '#00ae74', on: true },
  { key: 'sms', icon: '📱', label: 'SMS', color: '#34d399', on: false },
  { key: 'whatsapp', icon: '🟢', label: 'WhatsApp', color: '#25d366', on: true },
  { key: 'telegram', icon: '✈️', label: 'Telegram', color: '#229ed9', on: false },
]

const CAT_COLOR: Record<string, string> = {
  assessment: '#3FBAEB', reminder: '#fbbf24', report: '#00ae74',
  academic: '#2563eb', exams: '#7dd3fc', finance: '#34d399', system: '#94a3b8',
}
const catColor = (c: string | null) => (c && CAT_COLOR[c]) || '#2563eb'

function relTime(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotificationsPage() {
  const { t } = useI18n()
  const [channels, setChannels] = useState(CHANNELS)
  const [cat, setCat] = useState<string>('all')
  const [feed, setFeed] = useState<AppNotification[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await apiGet<{ notifications: AppNotification[] }>('/notifications')
      setFeed(d.notifications)
      setErr(null)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const markRead = async (id: number) => {
    setFeed(f => f.map(x => x.id === id ? { ...x, read: true } : x))
    try { await apiPost(`/notifications/${id}/read`) } catch { /* optimistic */ }
  }
  const markAll = async () => {
    const unreadIds = feed.filter(f => !f.read).map(f => f.id)
    setFeed(f => f.map(x => ({ ...x, read: true })))
    await Promise.allSettled(unreadIds.map(id => apiPost(`/notifications/${id}/read`)))
  }

  const cats = ['all', ...Array.from(new Set(feed.map(f => f.category).filter(Boolean) as string[]))]
  const visible = cat === 'all' ? feed : feed.filter(f => f.category === cat)
  const unread = feed.filter(f => !f.read).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">🔔 {t('nav.notifications')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time alerts from assessments, reminders & reports</p>
        </div>
        <button onClick={markAll} disabled={unread === 0}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40"
          style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.3)' }}>
          Mark all read · {unread} unread
        </button>
      </div>

      {err && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{err}</div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Channels */}
        <div className="rounded-2xl p-4 relative overflow-hidden self-start"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0, 174, 116,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-[1.5px]"
            style={{ background: 'linear-gradient(90deg,transparent,#00ae74,transparent)' }} />
          <p className="text-xs font-bold text-white mb-3">📡 Delivery Channels</p>
          <div className="space-y-2">
            {channels.map(c => (
              <button key={c.key}
                onClick={() => setChannels(cs => cs.map(x => x.key === c.key ? { ...x, on: !x.on } : x))}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                style={{ background: c.on ? `${c.color}1a` : 'rgba(255,255,255,0.03)', border: `1px solid ${c.on ? `${c.color}40` : 'rgba(255,255,255,0.05)'}` }}>
                <span className="text-base">{c.icon}</span>
                <span className="text-[11px] font-semibold text-white flex-1 text-left">{c.label}</span>
                <span className="w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                  style={{ background: c.on ? c.color : 'rgba(255,255,255,0.1)' }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: c.on ? '18px' : '2px' }} />
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-[9px] text-gray-500">Quiet hours · 10 PM – 6 AM (Yemen)</p>
          </div>
        </div>

        {/* Feed */}
        <div className="md:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'rgba(37,99,235,0.1)' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all capitalize"
                style={{ background: cat === c ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.04)', color: cat === c ? '#fff' : '#94a3b8' }}>
                {c}
              </button>
            ))}
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(37,99,235,0.06)' }}>
            {loading && <div className="px-4 py-8 text-center text-xs text-gray-500">Loading…</div>}
            {!loading && visible.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-500">No notifications.</div>}
            {visible.map((n, i) => {
              const color = catColor(n.category)
              return (
                <motion.button key={n.id} onClick={() => !n.read && markRead(n.id)}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>{n.icon || '🔔'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{n.title}</p>
                    {n.body && <p className="text-[10px] text-gray-500 mt-0.5">{n.body}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] text-gray-600">{relTime(n.createdAt)}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
