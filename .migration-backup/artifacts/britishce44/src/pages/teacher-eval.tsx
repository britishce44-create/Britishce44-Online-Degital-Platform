import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/components/providers/auth-provider'
import {
  apiGet, apiPost, apiPatch, ApiError,
  type EvalTemplate, type EvalSheet, type EvalGrid, type EvalScoreCell,
} from '@/lib/api'

/* ── Theme ── */
const CARD = 'rgba(26,19,92,0.7)'
const BORDER = 'rgba(37,99,235,0.18)'
const GREEN = '#00AE74'
const SKY = '#3FBAEB'

/* Day numbers follow getUTCDay: Sat=6 … Thu=4. Weekly order is Sat→Thu. */
const DAY_LABELS: Record<number, { en: string; ar: string }> = {
  6: { en: 'Sat', ar: 'السبت' },
  0: { en: 'Sun', ar: 'الأحد' },
  1: { en: 'Mon', ar: 'الإثنين' },
  2: { en: 'Tue', ar: 'الثلاثاء' },
  3: { en: 'Wed', ar: 'الأربعاء' },
  4: { en: 'Thu', ar: 'الخميس' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: 'rgba(63,186,235,0.15)', color: SKY, label: 'Open' },
  submitted: { bg: 'rgba(0,174,116,0.15)', color: GREEN, label: 'Submitted' },
  locked: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'Locked' },
}

const EMPTY_CELL: EvalScoreCell = { score: null, note: null }

type ScoreState = Record<number, Record<number, Record<number, EvalScoreCell>>>
type MetaState = Record<number, Record<number, number | null>>

function cellColor(v: number | null, max: number): string {
  if (v == null) return 'rgba(255,255,255,0.04)'
  const ratio = v / max
  if (ratio <= 0.4) return 'rgba(239,68,68,0.22)'
  if (ratio <= 0.6) return 'rgba(245,158,11,0.22)'
  if (ratio <= 0.8) return 'rgba(63,186,235,0.22)'
  return 'rgba(0,174,116,0.25)'
}

