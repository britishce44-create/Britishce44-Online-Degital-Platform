import React, { useState } from 'react'

export interface StudentScore {
  id: string
  name: string
  avatar?: string
  stars: number
  hearts: number
  points: number
  teamId?: string
}

export interface TeamScore {
  id: string
  name: string
  color: string
  points: number
}

interface ClassroomScoreboardProps {
  isOpen: boolean
  onClose: () => void
  initialStudents?: { id: string; name: string }[]
}

const DEFAULT_TEAMS: TeamScore[] = [
  { id: 'team-a', name: 'Team Eagles ', color: 'from-amber-500 to-amber-700', points: 0 },
  { id: 'team-b', name: 'Team Falcons ', color: 'from-blue-500 to-indigo-700', points: 0 },
  { id: 'team-c', name: 'Team Lions ', color: 'from-emerald-500 to-teal-700', points: 0 },
]

export const ClassroomScoreboard: React.FC<ClassroomScoreboardProps> = ({
  isOpen,
  onClose,
  initialStudents = [],
}) => {
  const [tab, setTab] = useState<'individual' | 'teams'>('individual')
  const [position, setPosition] = useState({ x: 120, y: 80 })
  const [size, setSize] = useState({ width: 440, height: 520 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const [students, setStudents] = useState<StudentScore[]>(() =>
    initialStudents.length > 0
      ? initialStudents.map((s, i) => ({
          id: s.id,
          name: s.name,
          stars: 0,
          hearts: 0,
          points: 0,
          teamId: DEFAULT_TEAMS[i % DEFAULT_TEAMS.length].id,
        }))
      : [
          { id: '1', name: 'Sara Al-Mansoor', stars: 5, hearts: 3, points: 25, teamId: 'team-a' },
          { id: '2', name: 'Youssef Ahmed', stars: 8, hearts: 4, points: 40, teamId: 'team-b' },
          { id: '3', name: 'Laila Hassan', stars: 6, hearts: 2, points: 30, teamId: 'team-a' },
          { id: '4', name: 'Omar Khaled', stars: 4, hearts: 5, points: 20, teamId: 'team-c' },
        ]
  )

  const [teams, setTeams] = useState<TeamScore[]>(DEFAULT_TEAMS)

  if (!isOpen) return null

  // Window Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  // Score Adjusters
  const awardPoint = (id: string, type: 'stars' | 'hearts' | 'points', delta: number) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s
        const updated = { ...s, [type]: Math.max(0, s[type] + delta) }
        if (type === 'stars') updated.points += delta * 5
        return updated
      })
    )
  }

  const awardTeamPoint = (teamId: string, delta: number) => {
    setTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, points: Math.max(0, t.points + delta) } : t))
    )
  }

  const resetAll = () => {
    if (confirm('Reset all classroom scores?')) {
      setStudents(prev => prev.map(s => ({ ...s, stars: 0, hearts: 0, points: 0 })))
      setTeams(prev => prev.map(t => ({ ...t, points: 0 })))
    }
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 9999,
      }}
      className="flex flex-col rounded-2xl shadow-2xl border border-amber-500/30 backdrop-blur-xl bg-slate-950/90 text-white overflow-hidden select-none transition-shadow hover:shadow-amber-500/10"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className="cursor-move px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl"></span>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
            Classroom Gamification
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-xs">
          <button
            onClick={() => setTab('individual')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              tab === 'individual' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setTab('teams')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              tab === 'teams' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Teams
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetAll}
            title="Reset Scores"
            className="text-xs px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded border border-rose-500/30"
          >
            
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-slate-400 hover:bg-white/10 hover:text-white"
          >
            
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {tab === 'individual' ? (
          /* Individual Student List */
          students.map((student, idx) => (
            <div
              key={student.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-white/5 hover:border-amber-500/30 transition flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 font-bold text-slate-950 flex items-center justify-center text-xs shrink-0">
                  #{idx + 1}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-sm text-slate-100 truncate">{student.name}</div>
                  <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono mt-0.5">
                    <span> {student.stars}</span>
                    <span> {student.hearts}</span>
                    <span className="text-slate-400">({student.points} pts)</span>
                  </div>
                </div>
              </div>

              {/* Award Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => awardPoint(student.id, 'stars', 1)}
                  className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs active:scale-95 transition"
                >
                  +
                </button>
                <button
                  onClick={() => awardPoint(student.id, 'hearts', 1)}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs active:scale-95 transition"
                >
                  +
                </button>
                <button
                  onClick={() => awardPoint(student.id, 'points', 5)}
                  className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs active:scale-95 transition"
                >
                  +5
                </button>
              </div>
            </div>
          ))
        ) : (
          /* Group/Team Competitions */
          <div className="space-y-4">
            {teams.map(team => (
              <div
                key={team.id}
                className="p-4 rounded-xl bg-slate-900 border border-white/10 flex flex-col gap-3 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${team.color}`} />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-slate-100">{team.name}</span>
                  <span className="text-2xl font-black font-mono text-amber-400">{team.points} <span className="text-xs font-normal text-slate-400">pts</span></span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => awardTeamPoint(team.id, -1)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-white/10 text-xs"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => awardTeamPoint(team.id, 1)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition"
                  >
                    +1 Point
                  </button>
                  <button
                    onClick={() => awardTeamPoint(team.id, 5)}
                    className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold rounded text-xs transition shadow-lg shadow-amber-500/20"
                  >
                    +5 Boost 
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resize Handle at Bottom Right */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation()
          const startX = e.clientX
          const startY = e.clientY
          const startW = size.width
          const startH = size.height

          const onMouseMove = (moveEvent: MouseEvent) => {
            setSize({
              width: Math.max(340, startW + (moveEvent.clientX - startX)),
              height: Math.max(350, startH + (moveEvent.clientY - startY)),
            })
          }

          const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
          }

          window.addEventListener('mousemove', onMouseMove)
          window.addEventListener('mouseup', onMouseUp)
        }}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-500 hover:text-amber-400"
      >
        
      </div>
    </div>
  )
}
