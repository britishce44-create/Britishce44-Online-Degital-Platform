import { useEffect, useState, useCallback } from 'react'
import {
  apiGet, apiPost, apiPatch, ApiError,
  type Sheet, type Course, type Criterion, type Report, type GoogleStatus,
} from '@/lib/api'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(63,186,235,0.15)', color: '#3FBAEB' },
  submitted: { bg: 'rgba(0,174,116,0.15)', color: '#00AE74' },
  locked: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  draft: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  edited: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  sent: { bg: 'rgba(0,174,116,0.15)', color: '#34d399' },
  pending: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  archived: { bg: 'rgba(0,174,116,0.15)', color: '#34d399' },
  skipped: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  failed: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}
const pill = (s: string) => STATUS_STYLE[s] ?? STATUS_STYLE.pending

function Badge({ value }: { value: string }) {
  const st = pill(value)
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{value}</span>
}

export function AssessmentAdmin() {
  const [sub, setSub] = useState<'sheets' | 'criteria'>('sheets')
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [editing, setEditing] = useState<Report | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [newCrit, setNewCrit] = useState({ labelEn: '', labelAr: '' })

  const flash = (kind: 'ok' | 'err', text: string) => { setMsg({ kind, text }); setTimeout(() => setMsg(null), 4000) }
  const courseName = useCallback((id: number) => courses.find(c => c.id === id)?.name ?? `Course ${id}`, [courses])

  const loadBase = useCallback(async () => {
    try {
      const [g, c, s, cr] = await Promise.all([
        apiGet<GoogleStatus>('/google/status'),
        apiGet<{ courses: Course[] }>('/assessment/courses'),
        apiGet<{ sheets: Sheet[] }>('/assessment/sheets'),
        apiGet<{ criteria: Criterion[] }>('/assessment/criteria?all=1'),
      ])
      setGoogle(g); setCourses(c.courses); setSheets(s.sheets); setCriteria(cr.criteria)
    } catch (e) {
      flash('err', e instanceof ApiError ? e.message : 'Failed to load')
    }
  }, [])
  useEffect(() => { loadBase() }, [loadBase])

  const loadReports = useCallback(async (sheetId: number) => {
    try {
      const d = await apiGet<{ reports: Report[] }>(`/reports?sheetId=${sheetId}`)
      setReports(d.reports)
    } catch (e) {
      flash('err', e instanceof ApiError ? e.message : 'Failed to load reports')
    }
  }, [])

  const openSheet = (id: number) => { setSelectedSheet(id); loadReports(id) }

  const setSheetStatus = async (id: number, status: string) => {
    setBusy(true)
    try {
      await apiPatch(`/assessment/sheet/${id}`, { status })
      await loadBase()
      flash('ok', `Sheet set to ${status}.`)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const generate = async (sheetId: number) => {
    setBusy(true)
    try {
      const r = await apiPost<{ created: number }>('/reports/generate', { sheetId })
      await loadReports(sheetId)
      flash('ok', `Generated ${r.created} report drafts.`)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const sendOne = async (r: Report) => {
    setBusy(true)
    try {
      const res = await apiPost<{ email: string; drive: string }>(`/reports/${r.id}/send`)
      await loadReports(r.sheetId)
      flash('ok', `Delivery attempted — email: ${res.email}, drive: ${res.drive}.`)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const sendSheet = async (sheetId: number) => {
    setBusy(true)
    try {
      const res = await apiPost<{ sent: number }>('/reports/send-sheet', { sheetId })
      await loadReports(sheetId)
      flash('ok', `Sent ${res.sent} reports (pending entries recorded if Google is offline).`)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const flush = async () => {
    setBusy(true)
    try {
      const res = await apiPost<{ processed: number }>('/reports/flush')
      if (selectedSheet) await loadReports(selectedSheet)
      flash('ok', `Flushed ${res.processed} pending deliveries.`)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const saveEdit = async () => {
    if (!editing) return
    setBusy(true)
    try {
      await apiPatch(`/reports/${editing.id}`, {
        body: editing.body, level: editing.level, recipientEmail: editing.recipientEmail,
      })
      await loadReports(editing.sheetId)
      setEditing(null)
      flash('ok', 'Report updated.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const reloadCrit = async () => {
    const d = await apiGet<{ criteria: Criterion[] }>('/assessment/criteria?all=1')
    setCriteria(d.criteria)
  }

  const toggleCrit = async (c: Criterion) => {
    setBusy(true)
    try {
      await apiPatch(`/assessment/criteria/${c.id}`, { active: !c.active })
      await reloadCrit()
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const editCrit = async (c: Criterion) => {
    const labelEn = prompt('Criterion (English)', c.labelEn)
    if (labelEn == null) return
    const labelAr = prompt('Criterion (Arabic)', c.labelAr ?? '') ?? c.labelAr
    setBusy(true)
    try { await apiPatch(`/assessment/criteria/${c.id}`, { labelEn, labelAr }); await reloadCrit(); flash('ok', 'Criterion updated.') }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const moveCrit = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= criteria.length) return
    const a = criteria[idx], b = criteria[j]
    setBusy(true)
    try {
      await Promise.all([
        apiPatch(`/assessment/criteria/${a.id}`, { orderIndex: b.orderIndex }),
        apiPatch(`/assessment/criteria/${b.id}`, { orderIndex: a.orderIndex }),
      ])
      await reloadCrit()
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const addCrit = async () => {
    if (!newCrit.labelEn || !newCrit.labelAr) return flash('err', 'Both English and Arabic labels are required.')
    setBusy(true)
    try {
      await apiPost('/assessment/criteria', newCrit)
      const d = await apiGet<{ criteria: Criterion[] }>('/assessment/criteria?all=1')
      setCriteria(d.criteria)
      setNewCrit({ labelEn: '', labelAr: '' })
      flash('ok', 'Criterion added.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const card = { background: 'rgba(8,14,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' } as const

  return (
    <div className="space-y-4">
      {/* Google connection status */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-white">🔗 Google Delivery</p>
            <p className="text-[10px] text-white/40 mt-0.5">
              Sender: {google?.sender ?? '—'} · {google?.connected
                ? 'Connected — reports send via Gmail and archive to Drive.'
                : 'Not connected — deliveries are recorded as pending and flush automatically once authorized.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['gmail', 'drive', 'calendar'] as const).map(k => (
              <span key={k} className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                style={{
                  background: google?.[k] ? 'rgba(0,174,116,0.15)' : 'rgba(148,163,184,0.12)',
                  color: google?.[k] ? '#34d399' : '#94a3b8',
                }}>
                {google?.[k] ? '●' : '○'} {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{
            background: msg.kind === 'ok' ? 'rgba(0,174,116,0.12)' : 'rgba(239,68,68,0.12)',
            color: msg.kind === 'ok' ? '#34d399' : '#f87171',
            border: `1px solid ${msg.kind === 'ok' ? 'rgba(0,174,116,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>{msg.text}</div>
      )}

      <div className="flex items-center gap-2">
        {(['sheets', 'criteria'] as const).map(s => (
          <button key={s} onClick={() => setSub(s)}
            className="text-[11px] font-bold px-3.5 py-2 rounded-xl transition capitalize"
            style={{
              background: sub === s ? 'rgba(0,174,116,0.2)' : 'rgba(255,255,255,0.04)',
              color: sub === s ? '#34d399' : '#94a3b8',
              border: `1px solid ${sub === s ? 'rgba(0,174,116,0.35)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            {s === 'sheets' ? 'Sheets & Reports' : 'Criteria'}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={flush} disabled={busy}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40"
          style={{ background: 'rgba(63,186,235,0.18)', border: '1px solid rgba(63,186,235,0.35)' }}>
          ⟳ Flush Pending
        </button>
      </div>

      {sub === 'sheets' && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Sheet list */}
          <div className="rounded-2xl overflow-hidden self-start" style={card}>
            <div className="px-4 py-3 text-xs font-bold text-white border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>Assessment Sheets</div>
            {sheets.length === 0 && <div className="px-4 py-6 text-center text-[11px] text-gray-500">No sheets yet.</div>}
            {sheets.map(s => (
              <div key={s.id} className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: s.id === selectedSheet ? 'rgba(0,174,116,0.06)' : 'transparent' }}>
                <button onClick={() => openSheet(s.id)} className="w-full text-left">
                  <p className="text-xs font-semibold text-white truncate">{courseName(s.courseId)}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{s.phase === 'first' ? 'First week' : 'Last week'} · day {s.teachingDay} · due {s.dueDate}</p>
                </button>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge value={s.status} />
                  {s.status !== 'open' && (
                    <button onClick={() => setSheetStatus(s.id, 'open')} disabled={busy}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-sky-300" style={{ background: 'rgba(63,186,235,0.12)' }}>Reopen</button>
                  )}
                  {s.status !== 'locked' && (
                    <button onClick={() => setSheetStatus(s.id, 'locked')} disabled={busy}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-gray-300" style={{ background: 'rgba(148,163,184,0.12)' }}>Lock</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Reports for sheet */}
          <div className="lg:col-span-2 space-y-3">
            {!selectedSheet && (
              <div className="rounded-2xl p-10 text-center text-sm text-gray-500" style={card}>Select a sheet to review its reports.</div>
            )}
            {selectedSheet && (
              <>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => generate(selectedSheet)} disabled={busy}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40"
                    style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>✨ (Re)generate Drafts</button>
                  <button onClick={() => sendSheet(selectedSheet)} disabled={busy}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#00ae74,#34d399)' }}>📨 Send All</button>
                </div>
                {reports.length === 0 && (
                  <div className="rounded-2xl p-8 text-center text-sm text-gray-500" style={card}>No reports yet — generate drafts or submit the sheet first.</div>
                )}
                {reports.map(r => (
                  <div key={r.id} className="rounded-2xl p-4" style={card}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{r.studentName} · <span className="capitalize text-white/60">{r.audience}</span> <span className="text-white/40">({r.language})</span></p>
                        <p className="text-[10px] text-gray-500 mt-0.5">→ {r.recipientName} · {r.recipientEmail}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge value={r.status} />
                          <span className="text-[9px] text-gray-500">email:</span><Badge value={r.emailStatus} />
                          <span className="text-[9px] text-gray-500">drive:</span><Badge value={r.driveStatus} />
                          {r.driveLink && <a href={r.driveLink} target="_blank" rel="noreferrer" className="text-[9px] text-sky-400 underline">Drive ↗</a>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setEditing(r)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-sky-300" style={{ background: 'rgba(63,186,235,0.12)', border: '1px solid rgba(63,186,235,0.25)' }}>Edit</button>
                        <button onClick={() => sendOne(r)} disabled={busy}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-emerald-300 disabled:opacity-40" style={{ background: 'rgba(0,174,116,0.12)', border: '1px solid rgba(0,174,116,0.25)' }}>Send</button>
                      </div>
                    </div>
                    <pre dir={r.language === 'ar' ? 'rtl' : 'ltr'}
                      className="mt-3 text-[10px] text-white/70 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto custom-scroll p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>{r.body}</pre>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {sub === 'criteria' && (
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="px-4 py-3 text-xs font-bold text-white border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span>Assessment Criteria</span>
            <span className="text-[9px] text-gray-500">{criteria.filter(c => c.active).length} active · {criteria.length} total</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {criteria.map((c, i) => (
              <div key={c.id} className="px-4 py-2.5 flex items-center gap-2.5">
                <div className="flex flex-col">
                  <button onClick={() => moveCrit(i, -1)} disabled={busy || i === 0} className="text-[9px] text-gray-400 disabled:opacity-20 leading-none">▲</button>
                  <button onClick={() => moveCrit(i, 1)} disabled={busy || i === criteria.length - 1} className="text-[9px] text-gray-400 disabled:opacity-20 leading-none">▼</button>
                </div>
                <span className="text-[10px] text-gray-600 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{c.labelEn}</p>
                  <p className="text-[10px] text-white/40" style={{ fontFamily: 'Tajawal,sans-serif' }}>{c.labelAr}</p>
                </div>
                <button onClick={() => editCrit(c)} disabled={busy}
                  className="text-[9px] font-bold px-2.5 py-1 rounded-full text-sky-300 disabled:opacity-40" style={{ background: 'rgba(63,186,235,0.12)' }}>Edit</button>
                <button onClick={() => toggleCrit(c)} disabled={busy}
                  className="text-[9px] font-bold px-2.5 py-1 rounded-full disabled:opacity-40"
                  style={{ background: c.active ? 'rgba(0,174,116,0.15)' : 'rgba(148,163,184,0.12)', color: c.active ? '#34d399' : '#94a3b8' }}>
                  {c.active ? '● Active' : '○ Inactive'}
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input value={newCrit.labelEn} onChange={e => setNewCrit(v => ({ ...v, labelEn: e.target.value }))} placeholder="English label"
              className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1 min-w-32" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input value={newCrit.labelAr} onChange={e => setNewCrit(v => ({ ...v, labelAr: e.target.value }))} placeholder="Arabic label" dir="rtl"
              className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1 min-w-32" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={addCrit} disabled={busy}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: 'rgba(0,174,116,0.2)', border: '1px solid rgba(0,174,116,0.35)' }}>+ Add</button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl p-5 space-y-3" style={{ background: '#150D79', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-white">Edit report — {editing.studentName} ({editing.audience})</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400">Level</label>
                <input value={editing.level ?? ''} onChange={e => setEditing({ ...editing, level: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none mt-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Recipient email</label>
                <input value={editing.recipientEmail ?? ''} onChange={e => setEditing({ ...editing, recipientEmail: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none mt-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Body</label>
              <textarea value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })}
                dir={editing.language === 'ar' ? 'rtl' : 'ltr'} rows={10}
                className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none mt-1 custom-scroll" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setEditing(null)} className="text-[11px] font-bold px-3 py-2 rounded-lg text-gray-300" style={{ background: 'rgba(148,163,184,0.12)' }}>Cancel</button>
              <button onClick={saveEdit} disabled={busy} className="text-[11px] font-bold px-4 py-2 rounded-lg text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#00ae74,#34d399)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
