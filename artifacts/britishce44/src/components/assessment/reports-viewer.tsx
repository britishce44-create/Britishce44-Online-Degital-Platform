import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGet, ApiError } from '@/lib/api'

interface Report {
  id: number; kind: string; audience: string; language: string;
  level: string; body: string; status: string; driveLink: string | null;
  createdAt: string; studentName: string | null; courseName: string | null;
  sheetId: number | null; studentId: number | null; courseId: number | null;
}

export function ReportsViewer() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [pdfData, setPdfData] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'teacher' | 'student'>('all')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiGet<{ reports: Report[] }>('/classroom-assessment/reports')
      setReports(r.reports)
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.audience !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (r.studentName?.toLowerCase().includes(q) || r.courseName?.toLowerCase().includes(q) || false)
    }
    return true
  })

  const viewReport = async (report: Report) => {
    setSelectedReport(report)
    setPdfData(null)
    try {
      const data = await apiGet<any>(`/classroom-assessment/reports/${report.id}/generate-pdf`)
      setPdfData(data)
    } catch { setPdfData({ body: report.body }) }
  }

  const printReport = () => {
    if (!pdfData) return
    const html = generateReportHtml(pdfData)
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 500)
    }
  }

  const statBadge = (status: string) => {
    const cfg: Record<string, { bg: string; color: string; label: string }> = {
      draft: { bg: '#fef3c7', color: '#92400e', label: 'Draft' },
      sent: { bg: '#d1fae5', color: '#065f46', label: 'Sent' },
      edited: { bg: '#dbeafe', color: '#1e40af', label: 'Edited' },
      failed: { bg: '#fce4ec', color: '#b91c1c', label: 'Failed' },
    }
    const c = cfg[status] || cfg.draft
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>
  }

  const audLabels: Record<string, { icon: string; label: string }> = {
    parent: { icon: '👪', label: 'Parent' },
    teacher: { icon: '👩‍🏫', label: 'Teacher' },
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {(['all', 'teacher', 'student'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition border"
              style={filter === f ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' } : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
              {f === 'all' ? '📋 All' : f === 'teacher' ? '👩‍🏫 Teacher' : '🎓 Student'}
            </button>
          ))}
        </div>
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white border border-blue-200 outline-none focus:border-blue-500 w-48" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-300 text-[10px]">🔍</span>
        </div>
        <button onClick={loadReports} className="text-xs px-3 py-1.5 rounded-lg text-blue-500 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">↻</button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-blue-400">Loading reports…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm text-blue-400">No reports found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => viewReport(r)}
              className="rounded-xl p-4 bg-white border border-blue-100 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: r.audience === 'teacher' ? '#dbeafe' : '#d1fae5' }}>
                    {r.audience === 'teacher' ? '👩‍🏫' : '🎓'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.studentName || 'Student'}</p>
                    <p className="text-[10px] text-blue-400">{r.courseName || 'Course'}</p>
                  </div>
                </div>
                {statBadge(r.status)}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{r.body?.slice(0, 120)}…</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{r.audience === 'teacher' ? '👩‍🏫 Teacher Report' : '🎓 Student Report'} · {r.language === 'ar' ? '🇾🇪 AR' : '🇬🇧 EN'}</span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-xs text-blue-300 text-center">{filtered.length} reports</p>

      {/* Report viewer modal */}
      <AnimatePresence>
        {selectedReport && pdfData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col">
              <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-400" />
              <div className="p-4 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">📄 {selectedReport.studentName || 'Report'} — {selectedReport.courseName || ''}</h3>
                  <p className="text-xs text-blue-400">Level: {selectedReport.level} · {new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={printReport} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
                    🖨️ Print / Save PDF
                  </button>
                  <button onClick={() => { setSelectedReport(null); setPdfData(null) }}
                    className="w-8 h-8 rounded-full text-blue-400 hover:bg-blue-50 transition">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none">
                  {/* Report content styled like a formal document */}
                  <div className="border-b border-blue-100 pb-4 mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{pdfData.studentName}</h4>
                    <p className="text-sm text-blue-500">{pdfData.courseName} · {pdfData.centerName}</p>
                  </div>
                  {pdfData.scores?.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-bold text-gray-700 mb-2">📊 Assessment Scores</h5>
                      <table className="w-full text-sm border-collapse">
                        {pdfData.scores.map((s: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="px-3 py-1.5 text-gray-600">{s.label}</td>
                            <td className="px-3 py-1.5 font-semibold text-right">{s.score !== null ? `${s.score}/5` : '—'}</td>
                          </tr>
                        ))}
                      </table>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {pdfData.body || selectedReport.body}
                  </div>
                  <div className="mt-6 pt-4 border-t border-blue-100 text-center text-xs text-gray-400">
                    <p className="font-semibold text-gray-600">{pdfData.centerName} — {pdfData.centerSub}</p>
                    <p>{pdfData.location} · Generated {new Date(pdfData.generatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function generateReportHtml(data: any): string {
  const isAr = data.language === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'
  const scoreRows = data.scores?.map((s: any) =>
    `<tr><td>${s.label}</td><td style="text-align:right;font-weight:600">${s.score !== null ? `${s.score}/5` : '—'}</td></tr>`
  ).join('') || ''

  return `<!DOCTYPE html><html dir="${dir}"><head><meta charset="utf-8"><title>Report — ${data.studentName}</title>
<style>
  @page { margin: 20mm 15mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; line-height: 1.7; }
  .header { background: linear-gradient(135deg,#1a1a5e,#2d2d8a); padding: 32px 40px; border-radius: 12px; margin-bottom: 28px; }
  .header h1 { color: #fff; font-size: 24px; }
  .header p { color: rgba(255,255,255,0.65); font-size: 13px; }
  .header .meta { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
  .header .meta span { background: rgba(255,255,255,0.08); padding: 6px 14px; border-radius: 8px; font-size: 11px; color: rgba(255,255,255,0.8); }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 6px 12px; border-bottom: 1px solid #eef0f6; font-size: 13px; }
  .body-text { white-space: pre-wrap; font-size: 13px; color: #374151; line-height: 1.8; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eef0f6; font-size: 11px; color: #9ca3af; }
</style></head><body>
<div class="header"><h1>${data.studentName}</h1><p>${data.courseName} · ${data.centerName}</p>
<div class="meta"><span>Level: ${data.level || '—'}</span><span>Date: ${new Date(data.generatedAt).toLocaleDateString()}</span></div></div>
${scoreRows ? `<table>${scoreRows}</table>` : ''}
<div class="body-text">${data.body || ''}</div>
<div class="footer"><p>${data.centerName} — ${data.centerSub}</p><p>${data.location} · ${new Date(data.generatedAt).toISOString().split('T')[0]}</p></div>
</body></html>`
}
