import { useEffect, useRef, useState } from 'react'
import { LibraryFile, FILE_TYPE_CONFIG, incrementDownloads } from '@/lib/library-storage'

interface Props {
  file: LibraryFile
  onClose: () => void
}

export function LibraryPlayer({ file, onClose }: Props) {
  const [showPdf, setShowPdf] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    incrementDownloads(file.id)
  }, [file])

  // Use the server URL directly (no blob creation)
  const mediaUrl = file.fileUrl
  const config = FILE_TYPE_CONFIG[file.type]
  const isVideo = file.type === 'mp4'
  const isImage = file.type === 'jpg'
  const isAudio = file.type === 'mp3'
  const isPdf = file.type === 'pdf'
  const isFlash = file.type === 'flash'

  const contactInfo = {
    phone1: '00967783226233',
    phone2: '00967783226233',
    email: 'britishce44@gmail.com',
    location: 'Taiz, Yemen · First British Center',
    website: 'britishce44.com',
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,15,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0a1628', border: '1px solid rgba(212,160,23,0.25)' }}>
        {/* ═══ UNREMOVABLE TOP WATERMARK — B44 LOGO ═══ */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#F5C518] flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-black text-[#17125c]">B44</span>
            </div>
            <span className="text-xs font-bold text-white drop-shadow-lg">Britishce44 Digital Library</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/50 font-medium">{file.type.toUpperCase()}</span>
            <button onClick={() => {
              const a = document.createElement('a')
              a.href = mediaUrl
              a.download = file.fileName || file.title || 'download'
              a.click()
            }} className="px-3 py-1 rounded-lg text-[10px] font-bold transition pointer-events-auto"
              style={{ background: 'rgba(212,160,23,0.20)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.25)' }}>
              ⬇ Download
            </button>
            <button onClick={onClose} className="text-white/50 hover:text-red-400 transition text-sm pointer-events-auto">✕</button>
          </div>
        </div>

        {/* ─── Content area ─── */}
        <div className="relative" style={{ minHeight: isAudio ? 'auto' : '55vh', maxHeight: '75vh' }}>
          {/* Centered B44 stamp watermark on the media itself */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none">
            <div className="text-6xl font-black opacity-[0.06] text-white rotate-[-25deg] drop-shadow-2xl select-none"
              style={{ fontFamily: 'Cairo, sans-serif', textShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
              B44
            </div>
          </div>

          {isVideo && mediaUrl && (
            <video ref={videoRef} src={mediaUrl} controls autoPlay className="w-full h-full max-h-[70vh] object-contain bg-black" style={{ maxHeight: '70vh' }}
              onClick={e => e.stopPropagation()} />
          )}

          {isImage && mediaUrl && (
            <div className="flex items-center justify-center p-4" style={{ minHeight: '50vh', background: '#0a0a1a' }}>
              <img ref={imgRef} src={mediaUrl} alt={file.title} className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-xl" />
            </div>
          )}

          {isAudio && mediaUrl && (
            <div className="flex flex-col items-center justify-center py-16 px-8" style={{ minHeight: '30vh', background: 'linear-gradient(135deg, #0a1628, #1a1a4e)' }}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-purple-500/20">
                🎵
              </div>
              <p className="text-white font-bold text-lg mb-4">{file.title}</p>
              <audio ref={audioRef} src={mediaUrl} controls autoPlay className="w-full max-w-md" />
            </div>
          )}

          {isPdf && (
            <div className="flex flex-col items-center justify-center py-16 px-8" style={{ minHeight: '50vh', background: '#0a0a1a' }}>
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center text-4xl mb-4 border border-red-500/20">📄</div>
              <p className="text-white font-bold text-lg mb-2">{file.title}</p>
              <p className="text-gray-400 text-xs mb-4">{(file.size / 1024).toFixed(1)} KB</p>
              <div className="flex gap-3">
                <button onClick={() => setShowPdf(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
                  👁 Preview PDF
                </button>
                <a href={mediaUrl} download={file.fileName || file.title || 'document.pdf'}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition inline-flex items-center gap-1"
                  style={{ background: 'rgba(212,160,23,0.10)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.20)' }}>
                  ⬇ Download
                </a>
              </div>
              {showPdf && (
                <iframe src={mediaUrl} className="w-full h-[60vh] mt-4 rounded-xl" style={{ background: 'white' }} />
              )}
            </div>
          )}

          {isFlash && (
            <div className="flex flex-col items-center justify-center py-16 px-8" style={{ minHeight: '50vh', background: 'linear-gradient(135deg, #0a1628, #1a1a4e)' }}>
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-4xl mb-4 border border-cyan-500/20">⚡</div>
              <p className="text-white font-bold text-lg mb-2">{file.title}</p>
              <p className="text-gray-400 text-xs mb-4">Flash Application · Click to open</p>
              <a href={mediaUrl} download={file.fileName || file.title || 'app.swf'}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg"
                style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 4px 14px rgba(6,182,212,0.25)' }}>
                ⬇ Download Flash App
              </a>
            </div>
          )}

          {!mediaUrl && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Loading media…</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ UNREMOVABLE BOTTOM RIBBON — Contact Info ═══ */}
        <div className="relative z-20 px-4 py-3 pointer-events-none select-none"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.92) 30%)' }}>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-[10px] md:text-xs"
            style={{ background: 'rgba(212,160,23,0.06)', borderRadius: '12px', padding: '8px 12px', border: '1px solid rgba(212,160,23,0.10)' }}>
            <span className="text-golden-bright font-bold flex items-center gap-1">📞 {contactInfo.phone1}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300 font-medium flex items-center gap-1">✉️ {contactInfo.email}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300 font-medium flex items-center gap-1">🌐 {contactInfo.website}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300 font-medium flex items-center gap-1">📍 {contactInfo.location}</span>
          </div>
          <p className="text-center text-[8px] text-gray-600 mt-1 font-medium">
            © {new Date().getFullYear()} Britishce44 Digital Library · All materials are protected
          </p>
        </div>
      </div>
    </div>
  )
}
