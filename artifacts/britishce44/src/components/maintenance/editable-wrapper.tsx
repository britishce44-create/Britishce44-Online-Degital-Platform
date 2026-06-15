import { useState, useRef, useCallback } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { useMaintenanceMode } from './maintenance-provider'

interface EditableWrapperProps {
  children: React.ReactNode
  id: string
  label?: string
  className?: string
  style?: React.CSSProperties
}

type EditMode = 'idle' | 'move' | 'resize'

const EDGE_THRESHOLD = 14

function getNearestBorder(e: React.MouseEvent): boolean {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  return x < EDGE_THRESHOLD || x > rect.width - EDGE_THRESHOLD
    || y < EDGE_THRESHOLD || y > rect.height - EDGE_THRESHOLD
}

const HANDLE_CONFIGS = [
  { id: 'nw', top: -5, left: -5,      cursor: 'nw-resize', dx: -1, dy: -1 },
  { id: 'n',  top: -5, left: '50%',   cursor: 'n-resize',  dx:  0, dy: -1, translateX: '-50%' },
  { id: 'ne', top: -5, right: -5,     cursor: 'ne-resize', dx:  1, dy: -1 },
  { id: 'e',  top: '50%', right: -5,  cursor: 'e-resize',  dx:  1, dy:  0, translateY: '-50%' },
  { id: 'se', bottom: -5, right: -5,  cursor: 'se-resize', dx:  1, dy:  1 },
  { id: 's',  bottom: -5, left: '50%',cursor: 's-resize',  dx:  0, dy:  1, translateX: '-50%' },
  { id: 'sw', bottom: -5, left: -5,   cursor: 'sw-resize', dx: -1, dy:  1 },
  { id: 'w',  top: '50%', left: -5,   cursor: 'w-resize',  dx: -1, dy:  0, translateY: '-50%' },
]

export function EditableWrapper({ children, id, label, className = '', style }: EditableWrapperProps) {
  const { isMaintenanceMode } = useMaintenanceMode()
  const [editMode, setEditMode] = useState<EditMode>('idle')
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isMaintenanceMode) return
    e.stopPropagation()

    if (editMode !== 'idle') {
      setEditMode('idle')
      return
    }

    const isEdge = getNearestBorder(e)
    if (isEdge) {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect()
        setSize({ w: r.width, h: r.height })
      }
      setEditMode('resize')
    } else {
      setEditMode('move')
    }
  }, [isMaintenanceMode, editMode])

  // Pass-through when not in maintenance mode
  if (!isMaintenanceMode) {
    return <div className={className} style={style}>{children}</div>
  }

  const isActive = editMode !== 'idle'

  return (
    <motion.div
      ref={ref}
      drag={editMode === 'move'}
      dragMomentum={false}
      dragElastic={0}
      dragControls={dragControls}
      onDragEnd={(_, info) => {
        setOffset(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }))
      }}
      animate={{ x: offset.x, y: offset.y }}
      onDoubleClick={handleDoubleClick}
      className={`relative group/editable ${className}
        ${editMode === 'idle'
          ? 'hover:outline hover:outline-2 hover:outline-dashed hover:outline-indigo-400/40 hover:outline-offset-1'
          : editMode === 'move'
            ? 'outline outline-2 outline-dashed outline-indigo-500 cursor-grab active:cursor-grabbing'
            : 'outline outline-2 outline-dashed outline-violet-500'
        }
      `}
      style={{
        ...style,
        ...(size && editMode === 'resize' ? { width: size.w, height: size.h } : {}),
      }}>

      {children}

      {/* Idle hint badge */}
      {editMode === 'idle' && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/editable:opacity-100 transition pointer-events-none z-50">
          <span className="text-[8px] bg-indigo-600/90 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm font-medium shadow-lg">
            ✎ dbl-click
          </span>
        </div>
      )}

      {/* Active mode toolbar */}
      {isActive && (
        <div
          className="absolute z-[200] flex items-center gap-1 pointer-events-auto select-none"
          style={{ top: -30, left: 0 }}
          onDoubleClick={e => e.stopPropagation()}>
          <div className="flex items-center rounded-full overflow-hidden shadow-xl"
            style={{ background: editMode === 'move' ? '#3b82f6' : '#2563eb', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="text-[9px] text-white px-2.5 py-1 font-bold flex items-center gap-1">
              {editMode === 'move' ? '✋' : '↔'}
              <span>{label || id}</span>
              <span className="text-white/60">· {editMode === 'move' ? 'drag to move' : 'drag handles to resize'}</span>
            </span>
            <button
              onClick={() => {
                setEditMode('idle')
                setOffset({ x: 0, y: 0 })
                setSize(null)
              }}
              className="text-[9px] text-white/70 hover:text-white px-2 py-1 bg-red-500/30 hover:bg-red-500/60 transition h-full border-l border-white/10">
              ↺
            </button>
            <button
              onClick={() => setEditMode('idle')}
              className="text-[9px] text-white/70 hover:text-white px-2 py-1 bg-white/10 hover:bg-white/20 transition h-full border-l border-white/10">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Resize handles */}
      {editMode === 'resize' && (
        <>
          {HANDLE_CONFIGS.map(h => (
            <motion.div
              key={h.id}
              drag
              dragMomentum={false}
              dragElastic={0}
              onDrag={(_, info) => {
                setSize(prev => {
                  if (!prev) return prev
                  return {
                    w: Math.max(80, prev.w + info.delta.x * h.dx),
                    h: Math.max(40, prev.h + info.delta.y * h.dy),
                  }
                })
              }}
              onDoubleClick={e => e.stopPropagation()}
              className="absolute z-[200] w-3 h-3 rounded-sm border-2 border-white shadow-lg"
              style={{
                background: '#2563eb',
                cursor: h.cursor,
                top: (h as any).top,
                bottom: (h as any).bottom,
                left: (h as any).left,
                right: (h as any).right,
                transform: [
                  (h as any).translateX ? `translateX(${(h as any).translateX})` : '',
                  (h as any).translateY ? `translateY(${(h as any).translateY})` : '',
                ].filter(Boolean).join(' ') || undefined,
              }}
            />
          ))}
          {/* Dimension badge */}
          {size && (
            <div className="absolute bottom-2 right-2 pointer-events-none z-50">
              <span className="text-[8px] bg-violet-600/90 text-white px-1.5 py-0.5 rounded-full font-mono">
                {Math.round(size.w)} × {Math.round(size.h)}
              </span>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
