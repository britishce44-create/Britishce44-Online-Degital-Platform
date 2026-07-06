import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/components/providers/auth-provider'
import {
  apiGet, apiPost, apiPatch, apiDelete, ApiError,
  type EvalTemplate, type EvalSheet, type EvalGrid, type EvalScoreCell,
  type EvalCriterion, type EvalAnalytics, type EvalTrainingPlan,
  type EvalAnalyticsTeacher, type Report, type GoogleStatus,
} from '@/lib/api'

/* ── Theme: light blue + golden + white/beige ── */
const SKY = '#3FBAEB'
const SKY_DEEP = '#2563eb'
const GOLD = '#D4A017'
const GOLD_LIGHT = '#F5C518'
const CREAM = '#fdf8f0'
const CREAM_LIGHT = '#fffbf5'
const BEIGE = '#f5e6d3'
const WEAK = '#ef4444'
const DEV = '#f59e0b'
const STRONG = '#00AE74'

const DAY_LABELS: Record<number, { en: string; ar: string }> = {
  6: { en: 'Sat', ar: 'السبت' },
  0: { en: 'Sun', ar: 'الأحد' },
  1: { en: 'Mon', ar: 'الإثنين' },
  2: { en: 'Tue', ar: 'الثلاثاء' },
  3: { en: 'Wed', ar: 'الأربعاء' },
  4: { en: 'Thu', ar: 'الخميس' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(63,186,235,0.12)', color: SKY_DEEP },
  submitted: { bg: 'rgba(0,174,116,0.12)', color: STRONG },
  locked: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
}

const EMPTY_CELL: EvalScoreCell = { score: null, note: null }
type ScoreState = Record<number, Record<number, Record<number, EvalScoreCell>>>
type MetaState = Record<number, Record<number, number | null>>
type TabKey = 'entry' | 'reports' | 'comparison' | 'training' | 'admin'

function cellColor(v: number | null, max: number): string {
  if (v == null) return 'rgba(255,255,255,0.5)'
  const ratio = v / max
  if (ratio <= 0.4) return 'rgba(239,68,68,0.18)'
  if (ratio <= 0.6) return 'rgba(245,158,11,0.18)'
  if (ratio <= 0.8) return 'rgba(63,186,235,0.18)'
  return 'rgba(0,174,116,0.2)'
}

function tierFor(percent: number): 'weak' | 'developing' | 'strong' {
  if (percent >= 80) return 'strong'
  if (percent >= 50) return 'developing'
  return 'weak'
}

function tierColor(tier: string): string {
  return tier === 'weak' ? WEAK : tier === 'developing' ? DEV : STRONG
}

function levelLabel(percent: number, lang: 'en' | 'ar'): string {
  if (percent >= 76) return lang === 'ar' ? 'متقدم' : 'Advanced'
  if (percent >= 56) return lang === 'ar' ? 'كفؤ' : 'Proficient'
  if (percent >= 30) return lang === 'ar' ? 'متطور' : 'Developing'
  return lang === 'ar' ? 'مبتدئ' : 'Novice'
}

export function TeacherEvalPage() {
  const { lang, isRTL, t } = useI18n()
  const { user } = useAuth()
  const isAcademic = user?.role === 'admin' || user?.role === 'supervisor'

  const [tab, setTab] = useState<TabKey>('entry')
  const [templates, setTemplates] = useState<EvalTemplate[]>([])
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [sheets, setSheets] = useState<EvalSheet[]>([])
  const [sheetId, setSheetId] = useState<number | null>(null)
  const [grid, setGrid] = useState<EvalGrid | null>(null)
  const [scores, setScores] = useState<ScoreState>({})
  const [dayMeta, setDayMeta] = useState<MetaState>({})
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [newWeek, setNewWeek] = useState('')
  const [analytics, setAnalytics] = useState<EvalAnalytics | null>(null)
  const [plans, setPlans] = useState<EvalTrainingPlan[]>([])

  const template = templates.find((tp) => tp.id === templateId) || null
  const isWeekly = grid?.template.layout === 'weekly'
  const editable = grid?.sheet.status === 'open'

  const loadTemplates = useCallback(async () => {
    try {
      const r = await apiGet<{ templates: EvalTemplate[] }>('/eval/templates')
      setTemplates(r.templates)
      if (r.templates.length && !templateId) setTemplateId(r.templates[r.templates.length - 1].id)
    } catch { /* ignore */ }
  }, [templateId])

  const loadSheets = useCallback(async () => {
    if (!templateId) return
    try {
      const r = await apiGet<{ sheets: EvalSheet[] }>(`/eval/sheets?templateId=${templateId}`)
      setSheets(r.sheets)
    } catch { /* ignore */ }
  }, [templateId])

  const loadGrid = useCallback(async () => {
    if (!sheetId) return
    setLoading(true)
    try {
      const r = await apiGet<EvalGrid>(`/eval/sheet/${sheetId}`)
      setGrid(r)
      setScores(r.scores || {})
      setDayMeta(r.dayMeta || {})
      setDirty(false)
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed to load sheet' })
    } finally {
      setLoading(false)
    }
  }, [sheetId])

  const loadAnalytics = useCallback(async () => {
    if (!sheetId) return
    try {
      const r = await apiGet<EvalAnalytics>(`/eval/sheet/${sheetId}/analytics`)
      setAnalytics(r)
    } catch { /* ignore */ }
  }, [sheetId])

  const loadPlans = useCallback(async () => {
    if (!sheetId) return
    try {
      const r = await apiGet<{ plans: EvalTrainingPlan[] }>(`/eval/training-plans?sheetId=${sheetId}`)
      setPlans(r.plans)
    } catch { /* ignore */ }
  }, [sheetId])

  useEffect(() => { if (isAcademic) loadTemplates() }, [isAcademic, loadTemplates])
  useEffect(() => { loadSheets() }, [loadSheets])
  useEffect(() => { loadGrid() }, [loadGrid])
  useEffect(() => { if (tab === 'reports') loadAnalytics() }, [tab, loadAnalytics])
  useEffect(() => { if (tab === 'training') loadPlans() }, [tab, loadPlans])

  const getCell = (tid: number, cid: number, day: number): EvalScoreCell =>
    scores[tid]?.[cid]?.[day] ?? EMPTY_CELL

  const setCell = (tid: number, cid: number, day: number, val: EvalScoreCell) => {
    setScores((p) => {
      const next = { ...p }
      next[tid] ??= {}
      next[tid][cid] ??= {}
      next[tid][cid][day] = val
      return next
    })
    setDirty(true)
  }

  const setMinutes = (tid: number, day: number, val: number | null) => {
    setDayMeta((p) => {
      const next = { ...p }
      next[tid] ??= {}
      next[tid][day] = val
      return next
    })
    setDirty(true)
  }

  const serialise = () => {
    if (!grid) return { scores: [], dayMeta: [] }
    const scoreArr: { teacherId: number; criterionId: number; day: number; score?: number; note?: string }[] = []
    const metaArr: { teacherId: number; day: number; minutes?: number }[] = []
    for (const tch of grid.teachers) {
      for (const c of grid.criteria) {
        if (c.kind === 'text') {
          const cell = getCell(tch.id, c.id, 0)
          if (cell.note) scoreArr.push({ teacherId: tch.id, criterionId: c.id, day: 0, note: cell.note })
        } else {
          const days = isWeekly ? grid.days : [0]
          for (const d of days) {
            const cell = getCell(tch.id, c.id, d)
            if (cell.score != null || cell.note) {
              scoreArr.push({ teacherId: tch.id, criterionId: c.id, day: d, score: cell.score ?? undefined, note: cell.note ?? undefined })
            }
          }
        }
      }
      if (isWeekly) {
        for (const d of grid.days) {
          const m = dayMeta[tch.id]?.[d]
          if (m != null) metaArr.push({ teacherId: tch.id, day: d, minutes: m })
        }
      }
    }
    return { scores: scoreArr, dayMeta: metaArr }
  }

  const save = async () => {
    if (!sheetId) return
    setBusy(true)
    try {
      const { scores: s, dayMeta: dm } = serialise()
      await apiPost(`/eval/sheet/${sheetId}/scores`, { scores: s, dayMeta: dm })
      setDirty(false)
      setMsg({ kind: 'ok', text: lang === 'ar' ? 'تم الحفظ' : 'Saved' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Save failed' })
    } finally { setBusy(false) }
  }

  const submit = async () => {
    if (!sheetId) return
    setBusy(true)
    try {
      const { scores: s, dayMeta: dm } = serialise()
      await apiPost(`/eval/sheet/${sheetId}/scores`, { scores: s, dayMeta: dm })
      await apiPost(`/eval/sheet/${sheetId}/submit`)
      setMsg({ kind: 'ok', text: lang === 'ar' ? 'تم التسليم وإنشاء التقارير' : 'Submitted & reports generated' })
      await loadGrid()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Submit failed' })
    } finally { setBusy(false) }
  }

  const generateAll = async () => {
    if (!sheetId) return
    setBusy(true)
    try {
      await apiPost(`/eval/sheet/${sheetId}/generate`)
      setMsg({ kind: 'ok', text: lang === 'ar' ? 'تم إنشاء المسودات' : 'Drafts generated' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  const sendAll = async () => {
    if (!sheetId) return
    setBusy(true)
    try {
      const r = await apiPost<{ sent: number }>(`/eval/sheet/${sheetId}/send`)
      setMsg({ kind: 'ok', text: lang === 'ar' ? `تم إرسال ${r.sent}` : `Sent ${r.sent}` })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  const setStatus = async (status: 'open' | 'submitted' | 'locked') => {
    if (!sheetId) return
    try {
      await apiPatch(`/eval/sheets/${sheetId}`, { status })
      await loadGrid()
    } catch { /* ignore */ }
  }

  const createSheet = async () => {
    if (!templateId) return
    try {
      const week = isWeekly ? (newWeek || 'Week 1') : ''
      const r = await apiPost<{ sheet: EvalSheet }>('/eval/sheets', { templateId, termLabel: 'Term 1', weekLabel: week })
      setSheetId(r.sheet.id)
      setNewWeek('')
      await loadSheets()
    } catch { /* ignore */ }
  }

  const generateTraining = async () => {
    if (!sheetId) return
    setBusy(true)
    try {
      const r = await apiPost<{ created: number }>(`/eval/sheet/${sheetId}/training-plans/generate`)
      setMsg({ kind: 'ok', text: lang === 'ar' ? `تم إنشاء ${r.created} خطة` : `${r.created} plans generated` })
      await loadPlans()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  const updatePlanStatus = async (id: number, status: 'pending' | 'in-progress' | 'done') => {
    try {
      await apiPatch(`/eval/training-plans/${id}`, { status })
      await loadPlans()
    } catch { /* ignore */ }
  }

  /* ── Weighted average for a teacher (client-side, for live display) ── */
  const teacherWeighted = (tid: number): { total: number; maxTotal: number; percent: number; level: string } => {
    if (!grid) return { total: 0, maxTotal: 0, percent: 0, level: '-' }
    let total = 0, maxTotal = 0
    for (const c of grid.criteria) {
      if (c.kind === 'text') continue
      const days = isWeekly ? grid.days : [0]
      const vals: number[] = []
      for (const d of days) {
        const cell = getCell(tid, c.id, d)
        if (cell.score != null) vals.push(cell.score)
      }
      if (!vals.length) continue
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const w = Number(c.weight)
      total += avg * w
      maxTotal += c.maxScore * w
    }
    const percent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
    return { total: Math.round(total * 10) / 10, maxTotal, percent, level: levelLabel(percent, lang) }
  }

  /* ── Get tier feedback for a criterion at a given score ── */
  const tierFeedback = (c: EvalCriterion, score: number): { tier: string; reason: string; feedback: string; rec: string; video: string; website: string } | null => {
    if (!c.feedback || score == null) return null
    const percent = (score / c.maxScore) * 100
    const tier = tierFor(percent)
    const tf = (c.feedback as any)[tier]?.[lang] || (c.feedback as any)[tier]?.en
    if (!tf) return null
    return { tier, reason: tf.reason, feedback: tf.feedback, rec: tf.rec, video: (c.feedback as any).video, website: (c.feedback as any).website }
  }

  if (!isAcademic) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: 18 }}>{lang === 'ar' ? 'هذا القسم مخصص للمشرفين والمديرين فقط.' : 'This section is for supervisors and admins only.'}</p>
      </div>
    )
  }

  const tabBtn = (key: TabKey, icon: string, labelKey: string): React.ReactNode => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        padding: '12px 20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
        background: tab === key ? 'white' : 'transparent', color: tab === key ? SKY_DEEP : '#64748b',
        borderBottom: tab === key ? `3px solid ${GOLD}` : '3px solid transparent',
        transition: 'all 0.2s', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      {icon} {t(labelKey)}
    </button>
  )

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100%' }}>
      {/* ── Header (light blue + golden) ── */}
      <div style={{
        background: `linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, ${CREAM_LIGHT} 100%)`,
        padding: '24px 32px', borderBottom: `4px solid ${GOLD}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', color: 'white', flexShrink: 0, boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
          }}>⭐</div>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: SKY_DEEP, fontFamily: 'inherit', fontWeight: 700 }}>{t('teacherEval.title')}</h1>
            <p style={{ color: GOLD, fontSize: '0.85rem', letterSpacing: 1, textTransform: 'uppercase' }}>{t('teacherEval.subtitle')}</p>
          </div>
        </div>
        <span style={{
          background: 'rgba(37,99,235,0.08)', padding: '8px 16px', borderRadius: 30,
          fontSize: '0.8rem', color: SKY_DEEP, border: '1px solid rgba(63,186,235,0.25)',
        }}>{user?.name} · {t(`role.${user?.role}`)}</span>
      </div>

      {/* ── Tab nav ── */}
      <div style={{ display: 'flex', background: BEIGE, borderBottom: '2px solid #e5dbcb', overflowX: 'auto' }}>
        {tabBtn('entry', '📝', 'teacherEval.tabEntry')}
        {tabBtn('reports', '📊', 'teacherEval.tabReports')}
        {tabBtn('comparison', '📋', 'teacherEval.tabComparison')}
        {tabBtn('training', '🎯', 'teacherEval.tabTraining')}
        {tabBtn('admin', '⚙️', 'teacherEval.tabAdmin')}
      </div>

      {/* ── Toast ── */}
      {msg && (
        <div style={{
          margin: '12px 24px', padding: '12px 20px', borderRadius: 12,
          background: msg.kind === 'ok' ? 'rgba(0,174,116,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.kind === 'ok' ? STRONG : WEAK, fontWeight: 600, fontSize: '0.9rem',
        }}>{msg.text}</div>
      )}

      <div style={{ padding: '24px' }}>
        {/* ════════════ TAB: ENTRY ════════════ */}
        {tab === 'entry' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Selectors */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontWeight: 600, color: SKY_DEEP, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>{t('teacherEval.template')}</label>
                <select value={templateId ?? ''} onChange={(e) => setTemplateId(Number(e.target.value))} style={selectStyle}>
                  <option value="">—</option>
                  {templates.map((tp) => <option key={tp.id} value={tp.id}>{lang === 'ar' ? (tp.nameAr || tp.name) : tp.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontWeight: 600, color: SKY_DEEP, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>{t('teacherEval.sheet')}</label>
                <select value={sheetId ?? ''} onChange={(e) => setSheetId(Number(e.target.value))} style={selectStyle}>
                  <option value="">—</option>
                  {sheets.map((s) => <option key={s.id} value={s.id}>{s.termLabel}{s.weekLabel ? ` · ${s.weekLabel}` : ''}</option>)}
                </select>
              </div>
              {isWeekly && (
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontWeight: 600, color: SKY_DEEP, fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>{t('teacherEval.newSheet')}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={newWeek} onChange={(e) => setNewWeek(e.target.value)} placeholder="Week 2" style={{ ...selectStyle, flex: 1 }} />
                    <button onClick={createSheet} style={btnGoldStyle}>+</button>
                  </div>
                </div>
              )}
            </div>

            {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>}
            {!loading && !grid && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>{lang === 'ar' ? 'اختر ورقة تقييم للبدء' : 'Select a sheet to begin'}</p>}

            {grid && (
              <>
                {/* Sheet meta + status */}
                <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <strong style={{ color: SKY_DEEP }}>{lang === 'ar' ? (grid.template.nameAr || grid.template.name) : grid.template.name}</strong>
                    <span style={{ color: '#64748b', marginLeft: 12 }}>{grid.criteria.length} {t('teacherEval.criterion')} · {grid.teachers.length} {t('teacherEval.teacher')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, ...STATUS_STYLE[grid.sheet.status] }}>
                      {t(`teacherEval.${grid.sheet.status}`)}
                    </span>
                    {grid.sheet.status === 'submitted' && <button onClick={() => setStatus('open')} style={btnSmStyle}>{lang === 'ar' ? 'إعادة فتح' : 'Reopen'}</button>}
                    {grid.sheet.status === 'open' && <button onClick={() => setStatus('locked')} style={{ ...btnSmStyle, background: '#94a3b8' }}>{lang === 'ar' ? 'قفل' : 'Lock'}</button>}
                  </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {dirty && <button onClick={save} disabled={busy} style={btnGoldStyle}>{t('teacherEval.save')}</button>}
                  <button onClick={submit} disabled={busy || !editable} style={{ ...btnStyle, opacity: !editable ? 0.5 : 1 }}>{t('teacherEval.submit')}</button>
                  <button onClick={generateAll} disabled={busy} style={btnStyle}>{t('teacherEval.generateAll')}</button>
                  <button onClick={sendAll} disabled={busy} style={btnStyle}>{t('teacherEval.sendAll')}</button>
                </div>

                {!editable && (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: 12 }}>{lang === 'ar' ? 'هذه الورقة ليست مفتوحة للتعديل.' : 'This sheet is not open for editing.'}</p>
                )}

                {/* ── COLUMNS layout: teachers as rows, criteria as columns ── */}
                {!isWeekly && (
                  <div style={{ ...cardStyle, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, fontSize: '0.88rem' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>{t('teacherEval.teacher')}</th>
                          <th style={thStyle}>{t('teacherEval.courses')}</th>
                          {grid.criteria.filter(c => c.kind === 'score').map(c => (
                            <th key={c.id} style={thStyle} title={c.labelAr || c.labelEn}>
                              {(lang === 'ar' ? c.labelAr : c.labelEn) || c.labelEn}
                              <div style={{ fontSize: '0.7rem', color: GOLD, marginTop: 2 }}>/{c.maxScore} · w{c.weight}</div>
                            </th>
                          ))}
                          <th style={thStyle}>{t('teacherEval.overallScore')}</th>
                          <th style={thStyle}>{t('teacherEval.level')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grid.teachers.map((tch) => {
                          const w = teacherWeighted(tch.id)
                          return (
                            <tr key={tch.id}>
                              <td style={tdStyle}><strong>{tch.name}</strong></td>
                              <td style={{ ...tdStyle, textAlign: isRTL ? 'right' : 'left', fontSize: '0.78rem', color: '#64748b' }}>
                                {tch.courses?.map(c => `${c.name}${c.room ? ` (${c.room})` : ''}`).join(', ') || '—'}
                              </td>
                              {grid.criteria.filter(c => c.kind === 'score').map(c => {
                                const cell = getCell(tch.id, c.id, 0)
                                return (
                                  <td key={c.id} style={{ ...tdStyle, background: cellColor(cell.score, c.maxScore) }}>
                                    {editable ? (
                                      <select
                                        value={cell.score ?? ''}
                                        onChange={(e) => setCell(tch.id, c.id, 0, { ...cell, score: e.target.value ? Number(e.target.value) : null })}
                                        style={{ width: 50, padding: '4px', border: `2px solid ${GOLD}40`, borderRadius: 6, textAlign: 'center', background: 'white' }}
                                      >
                                        <option value="">—</option>
                                        {Array.from({ length: c.maxScore }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                                      </select>
                                    ) : (cell.score ?? '—')}
                                  </td>
                                )
                              })}
                              <td style={tdStyle}><strong style={{ color: SKY_DEEP }}>{w.percent}%</strong></td>
                              <td style={tdStyle}>
                                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: 'white', background: tierColor(tierFor(w.percent)) }}>
                                  {w.level}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── WEEKLY layout: single teacher, criteria × days ── */}
                {isWeekly && <WeeklyGrid grid={grid} scores={scores} dayMeta={dayMeta} getCell={getCell} setCell={setCell} setMinutes={setMinutes} editable={editable} lang={lang} isRTL={isRTL} t={t} />}

                {/* ── Live 3-tier feedback (when scores entered) ── */}
                <LiveFeedback grid={grid} scores={scores} getCell={getCell} tierFeedback={tierFeedback} lang={lang} t={t} isWeekly={isWeekly} />
              </>
            )}
          </motion.div>
        )}

        {/* ════════════ TAB: REPORTS & CHARTS ════════════ */}
        {tab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {!sheetId && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>{lang === 'ar' ? 'اختر ورقة من تبويب الإدخال أولاً' : 'Select a sheet from the Entry tab first'}</p>}
            {sheetId && !analytics && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>}
            {analytics && (
              <>
                {/* Radar chart: per-teacher criterion profile */}
                <div style={cardStyle}>
                  <h3 style={{ color: SKY_DEEP, marginBottom: 16 }}>{lang === 'ar' ? 'ملف المعايير (رادار)' : 'Criterion Profile (Radar)'}</h3>
                  {analytics.teachersAnalytics.length > 0 && (
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={analytics.criterionAverages.map(ca => ({
                        criterion: lang === 'ar' ? (ca.labelAr || ca.label) : ca.label,
                        [analytics.teachersAnalytics[0]?.teacherName || '']: analytics.teachersAnalytics[0]?.perCriterion.find(pc => pc.criterionId === ca.criterionId)?.percent ?? 0,
                      }))}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar dataKey={analytics.teachersAnalytics[0]?.teacherName} stroke={SKY} fill={SKY} fillOpacity={0.3} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Bar chart: per-criterion averages across all teachers */}
                <div style={cardStyle}>
                  <h3 style={{ color: SKY_DEEP, marginBottom: 16 }}>{lang === 'ar' ? 'متوسط المعايير' : 'Criterion Averages'}</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.criterionAverages.map(ca => ({
                      name: lang === 'ar' ? (ca.labelAr || ca.label) : ca.label,
                      percent: ca.percent,
                      isKpi: ca.isKpi,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-30} textAnchor="end" height={80} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                        {analytics.criterionAverages.map((ca, i) => (
                          <Cell key={i} fill={ca.isKpi ? GOLD : SKY} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Individual report preview (prototype layout) */}
                {analytics.teachersAnalytics.map((ta: EvalAnalyticsTeacher) => (
                  <ReportPreview key={ta.teacherId} ta={ta} grid={grid} lang={lang} t={t} />
                ))}
              </>
            )}
          </motion.div>
        )}

        {/* ════════════ TAB: COMPARISON ════════════ */}
        {tab === 'comparison' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {!analytics && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>{t('teacherEval.noData')}</p>}
            {analytics && (
              <div style={cardStyle}>
                <h3 style={{ color: SKY_DEEP, marginBottom: 16 }}>{t('teacherEval.tabComparison')}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>{t('teacherEval.teacher')}</th>
                      <th style={thStyle}>{t('teacherEval.totalScore')}</th>
                      <th style={thStyle}>{t('teacherEval.level')}</th>
                      <th style={thStyle}>{t('teacherEval.strengths')}</th>
                      <th style={thStyle}>{t('teacherEval.weaknesses')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.teachersAnalytics.sort((a, b) => b.overallPercent - a.overallPercent).map(ta => (
                      <tr key={ta.teacherId}>
                        <td style={tdStyle}><strong>{ta.teacherName}</strong></td>
                        <td style={tdStyle}><strong style={{ color: SKY_DEEP }}>{ta.overallPercent}%</strong></td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: 'white', background: tierColor(ta.level.toLowerCase()) }}>
                            {ta.level}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? 'right' : 'left', fontSize: '0.78rem' }}>
                          {ta.perCriterion.filter(pc => pc.tier === 'strong').map(pc => lang === 'ar' ? (pc.labelAr || pc.label) : pc.label).join(', ') || '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: isRTL ? 'right' : 'left', fontSize: '0.78rem' }}>
                          {ta.perCriterion.filter(pc => pc.tier === 'weak').map(pc => lang === 'ar' ? (pc.labelAr || pc.label) : pc.label).join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════ TAB: TRAINING PLANS ════════════ */}
        {tab === 'training' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={generateTraining} disabled={busy || !sheetId} style={btnGoldStyle}>{t('teacherEval.generatePlan')}</button>
            </div>
            {!plans.length && <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>{t('teacherEval.noData')}</p>}
            {plans.map(p => {
              const teacher = grid?.teachers.find(tch => tch.id === p.teacherId)
              const crit = grid?.criteria.find(c => c.id === p.criterionId)
              return (
                <div key={p.id} style={{ ...cardStyle, borderLeft: `5px solid ${GOLD}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <strong style={{ color: SKY_DEEP }}>{teacher?.name || `#${p.teacherId}`}</strong>
                      {crit && <span style={{ color: '#64748b', marginLeft: 8 }}>— {lang === 'ar' ? (crit.labelAr || crit.labelEn) : crit.labelEn}</span>}
                      <p style={{ marginTop: 8, fontSize: '0.88rem', color: '#334155' }}>{p.action}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['pending', 'in-progress', 'done'] as const).map(st => (
                        <button key={st} onClick={() => updatePlanStatus(p.id, st)} style={{
                          ...btnSmStyle, background: p.status === st ? tierColor(st === 'done' ? 'strong' : st === 'in-progress' ? 'developing' : 'weak') : '#e2e8f0',
                          color: p.status === st ? 'white' : '#64748b',
                        }}>{t(`teacherEval.${st === 'in-progress' ? 'inProgress' : st}`)}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ════════════ TAB: ADMIN ════════════ */}
        {tab === 'admin' && <EvalAdminPanel lang={lang} isRTL={isRTL} t={t} />}
      </div>
    </div>
  )
}

/* ── Weekly grid sub-component ── */
function WeeklyGrid({ grid, scores, dayMeta, getCell, setCell, setMinutes, editable, lang, isRTL, t }: {
  grid: EvalGrid; scores: ScoreState; dayMeta: MetaState;
  getCell: (tid: number, cid: number, day: number) => EvalScoreCell;
  setCell: (tid: number, cid: number, day: number, val: EvalScoreCell) => void;
  setMinutes: (tid: number, day: number, val: number | null) => void;
  editable: boolean; lang: 'en' | 'ar'; isRTL: boolean; t: (k: string) => string;
}) {
  const [teacherIdx, setTeacherIdx] = useState(0)
  const tch = grid.teachers[teacherIdx]
  if (!tch) return null
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {grid.teachers.map((tt, i) => (
          <button key={tt.id} onClick={() => setTeacherIdx(i)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600,
            background: i === teacherIdx ? SKY : '#e2e8f0', color: i === teacherIdx ? 'white' : '#64748b',
          }}>{tt.name}</button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={thStyle}>{t('teacherEval.criterion')}</th>
            {grid.days.map(d => <th key={d} style={thStyle}>{DAY_LABELS[d]?.[lang] || d}</th>)}
            <th style={thStyle}>Avg</th>
          </tr>
        </thead>
        <tbody>
          {grid.criteria.filter(c => c.kind === 'score').map(c => {
            const vals = grid.days.map(d => getCell(tch.id, c.id, d).score).filter(v => v != null) as number[]
            const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
            return (
              <tr key={c.id}>
                <td style={{ ...tdStyle, textAlign: isRTL ? 'right' : 'left' }}>{lang === 'ar' ? (c.labelAr || c.labelEn) : c.labelEn}</td>
                {grid.days.map(d => {
                  const cell = getCell(tch.id, c.id, d)
                  return (
                    <td key={d} style={{ ...tdStyle, background: cellColor(cell.score, c.maxScore) }}>
                      {editable ? (
                        <select value={cell.score ?? ''} onChange={(e) => setCell(tch.id, c.id, d, { ...cell, score: e.target.value ? Number(e.target.value) : null })}
                          style={{ width: 45, padding: '3px', border: `2px solid ${GOLD}40`, borderRadius: 6, textAlign: 'center', background: 'white' }}>
                          <option value="">—</option>
                          {Array.from({ length: c.maxScore }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (cell.score ?? '—')}
                    </td>
                  )
                })}
                <td style={tdStyle}><strong style={{ color: SKY_DEEP }}>{avg ?? '—'}</strong></td>
              </tr>
            )
          })}
          {/* Duration row */}
          <tr>
            <td style={{ ...tdStyle, textAlign: isRTL ? 'right' : 'left', fontWeight: 600 }}>{lang === 'ar' ? 'مدة الحصة (د)' : 'Duration (min)'}</td>
            {grid.days.map(d => (
              <td key={d} style={tdStyle}>
                {editable ? (
                  <input type="number" value={dayMeta[tch.id]?.[d] ?? ''} onChange={(e) => setMinutes(tch.id, d, e.target.value ? Number(e.target.value) : null)}
                    style={{ width: 50, padding: '4px', border: `2px solid ${GOLD}40`, borderRadius: 6, textAlign: 'center' }} />
                ) : (dayMeta[tch.id]?.[d] ?? '—')}
              </td>
            ))}
            <td style={tdStyle}>—</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* ── Live 3-tier feedback sub-component ── */
function LiveFeedback({ grid, scores, getCell, tierFeedback, lang, t, isWeekly }: {
  grid: EvalGrid; scores: ScoreState;
  getCell: (tid: number, cid: number, day: number) => EvalScoreCell;
  tierFeedback: (c: EvalCriterion, score: number) => { tier: string; reason: string; feedback: string; rec: string; video: string; website: string } | null;
  lang: 'en' | 'ar'; t: (k: string) => string; isWeekly: boolean;
}) {
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null)
  const tch = grid.teachers.find(tt => tt.id === selectedTeacher) || grid.teachers[0]
  if (!tch) return null
  const days = isWeekly ? grid.days : [0]
  const feedbacks: { criterion: EvalCriterion; fb: { tier: string; reason: string; feedback: string; rec: string; video: string; website: string } }[] = []
  for (const c of grid.criteria) {
    if (c.kind === 'text') continue
    const vals = days.map(d => getCell(tch.id, c.id, d).score).filter(v => v != null) as number[]
    if (!vals.length) continue
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    const fb = tierFeedback(c, avg)
    if (fb) feedbacks.push({ criterion: c, fb })
  }
  if (!feedbacks.length) return null
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {grid.teachers.map(tt => (
          <button key={tt.id} onClick={() => setSelectedTeacher(tt.id)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
            background: (tt.id === (selectedTeacher ?? grid.teachers[0]?.id)) ? SKY : '#e2e8f0', color: (tt.id === (selectedTeacher ?? grid.teachers[0]?.id)) ? 'white' : '#64748b',
          }}>{tt.name}</button>
        ))}
      </div>
      <h3 style={{ color: SKY_DEEP, marginBottom: 12 }}>{lang === 'ar' ? '📋 ملاحظات مفصلة' : '📋 Detailed Feedback'}</h3>
      {feedbacks.map(({ criterion, fb }) => (
        <div key={criterion.id} style={{
          borderLeft: `5px solid ${tierColor(fb.tier)}`, padding: '14px 18px', marginBottom: 12,
          background: CREAM_LIGHT, borderRadius: '0 12px 12px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <strong style={{ color: SKY_DEEP }}>{lang === 'ar' ? (criterion.labelAr || criterion.labelEn) : criterion.labelEn}</strong>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: 'white', background: tierColor(fb.tier) }}>
              {t(`teacherEval.${fb.tier}`)}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', marginBottom: 4 }}><strong>{t('teacherEval.reason')}</strong> {fb.reason}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: 4 }}><strong>{t('teacherEval.feedback')}</strong> {fb.feedback}</p>
          <p style={{ fontSize: '0.85rem', marginBottom: 4 }}><strong>{t('teacherEval.recommendations')}</strong> {fb.rec}</p>
          {fb.video && <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: '0.78rem', color: '#64748b' }}>
            <span>📹 {fb.video}</span>
            <span>🌐 {fb.website}</span>
          </div>}
        </div>
      ))}
    </div>
  )
}

/* ── Report preview (prototype layout) ── */
function ReportPreview({ ta, grid, lang, t }: {
  ta: EvalAnalyticsTeacher; grid: EvalGrid | null; lang: 'en' | 'ar'; t: (k: string) => string;
}) {
  const criterionFeedback = ta.perCriterion.map(pc => {
    const c = grid?.criteria.find(cr => cr.id === pc.criterionId)
    const fb = c?.feedback as any
    const tf = fb?.[pc.tier]?.[lang] || fb?.[pc.tier]?.en
    return { pc, c, tf, video: fb?.video, website: fb?.website }
  }).filter(x => x.c)

  return (
    <div style={{
      ...cardStyle, background: 'white', border: `2px solid ${BEIGE}`,
      padding: 32,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ color: SKY_DEEP, marginBottom: 4 }}>{lang === 'ar' ? 'المنصة الأولى البريطانية' : 'The First British Center'}</h2>
        <h3 style={{ color: GOLD }}>{lang === 'ar' ? 'تقرير تقييم المعلم الفردي' : 'Individual Teacher Evaluation Report'}</h3>
      </div>
      <p style={{ marginBottom: 6 }}><strong>{t('teacherEval.teacher')}:</strong> {ta.teacherName}</p>
      <p style={{ marginBottom: 6 }}><strong>{t('teacherEval.overallScore')}:</strong> {ta.overallPercent}% —
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, color: 'white', background: tierColor(ta.level.toLowerCase()), marginLeft: 8 }}>{ta.level}</span>
      </p>

      {/* Bar chart for this teacher */}
      <div style={{ margin: '20px auto', maxWidth: '100%' }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ta.perCriterion.map(pc => ({ name: lang === 'ar' ? (pc.labelAr || pc.label) : pc.label, score: pc.percent, fill: tierColor(pc.tier) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} angle={-40} textAnchor="end" height={80} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {ta.perCriterion.map((pc, i) => <Cell key={i} fill={tierColor(pc.tier)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h4 style={{ color: SKY_DEEP, marginTop: 20, marginBottom: 12 }}>{lang === 'ar' ? 'ملاحظات تفصيلية حسب المعيار' : 'Detailed Criterion Feedback'}</h4>
      {criterionFeedback.map(({ pc, c, tf, video, website }) => (
        <div key={pc.criterionId} style={{ borderLeft: `5px solid ${tierColor(pc.tier)}`, padding: '12px 16px', marginBottom: 10, background: CREAM_LIGHT, borderRadius: '0 10px 10px 0' }}>
          <strong>{lang === 'ar' ? (pc.labelAr || pc.label) : pc.label} ({pc.score}/{pc.max}) — {t(`teacherEval.${pc.tier}`)}</strong>
          {tf && (
            <>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}><em>{tf.reason}</em></p>
              <p style={{ fontSize: '0.82rem' }}><strong>{t('teacherEval.feedback')}</strong> {tf.feedback}</p>
              <p style={{ fontSize: '0.82rem' }}><strong>{t('teacherEval.recommendations')}</strong> {tf.rec}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.76rem', color: '#64748b' }}>
                <span>📹 {video}</span><span>🌐 {website}</span>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Signature line */}
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, borderTop: `2px solid ${BEIGE}`, paddingTop: 20 }}>
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <strong style={{ display: 'block', color: SKY_DEEP }}>{t('teacherEval.administrator')}</strong>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{t('teacherEval.roleAdmin')}</span>
        </div>
        <div style={{ textAlign: 'center', minWidth: 160 }}>
          <strong style={{ display: 'block', color: SKY_DEEP }}>{t('teacherEval.supervisor')}</strong>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{t('teacherEval.roleSupervisor')}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Admin panel (template/criteria CRUD + weight + 3-tier feedback editor) ── */
function EvalAdminPanel({ lang, isRTL, t }: { lang: 'en' | 'ar'; isRTL: boolean; t: (k: string) => string }) {
  const [templates, setTemplates] = useState<EvalTemplate[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [editingCrit, setEditingCrit] = useState<EvalCriterion | null>(null)
  const [newTpl, setNewTpl] = useState({ name: '', nameAr: '', layout: 'columns' as 'columns' | 'weekly' })
  const [newCrit, setNewCrit] = useState<Record<number, { labelEn: string; labelAr: string; maxScore: number; weight: number; isKpi: boolean }>>({})

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ templates: EvalTemplate[] }>('/eval/templates?all=1')
      setTemplates(r.templates)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])

  const addTemplate = async () => {
    if (!newTpl.name) return
    setBusy(true)
    try {
      await apiPost('/eval/templates', { name: newTpl.name, nameAr: newTpl.nameAr || undefined, layout: newTpl.layout })
      setNewTpl({ name: '', nameAr: '', layout: 'columns' })
      await load()
    } finally { setBusy(false) }
  }

  const toggleTemplate = async (id: number, active: boolean) => {
    await apiPatch(`/eval/templates/${id}`, { active: !active })
    await load()
  }

  const deleteTemplate = async (id: number) => {
    if (!confirm(lang === 'ar' ? 'حذف هذا النموذج وكل ما تحته؟' : 'Delete this template and everything beneath it?')) return
    await apiDelete(`/eval/templates/${id}`)
    await load()
  }

  const addCrit = async (tplId: number) => {
    const nc = newCrit[tplId]
    if (!nc?.labelEn) return
    setBusy(true)
    try {
      await apiPost(`/eval/templates/${tplId}/criteria`, {
        labelEn: nc.labelEn, labelAr: nc.labelAr || undefined,
        maxScore: nc.maxScore || 5, weight: nc.weight || 1, isKpi: nc.isKpi || false,
      })
      setNewCrit((p) => ({ ...p, [tplId]: { labelEn: '', labelAr: '', maxScore: 5, weight: 1, isKpi: false } }))
      await load()
    } finally { setBusy(false) }
  }

  const saveCrit = async () => {
    if (!editingCrit) return
    setBusy(true)
    try {
      await apiPatch(`/eval/criteria/${editingCrit.id}`, {
        labelEn: editingCrit.labelEn, labelAr: editingCrit.labelAr,
        maxScore: editingCrit.maxScore, weight: editingCrit.weight, isKpi: editingCrit.isKpi,
        feedback: editingCrit.feedback,
      })
      setEditingCrit(null)
      await load()
      setMsg(lang === 'ar' ? 'تم الحفظ' : 'Saved')
    } finally { setBusy(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: `2px solid ${BEIGE}`, borderRadius: 8,
    fontSize: '0.85rem', background: 'white',
  }

  return (
    <div>
      {msg && <div style={{ ...cardStyle, color: STRONG, fontWeight: 600 }}>{msg}</div>}

      {/* New template */}
      <div style={cardStyle}>
        <h3 style={{ color: SKY_DEEP, marginBottom: 12 }}>{lang === 'ar' ? 'نموذج تقييم جديد' : 'New Evaluation Template'}</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input value={newTpl.name} onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })} placeholder={t('teacherEval.labelEn')} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          <input value={newTpl.nameAr} onChange={(e) => setNewTpl({ ...newTpl, nameAr: e.target.value })} placeholder={t('teacherEval.labelAr')} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          <select value={newTpl.layout} onChange={(e) => setNewTpl({ ...newTpl, layout: e.target.value as 'columns' | 'weekly' })} style={{ ...inputStyle, width: 120 }}>
            <option value="columns">Columns</option>
            <option value="weekly">Weekly</option>
          </select>
          <button onClick={addTemplate} disabled={busy} style={btnGoldStyle}>+</button>
        </div>
      </div>

      {/* Templates + criteria */}
      {templates.map(tpl => (
        <div key={tpl.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div>
              <strong style={{ color: SKY_DEEP }}>{lang === 'ar' ? (tpl.nameAr || tpl.name) : tpl.name}</strong>
              <span style={{ color: '#64748b', marginLeft: 8, fontSize: '0.8rem' }}>{tpl.layout} · {tpl.criteria.length} {t('teacherEval.criterion')}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleTemplate(tpl.id, tpl.active)} style={btnSmStyle}>{tpl.active ? '✓ Active' : 'Inactive'}</button>
              <button onClick={() => deleteTemplate(tpl.id)} style={{ ...btnSmStyle, background: WEAK, color: 'white' }}>🗑</button>
            </div>
          </div>

          {/* Criteria list */}
          {tpl.criteria.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', marginBottom: 6, background: CREAM_LIGHT, borderRadius: 8, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong style={{ fontSize: '0.88rem' }}>{lang === 'ar' ? (c.labelAr || c.labelEn) : c.labelEn}</strong>
                <span style={{ marginLeft: 8, fontSize: '0.76rem', color: '#64748b' }}>
                  /{c.maxScore} · w{c.weight}{c.isKpi ? ' · KPI' : ''}
                </span>
                {c.feedback && <span style={{ marginLeft: 8, fontSize: '0.72rem', color: GOLD }}>📝 feedback</span>}
              </div>
              <button onClick={() => setEditingCrit(c)} style={btnSmStyle}>{lang === 'ar' ? 'تحرير' : 'Edit'}</button>
            </div>
          ))}

          {/* Add criterion */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BEIGE}` }}>
            <input value={newCrit[tpl.id]?.labelEn || ''} onChange={(e) => setNewCrit((p) => ({ ...p, [tpl.id]: { ...(p[tpl.id] || { labelEn: '', labelAr: '', maxScore: 5, weight: 1, isKpi: false }), labelEn: e.target.value } }))} placeholder={t('teacherEval.labelEn')} style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
            <input value={newCrit[tpl.id]?.labelAr || ''} onChange={(e) => setNewCrit((p) => ({ ...p, [tpl.id]: { ...(p[tpl.id] || { labelEn: '', labelAr: '', maxScore: 5, weight: 1, isKpi: false }), labelAr: e.target.value } }))} placeholder={t('teacherEval.labelAr')} style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
            <input type="number" value={newCrit[tpl.id]?.maxScore || 5} onChange={(e) => setNewCrit((p) => ({ ...p, [tpl.id]: { ...(p[tpl.id] || { labelEn: '', labelAr: '', maxScore: 5, weight: 1, isKpi: false }), maxScore: Number(e.target.value) } }))} placeholder="Max" style={{ ...inputStyle, width: 70 }} />
            <input type="number" step="0.1" value={newCrit[tpl.id]?.weight || 1} onChange={(e) => setNewCrit((p) => ({ ...p, [tpl.id]: { ...(p[tpl.id] || { labelEn: '', labelAr: '', maxScore: 5, weight: 1, isKpi: false }), weight: Number(e.target.value) } }))} placeholder="Wt" style={{ ...inputStyle, width: 70 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
              <input type="checkbox" checked={newCrit[tpl.id]?.isKpi || false} onChange={(e) => setNewCrit((p) => ({ ...p, [tpl.id]: { ...(p[tpl.id] || { labelEn: '', labelAr: '', maxScore: 5, weight: 1, isKpi: false }), isKpi: e.target.checked } }))} /> KPI
            </label>
            <button onClick={() => addCrit(tpl.id)} disabled={busy} style={btnGoldStyle}>+</button>
          </div>
        </div>
      ))}

      {/* Criterion editor modal (with 3-tier feedback editor) */}
      {editingCrit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }} onClick={() => setEditingCrit(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 700, maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: SKY_DEEP, marginBottom: 16 }}>{t('teacherEval.feedbackEditor')}</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <input value={editingCrit.labelEn} onChange={(e) => setEditingCrit({ ...editingCrit, labelEn: e.target.value })} placeholder="EN" style={{ ...inputStyle, flex: 1, minWidth: 150 }} />
              <input value={editingCrit.labelAr || ''} onChange={(e) => setEditingCrit({ ...editingCrit, labelAr: e.target.value })} placeholder="AR" style={{ ...inputStyle, flex: 1, minWidth: 150 }} />
              <input type="number" value={editingCrit.maxScore} onChange={(e) => setEditingCrit({ ...editingCrit, maxScore: Number(e.target.value) })} placeholder="Max" style={{ ...inputStyle, width: 70 }} />
              <input type="number" step="0.1" value={Number(editingCrit.weight)} onChange={(e) => setEditingCrit({ ...editingCrit, weight: e.target.value })} placeholder="Wt" style={{ ...inputStyle, width: 70 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={editingCrit.isKpi} onChange={(e) => setEditingCrit({ ...editingCrit, isKpi: e.target.checked })} /> KPI
              </label>
            </div>
            {/* 3-tier feedback editor */}
            {(['weak', 'developing', 'strong'] as const).map(tier => (
              <div key={tier} style={{ marginBottom: 16, padding: 12, borderLeft: `4px solid ${tierColor(tier)}`, background: CREAM_LIGHT, borderRadius: '0 8px 8px 0' }}>
                <strong style={{ color: tierColor(tier) }}>{t(`teacherEval.${tier}`)}</strong>
                {(['en', 'ar'] as const).map(l => (
                  <div key={l} style={{ marginTop: 8 }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>{l === 'ar' ? '🇸🇦' : '🇬🇧'}</div>
                    <input value={(editingCrit.feedback as any)?.[tier]?.[l]?.reason || ''} onChange={(e) => setEditingCrit({
                      ...editingCrit,
                      feedback: {
                        ...editingCrit.feedback,
                        [tier]: { ...((editingCrit.feedback as any)?.[tier] || {}), [l]: { ...((editingCrit.feedback as any)?.[tier]?.[l] || {}), reason: e.target.value } },
                      } as any,
                    })} placeholder="Reason" style={{ ...inputStyle, marginBottom: 4 }} />
                    <textarea value={(editingCrit.feedback as any)?.[tier]?.[l]?.feedback || ''} onChange={(e) => setEditingCrit({
                      ...editingCrit,
                      feedback: {
                        ...editingCrit.feedback,
                        [tier]: { ...((editingCrit.feedback as any)?.[tier] || {}), [l]: { ...((editingCrit.feedback as any)?.[tier]?.[l] || {}), feedback: e.target.value } },
                      } as any,
                    })} placeholder="Feedback" rows={2} style={{ ...inputStyle, marginBottom: 4 }} />
                    <textarea value={(editingCrit.feedback as any)?.[tier]?.[l]?.rec || ''} onChange={(e) => setEditingCrit({
                      ...editingCrit,
                      feedback: {
                        ...editingCrit.feedback,
                        [tier]: { ...((editingCrit.feedback as any)?.[tier] || {}), [l]: { ...((editingCrit.feedback as any)?.[tier]?.[l] || {}), rec: e.target.value } },
                      } as any,
                    })} placeholder="Recommendations" rows={2} style={inputStyle} />
                  </div>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <input value={(editingCrit.feedback as any)?.video || ''} onChange={(e) => setEditingCrit({ ...editingCrit, feedback: { ...editingCrit.feedback, video: e.target.value } as any })} placeholder={t('teacherEval.video')} style={{ ...inputStyle, flex: 1 }} />
              <input value={(editingCrit.feedback as any)?.website || ''} onChange={(e) => setEditingCrit({ ...editingCrit, feedback: { ...editingCrit.feedback, website: e.target.value } as any })} placeholder={t('teacherEval.website')} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingCrit(null)} style={btnStyle}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={saveCrit} disabled={busy} style={btnGoldStyle}>{t('teacherEval.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shared styles ── */
const cardStyle: React.CSSProperties = {
  background: 'white', border: `1px solid ${BEIGE}`, borderRadius: 16,
  padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: `2px solid ${BEIGE}`, borderRadius: 10,
  fontSize: '0.9rem', background: 'white', color: '#1e293b',
}
const btnStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: 25, border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: '0.85rem', background: SKY_DEEP, color: 'white',
  boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
}
const btnGoldStyle: React.CSSProperties = {
  ...btnStyle, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: 'white',
  boxShadow: '0 4px 16px rgba(212,160,23,0.35)',
}
const btnSmStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 18, border: 'none', cursor: 'pointer',
  fontWeight: 600, fontSize: '0.76rem', background: '#e2e8f0', color: '#475569',
}
const thStyle: React.CSSProperties = {
  background: SKY_DEEP, color: 'white', padding: '10px 8px', textAlign: 'center',
  fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
}
const tdStyle: React.CSSProperties = {
  padding: '10px 8px', textAlign: 'center', borderBottom: `1px solid ${BEIGE}`, fontSize: '0.88rem',
}
