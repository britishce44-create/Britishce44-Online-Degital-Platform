import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { apiGet, ApiError, type Report, type AppNotification } from '@/lib/api'

const CHILD_COLORS = ['#2563eb', '#00ae74', '#3FBAEB', '#fb923c', '#a78bfa']

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.round(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

interface ChildGroup {
  studentId: number
  name: string
  color: string
  reports: Report[]
}

export function ParentPortalPage() {
  const { t } = useI18n()
  const [reports, setReports] = useState<Report[]>([])
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      apiGet<{ reports: Report[] }>('/reports'),
      apiGet<{ notifications: AppNotification[] }>('/notifications'),
    ]).then(([r, n]) => {
      if (r.status === 'fulfilled') setReports(r.value.reports)
      else setErr(r.reason instanceof ApiError ? r.reason.message : 'Failed to load reports')
      if (n.status === 'fulfilled') setNotifs(n.value.notifications)
      setLoading(false)
    })
  }, [])

  const children = useMemo<ChildGroup[]>(() => {
    const map = new Map<number, ChildGroup>()
    for (const r of reports) {
      if (r.audience !== 'parent') continue
      let g = map.get(r.studentId)
      if (!g) {
        g = {
          studentId: r.studentId,
          name: r.studentName || `Student #${r.studentId}`,
          color: CHILD_COLORS[map.size % CHILD_COLORS.length],
          reports: [],
        }
        map.set(r.studentId, g)
      }
      g.reports.push(r)
    }
    return Array.from(map.values())
  }, [reports])

  useEffect(() => {
    if (active == null && children.length > 0) setActive(children[0].studentId)
  }, [children, active])

  const child = children.find(c => c.studentId === active) || null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-gradient-aurora">👨‍👩‍👧 {t('nav.parentportal')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your child’s in-class performance reports — تقارير الأداء الصفّي</p>
      </div>

      {err && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{err}</div>
      )}

      {loading && <div className="rounded-2xl p-8 text-center text-sm text-gray-500" style={{ background: 'rgba(26, 19, 92,0.7)' }}>Loading your reports…</div>}

      {!loading && children.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
          <p className="text-4xl mb-2">📭</p>
          <p className="text-sm font-bold text-white">No reports yet</p>
          <p className="text-xs text-gray-500 mt-1">Performance reports appear here after each assessment milestone.</p>
        </div>
      )}

      {!loading && children.length > 0 && (
        <>
          {/* Child switcher */}
          {children.length > 1 && (
            <div className="flex items-center gap-3 flex-wrap">
              {children.map(c => (
                <button key={c.studentId} onClick={() => setActive(c.studentId)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all"
                  style={{ background: active === c.studentId ? `${c.color}1f` : 'rgba(26, 19, 92,0.7)', border: `1px solid ${active === c.studentId ? `${c.color}55` : 'rgba(255,255,255,0.06)'}` }}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: c.color }}>{c.name.charAt(0)}</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">{c.name.split(' ')[0]}</p>
                    <p className="text-[9px] text-gray-500">{c.reports.length} report{c.reports.length === 1 ? '' : 's'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {child && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Reports', value: String(child.reports.length), color: '#2563eb' },
                  { label: 'Latest Level', value: child.reports[0]?.level || '—', color: '#3FBAEB' },
                  { label: 'Delivered', value: `${child.reports.filter(r => r.emailStatus === 'sent').length}/${child.reports.length}`, color: '#00ae74' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'rgba(26, 19, 92,0.7)', border: `1px solid ${s.color}20` }}>
                    <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Reports */}
                <div className="md:col-span-2 space-y-3">
                  {child.reports.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl p-4" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-bold text-white">{r.courseName || 'Course'}</p>
                          <p className="text-[9px] text-gray-500">{new Date(r.createdAt).toLocaleDateString()} · {r.level || 'Level —'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-2 py-1 rounded-full"
                            style={{ background: r.emailStatus === 'sent' ? 'rgba(0,174,116,0.18)' : 'rgba(148,163,184,0.15)', color: r.emailStatus === 'sent' ? '#00ae74' : '#94a3b8' }}>
                            ✉️ {r.emailStatus}
                          </span>
                          {r.driveLink ? (
                            <a href={r.driveLink} target="_blank" rel="noreferrer"
                              className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(63,186,235,0.18)', color: '#3FBAEB' }}>📁 archive</a>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>📁 {r.driveStatus}</span>
                          )}
                        </div>
                      </div>
                      <p dir="rtl" className="text-[13px] leading-relaxed text-white/85 whitespace-pre-wrap text-right"
                        style={{ fontFamily: "'Tajawal','Segoe UI',sans-serif" }}>{r.body}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="rounded-2xl overflow-hidden self-start" style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(0, 174, 116,0.18)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0, 174, 116,0.1)' }}>
                    <p className="text-xs font-bold text-white">🕒 Recent Activity</p>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'rgba(0, 174, 116,0.06)' }}>
                    {notifs.length === 0 && <div className="px-4 py-6 text-center text-[10px] text-gray-500">No recent activity.</div>}
                    {notifs.slice(0, 8).map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="px-4 py-3 flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>{e.icon || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/85">{e.title}</p>
                          <span className="text-[9px] text-gray-600">{relTime(e.createdAt)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
