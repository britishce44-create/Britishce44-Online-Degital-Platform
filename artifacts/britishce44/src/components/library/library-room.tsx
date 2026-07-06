import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/providers/auth-provider'
import {
  ROOM_META, FILE_TYPE_CONFIG, LibraryFile, RoomCard,
  uploadLibraryFile, getRoomFiles, getRoomCards, deleteCard, deleteLibraryFile,
} from '@/lib/library-storage'
import { LibraryPlayer } from './library-player'

interface Props {
  roomId: string
  currentUser: string
  onBack: () => void
}

const CARD_COLORS = ['#2563eb', '#7c3aed', '#06b6d4', '#D4A017', '#ef4444', '#10b981', '#f97316', '#ec4899', '#6366f1', '#14b8a6']

export function LibraryRoom({ roomId, currentUser, onBack }: Props) {
  const { user } = useAuth()
  const canUpload = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'teacher'
  const meta = ROOM_META[roomId]
  const [files, setFiles] = useState<LibraryFile[]>([])
  const [cards, setCards] = useState<RoomCard[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [playingFile, setPlayingFile] = useState<LibraryFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Create form */
  const [cardTitle, setCardTitle] = useState('')
  const [cardType, setCardType] = useState<LibraryFile['type']>('mp4')
  const [cardDesc, setCardDesc] = useState('')
  const [cardFile, setCardFile] = useState<File | null>(null)

  const load = async () => {
    const [f, c] = await Promise.all([getRoomFiles(roomId), getRoomCards(roomId)])
    setFiles(f)
    setCards(c)
  }

  useEffect(() => { load() }, [roomId])

  const handleCreate = async () => {
    if (!cardFile || !cardTitle.trim()) return
    setUploading(true)
    try {
      await uploadLibraryFile({
        title: cardTitle,
        roomId,
        type: cardType,
        description: cardDesc,
        uploadedBy: currentUser,
        file: cardFile,
      })
      setCardTitle('')
      setCardDesc('')
      setCardFile(null)
      setShowCreate(false)
      load()
    } catch (e) {
      alert((e as Error).message || 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleDelete = async (cardId: number, fileId: number) => {
    if (!confirm('Delete this card and its file?')) return
    await deleteCard(cardId)
    await deleteLibraryFile(fileId)
    load()
  }

  const getThumbnail = (card: RoomCard) => {
    const file = files.find(f => f.id === card.fileId)
    const config = FILE_TYPE_CONFIG[card.type]
    return { file, config }
  }

  if (!meta) return null

  return (
    <div className="space-y-5">
      {/* Room header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${meta.gradient.replace('from-', '').split(' ')[0]}, ${meta.gradient.replace('to-', '').split(' ')[1]})`, boxShadow: '0 8px 32px rgba(0,0,0,0.30)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-2xl hover:scale-110 transition">←</button>
            <div>
              <h2 className="text-2xl font-black text-white">{meta.icon} {meta.label}</h2>
              <p className="text-xs text-white/60 font-medium">{meta.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.10)', color: '#fff' }}>
              {cards.length} items
            </span>
            {canUpload && (
              <button onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)' }}>
                ✚ Add Card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create card modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(2,6,15,0.80)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: 'rgba(14,30,80,0.95)', border: '1px solid rgba(212,160,23,0.25)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
              <div className="h-1 golden-gradient" />
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">✨ Create New {meta.label} Card</h3>

                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1 block">Card Title *</label>
                  <input value={cardTitle} onChange={e => setCardTitle(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-golden/50 transition placeholder-gray-600"
                    placeholder="Enter a title for this card" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1 block">File Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(FILE_TYPE_CONFIG) as [LibraryFile['type'], typeof FILE_TYPE_CONFIG['mp4']][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setCardType(key)}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-[10px] font-bold transition"
                        style={{ background: cardType === key ? `${cfg.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${cardType === key ? cfg.color + '40' : 'rgba(255,255,255,0.06)'}`, color: cardType === key ? cfg.color : 'rgba(255,255,255,0.5)' }}>
                        <span className="text-lg">{cfg.icon}</span>
                        <span>{cfg.label.split('(')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1 block">Description</label>
                  <input value={cardDesc} onChange={e => setCardDesc(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-white/5 border border-white/10 focus:border-golden/50 transition placeholder-gray-600"
                    placeholder="Brief description of this material" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold mb-1 block">Upload File *</label>
                  <input ref={fileRef} type="file"
                    accept={FILE_TYPE_CONFIG[cardType].accept}
                    onChange={e => setCardFile(e.target.files?.[0] || null)}
                    className="w-full rounded-xl px-4 py-3 text-sm text-gray-400 outline-none bg-white/5 border border-white/10 transition file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:text-[10px] file:font-bold file:border-none file:cursor-pointer"
                    style={{ '--file-bg': 'rgba(37,99,235,0.10)', '--file-color': '#60a5fa' } as React.CSSProperties} />
                  {cardFile && (
                    <p className="text-[10px] text-emerald-400 mt-1">✅ {cardFile.name} ({(cardFile.size / 1024).toFixed(1)} KB)</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition border border-white/10">
                    Cancel
                  </button>
                  <button onClick={handleCreate} disabled={!cardFile || !cardTitle.trim() || uploading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg disabled:opacity-40"
                    style={{ background: !cardFile ? 'rgba(37,99,235,0.20)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
                    {uploading ? '⏳ Uploading…' : '✨ Create Card'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const { file, config } = getThumbnail(card)
          return (
            <motion.div key={card.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => file && setPlayingFile(file)}
              style={{ background: card.backgroundColor, boxShadow: `0 4px 20px ${card.backgroundColor}30`, aspectRatio: '3/4' }}>
              {/* Card background with overlay */}
              <div className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, transparent 40%, ${card.backgroundColor} 100%)` }} />
              {/* Centered icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl opacity-80">{config?.icon || '📄'}</div>
              </div>
              {/* Title at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-bold text-white drop-shadow-lg truncate">{card.title}</p>
                <p className="text-[9px] text-white/60 font-medium mt-0.5">{config?.label || card.type}</p>
              </div>
              {/* Hover actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); file && setPlayingFile(file) }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                  style={{ background: 'rgba(0,0,0,0.50)', color: '#fff' }}>
                  👁
                </button>
                {canUpload && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(card.id, card.fileId) }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'rgba(239,68,68,0.50)', color: '#fff' }}>
                    ✕
                  </button>
                )}
              </div>
              {/* File type badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold"
                style={{ background: 'rgba(0,0,0,0.40)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                {config?.label || card.type}
              </div>
              {/* B44 watermark on card */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06]">
                <span className="text-4xl font-black rotate-[-20deg]" style={{ fontFamily: 'Cairo, sans-serif' }}>B44</span>
              </div>
            </motion.div>
          )
        })}
        {cards.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-5xl mb-4 opacity-30">{meta.icon}</p>
            <p className="text-lg font-bold text-gray-400">No cards yet</p>
            <p className="text-sm text-gray-600 mt-1">Tap "Add Card" to upload your first file</p>
          </div>
        )}
      </div>

      {/* Player overlay */}
      <AnimatePresence>
        {playingFile && (
          <LibraryPlayer file={playingFile} onClose={() => setPlayingFile(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
