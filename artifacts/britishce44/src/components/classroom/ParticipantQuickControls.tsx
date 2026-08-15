import { useState, useEffect } from 'react'

interface TileParticipant {
  id: string
  name: string
  role: string
  isTeacher?: boolean
  isLocal?: boolean
  stream?: MediaStream | null
  isMuted?: boolean
  isCameraOn?: boolean
  handRaised?: boolean
  isPresenter?: boolean
  permissions?: Record<string, string>
  status?: 'expected' | 'active' | 'inactive' | 'disconnected' | 'removed' | 'transferred'
}

interface ParticipantQuickControlsProps {
  selectedParticipant: TileParticipant | null
  onClose: () => void
  isTeacher: boolean
  onSetStatus: (participantId: string, status: string) => void
  onForcePermission: (participantId: string, feature: string, action: string) => void
  onAssignPresenter: (participantId: string) => void
  onRemovePresenter: (participantId: string) => void
  onMoveParticipant: (participantId: string, toClassroomId: number, isTemporary?: boolean, reason?: string) => void
  onTransferToRoom1: (participantId: string, reason?: string) => void
  onLockClassroom: (locked: boolean, reason?: string) => void
  classrooms: Array<{ id: number; label: string; roomId: number }>
  currentClassroomId: number
  dir?: 'ltr' | 'rtl'
}

const FEATURES = [
  { id: 'microphone', label: 'Microphone', icon: '🎤' },
  { id: 'camera', label: 'Camera', icon: '📹' },
  { id: 'screen_share', label: 'Screen Share', icon: '🖥️' },
  { id: 'whiteboard', label: 'Whiteboard', icon: '✏️' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'presenter', label: 'Presenter', icon: '🎤' },
  { id: 'file_share', label: 'File Share', icon: '📁' },
  { id: 'annotation', label: 'Annotation', icon: '🖊️' },
  { id: 'recording', label: 'Recording', icon: '🔴' },
  { id: 'breakout', label: 'Breakout', icon: '🏠' },
  { id: 'polls', label: 'Polls', icon: '📊' },
  { id: 'quiz', label: 'Quiz', icon: '🐵' },
  { id: 'raise_hand', label: 'Raise Hand', icon: '✋' },
]

const ACTIONS = [
  { id: 'allow', label: 'Allow', color: 'bg-green-500/20 text-green-400' },
  { id: 'deny', label: 'Deny', color: 'bg-red-500/20 text-red-400' },
  { id: 'force_allow', label: 'Force Allow', color: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'force_deny', label: 'Force Deny', color: 'bg-red-600/20 text-red-300' },
]

