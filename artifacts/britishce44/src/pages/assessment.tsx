import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import {
  apiGet, apiPost, apiPatch, ApiError,
  type Sheet, type SheetGrid, type Course,
} from '@/lib/api'
import { ClassroomAssessmentTab } from '@/components/assessment/classroom-assessment-tab'
import { ReportsViewer } from '@/components/assessment/reports-viewer'

type TabKey = 'assessment' | 'attendance' | 'results' | 'classroom' | 'reports'

/* ────────── helpers ────────── */
const PHASE_LABEL: Record<string, { en: string; ar: string }> = {
  first: { en: 'First Teaching Week · Day 5', ar: 'الأسبوع الأول · اليوم 5' },
  last: { en: 'Last Teaching Week · Day 17', ar: 'الأسبوع الأخير · اليوم 17' },
}
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: 'rgba(63,186,235,0.15)', color: '#3FBAEB', label: 'Open' },
  submitted: { bg: 'rgba(0,174,116,0.15)', color: '#00AE74', label: 'Submitted' },
  locked: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'Locked' },
}
function scoreColor(v: number | null): string {
  if (v == null) return 'rgba(255,255,255,0.04)'
  if (v <= 2) return 'rgba(239,68,68,0.22)'
  if (v === 3) return 'rgba(245,158,11,0.22)'
  if (v === 4) return 'rgba(63,186,235,0.22)'
  return 'rgba(0,174,116,0.25)'
}

type ScoreMap = Record<number, Record<number, number | null>>

