import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/auth-provider'
import { ROOMS, ROOM_META, checkMyLibraryAccess } from '@/lib/library-storage'
import { LibraryRoom } from '@/components/library/library-room'
import { LibraryUsersPanel } from '@/components/library/library-users-panel'

type Tab = 'rooms' | 'users'

const GRADIENTS = [
  'from-blue-600 to-purple-700', 'from-emerald-600 to-teal-700',
  'from-violet-600 to-indigo-700', 'from-pink-600 to-rose-700',
  'from-amber-600 to-orange-700', 'from-green-600 to-lime-700',
  'from-yellow-600 to-amber-700', 'from-sky-600 to-cyan-700',
  'from-indigo-600 to-blue-700', 'from-red-600 to-pink-700',
]

export function DigitalLibraryPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor'
  const [tab, setTab] = useState<Tab>('rooms')
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return ROOMS
    return ROOMS.filter(id => {
      const meta = ROOM_META[id]
      return meta.label.toLowerCase().includes(search.toLowerCase()) || meta.desc.toLowerCase().includes(search.toLowerCase())
    })
  }, [search])

  /* Check if current user is banned (server-backed) */
  const [banned, setBanned] = useState(false)
  useEffect(() => {
    if (user && !isAdmin) {
      checkMyLibraryAccess().then(access => {
        setBanned(access === 'ban')
      })
    }
  }, [user, isAdmin])

  if (banned && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-4">🚫</span>
          <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">You have been restricted from accessing the Digital Library. Please contact the administration.</p>
          <p className="text-xs text-gray-600">Britishce44 Admin · 00967783226233</p>
        </div>
      </div>
    )
  }

  /* If a room is selected, show the room view */
  if (activeRoom) {
    return (
      <LibraryRoom
        roomId={activeRoom}
        currentUser={user?.firstName + ' ' + user?.lastName || 'User'}
        onBack={() => setActiveRoom(null)}
      />
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero header */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #312e81, #4c1d95)', border: '1px solid rgba(212,160,23,0.20)', boxShadow: '0 8px 32px rgba(30,58,138,0.35)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #D4A017 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, #D4A017, transparent)', filter: 'blur(60px)' }} />
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#F5C518] flex items-center justify-center shadow-xl shadow-golden/20">
              <span className="text-2xl font-black text-[#17125c]">L</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-sm">Britishce44 Digital Library</h1>
              <p className="text-sm text-golden-bright/60 font-medium">Largest Educational Digital Library · {ROOMS.length} Rooms</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl w-fit mt-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setTab('rooms')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition"
              style={tab === 'rooms' ? { background: 'rgba(37,99,235,0.20)', color: '#fff' } : { color: 'rgba(255,255,255,0.5)' }}>
              📚 Library Rooms
            </button>
            {isAdmin && (
              <button onClick={() => setTab('users')}
                className="px-4 py-2 rounded-xl text-xs font-bold transition"
                style={tab === 'users' ? { background: 'rgba(37,99,235,0.20)', color: '#fff' } : { color: 'rgba(255,255,255,0.5)' }}>
                👥 Users Panel
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-4 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
          </div>
        </div>
      </div>

      {/* Users Panel */}
      {tab === 'users' && isAdmin && <LibraryUsersPanel />}

      {/* Rooms Grid */}
      {tab === 'rooms' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((roomId, i) => {
            const meta = ROOM_META[roomId]
            if (!meta) return null
            return (
              <motion.button key={roomId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setActiveRoom(roomId)}
                className="relative rounded-2xl overflow-hidden text-left group"
                style={{ background: `linear-gradient(135deg, ${GRADIENTS[i % GRADIENTS.length].replace('from-', '').split(' ')[0]}, ${GRADIENTS[i % GRADIENTS.length].replace('to-', '').split(' ')[1]})`, aspectRatio: '4/3', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D4A017, transparent)' }} />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center p-6">
                  <span className="text-5xl mb-3 drop-shadow-lg">{meta.icon}</span>
                  <h3 className="text-lg font-black text-white drop-shadow-sm text-center">{meta.label}</h3>
                  <p className="text-[10px] text-white/60 mt-1 text-center font-medium">{meta.desc}</p>
                </div>

                {/* B44 watermark */}
                <div className="absolute bottom-2 right-2 opacity-[0.08] pointer-events-none select-none">
                  <span className="text-lg font-black" style={{ fontFamily: 'Cairo, sans-serif' }}>B44</span>
                </div>

                {/* Enter arrow */}
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition text-white/70 text-sm">→</div>
              </motion.button>
            )
          })}
          {filteredRooms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm font-bold text-gray-400">No rooms match your search</p>
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span>📚 {ROOMS.length} Rooms</span>
        <span>|</span>
        <span>🎬 MP4 · 🖼 JPG · 🎵 MP3 · 📄 PDF · 📊 PPT · ⚡ Flash</span>
        <span>|</span>
        <span className="text-golden-bright/60">All materials protected with B44 watermark</span>
      </div>
    </div>
  )
}