export function ParticipantQuickControls({
  selectedParticipant,
  onClose,
  isTeacher,
  onSetStatus,
  onForcePermission,
  onAssignPresenter,
  onRemovePresenter,
  onMoveParticipant,
  onTransferToRoom1,
  onLockClassroom,
  classrooms,
  currentClassroomId,
  dir = 'ltr',
}: ParticipantQuickControlsProps) {
  if (!selectedParticipant || !isTeacher) return null

  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveToClassroom, setMoveToClassroom] = useState<number | null>(null)
  const [moveReason, setMoveReason] = useState('')
  const [isTemporaryMove, setIsTemporaryMove] = useState(true)

  const currentPermission = (feature: string) => {
    const perm = selectedParticipant.permissions?.[feature]
    if (!perm) return 'allow'
    return perm
  }

  const getPermissionBadge = (feature: string) => {
    const perm = currentPermission(feature)
    const action = ACTIONS.find(a => a.id === perm)
    return action ? (
      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${action.color}`}>
        {action.label}
      </span>
    ) : (
      <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
        Allow
      </span>
    )
  }

  const handlePermissionChange = (feature: string, action: string) => {
    onForcePermission(selectedParticipant.id, feature, action)
  }

  const handleMove = () => {
    if (moveToClassroom) {
      onMoveParticipant(selectedParticipant.id, moveToClassroom, isTemporaryMove, moveReason)
      setShowMoveModal(false)
      setMoveToClassroom(null)
      setMoveReason('')
    }
  }

  const handleTransferToRoom1 = () => {
    const reason = prompt('Reason for transfer to Room 1:')
    if (reason !== null) {
      onTransferToRoom1(selectedParticipant.id, reason || 'Teacher transfer')
    }
  }

  return (
    <>
      {/* Quick Control Bar - appears at bottom of CommunicationPanel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        style={{ pointerEvents: 'auto' }}>
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border p-4"
          style={{ borderColor: 'rgba(7,27,120,0.15)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: selectedParticipant.isTeacher ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#2563eb,#2620a8)' }}>
                {selectedParticipant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-[#071B78]">{selectedParticipant.name}</p>
                <p className="text-[10px] text-gray-500">{selectedParticipant.isTeacher ? 'Teacher' : 'Student'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-xl">✕</button>
          </div>

          {/* Status Controls */}
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(7,27,120,0.05)', border: '1px solid rgba(7,27,120,0.1)' }}>
            <p className="text-[10px] font-bold text-[#071B78] mb-2">Participant Status</p>
            <div className="flex flex-wrap gap-2">
              {['active', 'expected', 'inactive', 'disconnected'].map(s => (
                <button key={s} onClick={() => onSetStatus(selectedParticipant.id, s)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition ${selectedParticipant.status === s ? 'shadow-lg' : ''}`}
                  style={{
                    background: selectedParticipant.status === s
                      ? (s === 'active' ? 'linear-gradient(135deg,#00ae74,#00875a)' : s === 'expected' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6b7280,#4b5563)')
                      : 'rgba(7,27,120,0.05)',
                    color: selectedParticipant.status === s ? '#fff' : '#071B78',
                    border: selectedParticipant.status === s ? 'none' : '1px solid rgba(7,27,120,0.15)',
                  }}>
                {s === 'active' && '🟢 Active'}
                {s === 'expected' && '⏳ Expected'}
                {s === 'inactive' && '⚪ Inactive'}
                {s === 'disconnected' && '🔴 Disconnected'}
              </button>
            ))}
          </div>
          </div>

          {/* Presenter Controls */}
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-[#8b5cf6]">Presenter Controls</p>
              {selectedParticipant.isPresenter ? (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                  🎤 Presenter Active
                </span>
              ) : (
                <span className="text-[9px] text-gray-500">Not a presenter</span>
              )}
            </div>
            <div className="flex gap-2">
              {selectedParticipant.isPresenter ? (
                <button onClick={() => onRemovePresenter(selectedParticipant.id)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-medium transition"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>
                  Remove Presenter
                </button>
              ) : (
                <button onClick={() => onAssignPresenter(selectedParticipant.id)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-medium transition"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', boxShadow: '0 2px 8px rgba(139,92,246,0.3)' }}>
                  Make Presenter
                </button>
              )}
            </div>
          </div>

          {/* Feature Permissions */}
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(7,27,120,0.05)', border: '1px solid rgba(7,27,120,0.1)' }}>
            <p className="text-[10px] font-bold text-[#071B78] mb-2">Feature Permissions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {FEATURES.map(f => (
                <div key={f.id} className="p-2 rounded-lg" style={{ background: 'rgba(7,27,120,0.03)', border: '1px solid rgba(7,27,120,0.08)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#071B78]">
                      <span>{f.icon}</span>
                      <span className="truncate">{f.label}</span>
                    </span>
                    {getPermissionBadge(f.id)}
                  </div>
                  <div className="flex gap-1">
                    {ACTIONS.map(a => (
                      <button key={a.id} onClick={() => handlePermissionChange(f.id, a.id)}
                        className={`flex-1 py-1 px-2 rounded text-[8px] font-medium transition ${currentPermission(f.id) === a.id ? 'shadow' : ''}`}
                        style={{
                          background: currentPermission(f.id) === a.id
                            ? (a.id.startsWith('force') ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : a.id.includes('allow') ? 'linear-gradient(135deg,#00ae74,#00875a)' : 'linear-gradient(135deg,#ef4444,#dc2626)')
                            : 'transparent',
                          color: currentPermission(f.id) === a.id ? '#fff' : '#071B78',
                          border: currentPermission(f.id) === a.id ? 'none' : '1px solid rgba(7,27,120,0.15)',
                        }}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classroom Transfer */}
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p className="text-[10px] font-bold text-[#3b82f6] mb-2">Move to Another Classroom</p>
            <div className="flex gap-2">
              <select value={moveToClassroom || ''} onChange={e => setMoveToClassroom(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(7,27,120,0.05)', border: '1px solid rgba(7,27,120,0.15)', color: '#fff' }}>
                <option value="">Select classroom</option>
                {classrooms.filter(c => c.id !== currentClassroomId).map(c => (
                  <option key={c.id} value={c.id}>{c.label} (Room {c.roomId})</option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: 'rgba(7,27,120,0.05)', border: '1px solid rgba(7,27,120,0.15)', color: '#fff' }}>
                <input type="checkbox" checked={isTemporaryMove} onChange={e => setIsTemporaryMove(e.target.checked)} className="w-3 h-3 accent-blue-500" />
                Temporary
              </label>
            </div>
            <input type="text" value={moveReason} onChange={e => setMoveReason(e.target.value)} placeholder="Reason for move"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mt-2"
              style={{ background: 'rgba(7,27,120,0.05)', border: '1px solid rgba(7,27,120,0.15)', color: '#fff' }} />
            <button onClick={handleMove} disabled={!moveToClassroom}
              className="w-full mt-2 px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
              style={{ background: moveToClassroom ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(7,27,120,0.1)', color: '#fff', boxShadow: moveToClassroom ? '0 2px 8px rgba(59,130,246,0.3)' : 'none' }}>
              Move Participant
            </button>
          </div>

          {/* Emergency Transfer to Room 1 */}
          <button onClick={handleTransferToRoom1}
            className="w-full px-4 py-2 rounded-xl text-sm font-bold transition"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
            🚨 Emergency Transfer to Room 1
          </button>

          {/* Lock Classroom */}
          <button onClick={() => onLockClassroom(true, 'Teacher locked classroom')}
            className="w-full px-4 py-2 rounded-xl text-sm font-bold transition"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
            🔒 Lock Classroom
          </button>
        </div>
      </motion.div>

      {/* Move Modal */}
      {showMoveModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-2xl p-6"
          style={{ background: '#071B78', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>🚚</span>
            Move Participant
          </h3>
          <p className="text-gray-400 mb-4 text-sm">Move <strong>{selectedParticipant.name}</strong> to another classroom</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Destination Classroom</label>
              <select value={moveToClassroom || ''} onChange={e => setMoveToClassroom(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }}>
                <option value="">Select classroom</option>
                {classrooms.filter(c => c.id !== currentClassroomId).map(c => (
                  <option key={c.id} value={c.id}>{c.label} (Room {c.roomId})</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isTemporaryMove} onChange={e => setIsTemporaryMove(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-gray-300">Temporary transfer (auto-return after class)</span>
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Reason</label>
              <input type="text" value={moveReason} onChange={e => setMoveReason(e.target.value)} placeholder="Reason for move"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#fff' }} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
              <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Cancel</button>
              <button onClick={handleMove} className="px-6 py-2 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>Move</button>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}