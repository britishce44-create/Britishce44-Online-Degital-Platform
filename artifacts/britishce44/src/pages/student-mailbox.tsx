import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/auth-provider'
import { uploadFile, getStudentFiles, getAllFiles, deleteFile, gradeFile, logActivity, type FileRecord } from '@/lib/student-records-db'

type TabType = 'my-files' | 'upload' | 'all-files'

export function StudentMailboxPage() {
  const { user } = useAuth()
  const isSupervisor = user?.role === 'admin' || user?.role === 'supervisor'
  const isStudent = user?.role === 'student'
  const [tab, setTab] = useState<TabType>(isSupervisor ? 'all-files' : 'my-files')
  const [myFiles, setMyFiles] = useState<FileRecord[]>([])
  const [allFiles, setAllFiles] = useState<FileRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'homework' | 'video'>('all')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Upload form */
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadType, setUploadType] = useState<'homework' | 'video' | 'document'>('homework')
  const [uploadFileData, setUploadFileData] = useState<File | null>(null)

  const loadFiles = async () => {
    setLoading(true)
    try {
      if (user) {
        const mine = await getStudentFiles(Number(user.id))
        setMyFiles(mine)
      }
      const all = await getAllFiles()
      setAllFiles(all)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadFiles() }, [user])

  const handleUpload = async () => {
    if (!uploadFileData || !user) return
    setUploading(true)
    try {
      const id = await uploadFile({
        name: uploadFileData.name,
        type: uploadType,
        mimeType: uploadFileData.type,
        size: uploadFileData.size,
        studentId: Number(user.id),
        studentName: user.firstName + ' ' + user.lastName,
        title: uploadTitle || uploadFileData.name,
        description: uploadDesc,
        data: uploadFileData,
        folder: uploadType === 'video' ? 'videos' : 'homework',
      })
      await logActivity({
        studentId: Number(user.id),
        type: uploadType,
        title: `Uploaded ${uploadType}: ${uploadTitle || uploadFileData.name}`,
        description: uploadDesc,
        date: new Date().toISOString(),
        status: 'submitted',
      })
      setUploadTitle('')
      setUploadDesc('')
      setUploadFileData(null)
      if (fileRef.current) fileRef.current.value = ''
      loadFiles()
    } catch {} finally { setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return
    await deleteFile(id)
    loadFiles()
  }

  const handleGrade = async (id: string) => {
    const grade = prompt('Enter grade (0-100):')
    if (grade === null) return
    const num = parseInt(grade)
    if (isNaN(num) || num < 0 || num > 100) { alert('Grade must be 0-100'); return }
    const comment = prompt('Add a comment (optional):') || ''
    await gradeFile(id, num, comment)
    loadFiles()
  }

  const displayedFiles = isSupervisor ? allFiles : myFiles
  const filteredFiles = filter === 'all' ? displayedFiles : displayedFiles.filter(f => f.type === filter)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: '1px solid rgba(212,160,23,0.20)', boxShadow: '0 8px 32px rgba(30,58,138,0.35)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #D4A017 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">📬</span>
            <div>
              <h2 className="text-xl font-black text-white drop-shadow-sm">Student Mailbox</h2>
              <p className="text-xs text-golden-bright/60 font-medium">Upload & manage your homework, videos, and documents</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
              📄 {allFiles.filter(f => f.type === 'homework').length} Homework
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(168,85,247,0.10)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.15)' }}>
              🎥 {allFiles.filter(f => f.type === 'video').length} Videos
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(37,99,235,0.10)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.15)' }}>
              📋 {allFiles.filter(f => f.type === 'document').length} Documents
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {isStudent && (
          <button onClick={() => setTab('my-files')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition"
            style={tab === 'my-files' ? { background: 'rgba(37,99,235,0.15)', color: '#60a5fa' } : { color: 'rgba(255,255,255,0.5)' }}>
            📁 My Files
          </button>
        )}
        <button onClick={() => setTab('upload')}
          className="px-4 py-2 rounded-xl text-xs font-bold transition"
          style={tab === 'upload' ? { background: 'rgba(37,99,235,0.15)', color: '#60a5fa' } : { color: 'rgba(255,255,255,0.5)' }}>
          📤 Upload
        </button>
        {isSupervisor && (
          <button onClick={() => setTab('all-files')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition"
            style={tab === 'all-files' ? { background: 'rgba(37,99,235,0.15)', color: '#60a5fa' } : { color: 'rgba(255,255,255,0.5)' }}>
            📋 All Submissions
          </button>
        )}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <h3 className="text-sm font-black text-white mb-4">📤 Upload File</h3>
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="text-[10px] text-gray-400 font-semibold mb-1 block">File Type</label>
              <div className="flex gap-2">
                {(['homework', 'video', 'document'] as const).map(t => (
                  <button key={t} onClick={() => setUploadType(t)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold transition"
                    style={{ background: uploadType === t ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)', color: uploadType === t ? '#60a5fa' : 'rgba(255,255,255,0.5)', border: `1px solid ${uploadType === t ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                    {t === 'homework' ? '📄 Homework' : t === 'video' ? '🎥 Video' : '📋 Document'}
                  </button>
                ))}
              </div>
            </div>
            <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="File title…"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-blue-500/30 transition placeholder-gray-600" />
            <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Description (optional)…"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-blue-500/30 transition placeholder-gray-600" />
            <div className="relative">
              <input ref={fileRef} type="file" onChange={e => setUploadFileData(e.target.files?.[0] || null)}
                accept={uploadType === 'video' ? 'video/*' : uploadType === 'homework' ? '.pdf,.doc,.docx,.txt,.jpg,.png' : '*/*'}
                className="w-full rounded-xl px-4 py-3 text-sm text-gray-400 outline-none bg-white/5 border border-white/10 focus:border-blue-500/30 transition file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:text-[10px] file:font-bold file:border-none file:bg-blue-500/10 file:text-blue-400 file:cursor-pointer" />
            </div>
            {uploadFileData && (
              <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}>
                <span className="text-emerald-400">✅</span>
                <span className="text-[10px] text-gray-300 font-medium flex-1">{uploadFileData.name} ({(uploadFileData.size / 1024).toFixed(1)} KB)</span>
                <button onClick={() => { setUploadFileData(null); if (fileRef.current) fileRef.current.value = '' }} className="text-[10px] text-red-400 font-bold">Remove</button>
              </div>
            )}
            <button onClick={handleUpload} disabled={!uploadFileData || uploading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg"
              style={{ background: !uploadFileData ? 'rgba(37,99,235,0.20)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
              {uploading ? '⏳ Uploading…' : '📤 Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Files list */}
      {(tab === 'my-files' || tab === 'all-files') && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(8,14,32,0.90)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-sm font-bold text-white flex-1">{tab === 'all-files' ? '📋 All Student Submissions' : '📁 My Files'}</span>
            <div className="flex gap-1">
              {(['all', 'homework', 'video'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition"
                  style={{ background: filter === f ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#60a5fa' : 'rgba(255,255,255,0.5)' }}>
                  {f === 'all' ? 'All' : f === 'homework' ? '📄' : '🎥'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading files…</div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm font-bold text-gray-400">No files found</p>
              <p className="text-xs text-gray-600 mt-1">Upload your first homework or video</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {filteredFiles.map(f => (
                <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
                  <span className="text-xl">{f.type === 'homework' ? '📄' : f.type === 'video' ? '🎥' : '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{f.title || f.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {f.studentName} · {(f.size / 1024).toFixed(1)} KB · {new Date(f.uploadedAt).toLocaleDateString()}
                      {f.graded && <span className="text-emerald-400 ml-2">⭐ Grade: {f.grade}/100</span>}
                    </p>
                    {f.description && <p className="text-[9px] text-gray-500 mt-0.5">{f.description}</p>}
                    {f.teacherComment && <p className="text-[9px] text-blue-400 mt-0.5">💬 {f.teacherComment}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { const url = URL.createObjectURL(f.data); window.open(url); setTimeout(() => URL.revokeObjectURL(url), 60000) }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition"
                      style={{ background: 'rgba(37,99,235,0.10)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.15)' }}>
                      👁 View
                    </button>
                    {isSupervisor && !f.graded && (
                      <button onClick={() => handleGrade(f.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition"
                        style={{ background: 'rgba(212,160,23,0.10)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.15)' }}>
                        ⭐ Grade
                      </button>
                    )}
                    {(isSupervisor || Number(user?.id) === f.studentId) && (
                      <button onClick={() => handleDelete(f.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition"
                        style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                        🗑
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
