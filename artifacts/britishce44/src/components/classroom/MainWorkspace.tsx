import { useState, useRef, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'
import { WhiteboardArea } from './whiteboard-area'

type WbLayout = 'whiteboard' | 'grid' | 'resources'

interface MainWorkspaceProps {
  layout: WbLayout
  onLayoutChange: (layout: WbLayout) => void
  participants: any[]
  isTeacher: boolean
  localStream?: MediaStream | null
  remoteParticipants?: any[]
  dir?: 'ltr' | 'rtl'
  onSyncDraw?: (json: string) => void
  activePresenter?: any
  stageOthers?: any[]
  onStopScreenShare?: () => void
}

const TOOLS = [
  { id: 'select', icon: '🖱', label: 'Select', shortcut: 'V' },
  { id: 'pen', icon: '✏️', label: 'Pen', shortcut: 'P' },
  { id: 'highlighter', icon: '🖍', label: 'Mark', shortcut: 'H' },
  { id: 'line', icon: '📏', label: 'Line', shortcut: 'L' },
  { id: 'arrow', icon: '➡️', label: 'Arrow', shortcut: 'A' },
  { id: 'rect', icon: '⬜', label: 'Rect', shortcut: 'R' },
  { id: 'circle', icon: '⭕', label: 'Circle', shortcut: 'O' },
  { id: 'triangle', icon: '🔺', label: 'Tri', shortcut: 'T' },
  { id: 'diamond', icon: '🔷', label: 'Dia', shortcut: 'D' },
  { id: 'text', icon: '🔤', label: 'Text', shortcut: 'X' },
  { id: 'note', icon: '🗒', label: 'Note', shortcut: 'N' },
  { id: 'eraser', icon: '🧹', label: 'Erase', shortcut: 'E' },
  { id: 'pan', icon: '✋', label: 'Pan', shortcut: 'Space' },
]

const COLORS = ['#000000', '#1e3a5f', '#c8a84e', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ffffff', '#64748b']

export function MainWorkspace({
  layout,
  onLayoutChange,
  participants,
  isTeacher,
  localStream,
  remoteParticipants,
  dir = 'ltr',
  onSyncDraw,
  activePresenter,
  stageOthers,
  onStopScreenShare,
}: MainWorkspaceProps) {
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(3)
  const [zoom, setZoom] = useState(100)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [color, setColor] = useState('#000000')

  // Screen sharing overlay
  if (activePresenter) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col" style={{ background: '#071B78' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(7, 27, 120, 0.9)', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black"
              style={{ background: 'linear-gradient(135deg, #00875a, #00ae74)', color: '#071B78' }}>LIVE</div>
            <div>
              <h3 className="font-bold text-white text-sm">Screen Share Active</h3>
              <p className="text-[10px]" style={{ color: 'rgba(212, 175, 55, 0.8)' }}>
                {activePresenter.name} is presenting
              </p>
            </div>
          </div>
          <button
            onClick={onStopScreenShare}
            className="px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{ background: '#E53935', color: '#FFFFFF' }}
          >
            Stop Sharing
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <p className="text-white text-lg">Screen sharing view</p>
            <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {stageOthers.length} other participants
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir={dir} className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0" style={{ background: '#FAF8F1' }}>
      {/* Mode Tabs */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: '#FAF8F1', borderBottom: '1px solid rgba(7, 27, 120, 0.06)' }}>
        <div className="flex items-center gap-1 bg-white/50 rounded-xl px-1 py-1" style={{ border: '1px solid rgba(7, 27, 120, 0.06)' }}>
          {(['whiteboard', 'grid', 'resources'] as WbLayout[]).map((l) => (
            <button
              key={l}
              onClick={() => onLayoutChange(l)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[12px] font-medium transition-all`}
              style={{
                background: layout === l ? '#071B78' : 'transparent',
                color: layout === l ? '#FFFFFF' : '#071B78',
                boxShadow: layout === l ? '0 2px 8px rgba(7, 27, 120, 0.25)' : 'none',
                border: layout === l ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
                minWidth: l === 'whiteboard' ? 61 : l === 'grid' ? 55 : 78,
              }}
            >
              {l === 'whiteboard' && '✏ Board'}
              {l === 'grid' && '⊞ Grid'}
              {l === 'resources' && '🖥 Resources'}
            </button>
          ))}
        </div>

        {/* Page & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/50 rounded-xl px-2 py-1.5" style={{ border: '1px solid rgba(7, 27, 120, 0.06)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg text-[12px] transition disabled:opacity-30"
              style={{ color: '#071B78', background: 'transparent' }}>‹</button>
            <span className="px-2 text-[11px] font-medium tabular-nums" style={{ color: '#071B78' }}>
              Page {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg text-[12px] transition disabled:opacity-30"
              style={{ color: '#071B78', background: 'transparent' }}>›</button>
          </div>

          <div className="flex items-center gap-1 bg-white/50 rounded-xl px-2 py-1.5" style={{ border: '1px solid rgba(7, 27, 120, 0.06)' }}>
            <button onClick={() => setZoom(z => Math.max(25, z - 25))}
              className="p-1.5 rounded-lg text-[14px] transition" style={{ color: '#071B78', background: 'transparent' }}>−</button>
            <span className="px-2 text-[11px] font-medium tabular-nums" style={{ color: '#071B78', minWidth: 45, textAlign: 'center' }}>
              {zoom}%
            </span>
            <button onClick={() => setZoom(z => Math.min(300, z + 25))}
              className="p-1.5 rounded-lg text-[14px] transition" style={{ color: '#071B78', background: 'transparent' }}>+</button>
            <button onClick={() => setZoom(100)}
              className="p-1.5 rounded-lg text-[12px] transition" style={{ color: '#071B78', background: 'transparent' }} title="Reset zoom">⛶</button>
          </div>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden relative">
        {layout === 'whiteboard' && (
          <WhiteboardWorkspace
            onSyncDraw={onSyncDraw}
            zoom={zoom}
            setZoom={setZoom}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            setTotalPages={setTotalPages}
            color={color}
            setColor={setColor}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
            dir={dir}
          />
        )}

        {layout === 'grid' && (
          <GridWorkspace
            participants={participants}
            isTeacher={isTeacher}
            dir={dir}
          />
        )}

        {layout === 'resources' && (
          <ResourcesWorkspace dir={dir} />
        )}
      </div>
    </div>
  )
}

// Whiteboard Workspace with vertical toolbar
function WhiteboardWorkspace({
  onSyncDraw,
  zoom,
  setZoom,
  page,
  setPage,
  totalPages,
  setTotalPages,
  color,
  setColor,
  showColorPicker,
  setShowColorPicker,
  dir,
}: any) {
  const [touched, setTouched] = useState(false)

  return (
    <div className="relative flex-1 overflow-hidden p-4" onPointerDown={() => setTouched(true)}>
      {/* Whiteboard Container */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ borderRadius: '14px', background: '#FFFFFF', boxShadow: '0 4px 24px rgba(7, 27, 120, 0.08), 0 1px 3px rgba(7, 27, 120, 0.04)', border: '1px solid rgba(7, 27, 120, 0.04)' }}>
        
        {/* Vertical Toolbar */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1"
          style={{ width: 30, height: '70%', background: '#FFFFFF', borderRadius: '12px', padding: '8px 4px', boxShadow: '0 4px 20px rgba(7, 27, 120, 0.12)', border: '1px solid rgba(7, 27, 120, 0.06)' }}>
          {TOOLS.slice(0, 7).map((tool) => (
            <button key={tool.id} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all" style={{ color: '#071B78' }} title={`${tool.label} (${tool.shortcut})`}>
              <span className="text-[14px]">{tool.icon}</span>
            </button>
          ))}
          <div className="w-4 h-px my-1" style={{ background: 'rgba(7, 27, 120, 0.1)' }} />
          {TOOLS.slice(7).map((tool) => (
            <button key={tool.id} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all" style={{ color: '#071B78' }} title={`${tool.label} (${tool.shortcut})`}>
              <span className="text-[14px]">{tool.icon}</span>
            </button>
          ))}
          <div className="w-4 h-px my-1" style={{ background: 'rgba(7, 27, 120, 0.1)' }} />
          {/* Color indicator */}
          <button onClick={() => setShowColorPicker(!showColorPicker)} className="w-6 h-6 rounded-full flex items-center justify-center transition-all relative" style={{ border: '2px solid rgba(7, 27, 120, 0.1)' }}>
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid rgba(7, 27, 120, 0.2)' : 'none' }} />
            {showColorPicker && (
              <div className="absolute left-full ml-2 top-0 w-44 bg-white rounded-xl shadow-xl border p-2 z-20" style={{ borderColor: 'rgba(7, 27, 120, 0.06)' }}>
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => { setColor(c); setShowColorPicker(false) }} className="w-5 h-5 rounded-full transition hover:scale-110" style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid rgba(7, 27, 120, 0.2)' : 'none', outline: color === c ? '2px solid #D4AF37' : 'none' }} />
                  ))}
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Whiteboard Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <WhiteboardArea onSyncDraw={onSyncDraw} />
        </div>

        {/* Bottom Toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(7, 27, 120, 0.12)', border: '1px solid rgba(7, 27, 120, 0.06)' }}>
          {COLORS.slice(0, 7).map((c) => (
            <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full transition hover:scale-110" style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid rgba(7, 27, 120, 0.2)' : 'none', outline: color === c ? '2px solid #D4AF37' : 'none' }} />
          ))}
        </div>
      </div>

      
    </div>
  )
}

// Grid Workspace
function GridWorkspace({ participants, isTeacher, dir }: any) {
  return (
    <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-3 p-4 min-h-0" style={{ background: 'rgba(26, 19, 92, 0.08)' }}>
      {participants.map((p: any) => (
        <div key={p.id} className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(26, 19, 92, 0.3)', border: '1px solid rgba(7, 27, 120, 0.06)' }}>
          {p.stream ? (
            <video autoPlay playsInline muted={p.isLocal} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: p.isTeacher ? 'linear-gradient(135deg, #071B78 0%, #0A2A92 100%)' : 'linear-gradient(135deg, #D4AF37 0%, #E5B93F 100%)' }}>
              <span className="text-white font-black text-3xl">{p.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
            <span className="text-white text-[10px] font-medium truncate block">{p.name}</span>
          </div>
        </div>
      ))}
      {participants.length === 0 && (
        <div className="col-span-4 row-span-2 flex flex-col items-center justify-center gap-3">
          <div className="text-6xl">👥</div>
          <p className="text-sm" style={{ color: '#071B78', opacity: 0.5 }}>Waiting for participants…</p>
        </div>
      )}
    </div>
  )
}

// Resources Workspace
function ResourcesWorkspace({ dir }: any) {
  return (
    <div className="flex-1 overflow-hidden p-4">
      <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ color: '#071B78', opacity: 0.5 }}>
        <div className="text-6xl mb-4">🖥</div>
        <h3 className="text-xl font-bold mb-2">Resources</h3>
        <p className="text-sm">Files, links, and materials will appear here</p>
      </div>
    </div>
  )
}