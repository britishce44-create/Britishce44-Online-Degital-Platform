import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import {
  apiGet, apiPost, ApiError,
  type Sheet, type SheetGrid, type Course,
} from '@/lib/api'

type ScoreMap = Record<number, Record<number, number | null>>

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

export function AssessmentPage() {
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
      setCourses(c.courses)
      setSheets(s.sheets)
      setSelectedId(prev => prev ?? (s.sheets.find(x => x.status === 'open')?.id ?? s.sheets[0]?.id ?? null))
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadIndex() }, [loadIndex])

  const loadGrid = useCallback(async (id: number) => {
    try {
      const g = await apiGet<SheetGrid>(`/assessment/sheet/${id}`)
      setGrid(g)
      setScores(structuredClone(g.scores) as ScoreMap)
      setDirty(false)
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Failed to load sheet' })
    }
  }, [])

  useEffect(() => { if (selectedId != null) loadGrid(selectedId) }, [selectedId, loadGrid])

  const courseName = useCallback(
    (id: number) => courses.find(c => c.id === id)?.name ?? `Course ${id}`,
    [courses],
  )

  const editable = grid?.sheet.status === 'open'

  const setScore = (studentId: number, criterionId: number, value: number | null) => {
    setScores(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [criterionId]: value },
    }))
    setDirty(true)
  }

  const studentAvg = useCallback((studentId: number): number | null => {
    if (!grid) return null
    const vals = grid.criteria
      .map(c => scores[studentId]?.[c.id])
      .filter((v): v is number => typeof v === 'number')
    if (!vals.length) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }, [grid, scores])

  const save = async () => {
    if (!grid) return
    setBusy(true); setMsg(null)
    try {
      const flat: { studentId: number; criterionId: number; score: number | null }[] = []
      for (const s of grid.students)
        for (const c of grid.criteria)
          flat.push({ studentId: s.id, criterionId: c.id, score: scores[s.id]?.[c.id] ?? null })
      await apiPost(`/assessment/sheet/${grid.sheet.id}/scores`, { scores: flat })
      setDirty(false)
      setMsg({ kind: 'ok', text: 'Scores saved.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Save failed' })
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    if (!grid) return
    if (!confirm('Submit this sheet? Scores will be locked for teachers and AI reports will be generated for review.')) return
    setBusy(true); setMsg(null)
    try {
      if (dirty) {
        const flat: { studentId: number; criterionId: number; score: number | null }[] = []
        for (const s of grid.students)
          for (const c of grid.criteria)
            flat.push({ studentId: s.id, criterionId: c.id, score: scores[s.id]?.[c.id] ?? null })
        await apiPost(`/assessment/sheet/${grid.sheet.id}/scores`, { scores: flat })
      }
      const r = await apiPost<{ ok: boolean; generated: number }>(`/assessment/sheet/${grid.sheet.id}/submit`)
      setMsg({ kind: 'ok', text: `Submitted — ${r.generated} report drafts generated. Review them in the Academic Room.` })
      await Promise.all([loadIndex(), loadGrid(grid.sheet.id)])
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof ApiError ? e.message : 'Submit failed' })
    } finally {
      setBusy(false)
    }
  }

  const filledCount = useMemo(() => {
    if (!grid) return 0
    let n = 0
    for (const s of grid.students)
      for (const c of grid.criteria)
        if (typeof scores[s.id]?.[c.id] === 'number') n++
    return n
  }, [grid, scores])
  const totalCells = grid ? grid.students.length * grid.criteria.length : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gradient-aurora">📋 In-Class Performance Assessment</h2>
          <p className="text-sm text-gray-500 mt-0.5">Score every student 1–5 per criterion, then submit to generate parent &amp; teacher reports.</p>
        </div>
        <button onClick={loadIndex}
          className="text-[11px] font-bold px-3 py-2 rounded-xl text-white"
          style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.3)' }}>
          ↻ Refresh
        </button>
      </div>

      {msg && (
        <div className="rounded-xl px-4 py-2.5 text-xs font-semibold"
          style={{
            background: msg.kind === 'ok' ? 'rgba(0,174,116,0.12)' : 'rgba(239,68,68,0.12)',
            color: msg.kind === 'ok' ? '#34d399' : '#f87171',
            border: `1px solid ${msg.kind === 'ok' ? 'rgba(0,174,116,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
          {msg.text}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Sheet selector */}
        <div className="rounded-2xl overflow-hidden self-start"
          style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(63,186,235,0.18)' }}>
          <div className="px-4 py-3 text-xs font-bold text-sky-400 border-b" style={{ borderColor: 'rgba(63,186,235,0.12)' }}>
            Assessment Sheets
          </div>
          {loading && <div className="px-4 py-6 text-center text-[11px] text-gray-500">Loading…</div>}
          {!loading && sheets.length === 0 && (
            <div className="px-4 py-6 text-center text-[11px] text-gray-500">No assessment sheets assigned to you.</div>
          )}
          <div className="max-h-[70vh] overflow-y-auto custom-scroll">
            {sheets.map(s => {
              const st = STATUS_STYLE[s.status]
              const active = s.id === selectedId
              return (
                <button key={s.id} onClick={() => setSelectedId(s.id)}
                  className="w-full text-left px-4 py-3 border-b transition"
                  style={{ borderColor: 'rgba(63,186,235,0.06)', background: active ? 'rgba(63,186,235,0.08)' : 'transparent' }}>
                  <p className="text-xs font-semibold text-white truncate">{courseName(s.courseId)}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    {(PHASE_LABEL[s.phase] ?? PHASE_LABEL.first)[lang]} · due {s.dueDate}
                  </p>
                  <span className="inline-block mt-1.5 text-[8px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="lg:col-span-3 space-y-3">
          {!grid && !loading && (
            <div className="rounded-2xl p-10 text-center text-sm text-gray-500"
              style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
              Select a sheet to start scoring.
            </div>
          )}
          {grid && (
            <>
              <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
                style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
                <div>
                  <h3 className="font-bold text-white text-sm">{grid.course.name}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {grid.course.teacherName ? `Teacher: ${grid.course.teacherName} · ` : ''}
                    {grid.sheet.termLabel} · {(PHASE_LABEL[grid.sheet.phase] ?? PHASE_LABEL.first)[lang]} · due {grid.sheet.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{filledCount}/{totalCells} filled</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: STATUS_STYLE[grid.sheet.status].bg, color: STATUS_STYLE[grid.sheet.status].color }}>
                    {STATUS_STYLE[grid.sheet.status].label}
                  </span>
                </div>
              </div>

              {!editable && (
                <div className="rounded-xl px-4 py-2.5 text-[11px] font-semibold"
                  style={{ background: 'rgba(148,163,184,0.1)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.2)' }}>
                  This sheet is {grid.sheet.status}. Scores are read-only — reopen it from the Academic Management Room to edit.
                </div>
              )}

              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(26, 19, 92,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr style={{ background: 'rgba(21,13,121,0.6)' }}>
                        <th className="sticky left-0 z-10 px-3 py-2.5 text-left text-[10px] font-bold text-white whitespace-nowrap"
                          style={{ background: 'rgba(21,13,121,0.95)' }}>Student</th>
                        {grid.criteria.map(c => (
                          <th key={c.id} className="px-2 py-2.5 text-[9px] font-bold text-gray-300 whitespace-nowrap" style={{ minWidth: 64 }}>
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
                          <tr key={s.id} style={{ background: ri % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                            <td className="sticky left-0 z-10 px-3 py-2 text-[11px] font-semibold text-white whitespace-nowrap"
                              style={{ background: ri % 2 ? 'rgba(28,21,86,0.97)' : 'rgba(24,17,80,0.97)' }}>
                              {s.name}
                              {s.parentName && <span className="block text-[8px] text-gray-500 font-normal">{s.parentName}</span>}
                            </td>
                            {grid.criteria.map(c => {
                              const v = scores[s.id]?.[c.id] ?? null
                              return (
                                <td key={c.id} className="px-1.5 py-1.5 text-center">
                                  <select
                                    value={v ?? ''}
                                    disabled={!editable}
                                    onChange={e => setScore(s.id, c.id, e.target.value === '' ? null : Number(e.target.value))}
                                    className="w-12 text-center text-[11px] font-bold rounded-lg py-1.5 outline-none cursor-pointer disabled:cursor-default text-white"
                                    style={{ background: scoreColor(v), border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <option value="" style={{ background: '#150D79' }}>–</option>
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <option key={n} value={n} style={{ background: '#150D79' }}>{n}</option>
                                    ))}
                                  </select>
                                </td>
                              )
                            })}
                            <td className="px-3 py-2 text-center text-[12px] font-black"
                              style={{ color: avg == null ? '#64748b' : avg >= 4 ? '#34d399' : avg >= 3 ? '#fbbf24' : '#f87171' }}>
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
                  {dirty && <span className="text-[10px] text-amber-400">Unsaved changes</span>}
                  <button onClick={save} disabled={busy || !dirty}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition disabled:opacity-40"
                    style={{ background: 'rgba(63,186,235,0.18)', border: '1px solid rgba(63,186,235,0.35)' }}>
                    {busy ? 'Saving…' : '💾 Save Scores'}
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
      </div>
    </div>
  )
}
