import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ResourceType = 'worldwall' | 'elilo' | 'youtube' | 'worksheets' | 'web' | 'desktop'

interface ResourcePanel {
  id: string; type: ResourceType; url: string; title: string; fileType?: string
}

const PRESETS: { type: ResourceType; label: string; icon: string; url: string; bg: string }[] = [
  { type: 'worldwall', label: 'Wordwall', icon: '🎮', url: 'https://wordwall.net', bg: 'from-purple-600 to-purple-700' },
  { type: 'elilo', label: 'Elilo', icon: '📚', url: 'https://elilo.net', bg: 'from-blue-500 to-blue-700' },
  { type: 'youtube', label: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/embed/videoseries?list=PLbpi6ZahtOH6Ar_3GPy3workh7JXZ6RRJF', bg: 'from-red-600 to-red-700' },
  { type: 'worksheets', label: 'Worksheets', icon: '📝', url: '', bg: 'from-green-600 to-green-700' },
  { type: 'web', label: 'Web / Google', icon: '🔍', url: 'https://www.google.com/webhp?igu=1', bg: 'from-slate-600 to-slate-700' },
  { type: 'desktop', label: 'My Files', icon: '💻', url: '', bg: 'from-gray-600 to-gray-700' },
]

const WORKSHEET_SITES = [
  { name: 'ISL Collective', url: 'https://en.islcollective.com', desc: 'ESL worksheets, listening & videos', icon: '📄', tag: 'Worksheets' },
  { name: 'British Council', url: 'https://learnenglish.britishcouncil.org/skills', desc: 'Grammar, vocabulary & listening', icon: '🇬🇧', tag: 'Grammar' },
  { name: 'Kahoot', url: 'https://kahoot.it', desc: 'Interactive quizzes & games', icon: '🎉', tag: 'Quiz' },
  { name: 'Quizlet', url: 'https://quizlet.com', desc: 'Flashcards & vocabulary games', icon: '🃏', tag: 'Vocab' },
  { name: 'ESL Games Plus', url: 'https://www.eslgamesplus.com', desc: 'Interactive grammar games', icon: '🎯', tag: 'Games' },
  { name: 'Edpuzzle', url: 'https://edpuzzle.com', desc: 'Interactive video lessons', icon: '📹', tag: 'Video' },
  { name: 'Learning Apps', url: 'https://learningapps.org', desc: 'Free interactive tools', icon: '🧩', tag: 'Interactive' },
  { name: 'Busy Teacher', url: 'https://busyteacher.org', desc: 'Printable worksheets', icon: '👩‍🏫', tag: 'Print' },
  { name: 'Storybird', url: 'https://storybird.com', desc: 'Creative writing & reading', icon: '📖', tag: 'Writing' },
  { name: 'Pronunciation', url: 'https://www.howjsay.com', desc: 'Word pronunciation guide', icon: '🎤', tag: 'Pronunciation' },
  { name: 'Lyrics Training', url: 'https://lyricstraining.com', desc: 'Learn English through songs', icon: '🎵', tag: 'Listening' },
  { name: 'Lingohack', url: 'https://www.bbc.co.uk/learningenglish/english/features/lingohack', desc: 'BBC video English lessons', icon: '📡', tag: 'Video' },
]

interface ResourceBrowserProps {
  onMinimize?: () => void
}

export function ResourceBrowser({ onMinimize }: ResourceBrowserProps) {
  const [panels, setPanels] = useState<ResourcePanel[]>([])
  const [showWorksheets, setShowWorksheets] = useState(false)
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({})
  const [ytInputs, setYtInputs] = useState<Record<string, string>>({})
  const [frameErrors, setFrameErrors] = useState<Set<string>>(new Set())

  const openPreset = useCallback((type: ResourceType) => {
    if (type === 'worksheets') { setShowWorksheets(s => !s); return }
    if (type === 'desktop') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'video/*,audio/*,image/*,.pdf,.txt,.ppt,.pptx'
      input.multiple = false
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        let ft = 'other'
        if (['mp4','webm','mov','avi','mkv'].includes(ext)) ft = 'video'
        else if (['mp3','wav','ogg','aac','m4a'].includes(ext)) ft = 'audio'
        else if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) ft = 'image'
        else if (ext === 'pdf') ft = 'pdf'
        addPanel({ type: 'desktop', url, title: file.name, fileType: ft })
      }
      input.click()
      return
    }
    const preset = PRESETS.find(p => p.type === type)!
    addPanel({ type, url: preset.url, title: preset.label })
  }, [])

  const addPanel = useCallback((opts: Omit<ResourcePanel, 'id'>) => {
    const panel: ResourcePanel = { id: `${opts.type}-${Date.now()}`, ...opts }
    setPanels(prev => prev.length >= 2 ? [prev[prev.length - 1], panel] : [...prev, panel])
    setShowWorksheets(false)
  }, [])

  const openWorksheet = useCallback((url: string, name: string) => {
    addPanel({ type: 'worksheets', url, title: name })
  }, [addPanel])

  const removePanel = useCallback((id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id))
    setFrameErrors(prev => { const n = new Set(prev); n.delete(id); return n })
  }, [])

  const loadUrl = useCallback((panelId: string, url: string) => {
    const finalUrl = url.startsWith('http') ? url : `https://${url}`
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, url: finalUrl, title: finalUrl } : p))
    setFrameErrors(prev => { const n = new Set(prev); n.delete(panelId); return n })
  }, [])

  const loadYouTube = useCallback((panelId: string, raw: string) => {
    if (!raw.trim()) return
    const m = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\s?#]+)/)
    const videoId = m ? m[1] : raw.trim()
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    setPanels(prev => prev.map(p => p.id === panelId ? { ...p, url, title: `YouTube: ${videoId}` } : p))
    setYtInputs(prev => ({ ...prev, [panelId]: '' }))
    setFrameErrors(prev => { const n = new Set(prev); n.delete(panelId); return n })
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#111827] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#241c80] border-b border-white/10 shrink-0 overflow-x-auto">
        {PRESETS.map(p => (
          <button key={p.type} onClick={() => openPreset(p.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white
              bg-gradient-to-r ${p.bg} hover:opacity-90 active:scale-95 transition shrink-0 shadow`}>
            <span className="text-sm">{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {panels.length > 0 && (
            <button onClick={() => setPanels([])}
              className="text-[9px] text-gray-400 hover:text-white transition px-2">Clear</button>
          )}
          <span className="text-[9px] text-gray-500">{panels.length}/2 panels</span>
          {onMinimize && (
            <button onClick={onMinimize}
              className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition">
              ⊟ Whiteboard
            </button>
          )}
        </div>
      </div>

      {/* ── Worksheet picker ── */}
      <AnimatePresence>
        {showWorksheets && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-[#1e293b] border-b border-white/10 overflow-hidden shrink-0">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white">📝 Interactive Resource Sites</span>
                <button onClick={() => setShowWorksheets(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                {WORKSHEET_SITES.map(s => (
                  <button key={s.name} onClick={() => openWorksheet(s.url, s.name)}
                    className="flex items-start gap-1.5 bg-white/5 hover:bg-white/10 rounded-lg p-2 text-left transition">
                    <span className="text-base shrink-0">{s.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-white truncate">{s.name}</div>
                      <div className="text-[7px] text-gray-400 mt-0.5">{s.desc}</div>
                      <span className="text-[7px] bg-white/10 text-gray-300 px-1 rounded-full">{s.tag}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panels ── */}
      <div className={`flex-1 flex overflow-hidden ${panels.length === 2 ? 'divide-x divide-white/10' : ''}`}>
        {panels.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 select-none">
            <div className="text-5xl mb-4 opacity-40">🖥️</div>
            <p className="text-sm font-medium text-gray-500">Choose a resource above</p>
            <p className="text-xs text-gray-600 mt-1">Up to 2 resources play simultaneously</p>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-xs opacity-60">
              {PRESETS.map(p => (
                <button key={p.type} onClick={() => openPreset(p.type)}
                  className="flex flex-col items-center gap-1 hover:opacity-100 transition">
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[9px] text-gray-500">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          panels.map(panel => (
            <div key={panel.id} className="flex-1 flex flex-col min-w-0">
              {/* Panel toolbar */}
              <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1e293b] border-b border-white/10 shrink-0">
                <span className="text-[10px] text-gray-300 truncate flex-1 font-medium">{panel.title}</span>

                {panel.type === 'youtube' && (
                  <div className="flex gap-1 shrink-0">
                    <input value={ytInputs[panel.id] || ''} onChange={e => setYtInputs(p => ({ ...p, [panel.id]: e.target.value }))}
                      placeholder="YouTube URL or video ID..."
                      onKeyDown={e => e.key === 'Enter' && loadYouTube(panel.id, ytInputs[panel.id] || '')}
                      className="w-44 bg-white/10 text-white placeholder-gray-500 border border-white/20 rounded px-2 py-0.5 text-[9px] outline-none focus:border-red-400" />
                    <button onClick={() => loadYouTube(panel.id, ytInputs[panel.id] || '')}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[9px] font-bold transition">
                      ▶ Load
                    </button>
                  </div>
                )}

                {['web', 'worldwall', 'elilo', 'worksheets'].includes(panel.type) && (
                  <div className="flex gap-1 shrink-0">
                    <input value={urlInputs[panel.id] || ''} onChange={e => setUrlInputs(p => ({ ...p, [panel.id]: e.target.value }))}
                      placeholder="Enter URL..."
                      onKeyDown={e => e.key === 'Enter' && loadUrl(panel.id, urlInputs[panel.id] || '')}
                      className="w-48 bg-white/10 text-white placeholder-gray-500 border border-white/20 rounded px-2 py-0.5 text-[9px] outline-none focus:border-blue-400" />
                    <button onClick={() => loadUrl(panel.id, urlInputs[panel.id] || '')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[9px] font-bold transition">
                      Go
                    </button>
                  </div>
                )}

                <button onClick={() => removePanel(panel.id)}
                  className="text-gray-500 hover:text-white text-xs shrink-0 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded transition">
                  ✕
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 relative overflow-hidden bg-[#111827]">
                {panel.fileType === 'video' && (
                  <video src={panel.url} controls autoPlay className="w-full h-full object-contain" />
                )}
                {panel.fileType === 'audio' && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-6xl animate-pulse">🎵</div>
                    <p className="text-white text-sm text-center px-4 max-w-xs">{panel.title}</p>
                    <audio src={panel.url} controls autoPlay className="w-72" />
                  </div>
                )}
                {panel.fileType === 'image' && (
                  <div className="flex items-center justify-center h-full">
                    <img src={panel.url} alt={panel.title} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                {panel.fileType === 'pdf' && (
                  <iframe src={panel.url} className="w-full h-full border-none" title={panel.title} />
                )}
                {panel.fileType === 'other' && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="text-5xl">📄</div>
                    <p className="text-gray-400 text-sm">{panel.title}</p>
                    <a href={panel.url} download={panel.title}
                      className="bg-gold text-navy px-4 py-2 rounded-full text-xs font-bold hover:bg-gold/90 transition">
                      ⬇ Download File
                    </a>
                  </div>
                )}
                {!panel.fileType && (
                  <>
                    {frameErrors.has(panel.id) ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                        <div className="text-4xl">🔒</div>
                        <p className="text-gray-400 text-sm font-medium text-center">This site cannot be embedded</p>
                        <p className="text-gray-500 text-xs text-center">{panel.url}</p>
                        <a href={panel.url} target="_blank" rel="noreferrer"
                          className="bg-white text-gray-800 px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-100 transition">
                          🔗 Open in New Tab
                        </a>
                      </div>
                    ) : (
                      <iframe
                        key={panel.url}
                        src={panel.url}
                        className="w-full h-full border-none"
                        title={panel.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; camera; microphone"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"
                        onError={() => setFrameErrors(prev => new Set([...prev, panel.id]))}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
