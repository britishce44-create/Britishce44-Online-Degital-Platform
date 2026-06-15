import { useEffect, useState, useCallback } from 'react'
import {
  apiGet, apiPost, apiPatch, apiDelete, ApiError,
  type EvalTemplate, type EvalCriterion, type EvalSheet, type Report, type GoogleStatus,
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

const card = { background: 'rgba(8,14,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' } as const
const fld = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } as const

export function EvalAdmin() {
  const [sub, setSub] = useState<'tables' | 'reports'>('tables')
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [templates, setTemplates] = useState<EvalTemplate[]>([])
  const [sheets, setSheets] = useState<EvalSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [editing, setEditing] = useState<Report | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const [newTpl, setNewTpl] = useState<{ name: string; nameAr: string; layout: 'columns' | 'weekly' }>({ name: '', nameAr: '', layout: 'columns' })
  const [newCrit, setNewCrit] = useState<Record<number, { labelEn: string; labelAr: string; kind: 'score' | 'text'; maxScore: number }>>({})

  const flash = (kind: 'ok' | 'err', text: string) => { setMsg({ kind, text }); setTimeout(() => setMsg(null), 4000) }

  const loadTemplates = useCallback(async () => {
    const d = await apiGet<{ templates: EvalTemplate[] }>('/eval/templates?all=1')
    setTemplates(d.templates)
  }, [])
  const loadSheets = useCallback(async () => {
    const d = await apiGet<{ sheets: EvalSheet[] }>('/eval/sheets')
    setSheets(d.sheets)
  }, [])
  const loadBase = useCallback(async () => {
    try {
      const [g] = await Promise.all([apiGet<GoogleStatus>('/google/status'), loadTemplates(), loadSheets()])
      setGoogle(g)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed to load') }
  }, [loadTemplates, loadSheets])
  useEffect(() => { loadBase() }, [loadBase])

  const loadReports = useCallback(async (sheetId: number) => {
    try {
      const d = await apiGet<{ reports: Report[] }>(`/reports?evalSheetId=${sheetId}`)
      setReports(d.reports)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed to load reports') }
  }, [])
  const openSheet = (id: number) => { setSelectedSheet(id); loadReports(id) }

  const tplName = useCallback((id: number) => templates.find(t => t.id === id)?.name ?? `Table ${id}`, [templates])

  /* ── Template CRUD ── */
  const addTemplate = async () => {
    if (!newTpl.name.trim()) return flash('err', 'Table name is required.')
    setBusy(true)
    try {
      await apiPost('/eval/templates', { name: newTpl.name, nameAr: newTpl.nameAr || null, layout: newTpl.layout })
      setNewTpl({ name: '', nameAr: '', layout: 'columns' })
      await loadTemplates()
      flash('ok', 'Table created.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const renameTemplate = async (t: EvalTemplate) => {
    const name = prompt('Table name (English)', t.name)
    if (name == null) return
    const nameAr = prompt('Table name (Arabic)', t.nameAr ?? '') ?? t.nameAr
    setBusy(true)
    try { await apiPatch(`/eval/templates/${t.id}`, { name, nameAr }); await loadTemplates(); flash('ok', 'Table renamed.') }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const toggleTemplate = async (t: EvalTemplate) => {
    setBusy(true)
    try { await apiPatch(`/eval/templates/${t.id}`, { active: !t.active }); await loadTemplates() }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const deleteTemplate = async (t: EvalTemplate) => {
    if (!confirm(`Delete table "${t.name}" and all its sheets, scores and reports? This cannot be undone.`)) return
    setBusy(true)
    try { await apiDelete(`/eval/templates/${t.id}`); await Promise.all([loadTemplates(), loadSheets()]); flash('ok', 'Table deleted.') }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  /* ── Criteria CRUD ── */
  const addCrit = async (tid: number) => {
    const n = newCrit[tid] ?? { labelEn: '', labelAr: '', kind: 'score' as const, maxScore: 5 }
    if (!n.labelEn.trim()) return flash('err', 'English label is required.')
    setBusy(true)
    try {
      await apiPost(`/eval/templates/${tid}/criteria`, { labelEn: n.labelEn, labelAr: n.labelAr || null, kind: n.kind, maxScore: n.maxScore })
      setNewCrit(p => ({ ...p, [tid]: { labelEn: '', labelAr: '', kind: 'score', maxScore: 5 } }))
      await loadTemplates()
      flash('ok', 'Criterion added.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const editCrit = async (c: EvalCriterion) => {
    const labelEn = prompt('Criterion (English)', c.labelEn)
    if (labelEn == null) return
    const labelAr = prompt('Criterion (Arabic)', c.labelAr ?? '') ?? c.labelAr
    setBusy(true)
    try { await apiPatch(`/eval/criteria/${c.id}`, { labelEn, labelAr }); await loadTemplates() }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const toggleCrit = async (c: EvalCriterion) => {
    setBusy(true)
    try { await apiPatch(`/eval/criteria/${c.id}`, { active: !c.active }); await loadTemplates() }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const deleteCrit = async (c: EvalCriterion) => {
    if (!confirm(`Delete criterion "${c.labelEn}"? Its scores will be removed.`)) return
    setBusy(true)
    try { await apiDelete(`/eval/criteria/${c.id}`); await loadTemplates(); flash('ok', 'Criterion deleted.') }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const dupCrit = async (tid: number, c: EvalCriterion) => {
    setBusy(true)
    try {
      await apiPost(`/eval/templates/${tid}/criteria`, { labelEn: `${c.labelEn} (copy)`, labelAr: c.labelAr, kind: c.kind, maxScore: c.maxScore })
      await loadTemplates(); flash('ok', 'Criterion duplicated.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const moveCrit = async (list: EvalCriterion[], idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= list.length) return
    const a = list[idx], b = list[j]
    setBusy(true)
    try {
      await Promise.all([
        apiPatch(`/eval/criteria/${a.id}`, { orderIndex: b.orderIndex }),
        apiPatch(`/eval/criteria/${b.id}`, { orderIndex: a.orderIndex }),
      ])
      await loadTemplates()
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  /* ── Reports ── */
  const setSheetStatus = async (id: number, status: string) => {
    setBusy(true)
    try { await apiPatch(`/eval/sheets/${id}`, { status }); await loadSheets(); flash('ok', `Sheet set to ${status}.`) }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const generateAll = async (sheetId: number) => {
    setBusy(true)
    try { const r = await apiPost<{ created: number }>(`/eval/sheet/${sheetId}/generate`); await loadReports(sheetId); flash('ok', `Generated ${r.created} report draft(s).`) }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const sendAll = async (sheetId: number) => {
    setBusy(true)
    try { const r = await apiPost<{ sent: number }>(`/eval/sheet/${sheetId}/send`); await loadReports(sheetId); flash('ok', `Delivery attempted for ${r.sent} report(s).`) }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const sendOne = async (r: Report) => {
    setBusy(true)
    try { const res = await apiPost<{ email: string; drive: string }>(`/reports/${r.id}/send`); if (selectedSheet) await loadReports(selectedSheet); flash('ok', `Delivery — email: ${res.email}, drive: ${res.drive}.`) }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const flush = async () => {
    setBusy(true)
    try { const res = await apiPost<{ processed: number }>('/eval/flush'); if (selectedSheet) await loadReports(selectedSheet); flash('ok', `Flushed ${res.processed} pending deliveries.`) }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }
  const saveEdit = async () => {
    if (!editing) return
    setBusy(true)
    try { await apiPatch(`/reports/${editing.id}`, { body: editing.body, recipientEmail: editing.recipientEmail }); if (selectedSheet) await loadReports(selectedSheet); setEditing(null); flash('ok', 'Report updated.') }
    catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {/* Google status */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-bold text-white">🔗 Google Delivery · Teacher Evaluations</p>
            <p className="text-[10px] text-white/40 mt-0.5">
              Sender: {google?.sender ?? '—'} · Reports go to each teacher's Gmail and archive to the Britishce44 Drive “Teacher Evaluations” folder.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['gmail', 'drive', 'calendar'] as const).map(k => (
              <span key={k} className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                style={{ background: google?.[k] ? 'rgba(0,174,116,0.15)' : 'rgba(148,163,184,0.12)', color: google?.[k] ? '#34d399' : '#94a3b8' }}>
                {google?.[k] ? '●' : '○'} {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{ background: msg.kind === 'ok' ? 'rgba(0,174,116,0.12)' : 'rgba(239,68,68,0.12)', color: msg.kind === 'ok' ? '#34d399' : '#f87171', border: `1px solid ${msg.kind === 'ok' ? 'rgba(0,174,116,0.3)' : 'rgba(239,68,68,0.3)'}` }}>{msg.text}</div>
      )}

      <div className="flex items-center gap-2">
        {(['tables', 'reports'] as const).map(s => (
          <button key={s} onClick={() => setSub(s)}
            className="text-[11px] font-bold px-3.5 py-2 rounded-xl transition capitalize"
            style={{ background: sub === s ? 'rgba(0,174,116,0.2)' : 'rgba(255,255,255,0.04)', color: sub === s ? '#34d399' : '#94a3b8', border: `1px solid ${sub === s ? 'rgba(0,174,116,0.35)' : 'rgba(255,255,255,0.06)'}` }}>
            {s === 'tables' ? 'Tables & Criteria' : 'Sheets & Reports'}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={flush} disabled={busy}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40"
          style={{ background: 'rgba(63,186,235,0.18)', border: '1px solid rgba(63,186,235,0.35)' }}>⟳ Flush Pending</button>
      </div>

      {/* ── TABLES & CRITERIA ── */}
      {sub === 'tables' && (
        <div className="space-y-4">
          {templates.map(t => {
            const draft = newCrit[t.id] ?? { labelEn: '', labelAr: '', kind: 'score' as const, maxScore: 5 }
            return (
              <div key={t.id} className="rounded-2xl overflow-hidden" style={card}>
                <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.name} {t.nameAr && <span className="text-white/40 font-normal" style={{ fontFamily: 'Tajawal,sans-serif' }}>· {t.nameAr}</span>}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{t.layout === 'weekly' ? 'Weekly grid (Sat–Thu)' : 'Criteria columns'} · {t.criteria.length} criteria</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => renameTemplate(t)} className="text-[9px] font-bold px-2 py-1 rounded-lg text-sky-300" style={{ background: 'rgba(63,186,235,0.12)' }}>Rename</button>
                    <button onClick={() => toggleTemplate(t)} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: t.active ? 'rgba(0,174,116,0.15)' : 'rgba(148,163,184,0.12)', color: t.active ? '#34d399' : '#94a3b8' }}>{t.active ? '● Active' : '○ Inactive'}</button>
                    <button onClick={() => deleteTemplate(t)} className="text-[9px] font-bold px-2 py-1 rounded-lg text-red-300" style={{ background: 'rgba(239,68,68,0.12)' }}>Delete</button>
                  </div>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {t.criteria.map((c, i) => (
                    <div key={c.id} className="px-4 py-2 flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveCrit(t.criteria, i, -1)} disabled={busy || i === 0} className="text-[9px] text-gray-400 disabled:opacity-20 leading-none">▲</button>
                        <button onClick={() => moveCrit(t.criteria, i, 1)} disabled={busy || i === t.criteria.length - 1} className="text-[9px] text-gray-400 disabled:opacity-20 leading-none">▼</button>
                      </div>
                      <span className="text-[10px] text-gray-600 w-5">{i + 1}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: c.kind === 'text' ? 'rgba(167,139,250,0.15)' : 'rgba(63,186,235,0.15)', color: c.kind === 'text' ? '#c4b5fd' : '#7dd3fc' }}>{c.kind === 'text' ? 'TEXT' : `1–${c.maxScore}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{c.labelEn}</p>
                        {c.labelAr && <p className="text-[10px] text-white/40 truncate" style={{ fontFamily: 'Tajawal,sans-serif' }}>{c.labelAr}</p>}
                      </div>
                      <button onClick={() => editCrit(c)} className="text-[9px] font-bold px-2 py-1 rounded-lg text-sky-300" style={{ background: 'rgba(63,186,235,0.1)' }}>Edit</button>
                      <button onClick={() => dupCrit(t.id, c)} className="text-[9px] font-bold px-2 py-1 rounded-lg text-white/60" style={{ background: 'rgba(255,255,255,0.05)' }}>Duplicate</button>
                      <button onClick={() => toggleCrit(c)} className="text-[9px] font-bold px-2 py-1 rounded-lg" style={{ background: c.active ? 'rgba(0,174,116,0.15)' : 'rgba(148,163,184,0.12)', color: c.active ? '#34d399' : '#94a3b8' }}>{c.active ? '●' : '○'}</button>
                      <button onClick={() => deleteCrit(c)} className="text-[9px] font-bold px-2 py-1 rounded-lg text-red-300" style={{ background: 'rgba(239,68,68,0.1)' }}>✕</button>
                    </div>
                  ))}
                </div>
                {/* add criterion */}
                <div className="px-4 py-3 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <input value={draft.labelEn} onChange={e => setNewCrit(p => ({ ...p, [t.id]: { ...draft, labelEn: e.target.value } }))} placeholder="English label"
                    className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1 min-w-28" style={fld} />
                  <input value={draft.labelAr} onChange={e => setNewCrit(p => ({ ...p, [t.id]: { ...draft, labelAr: e.target.value } }))} placeholder="Arabic label" dir="rtl"
                    className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1 min-w-28" style={fld} />
                  <select value={draft.kind} onChange={e => setNewCrit(p => ({ ...p, [t.id]: { ...draft, kind: e.target.value as 'score' | 'text' } }))}
                    className="px-2 py-1.5 rounded-lg text-xs text-white outline-none cursor-pointer" style={fld}>
                    <option value="score" style={{ background: '#150D79' }}>Score</option>
                    <option value="text" style={{ background: '#150D79' }}>Text</option>
                  </select>
                  {draft.kind === 'score' && (
                    <input type="number" min={1} max={10} value={draft.maxScore} onChange={e => setNewCrit(p => ({ ...p, [t.id]: { ...draft, maxScore: Number(e.target.value) || 5 } }))}
                      className="px-2 py-1.5 rounded-lg text-xs text-white outline-none w-16" style={fld} title="Max score" />
                  )}
                  <button onClick={() => addCrit(t.id)} disabled={busy}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: 'rgba(0,174,116,0.2)', border: '1px solid rgba(0,174,116,0.35)' }}>+ Add</button>
                </div>
              </div>
            )
          })}

          {/* New table */}
          <div className="rounded-2xl p-4" style={card}>
            <p className="text-xs font-bold text-white mb-2">➕ New evaluation table</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input value={newTpl.name} onChange={e => setNewTpl(v => ({ ...v, name: e.target.value }))} placeholder="Table name (English)"
                className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1 min-w-32" style={fld} />
              <input value={newTpl.nameAr} onChange={e => setNewTpl(v => ({ ...v, nameAr: e.target.value }))} placeholder="اسم الجدول" dir="rtl"
                className="px-3 py-1.5 rounded-lg text-xs text-white outline-none flex-1 min-w-32" style={fld} />
              <select value={newTpl.layout} onChange={e => setNewTpl(v => ({ ...v, layout: e.target.value as 'columns' | 'weekly' }))}
                className="px-2 py-1.5 rounded-lg text-xs text-white outline-none cursor-pointer" style={fld}>
                <option value="columns" style={{ background: '#150D79' }}>Criteria columns</option>
                <option value="weekly" style={{ background: '#150D79' }}>Weekly (Sat–Thu)</option>
              </select>
              <button onClick={addTemplate} disabled={busy}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: 'rgba(0,174,116,0.2)', border: '1px solid rgba(0,174,116,0.35)' }}>+ Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHEETS & REPORTS ── */}
      {sub === 'reports' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-2xl overflow-hidden self-start" style={card}>
            <div className="px-4 py-3 text-xs font-bold text-white border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>Evaluation Sheets</div>
            {sheets.length === 0 && <div className="px-4 py-6 text-center text-[11px] text-gray-500">No sheets yet.</div>}
            {sheets.map(s => (
              <div key={s.id} className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: s.id === selectedSheet ? 'rgba(0,174,116,0.06)' : 'transparent' }}>
                <button onClick={() => openSheet(s.id)} className="w-full text-left">
                  <p className="text-xs font-semibold text-white truncate">{tplName(s.templateId)}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{s.termLabel}{s.weekLabel ? ` · ${s.weekLabel}` : ''}</p>
                </button>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Badge value={s.status} />
                  {s.status !== 'open' && <button onClick={() => setSheetStatus(s.id, 'open')} disabled={busy} className="text-[9px] font-bold px-2 py-0.5 rounded-full text-sky-300" style={{ background: 'rgba(63,186,235,0.12)' }}>Reopen</button>}
                  {s.status !== 'locked' && <button onClick={() => setSheetStatus(s.id, 'locked')} disabled={busy} className="text-[9px] font-bold px-2 py-0.5 rounded-full text-gray-300" style={{ background: 'rgba(148,163,184,0.12)' }}>Lock</button>}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-3">
            {!selectedSheet && <div className="rounded-2xl p-10 text-center text-sm text-gray-500" style={card}>Select a sheet to review its teacher reports.</div>}
            {selectedSheet && (
              <>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => generateAll(selectedSheet)} disabled={busy}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40" style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>✨ (Re)generate Drafts</button>
                  <button onClick={() => sendAll(selectedSheet)} disabled={busy}
                    className="text-[11px] font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#00ae74,#34d399)' }}>📨 Send All</button>
                </div>
                {reports.length === 0 && <div className="rounded-2xl p-8 text-center text-sm text-gray-500" style={card}>No reports yet — generate drafts or submit the sheet first.</div>}
                {reports.map(r => (
                  <div key={r.id} className="rounded-2xl p-4" style={card}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{r.recipientName ?? r.teacherName ?? 'Teacher'} <span className="text-white/40">({r.language})</span></p>
                        <p className="text-[10px] text-gray-500 mt-0.5">→ {r.recipientEmail}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge value={r.status} />
                          <span className="text-[9px] text-gray-500">email:</span><Badge value={r.emailStatus} />
                          <span className="text-[9px] text-gray-500">drive:</span><Badge value={r.driveStatus} />
                          {r.driveLink && <a href={r.driveLink} target="_blank" rel="noreferrer" className="text-[9px] text-sky-400 underline">Drive ↗</a>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setEditing(r)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-sky-300" style={{ background: 'rgba(63,186,235,0.12)', border: '1px solid rgba(63,186,235,0.25)' }}>Edit</button>
                        <button onClick={() => sendOne(r)} disabled={busy} className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-emerald-300 disabled:opacity-40" style={{ background: 'rgba(0,174,116,0.12)', border: '1px solid rgba(0,174,116,0.25)' }}>Send</button>
                      </div>
                    </div>
                    <pre dir={r.language === 'ar' ? 'rtl' : 'ltr'}
                      className="mt-3 text-[10px] text-white/70 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto custom-scroll p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>{r.body}</pre>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl p-5 space-y-3" style={{ background: '#150D79', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-white">Edit report — {editing.recipientName ?? 'Teacher'}</p>
            <div>
              <label className="text-[10px] text-gray-400">Recipient email</label>
              <input value={editing.recipientEmail ?? ''} onChange={e => setEditing({ ...editing, recipientEmail: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none mt-1" style={fld} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Body</label>
              <textarea value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })}
                dir={editing.language === 'ar' ? 'rtl' : 'ltr'} rows={10}
                className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none mt-1 custom-scroll" style={fld} />
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