/* ──────── in-class assessment tab ──────── */
function AssessmentTab() {
  const { lang, isRTL } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [grid, setGrid] = useState<SheetGrid | null>(null)
  const [scores, setScores] = useState<ScoreMap>({})
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const loadIndex = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        apiGet<{ courses: Course[] }>('/assessment/courses'),
        apiGet<{ sheets: Sheet[] }>('/assessment/sheets'),
      ])
      setCourses(c.courses); setSheets(s.sheets)
      setSelectedId(prev => prev ?? (s.sheets.find(x => x.status === 'open')?.id ?? s.sheets[0]?.id ?? null))
    } catch (e) { setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed to load' })
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { loadIndex() }, [loadIndex])

  const loadGrid = useCallback(async (id: number) => {
    try {
      const g = await apiGet<SheetGrid>(`/assessment/sheet/${id}`)
      setGrid(g); setScores(structuredClone(g.scores) as ScoreMap); setDirty(false)
    } catch (e) { setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed to load sheet' }) }
  }, [])
  useEffect(() => { if (selectedId != null) loadGrid(selectedId) }, [selectedId, loadGrid])

  const courseName = useCallback((id: number) => courses.find(c => c.id === id)?.name ?? `Course ${id}`, [courses])
  const editable = grid?.sheet.status === 'open'
  const setScore = (sid: number, cid: number, v: number | null) => {
    setScores(p => ({ ...p, [sid]: { ...(p[sid] ?? {}), [cid]: v } })); setDirty(true)
  }
  const studentAvg = useCallback((sid: number): number | null => {
    if (!grid) return null
    const vals = grid.criteria.map(c => scores[sid]?.[c.id]).filter((v): v is number => typeof v === 'number')
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  }, [grid, scores])

  const save = async () => {
    if (!grid) return; setBusy(true); setMsg(null)
    try {
      const flat: { studentId: number; criterionId: number; score: number | null }[] = []
      for (const s of grid.students) for (const c of grid.criteria) flat.push({ studentId: s.id, criterionId: c.id, score: scores[s.id]?.[c.id] ?? null })
      await apiPost(`/assessment/sheet/${grid.sheet.id}/scores`, { scores: flat }); setDirty(false)
      setMsg({ kind: 'ok', text: 'Scores saved.' })
    } catch (e) { setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Save failed' })
    } finally { setBusy(false) }
  }
  const submit = async () => {
    if (!grid) return
    if (!confirm('Submit this sheet? Scores will be locked and AI reports generated.')) return
    setBusy(true); setMsg(null)
    try {
      if (dirty) {
        const flat: { studentId: number; criterionId: number; score: number | null }[] = []
        for (const s of grid.students) for (const c of grid.criteria) flat.push({ studentId: s.id, criterionId: c.id, score: scores[s.id]?.[c.id] ?? null })
        await apiPost(`/assessment/sheet/${grid.sheet.id}/scores`, { scores: flat })
      }
      const r = await apiPost<{ ok: boolean; generated: number }>(`/assessment/sheet/${grid.sheet.id}/submit`)
      setMsg({ kind: 'ok', text: `Submitted — ${r.generated} report drafts generated.` })
      await Promise.all([loadIndex(), loadGrid(grid.sheet.id)])
    } catch (e) { setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Submit failed' })
    } finally { setBusy(false) }
  }

  const filledCount = useMemo(() => {
    if (!grid) return 0; let n = 0
    for (const s of grid.students) for (const c of grid.criteria) if (typeof scores[s.id]?.[c.id] === 'number') n++
    return n
  }, [grid, scores])
  const totalCells = grid ? grid.students.length * grid.criteria.length : 0

  return (
    <div className="space-y-4">
      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-bold" style={{ background: msg.kind === 'ok' ? 'rgba(0,174,116,0.15)' : 'rgba(239,68,68,0.15)', color: msg.kind === 'ok' ? '#00ae74' : '#ef4444', border: `1px solid ${msg.kind === 'ok' ? 'rgba(0,174,116,0.35)' : 'rgba(239,68,68,0.35)'}` }}>
          {msg.text}
        </div>
      )}
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="rounded-2xl overflow-hidden self-start" style={{ background: 'var(--blue-deep)', border: '1px solid rgba(212,160,23,0.20)' }}>
          <div className="px-4 py-3 text-xs font-bold text-golden-bright border-b" style={{ borderColor: 'rgba(212,160,23,0.15)' }}>Assessment Sheets</div>
          {loading && <div className="px-4 py-6 text-center text-[11px] text-gray-300">Loading…</div>}
          {!loading && sheets.length === 0 && <div className="px-4 py-6 text-center text-[11px] text-gray-300">No assessment sheets assigned to you.</div>}
          <div className="max-h-[70vh] overflow-y-auto custom-scroll">
            {sheets.map(s => {
              const st = STATUS_STYLE[s.status]; const active = s.id === selectedId
              return (
                <button key={s.id} onClick={() => setSelectedId(s.id)}
                  className="w-full text-left px-4 py-3 border-b transition" style={{ borderColor: 'rgba(212,160,23,0.06)', background: active ? 'rgba(212,160,23,0.12)' : 'transparent' }}>
                  <p className="text-xs font-semibold text-white truncate">{courseName(s.courseId)}</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">{(PHASE_LABEL[s.phase] ?? PHASE_LABEL.first)[lang]} · due {s.dueDate}</p>
                  <span className="inline-block mt-1.5 text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          {!grid && !loading && (
            <div className="rounded-2xl p-10 text-center text-sm font-semibold text-gray-300" style={{ background: 'var(--blue-deep)', border: '1px solid rgba(212,160,23,0.20)' }}>
              Select a sheet to start scoring.
            </div>
          )}
          {grid && (
            <>
              <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--blue-deep)', border: '1px solid rgba(212,160,23,0.25)' }}>
                <div>
                  <h3 className="font-bold text-white text-sm drop-shadow-sm">{grid.course.name}</h3>
                  <p className="text-[10px] text-gray-300 mt-0.5 font-medium">
                    {grid.course.teacherName ? `Teacher: ${grid.course.teacherName} · ` : ''}{grid.sheet.termLabel} · {(PHASE_LABEL[grid.sheet.phase] ?? PHASE_LABEL.first)[lang]} · due {grid.sheet.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-300 font-medium">{filledCount}/{totalCells} filled</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full" style={{ background: STATUS_STYLE[grid.sheet.status].bg, color: STATUS_STYLE[grid.sheet.status].color }}>{STATUS_STYLE[grid.sheet.status].label}</span>
                </div>
              </div>

              {!editable && (
                <div className="rounded-xl px-4 py-2.5 text-[11px] font-bold" style={{ background: 'rgba(148,163,184,0.15)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.3)' }}>
                  This sheet is {grid.sheet.status}. Scores are read-only.
                </div>
              )}

              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--blue-deep)', border: '2px solid rgba(212,160,23,0.40)' }}>
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr style={{ background: 'rgba(30,58,138,0.8)' }}>
                        <th className="sticky left-0 z-10 px-3 py-2.5 text-left text-[10px] font-bold text-white whitespace-nowrap" style={{ background: 'rgba(30,58,138,0.95)' }}>Student</th>
                        {grid.criteria.map(c => (
                          <th key={c.id} className="px-2 py-2.5 text-[9px] font-bold text-gray-200 whitespace-nowrap" style={{ minWidth: 64 }}>
                            {lang === 'ar' ? c.labelAr : c.labelEn}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-[10px] font-bold text-white whitespace-nowrap">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grid.students.map((s, ri) => {
                        const avg = studentAvg(s.id)
                        return (
                          <tr key={s.id} style={{ background: ri % 2 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>
                            <td className="sticky left-0 z-10 px-3 py-2 text-[11px] font-semibold text-white whitespace-nowrap" style={{ background: ri % 2 ? 'rgba(30,58,138,0.97)' : 'rgba(30,58,138,0.92)' }}>
                              {s.name}{s.parentName && <span className="block text-[8px] text-gray-300 font-normal">{s.parentName}</span>}
                            </td>
                            {grid.criteria.map(c => {
                              const v = scores[s.id]?.[c.id] ?? null
                              return (
                                <td key={c.id} className="px-1.5 py-1.5 text-center">
                                  <select value={v ?? ''} disabled={!editable}
                                    onChange={e => setScore(s.id, c.id, e.target.value === '' ? null : Number(e.target.value))}
                                    className="w-12 text-center text-[11px] font-bold rounded-lg py-1.5 outline-none cursor-pointer disabled:cursor-default text-white"
                                    style={{ background: scoreColor(v), border: '1px solid rgba(255,255,255,0.10)' }}>
                                    <option value="" style={{ background: '#1e3a8a' }}>–</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} style={{ background: '#1e3a8a' }}>{n}</option>)}
                                  </select>
                                </td>
                              )
                            })}
                            <td className="px-3 py-2 text-center text-[12px] font-black" style={{ color: avg == null ? '#64748b' : avg >= 4 ? '#34d399' : avg >= 3 ? '#D4A017' : '#f87171' }}>
                              {avg ?? '–'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {editable && (
                <div className="flex items-center justify-end gap-3">
                  {dirty && <span className="text-[10px] text-golden-bright font-bold">Unsaved changes</span>}
                  <button onClick={save} disabled={busy || !dirty}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-40"
                    style={{ background: 'rgba(212,160,23,0.20)', border: '1px solid rgba(212,160,23,0.40)' }}>
                    {busy ? 'Saving…' : '💾 Save Scores'}
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={busy}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-40 golden-gradient">
                    ✓ Submit & Generate Reports
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ──────── types for attendance / results ──────── */
interface AttSheet { id: number; subject: string; termId: string; groupNo: string; teacherName: string; startDate: string; endDate: string; period: string; room: string; timeRange: string; dateHeaders: string[] }
interface AttRow { id: number; sheetId: number; rowNumber: number; studentName: string; dates: Record<string,{ value: string; color: string } | null>; pr: string; ma1: string; re: string; ma2: string; wr: string; ma3: string; aps: string }

const ROW_COUNT = 12

/* ──────── attendance sheet tab ──────── */
function AttendanceTab() {
  const [sheet, setSheet] = useState<AttSheet | null>(null)
  const [rows, setRows] = useState<AttRow[]>([])
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const perPage = 12
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/')

  const dateHeaders = useMemo(() =>
    sheet?.dateHeaders?.length ? sheet.dateHeaders
      : Array.from({ length: 21 }, (_, i) => `${i + 1}`)
  , [sheet])

  const load = useCallback(async () => {
    try {
      const sRes = await apiGet<{ sheets: AttSheet[] }>('/attendance/sheets')
      let s = sRes.sheets[0]
      if (!s) {
        const c = await apiPost<{ sheet: AttSheet }>('/attendance/sheets')
        s = c.sheet
      }
      setSheet(s)
      const rRes = await apiGet<{ rows: AttRow[] }>(`/attendance/sheets/${s.id}/rows`)
      let r = rRes.rows
      if (r.length < ROW_COUNT) {
        for (let i = r.length + 1; i <= ROW_COUNT; i++) {
          const cr = await apiPost<{ row: AttRow }>(`/attendance/sheets/${s.id}/rows`, { rowNumber: i })
          r = [...r, cr.row]
        }
      }
      setRows(r.sort((a, b) => a.rowNumber - b.rowNumber))
    } catch { /* ignore */ }
  }, [])
  useEffect(() => { load() }, [load])

  const updateMeta = async (patch: Partial<AttSheet>) => {
    if (!sheet) return
    setBusy(true)
    try {
      const r = await apiPatch<{ sheet: AttSheet }>(`/attendance/sheets/${sheet.id}`, patch)
      setSheet(r.sheet)
    } finally { setBusy(false) }
  }

  const updateRow = async (id: number, patch: Partial<AttRow>) => {
    setBusy(true)
    try {
      const r = await apiPatch<{ row: AttRow }>(`/attendance/rows/${id}`, patch)
      setRows(prev => prev.map(x => x.id === id ? r.row : x))
    } finally { setBusy(false) }
  }

  const clickDateCell = async (row: AttRow, colIdx: number) => {
    const key = String(colIdx)
    const current = row.dates?.[key]
    let next: { value: string; color: string } | null = null
    if (!current || current.color === '#ffffff') {
      const val = prompt('Enter value (e.g. B, G, F, Q):')
      if (val === null) return
      next = { value: val || '✓', color: '#22c55e' }
    } else if (current.color === '#22c55e') {
      const val = prompt('Enter value (e.g. F, Q):')
      if (val === null) return
      next = { value: val || '✗', color: '#ef4444' }
    } else {
      next = { value: '', color: '#ffffff' }
    }
    const dates = { ...(row.dates || {}), [key]: next?.color === '#ffffff' ? null : next }
    await updateRow(row.id, { dates } as any)
  }

  const totalPages = Math.ceil(rows.length / perPage)
  const paged = rows.slice(page * perPage, (page + 1) * perPage)

  const perfHeaders = ['Pr', 'Ma', 'Re', 'Ma', 'Wr', 'Ma', 'APS']
  const perfKeys: (keyof AttRow)[] = ['pr', 'ma1', 're', 'ma2', 'wr', 'ma3', 'aps']

  const updatePerf = async (row: AttRow, key: keyof AttRow, val: string) => {
    await updateRow(row.id, { [key]: val } as any)
  }

  return (
    <div className="space-y-3">
      {/* metadata bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Subject:</span>
          <input value={sheet?.subject ?? ''} onChange={e => updateMeta({ subject: e.target.value })}
            className="flex-1 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" placeholder="Windows" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Term Id:</span>
          <input value={sheet?.termId ?? ''} onChange={e => updateMeta({ termId: e.target.value })}
            className="w-16 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Group No.:</span>
          <input value={sheet?.groupNo ?? ''} onChange={e => updateMeta({ groupNo: e.target.value })}
            className="w-12 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Teacher:</span>
          <input value={sheet?.teacherName ?? ''} onChange={e => updateMeta({ teacherName: e.target.value })}
            className="flex-1 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Start Date:</span>
          <input value={sheet?.startDate ?? ''} onChange={e => updateMeta({ startDate: e.target.value })}
            className="w-28 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" placeholder="13/06/2026" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">End Date:</span>
          <input value={sheet?.endDate ?? ''} onChange={e => updateMeta({ endDate: e.target.value })}
            className="w-28 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" placeholder="22/06/2026" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Period:</span>
          <select value={sheet?.period ?? 'Morning'} onChange={e => updateMeta({ period: e.target.value })}
            className="bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none text-[11px] focus:border-emerald-400">
            <option style={{ background: '#150D79' }}>Morning</option>
            <option style={{ background: '#150D79' }}>Evening</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Room:</span>
          <input value={sheet?.room ?? ''} onChange={e => updateMeta({ room: e.target.value })}
            className="w-20 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
          <span className="text-gray-400 font-medium ml-2">Time:</span>
          <input value={sheet?.timeRange ?? ''} onChange={e => updateMeta({ timeRange: e.target.value })}
            className="w-20 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
      </div>

      {/* main datasheet table */}
      <div className="overflow-x-auto custom-scroll" style={{ border: '2px solid #2563eb', borderRadius: 0 }}>
        <table className="w-full border-collapse text-[11px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#dbeafe' }}>
              <th style={{ border: '1px solid #bfdbfe', padding: '6px 8px', fontWeight: 700, color: '#1e3a8a', minWidth: 36, textAlign: 'center' }}>N</th>
              <th style={{ border: '1px solid #bfdbfe', padding: '6px 8px', fontWeight: 700, color: '#1e3a8a', minWidth: 140, textAlign: 'left' }}>Name</th>
              {dateHeaders.map((h, i) => (
                <th key={i} style={{ border: '1px solid #bfdbfe', padding: '6px 4px', fontWeight: 600, color: '#1e3a8a', minWidth: 32, textAlign: 'center', fontSize: 10 }}>{h}</th>
              ))}
              {perfHeaders.map((h, i) => (
                <th key={`ph-${i}`} style={{ border: '1px solid #bfdbfe', padding: '6px 4px', fontWeight: 600, color: '#1e3a8a', minWidth: 32, textAlign: 'center', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => (
              <tr key={row.id} style={{ background: ri % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                <td style={{ border: '1px solid #e2e8f0', padding: '4px 8px', textAlign: 'center', color: '#1e3a8a', fontWeight: 700 }}>{row.rowNumber}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 8px' }}>
                  <input value={row.studentName} onChange={e => updateRow(row.id, { studentName: e.target.value } as any)}
                    className="w-full bg-transparent text-[11px] text-blue-deep font-semibold outline-none" placeholder="Enter student name" />
                </td>
                {dateHeaders.map((_, ci) => {
                  const cell = row.dates?.[String(ci)] ?? null
                  return (
                    <td key={ci} onClick={() => clickDateCell(row, ci)}
                      style={{
                        border: '1px solid #e2e8f0', padding: 0, textAlign: 'center', cursor: 'pointer',
                        background: cell?.color === '#22c55e' ? '#22c55e' : cell?.color === '#ef4444' ? '#ef4444' : '#ffffff',
                        color: cell?.color ? '#ffffff' : '#94a3b8', fontWeight: cell?.color ? 700 : 400,
                        fontSize: 11, minWidth: 32, height: 28,
                      }}>
                      {cell?.value ?? ''}
                    </td>
                  )
                })}
                {perfKeys.map((key) => (
                  <td key={key as string} style={{ border: '1px solid #e2e8f0', padding: 0, textAlign: 'center' }}>
                    <input value={(row as any)[key] ?? ''} onChange={e => updatePerf(row, key, e.target.value)}
                      className="w-full h-7 bg-transparent text-center text-[11px] text-blue-deep font-semibold outline-none" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between text-[11px]">
        <button onClick={load} className="text-gray-300 hover:text-golden-bright px-3 py-1 rounded-lg border border-white/20 font-medium">↻ Refresh</button>
        <div className="flex items-center gap-2 text-gray-300">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded disabled:opacity-30 border border-white/20 font-medium">‹ Prev</button>
          <span className="font-medium">Page {page + 1} of {totalPages || 1}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded disabled:opacity-30 border border-white/20 font-medium">Next ›</button>
        </div>
        {busy && <span className="text-golden-bright text-[10px] font-bold">Saving…</span>}
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 text-[10px] text-gray-300 border-t border-white/15 pt-2 font-medium">
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: '#22c55e' }} /> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: '#ef4444' }} /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block rounded" style={{ background: '#ffffff', border: '1px solid #cbd5e1' }} /> Not set</span>
      </div>
    </div>
  )
}

/* ──────── results sheet tab ──────── */
interface ResSheet { id: number; subject: string; teacherName: string; startDate: string; endDate: string; groupNo: string; period: string; timeRange: string; room: string }
interface ResRow { id: number; sheetId: number; rowNumber: number; studentName: string; atten: number | null; projects: number | null; quiz1: number | null; quiz2: number | null; listening: number | null; reading: number | null; writing: number | null; speaking: number | null; final: number | null; total: number | null; abse: number | null }

const WEIGHTS = { atten: 0.05, projects: 0.10, quiz1: 0.10, quiz2: 0.15, listening: 0.10, reading: 0.10, writing: 0.10, speaking: 0.10, final: 0.20 }
const ASSESS_LABELS: { key: keyof ResRow & string; label: string; weight: string }[] = [
  { key: 'atten', label: 'atten', weight: '5%' },
  { key: 'projects', label: 'projects', weight: '10%' },
  { key: 'quiz1', label: 'Quiz 1', weight: '10%' },
  { key: 'quiz2', label: 'Quiz2', weight: '15%' },
  { key: 'listening', label: 'Listening', weight: '10%' },
  { key: 'reading', label: 'Reading', weight: '10%' },
  { key: 'writing', label: 'Writing', weight: '10%' },
  { key: 'speaking', label: 'speaking', weight: '10%' },
  { key: 'final', label: 'Final', weight: '20%' },
]

function calcTotal(r: ResRow): number {
  let t = 0
  for (const { key } of ASSESS_LABELS) {
    const v = r[key]
    if (v != null) t += v * (WEIGHTS as any)[key]
  }
  return Math.round(t * 100) / 100
}

function ResultsTab() {
  const [sheet, setSheet] = useState<ResSheet | null>(null)
  const [rows, setRows] = useState<ResRow[]>([])
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const perPage = 13
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/')

  const load = useCallback(async () => {
    try {
      const sRes = await apiGet<{ sheets: ResSheet[] }>('/results/sheets')
      let s = sRes.sheets[0]
      if (!s) {
        const c = await apiPost<{ sheet: ResSheet }>('/results/sheets')
        s = c.sheet
      }
      setSheet(s)
      const rRes = await apiGet<{ rows: ResRow[] }>(`/results/sheets/${s.id}/rows`)
      let r = rRes.rows
      if (r.length < 13) {
        for (let i = r.length + 1; i <= 13; i++) {
          const cr = await apiPost<{ row: ResRow }>(`/results/sheets/${s.id}/rows`, { rowNumber: i })
          r = [...r, cr.row]
        }
      }
      setRows(r.sort((a, b) => a.rowNumber - b.rowNumber))
    } catch { /* ignore */ }
  }, [])
  useEffect(() => { load() }, [load])

  const updateMeta = async (patch: Partial<ResSheet>) => {
    if (!sheet) return; setBusy(true)
    try { const r = await apiPatch<{ sheet: ResSheet }>(`/results/sheets/${sheet.id}`, patch); setSheet(r.sheet) } finally { setBusy(false) }
  }

  const updateRowVal = async (id: number, key: string, val: number | null) => {
    setBusy(true)
    try {
      const row = rows.find(r => r.id === id)
      if (!row) return
      const updated = { ...row, [key]: val }
      const total = calcTotal(updated)
      const r = await apiPatch<{ row: ResRow }>(`/results/rows/${id}`, { [key]: val, total } as any)
      setRows(prev => prev.map(x => x.id === id ? r.row : x))
    } finally { setBusy(false) }
  }

  const totalPages = Math.ceil(rows.length / perPage)
  const paged = rows.slice(page * perPage, (page + 1) * perPage)

  return (
    <div className="space-y-3">
      {/* metadata bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Subject:</span>
          <input value={sheet?.subject ?? ''} onChange={e => updateMeta({ subject: e.target.value })}
            className="flex-1 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Teacher:</span>
          <input value={sheet?.teacherName ?? ''} onChange={e => updateMeta({ teacherName: e.target.value })}
            className="flex-1 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Start:</span>
          <input value={sheet?.startDate ?? ''} onChange={e => updateMeta({ startDate: e.target.value })}
            className="w-24 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">End:</span>
          <input value={sheet?.endDate ?? ''} onChange={e => updateMeta({ endDate: e.target.value })}
            className="w-24 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Group No:</span>
          <input value={sheet?.groupNo ?? ''} onChange={e => updateMeta({ groupNo: e.target.value })}
            className="w-12 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Period:</span>
          <select value={sheet?.period ?? 'Morning'} onChange={e => updateMeta({ period: e.target.value })}
            className="bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none text-[11px] focus:border-emerald-400">
            <option style={{ background: '#150D79' }}>Morning</option>
            <option style={{ background: '#150D79' }}>Evening</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Time:</span>
          <input value={sheet?.timeRange ?? ''} onChange={e => updateMeta({ timeRange: e.target.value })}
            className="w-20 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-medium">Room:</span>
          <input value={sheet?.room ?? ''} onChange={e => updateMeta({ room: e.target.value })}
            className="w-20 bg-transparent border-b border-white/10 text-white px-1 py-0.5 outline-none focus:border-emerald-400" />
        </div>
      </div>

      {/* results datasheet */}
      <div className="overflow-x-auto custom-scroll" style={{ border: '2px solid #2563eb', borderRadius: 0 }}>
        <table className="w-full border-collapse text-[11px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#dbeafe' }}>
              <th style={{ border: '1px solid #bfdbfe', padding: '6px 6px', fontWeight: 700, color: '#1e3a8a', minWidth: 30, textAlign: 'center' }}>م</th>
              <th style={{ border: '1px solid #bfdbfe', padding: '6px 8px', fontWeight: 700, color: '#1e3a8a', minWidth: 140, textAlign: 'left' }}>Student's Name</th>
              {ASSESS_LABELS.map(a => (
                <th key={a.key} style={{ border: '1px solid #bfdbfe', padding: '6px 4px', fontWeight: 700, color: '#1e3a8a', minWidth: 55, textAlign: 'center', fontSize: 9 }}>
                  {a.label}<br /><span style={{ fontSize: 8, fontWeight: 500 }}>{a.weight}</span>
                </th>
              ))}
              <th style={{ border: '1px solid #bfdbfe', padding: '6px 6px', fontWeight: 700, color: '#1e3a8a', minWidth: 55, textAlign: 'center', fontSize: 10 }}>
                Total<br /><span style={{ fontSize: 8, fontWeight: 500 }}>100%</span>
              </th>
              <th style={{ border: '1px solid #bfdbfe', padding: '6px 6px', fontWeight: 700, color: '#1e3a8a', minWidth: 40, textAlign: 'center', fontSize: 10 }}>Abse</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, ri) => {
              const total = calcTotal(row)
              return (
                <tr key={row.id} style={{ background: ri % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center', color: '#1e3a8a', fontWeight: 700 }}>{row.rowNumber}</td>
                  <td style={{ border: '1px solid #e2e8f0', padding: '2px 8px' }}>
                    <input value={row.studentName} onChange={e => { const v = e.target.value; apiPatch(`/results/rows/${row.id}`, { studentName: v }).then(() => setRows(prev => prev.map(x => x.id === row.id ? { ...x, studentName: v } : x))) }}
                      className="w-full bg-transparent text-[11px] text-blue-deep font-semibold outline-none" placeholder="Enter student name" />
                  </td>
                  {ASSESS_LABELS.map(a => (
                    <td key={a.key} style={{ border: '1px solid #e2e8f0', padding: 0, textAlign: 'center' }}>
                      <input type="number" min={0} max={100} value={row[a.key] ?? ''} onChange={e => updateRowVal(row.id, a.key, e.target.value === '' ? null : Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full h-7 bg-transparent text-center text-[11px] text-blue-deep font-semibold outline-none" />
                    </td>
                  ))}
                  <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#1e3a8a', background: '#dbeafe' }}>
                    {total.toFixed(1)}
                  </td>
                  <td style={{ border: '1px solid #e2e8f0', padding: 0, textAlign: 'center' }}>
                    <input type="number" min={0} value={row.abse ?? ''} onChange={e => updateRowVal(row.id, 'abse', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full h-7 bg-transparent text-center text-[11px] outline-none"
                      style={{ color: (row.abse ?? 0) > 0 ? '#ef4444' : '#1e3a8a', fontWeight: (row.abse ?? 0) > 0 ? 700 : 600 }} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* signature footer */}
      <div className="grid grid-cols-4 gap-4 text-[10px] pt-2 border-t border-blue-pale/30">
        {['Trainer', 'Academic supervisor', "Students' Affairs", 'Center manager'].map(label => (
          <div key={label} className="text-center">
            <div className="border-b border-dashed border-gray-400 h-8 mb-1" />
            <span className="text-blue-deep font-semibold">{label}</span>
          </div>
        ))}
      </div>

      {/* instructions */}
      <div className="text-[10px] space-y-1 font-semibold" style={{ color: '#dc2626' }}>
        <p>• Not to amend after writing Marks</p>
        <p>• Writing marks after rounding , if any</p>
        <p>• Students must sign on this register</p>
        <p>• The Trainer must sign on this register</p>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between text-[11px]">
        <button onClick={load} className="text-gray-300 hover:text-golden-bright px-3 py-1 rounded-lg border border-white/20 font-medium">↻ Refresh</button>
        <div className="flex items-center gap-2 text-gray-300">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded disabled:opacity-30 border border-white/20 font-medium">‹ Prev</button>
          <span className="font-medium">Page {page + 1} of {totalPages || 1}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded disabled:opacity-30 border border-white/20 font-medium">Next ›</button>
        </div>
        {busy && <span className="text-golden-bright text-[10px] font-bold">Saving…</span>}
      </div>
    </div>
  )
}

/* ──────── main page with tabs ──────── */
export function AssessmentPage() {
  const [tab, setTab] = useState<TabKey>('assessment')

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'classroom', label: 'Classroom Assessment', icon: '📝' },
    { key: 'assessment', label: 'In-Class Scoring', icon: '📋' },
    { key: 'attendance', label: 'Attendance Sheet', icon: '📅' },
    { key: 'results', label: 'Results Sheet', icon: '📊' },
    { key: 'reports', label: 'Reports Dashboard', icon: '📄' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-blue-deep drop-shadow-sm">📋 System Datasheets</h2>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Classroom Assessment · In-Class Scoring · Attendance · Results · Reports</p>
        </div>
        <div className="flex items-center gap-1 bg-beige-light rounded-xl p-1 border border-blue-pale">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${tab === t.key ? 'bg-blue-primary text-white shadow-sm' : 'text-blue-deep hover:text-blue-primary border border-transparent'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'classroom' && <ClassroomAssessmentTab />}
      {tab === 'assessment' && <AssessmentTab />}
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'results' && <ResultsTab />}
      {tab === 'reports' && <ReportsViewer />}
    </div>
  )
}