export function TeacherEvalPage() {
  const { lang, isRTL } = useI18n()
  const { user } = useAuth()
  const isAcademic = user?.role === 'admin' || user?.role === 'supervisor'

  const [templates, setTemplates] = useState<EvalTemplate[]>([])
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [sheets, setSheets] = useState<EvalSheet[]>([])
  const [sheetId, setSheetId] = useState<number | null>(null)
  const [grid, setGrid] = useState<EvalGrid | null>(null)
  const [scores, setScores] = useState<ScoreState>({})
  const [dayMeta, setDayMeta] = useState<MetaState>({})
  const [teacherIdx, setTeacherIdx] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [newWeek, setNewWeek] = useState('')

  const flash = (kind: 'ok' | 'err', text: string) => { setMsg({ kind, text }); setTimeout(() => setMsg(null), 4500) }

  const template = useMemo(() => templates.find(t => t.id === templateId) ?? null, [templates, templateId])
  const isWeekly = grid?.template.layout === 'weekly'
  const editable = grid?.sheet.status === 'open'

  /* ── Loaders ── */
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiGet<{ templates: EvalTemplate[] }>('/eval/templates')
      setTemplates(d.templates)
      setTemplateId(prev => prev ?? d.templates[0]?.id ?? null)
    } catch (e) {
      flash('err', e instanceof ApiError ? e.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSheets = useCallback(async (tid: number) => {
    try {
      const d = await apiGet<{ sheets: EvalSheet[] }>(`/eval/sheets?templateId=${tid}`)
      setSheets(d.sheets)
      setSheetId(prev => {
        if (prev != null && d.sheets.some(s => s.id === prev)) return prev
        return d.sheets.find(s => s.status === 'open')?.id ?? d.sheets[0]?.id ?? null
      })
    } catch (e) {
      flash('err', e instanceof ApiError ? e.message : 'Failed to load sheets')
    }
  }, [])

  const loadGrid = useCallback(async (id: number) => {
    try {
      const g = await apiGet<EvalGrid>(`/eval/sheet/${id}`)
      setGrid(g)
      setScores(structuredClone(g.scores) as ScoreState)
      setDayMeta(structuredClone(g.dayMeta) as MetaState)
      setTeacherIdx(0)
      setDirty(false)
    } catch (e) {
      flash('err', e instanceof ApiError ? e.message : 'Failed to load sheet')
    }
  }, [])

  useEffect(() => { if (isAcademic) loadTemplates() }, [isAcademic, loadTemplates])
  useEffect(() => { if (templateId != null) loadSheets(templateId) }, [templateId, loadSheets])
  useEffect(() => { if (sheetId != null) loadGrid(sheetId); else setGrid(null) }, [sheetId, loadGrid])

  /* ── Cell helpers ── */
  const getCell = useCallback((t: number, c: number, d: number): EvalScoreCell =>
    scores[t]?.[c]?.[d] ?? EMPTY_CELL, [scores])

  const setCell = (t: number, c: number, d: number, patch: Partial<EvalScoreCell>) => {
    setScores(prev => {
      const next: ScoreState = { ...prev }
      next[t] = { ...(next[t] ?? {}) }
      next[t][c] = { ...(next[t][c] ?? {}) }
      next[t][c][d] = { ...(next[t][c][d] ?? EMPTY_CELL), ...patch }
      return next
    })
    setDirty(true)
  }

  const setMinutes = (t: number, d: number, minutes: number | null) => {
    setDayMeta(prev => ({ ...prev, [t]: { ...(prev[t] ?? {}), [d]: minutes } }))
    setDirty(true)
  }

  /* ── Serialise + save ── */
  const serialise = useCallback(() => {
    if (!grid) return { scores: [], dayMeta: [] }
    const flatScores: { teacherId: number; criterionId: number; day: number; score?: number | null; note?: string | null }[] = []
    const flatMeta: { teacherId: number; day: number; minutes: number | null }[] = []
    if (grid.template.layout === 'weekly') {
      for (const t of grid.teachers)
        for (const c of grid.criteria)
          for (const d of grid.days)
            flatScores.push({ teacherId: t.id, criterionId: c.id, day: d, score: getCell(t.id, c.id, d).score })
      for (const t of grid.teachers)
        for (const d of grid.days)
          flatMeta.push({ teacherId: t.id, day: d, minutes: dayMeta[t.id]?.[d] ?? null })
    } else {
      for (const t of grid.teachers)
        for (const c of grid.criteria) {
          const cell = getCell(t.id, c.id, 0)
          if (c.kind === 'text') flatScores.push({ teacherId: t.id, criterionId: c.id, day: 0, note: cell.note })
          else flatScores.push({ teacherId: t.id, criterionId: c.id, day: 0, score: cell.score })
        }
    }
    return { scores: flatScores, dayMeta: flatMeta }
  }, [grid, getCell, dayMeta])

  const save = async () => {
    if (!grid) return
    setBusy(true)
    try {
      await apiPost(`/eval/sheet/${grid.sheet.id}/scores`, serialise())
      setDirty(false)
      flash('ok', 'Evaluation saved.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Save failed') } finally { setBusy(false) }
  }

  const submit = async () => {
    if (!grid) return
    if (!confirm('Submit this evaluation? Reports will be generated for each teacher and queued to their Gmail and the Britishce44 Drive.')) return
    setBusy(true)
    try {
      if (dirty) await apiPost(`/eval/sheet/${grid.sheet.id}/scores`, serialise())
      const r = await apiPost<{ ok: boolean; generated: number }>(`/eval/sheet/${grid.sheet.id}/submit`)
      flash('ok', `Submitted — ${r.generated} teacher report(s) generated.`)
      await Promise.all([loadSheets(grid.sheet.templateId), loadGrid(grid.sheet.id)])
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Submit failed') } finally { setBusy(false) }
  }

  const generateAll = async () => {
    if (!grid) return
    setBusy(true)
    try {
      if (dirty) await apiPost(`/eval/sheet/${grid.sheet.id}/scores`, serialise())
      const r = await apiPost<{ created: number }>(`/eval/sheet/${grid.sheet.id}/generate`)
      flash('ok', `Generated ${r.created} report draft(s) — review & send from the Academic Room.`)
      setDirty(false)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Generate failed') } finally { setBusy(false) }
  }

  const sendAll = async () => {
    if (!grid) return
    if (!confirm('Generate and send reports to every teacher now?')) return
    setBusy(true)
    try {
      if (dirty) await apiPost(`/eval/sheet/${grid.sheet.id}/scores`, serialise())
      const r = await apiPost<{ sent: number }>(`/eval/sheet/${grid.sheet.id}/send`)
      flash('ok', `Delivery attempted for ${r.sent} report(s) (queued as pending if Google is offline).`)
      setDirty(false)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Send failed') } finally { setBusy(false) }
  }

  const setStatus = async (status: string) => {
    if (!grid) return
    setBusy(true)
    try {
      if (dirty) await apiPost(`/eval/sheet/${grid.sheet.id}/scores`, serialise())
      await apiPatch(`/eval/sheets/${grid.sheet.id}`, { status })
      await Promise.all([loadSheets(grid.sheet.templateId), loadGrid(grid.sheet.id)])
      flash('ok', `Sheet ${status}.`)
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  const createSheet = async () => {
    if (!template) return
    setBusy(true)
    try {
      const term = template.termLabel || 'Term 3 — 2026'
      const week = template.layout === 'weekly' ? (newWeek.trim() || `Week of ${new Date().toISOString().slice(0, 10)}`) : ''
      const r = await apiPost<{ sheet: EvalSheet }>('/eval/sheets', { templateId: template.id, termLabel: term, weekLabel: week })
      setNewWeek('')
      await loadSheets(template.id)
      if (r.sheet) setSheetId(r.sheet.id)
      flash('ok', 'Sheet ready.')
    } catch (e) { flash('err', e instanceof ApiError ? e.message : 'Failed') } finally { setBusy(false) }
  }

  /* ── Bulk tools ── */
  const bulkFill = (value: number) => {
    if (!grid || !editable) return
    setScores(prev => {
      const next = structuredClone(prev) as ScoreState
      const apply = (t: number, c: number, d: number) => {
        next[t] = { ...(next[t] ?? {}) }
        next[t][c] = { ...(next[t][c] ?? {}) }
        next[t][c][d] = { ...(next[t][c][d] ?? EMPTY_CELL), score: value }
      }
      if (grid.template.layout === 'weekly') {
        const t = grid.teachers[teacherIdx]
        if (t) for (const c of grid.criteria) for (const d of grid.days) apply(t.id, c.id, d)
      } else {
        for (const t of grid.teachers) for (const c of grid.criteria) if (c.kind === 'score') apply(t.id, c.id, 0)
      }
      return next
    })
    setDirty(true)
  }

  const bulkClear = () => {
    if (!grid || !editable) return
    if (!confirm('Clear all scores in the current view?')) return
    setScores(prev => {
      const next = structuredClone(prev) as ScoreState
      const clear = (t: number, c: number, d: number) => {
        next[t] = { ...(next[t] ?? {}) }
        next[t][c] = { ...(next[t][c] ?? {}) }
        next[t][c][d] = { score: null, note: next[t][c][d]?.note ?? null }
      }
      if (grid.template.layout === 'weekly') {
        const t = grid.teachers[teacherIdx]
        if (t) { for (const c of grid.criteria) for (const d of grid.days) clear(t.id, c.id, d); setDayMeta(m => ({ ...m, [t.id]: {} })) }
      } else {
        for (const t of grid.teachers) for (const c of grid.criteria) if (c.kind === 'score') clear(t.id, c.id, 0)
      }
      return next
    })
    setDirty(true)
  }

  /* ── Averages ── */
  const teacherAvgColumns = useCallback((tId: number): number | null => {
    if (!grid) return null
    const vals = grid.criteria
      .filter(c => c.kind === 'score')
      .map(c => getCell(tId, c.id, 0).score)
      .filter((v): v is number => typeof v === 'number')
    if (!vals.length) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }, [grid, getCell])

  const dayTotal = useCallback((tId: number, d: number): number | null => {
    if (!grid) return null
    const vals = grid.criteria
      .map(c => getCell(tId, c.id, d).score)
      .filter((v): v is number => typeof v === 'number')
    if (!vals.length) return null
    return vals.reduce((a, b) => a + b, 0)
  }, [grid, getCell])

  /* ── Export CSV ── */
  const exportCsv = () => {
    if (!grid) return
    const rows: string[][] = []
    const q = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`
    if (grid.template.layout === 'weekly') {
      const t = grid.teachers[teacherIdx]
      rows.push(['Criterion', ...grid.days.map(d => DAY_LABELS[d]?.en ?? String(d))])
      for (const c of grid.criteria)
        rows.push([c.labelEn, ...grid.days.map(d => String(getCell(t.id, c.id, d).score ?? ''))])
      rows.push(['Duration (min)', ...grid.days.map(d => String(dayMeta[t.id]?.[d] ?? ''))])
    } else {
      rows.push(['Teacher', ...grid.criteria.map(c => c.labelEn), 'Average'])
      for (const t of grid.teachers) {
        rows.push([
          t.name,
          ...grid.criteria.map(c => c.kind === 'text' ? (getCell(t.id, c.id, 0).note ?? '') : String(getCell(t.id, c.id, 0).score ?? '')),
          String(teacherAvgColumns(t.id) ?? ''),
        ])
      }
    }
    const csv = rows.map(r => r.map(q).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `teacher-eval-${grid.sheet.id}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!isAcademic) {
    return (
      <div className="rounded-2xl p-10 text-center text-sm text-gray-400" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        🔒 Teacher performance evaluation is managed by the academic team. Your evaluation reports are delivered to your email and appear in your Reports page.
      </div>
    )
  }

  const scoreCriteria = grid?.criteria.filter(c => c.kind === 'score') ?? []
  const textCriteria = grid?.criteria.filter(c => c.kind === 'text') ?? []
  const wkTeacher = grid?.teachers[teacherIdx]

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">⭐ Teachers' Performance Evaluation</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(147,197,253,0.6)' }}>
            Score every teacher, then generate &amp; deliver reports to each teacher's Gmail and the Britishce44 Drive.
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(147,197,253,0.4)', fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
            تقييم أداء المعلمين — درجات لكل معلم ثم توليد التقارير وإرسالها إلى بريد كل معلم وأرشفتها في درايف
          </p>
        </div>
        <button onClick={loadTemplates}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white"
          style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.3)' }}>↻ Refresh</button>
      </div>

      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{
            background: msg.kind === 'ok' ? 'rgba(0,174,116,0.12)' : 'rgba(239,68,68,0.12)',
            color: msg.kind === 'ok' ? '#34d399' : '#f87171',
            border: `1px solid ${msg.kind === 'ok' ? 'rgba(0,174,116,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>{msg.text}</div>
      )}

      {/* Template + sheet selectors */}
      <div className="rounded-2xl p-4 flex flex-wrap items-end gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="min-w-48 flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(147,197,253,0.5)' }}>Evaluation Table</label>
          <select value={templateId ?? ''} onChange={e => setTemplateId(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-semibold text-white outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {templates.map(t => (
              <option key={t.id} value={t.id} style={{ background: '#150D79' }}>
                {t.name} · {t.layout === 'weekly' ? 'Weekly (Sat–Thu)' : 'Criteria columns'}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-48 flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(147,197,253,0.5)' }}>Sheet</label>
          <select value={sheetId ?? ''} onChange={e => setSheetId(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-semibold text-white outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {sheets.length === 0 && <option value="" style={{ background: '#150D79' }}>No sheets yet</option>}
            {sheets.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#150D79' }}>
                {s.termLabel}{s.weekLabel ? ` · ${s.weekLabel}` : ''} · {s.status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          {template?.layout === 'weekly' && (
            <input value={newWeek} onChange={e => setNewWeek(e.target.value)} placeholder="Week label"
              className="px-3 py-2 rounded-lg text-xs text-white outline-none w-36"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          )}
          <button onClick={createSheet} disabled={busy || !template}
            className="text-[11px] font-bold px-3 py-2 rounded-lg text-white disabled:opacity-40"
            style={{ background: 'rgba(63,186,235,0.18)', border: '1px solid rgba(63,186,235,0.35)' }}>+ New Sheet</button>
        </div>
      </div>

      {loading && <div className="rounded-2xl p-10 text-center text-sm text-gray-500" style={{ background: CARD, border: `1px solid ${BORDER}` }}>Loading…</div>}
      {!loading && !grid && (
        <div className="rounded-2xl p-10 text-center text-sm text-gray-500" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          Select or create a sheet to begin evaluating.
        </div>
      )}

      {grid && (
        <>
          {/* Sheet meta + status */}
          <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div>
              <h3 className="font-bold text-white text-sm">{grid.template.name}</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {grid.sheet.termLabel}{grid.sheet.weekLabel ? ` · ${grid.sheet.weekLabel}` : ''} · {grid.teachers.length} teachers · {grid.criteria.length} criteria
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: STATUS_STYLE[grid.sheet.status].bg, color: STATUS_STYLE[grid.sheet.status].color }}>
                {STATUS_STYLE[grid.sheet.status].label}
              </span>
              {grid.sheet.status !== 'open' && (
                <button onClick={() => setStatus('open')} disabled={busy}
                  className="text-[9px] font-bold px-2.5 py-1 rounded-full text-sky-300" style={{ background: 'rgba(63,186,235,0.12)' }}>Reopen</button>
              )}
              {grid.sheet.status !== 'locked' && (
                <button onClick={() => setStatus('locked')} disabled={busy}
                  className="text-[9px] font-bold px-2.5 py-1 rounded-full text-gray-300" style={{ background: 'rgba(148,163,184,0.12)' }}>Lock</button>
              )}
            </div>
          </div>

          {/* Editor toolbar */}
          <div className="rounded-2xl p-3 flex items-center gap-2 flex-wrap" style={{ background: 'rgba(11,22,62,0.55)', border: `1px solid ${BORDER}` }}>
            <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'rgba(147,197,253,0.5)' }}>Tools</span>
            {editable && [1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => bulkFill(n)}
                className="w-7 h-7 rounded-lg text-[11px] font-black text-white" style={{ background: cellColor(n, 5), border: '1px solid rgba(255,255,255,0.1)' }}
                title={`Fill view with ${n}`}>{n}</button>
            ))}
            {editable && <button onClick={bulkClear} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-gray-300" style={{ background: 'rgba(148,163,184,0.12)' }}>Clear view</button>}
            <div className="flex-1" />
            <button onClick={exportCsv} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-sky-300" style={{ background: 'rgba(63,186,235,0.12)' }}>⬇ CSV</button>
            <button onClick={() => window.print()} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>🖨 Print</button>
            <button onClick={generateAll} disabled={busy} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)' }}>✨ Generate All</button>
            <button onClick={sendAll} disabled={busy} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#00ae74,#34d399)' }}>📨 Send All</button>
          </div>

          {!editable && (
            <div className="rounded-xl px-4 py-2.5 text-[11px] font-semibold"
              style={{ background: 'rgba(148,163,184,0.1)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.2)' }}>
              This sheet is {grid.sheet.status}. Scores are read-only — reopen it to edit.
            </div>
          )}

          {/* ── COLUMNS layout (Table 1) ── */}
          {!isWeekly && (
            <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(21,13,121,0.6)' }}>
                      <th className="sticky left-0 z-10 px-3 py-2.5 text-start text-[10px] font-bold text-white whitespace-nowrap" style={{ background: 'rgba(21,13,121,0.95)' }}>Teacher</th>
                      {scoreCriteria.map(c => (
                        <th key={c.id} className="px-2 py-2.5 text-[9px] font-bold text-gray-300" style={{ minWidth: 60 }}>
                          <div>{lang === 'ar' ? (c.labelAr ?? c.labelEn) : c.labelEn}</div>
                          <div className="text-[8px] text-gray-500">/{c.maxScore}</div>
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-[10px] font-bold text-white whitespace-nowrap">Avg</th>
                      {textCriteria.map(c => (
                        <th key={c.id} className="px-2 py-2.5 text-[9px] font-bold text-gray-300" style={{ minWidth: 160 }}>
                          {lang === 'ar' ? (c.labelAr ?? c.labelEn) : c.labelEn}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.teachers.map((t, ri) => {
                      const avg = teacherAvgColumns(t.id)
                      return (
                        <tr key={t.id} style={{ background: ri % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                          <td className="sticky left-0 z-10 px-3 py-2 text-[11px] font-semibold text-white whitespace-nowrap"
                            style={{ background: ri % 2 ? 'rgba(28,21,86,0.97)' : 'rgba(24,17,80,0.97)' }}>{t.name}</td>
                          {scoreCriteria.map(c => {
                            const v = getCell(t.id, c.id, 0).score
                            return (
                              <td key={c.id} className="px-1.5 py-1.5 text-center">
                                <select value={v ?? ''} disabled={!editable}
                                  onChange={e => setCell(t.id, c.id, 0, { score: e.target.value === '' ? null : Number(e.target.value) })}
                                  className="w-12 text-center text-[11px] font-bold rounded-lg py-1.5 outline-none cursor-pointer disabled:cursor-default text-white"
                                  style={{ background: cellColor(v, c.maxScore), border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <option value="" style={{ background: '#150D79' }}>–</option>
                                  {Array.from({ length: c.maxScore }, (_, i) => i + 1).map(n => (
                                    <option key={n} value={n} style={{ background: '#150D79' }}>{n}</option>
                                  ))}
                                </select>
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-center text-[12px] font-black"
                            style={{ color: avg == null ? '#64748b' : avg >= 4 ? '#34d399' : avg >= 3 ? '#fbbf24' : '#f87171' }}>{avg ?? '–'}</td>
                          {textCriteria.map(c => (
                            <td key={c.id} className="px-1.5 py-1.5 align-top">
                              <textarea value={getCell(t.id, c.id, 0).note ?? ''} disabled={!editable} rows={2}
                                onChange={e => setCell(t.id, c.id, 0, { note: e.target.value })}
                                placeholder="…"
                                className="w-40 text-[10px] rounded-lg px-2 py-1 outline-none text-white resize-y disabled:opacity-60"
                                dir={isRTL ? 'rtl' : 'ltr'}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── WEEKLY layout (Table 2) ── */}
          {isWeekly && wkTeacher && (
            <div className="space-y-3">
              {/* Teacher selector */}
              <div className="flex gap-2 flex-wrap">
                {grid.teachers.map((t, i) => (
                  <button key={t.id} onClick={() => setTeacherIdx(i)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition"
                    style={teacherIdx === i
                      ? { background: 'linear-gradient(135deg,#2620a8,#2563eb)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(147,197,253,0.6)', border: `1px solid ${BORDER}` }}>
                    {t.name}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="px-4 py-3 text-xs font-bold text-white border-b" style={{ borderColor: BORDER }}>
                  {wkTeacher.name} <span className="text-gray-500 font-normal">· weekly performance</span>
                </div>
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: 'rgba(21,13,121,0.6)' }}>
                        <th className="sticky left-0 z-10 px-3 py-2.5 text-start text-[10px] font-bold text-white whitespace-nowrap" style={{ background: 'rgba(21,13,121,0.95)' }}>Criterion</th>
                        {grid.days.map(d => (
                          <th key={d} className="px-2 py-2.5 text-[10px] font-bold text-gray-300 text-center" style={{ minWidth: 56 }}>
                            {lang === 'ar' ? DAY_LABELS[d]?.ar : DAY_LABELS[d]?.en}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grid.criteria.map((c, ri) => (
                        <tr key={c.id} style={{ background: ri % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                          <td className="sticky left-0 z-10 px-3 py-2 text-[11px] font-semibold text-white"
                            style={{ background: ri % 2 ? 'rgba(28,21,86,0.97)' : 'rgba(24,17,80,0.97)' }}>
                            {lang === 'ar' ? (c.labelAr ?? c.labelEn) : c.labelEn}
                            <span className="block text-[8px] text-gray-500 font-normal">/{c.maxScore}</span>
                          </td>
                          {grid.days.map(d => {
                            const v = getCell(wkTeacher.id, c.id, d).score
                            return (
                              <td key={d} className="px-1.5 py-1.5 text-center">
                                <select value={v ?? ''} disabled={!editable}
                                  onChange={e => setCell(wkTeacher.id, c.id, d, { score: e.target.value === '' ? null : Number(e.target.value) })}
                                  className="w-12 text-center text-[11px] font-bold rounded-lg py-1.5 outline-none cursor-pointer disabled:cursor-default text-white"
                                  style={{ background: cellColor(v, c.maxScore), border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <option value="" style={{ background: '#150D79' }}>–</option>
                                  {Array.from({ length: c.maxScore }, (_, i) => i + 1).map(n => (
                                    <option key={n} value={n} style={{ background: '#150D79' }}>{n}</option>
                                  ))}
                                </select>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                      {/* Daily total */}
                      <tr style={{ background: 'rgba(0,174,116,0.06)' }}>
                        <td className="sticky left-0 z-10 px-3 py-2 text-[10px] font-black text-emerald-300" style={{ background: 'rgba(20,30,60,0.97)' }}>Daily total</td>
                        {grid.days.map(d => (
                          <td key={d} className="px-2 py-2 text-center text-[11px] font-black text-emerald-300">{dayTotal(wkTeacher.id, d) ?? '–'}</td>
                        ))}
                      </tr>
                      {/* Duration per day */}
                      <tr>
                        <td className="sticky left-0 z-10 px-3 py-2 text-[10px] font-bold text-sky-300" style={{ background: 'rgba(24,17,80,0.97)' }}>
                          Duration (min)<span className="block text-[8px] text-gray-500 font-normal" dir="rtl">مدة الحصة</span>
                        </td>
                        {grid.days.map(d => (
                          <td key={d} className="px-1.5 py-1.5 text-center">
                            <input type="number" min={0} value={dayMeta[wkTeacher.id]?.[d] ?? ''} disabled={!editable}
                              onChange={e => setMinutes(wkTeacher.id, d, e.target.value === '' ? null : Number(e.target.value))}
                              className="w-14 text-center text-[11px] font-bold rounded-lg py-1.5 outline-none text-white disabled:opacity-60"
                              style={{ background: 'rgba(63,186,235,0.1)', border: '1px solid rgba(255,255,255,0.08)' }} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Save / submit footer */}
          {editable && (
            <div className="flex items-center justify-end gap-3">
              {dirty && <span className="text-[10px] text-amber-400">Unsaved changes</span>}
              <button onClick={save} disabled={busy || !dirty}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-40"
                style={{ background: 'rgba(63,186,235,0.18)', border: '1px solid rgba(63,186,235,0.35)' }}>
                {busy ? 'Saving…' : '💾 Save'}
              </button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={busy}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#00ae74,#34d399)' }}>
                ✓ Submit &amp; Generate Reports
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
