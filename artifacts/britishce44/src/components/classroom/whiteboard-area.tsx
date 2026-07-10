
import { useRef, useState, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'

type Tool =
  | 'select' | 'pen' | 'highlighter' | 'line' | 'arrow'
  | 'rect' | 'circle' | 'triangle' | 'diamond'
  | 'text' | 'note' | 'eraser' | 'pan'
type Position = 'main' | 'chat'
type AILang = 'en' | 'ar'
type AIAction = 'explain' | 'translate' | 'quiz' | 'activity' | 'game'

const COLORS = ['#000000', '#1e3a5f', '#c8a84e', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ffffff', '#64748b']
const STROKE_WIDTHS = [2, 3, 5, 8, 14]
const NOTE_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa']

const AI_LABELS: Record<AILang, Record<AIAction, string>> = {
  en: { explain: '🤖 Explain', translate: '🌐 Translate', quiz: '❓ Quiz', activity: '🎯 Activity', game: '🎮 Game' },
  ar: { explain: '🤖 شرح', translate: '🌐 ترجمة', quiz: '❓ اختبار', activity: '🎯 نشاط', game: '🎮 لعبة' },
}

interface WhiteboardAreaProps {
  onSyncDraw?: (json: string) => void
  syncDrawings?: string[]
  lang?: AILang
}

function withAlpha(hex: string, a: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function WhiteboardArea({ onSyncDraw, lang = 'en' }: WhiteboardAreaProps) {
  const aiLabels = AI_LABELS[lang]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [fillShapes, setFillShapes] = useState(false)
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0])
  const [showColors, setShowColors] = useState(false)
  const [showStroke, setShowStroke] = useState(false)
  const [gridOn, setGridOn] = useState(false)
  const [zoomPct, setZoomPct] = useState(100)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [pinnedSide, setPinnedSide] = useState<Position | null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [wbChat, setWbChat] = useState<{ sender: string; text: string }[]>([])

  // AI panel
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTitle, setAiTitle] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)

  // Refs mirroring latest state for canvas event handlers (attached once)
  const toolRef = useRef(tool)
  const colorRef = useRef(color)
  const strokeRef = useRef(strokeWidth)
  const fillRef = useRef(fillShapes)
  const noteColorRef = useRef(noteColor)
  const gridRef = useRef(gridOn)

  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])
  const suppress = useRef(false)
  const gridPatternRef = useRef<fabric.Pattern | null>(null)

  // page snapshots
  const pagesRef = useRef<string[]>([''])

  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { strokeRef.current = strokeWidth }, [strokeWidth])
  useEffect(() => { fillRef.current = fillShapes }, [fillShapes])
  useEffect(() => { noteColorRef.current = noteColor }, [noteColor])
  useEffect(() => { gridRef.current = gridOn }, [gridOn])

  const pushHistory = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || suppress.current) return
    const json = JSON.stringify(canvas.toJSON())
    undoStack.current.push(json)
    if (undoStack.current.length > 80) undoStack.current.shift()
    redoStack.current = []
    setCanUndo(undoStack.current.length > 1)
    setCanRedo(false)
    onSyncDraw?.(json)
  }, [onSyncDraw])

  const makeGridPattern = useCallback(() => {
    const size = 26
    const c = document.createElement('canvas')
    c.width = size; c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0.5, 0); ctx.lineTo(0.5, size)
    ctx.moveTo(0, 0.5); ctx.lineTo(size, 0.5)
    ctx.stroke()
    return new fabric.Pattern({ source: c, repeat: 'repeat' })
  }, [])

  const applyGrid = useCallback((on: boolean) => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.backgroundColor = (on ? gridPatternRef.current : '#ffffff') as unknown as string
    canvas.requestRenderAll()
  }, [])

  const applyToolState = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const t = toolRef.current
    canvas.isDrawingMode = t === 'pen' || t === 'highlighter'
    canvas.selection = t === 'select'
    canvas.forEachObject(o => {
      if (t === 'select') { o.selectable = true; o.evented = true }
      else if (t === 'eraser') { o.selectable = false; o.evented = true }
      else { o.selectable = false; o.evented = false }
    })
    canvas.defaultCursor =
      t === 'pan' ? 'grab' :
      t === 'eraser' ? 'cell' :
      t === 'select' ? 'default' : 'crosshair'
    if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
      const brush = canvas.freeDrawingBrush
      if (t === 'highlighter') {
        brush.color = withAlpha(colorRef.current, 0.35)
        brush.width = Math.max(strokeRef.current * 4, 16)
      } else {
        brush.color = colorRef.current
        brush.width = strokeRef.current
      }
    }
    if (t !== 'select') canvas.discardActiveObject()
    canvas.requestRenderAll()
  }, [])

  // ── Init canvas (once) ──
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return
    const parent = wrapRef.current
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: parent?.clientWidth || 800,
      height: parent?.clientHeight || 500,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
      preserveObjectStacking: true,
    })
    const brush = new fabric.PencilBrush(canvas)
    brush.color = '#000000'
    brush.width = 3
    canvas.freeDrawingBrush = brush
    fabricRef.current = canvas
    gridPatternRef.current = makeGridPattern()

    undoStack.current = [JSON.stringify(canvas.toJSON())]
    redoStack.current = []

    canvas.on('object:added', pushHistory)
    canvas.on('object:modified', pushHistory)
    canvas.on('object:removed', pushHistory)

    // ── drag-to-draw / eraser / pan handlers ──
    let drawingShape: fabric.Object | null = null
    let start = { x: 0, y: 0 }
    let erasing = false
    let panning = false
    let lastPan = { x: 0, y: 0 }

    const makeShape = (t: Tool, x: number, y: number): fabric.Object | null => {
      const stroke = colorRef.current
      const sw = strokeRef.current
      const fill = fillRef.current ? withAlpha(stroke, 0.18) : 'transparent'
      const common = { left: x, top: y, stroke, strokeWidth: sw, fill, strokeUniform: true, originX: 'left' as const, originY: 'top' as const }
      switch (t) {
        case 'rect': return new fabric.Rect({ ...common, width: 1, height: 1, rx: 3, ry: 3 })
        case 'circle': return new fabric.Ellipse({ ...common, rx: 1, ry: 1 })
        case 'triangle': return new fabric.Triangle({ ...common, width: 1, height: 1 })
        case 'diamond':
          return new fabric.Polygon(
            [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }],
            { ...common, scaleX: 0.001, scaleY: 0.001 },
          )
        case 'line':
        case 'arrow':
          return new fabric.Line([x, y, x, y], { stroke, strokeWidth: sw, strokeUniform: true })
        default: return null
      }
    }

    const updateShape = (t: Tool, shape: fabric.Object, cx: number, cy: number) => {
      const w = cx - start.x, h = cy - start.y
      const left = Math.min(start.x, cx), top = Math.min(start.y, cy)
      if (t === 'line' || t === 'arrow') {
        ;(shape as fabric.Line).set({ x2: cx, y2: cy })
      } else if (t === 'circle') {
        ;(shape as fabric.Ellipse).set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2, left, top })
      } else if (t === 'diamond') {
        shape.set({ left, top, scaleX: Math.max(Math.abs(w) / 100, 0.001), scaleY: Math.max(Math.abs(h) / 100, 0.001) })
      } else {
        shape.set({ width: Math.max(Math.abs(w), 1), height: Math.max(Math.abs(h), 1), left, top })
      }
      shape.setCoords()
    }

    const finalizeArrow = (line: fabric.Line) => {
      const x1 = line.x1!, y1 = line.y1!, x2 = line.x2!, y2 = line.y2!
      const stroke = colorRef.current, sw = strokeRef.current
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const headLen = Math.max(14, sw * 3.2)
      const body = new fabric.Line([x1, y1, x2, y2], { stroke, strokeWidth: sw, strokeUniform: true })
      const head = new fabric.Triangle({
        left: x2, top: y2, originX: 'center', originY: 'center',
        width: headLen, height: headLen, fill: stroke,
        angle: (angle * 180) / Math.PI + 90,
      })
      const group = new fabric.Group([body, head])
      canvas.remove(line)
      canvas.add(group)
    }

    const eraseAt = (opt: any) => {
      const target = opt.target as fabric.Object | undefined
      if (target) canvas.remove(target)
    }

    canvas.on('mouse:down', (opt: any) => {
      const t = toolRef.current
      const p = canvas.getScenePoint(opt.e)
      if (t === 'pan') {
        panning = true
        lastPan = { x: opt.e.clientX, y: opt.e.clientY }
        canvas.defaultCursor = 'grabbing'
        return
      }
      if (t === 'eraser') {
        erasing = true
        suppress.current = true
        eraseAt(opt)
        return
      }
      if (t === 'text') {
        const txt = new fabric.IText('Type here', { left: p.x, top: p.y, fontSize: 22, fill: colorRef.current, fontFamily: 'Inter, Arial, sans-serif' })
        canvas.add(txt); canvas.setActiveObject(txt); txt.enterEditing(); txt.selectAll()
        return
      }
      if (t === 'note') {
        const note = new fabric.Textbox('Note…', {
          left: p.x, top: p.y, width: 170, fontSize: 16, fill: '#1f2937',
          backgroundColor: noteColorRef.current, padding: 10, fontFamily: 'Inter, Arial, sans-serif',
          textAlign: 'left',
        })
        canvas.add(note); canvas.setActiveObject(note); note.enterEditing(); note.selectAll()
        return
      }
      if (['rect', 'circle', 'triangle', 'diamond', 'line', 'arrow'].includes(t)) {
        start = { x: p.x, y: p.y }
        const shape = makeShape(t, p.x, p.y)
        if (shape) {
          suppress.current = true
          drawingShape = shape
          canvas.add(shape)
        }
      }
    })

    canvas.on('mouse:move', (opt: any) => {
      if (panning) {
        const dx = opt.e.clientX - lastPan.x
        const dy = opt.e.clientY - lastPan.y
        lastPan = { x: opt.e.clientX, y: opt.e.clientY }
        canvas.relativePan(new fabric.Point(dx, dy))
        return
      }
      if (erasing) { eraseAt(opt); return }
      if (drawingShape) {
        const p = canvas.getScenePoint(opt.e)
        updateShape(toolRef.current, drawingShape, p.x, p.y)
        canvas.requestRenderAll()
      }
    })

    canvas.on('mouse:up', () => {
      if (panning) { panning = false; canvas.defaultCursor = 'grab'; return }
      if (erasing) {
        erasing = false
        suppress.current = false
        pushHistory()
        return
      }
      if (drawingShape) {
        const t = toolRef.current
        const obj = drawingShape
        drawingShape = null
        suppress.current = false
        // discard tiny shapes (treated as a stray click)
        const tooSmall =
          (t === 'line' || t === 'arrow')
            ? Math.hypot((obj as fabric.Line).x2! - (obj as fabric.Line).x1!, (obj as fabric.Line).y2! - (obj as fabric.Line).y1!) < 6
            : (obj.width! * (obj.scaleX || 1) < 4 && obj.height! * (obj.scaleY || 1) < 4)
        if (tooSmall) { canvas.remove(obj); return }
        if (t === 'arrow') { finalizeArrow(obj as fabric.Line); return }
        obj.setCoords()
        pushHistory()
      }
    })

    canvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY
      let z = canvas.getZoom() * 0.999 ** delta
      z = Math.min(Math.max(z, 0.2), 5)
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), z)
      setZoomPct(Math.round(z * 100))
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    // ── resize to container ──
    const ro = new ResizeObserver(() => {
      const el = wrapRef.current
      if (el && fabricRef.current) {
        fabricRef.current.setDimensions({ width: el.clientWidth, height: el.clientHeight })
        fabricRef.current.requestRenderAll()
      }
    })
    if (parent) ro.observe(parent)

    // ── keyboard shortcuts ──
    const onKey = (e: KeyboardEvent) => {
      const active = canvas.getActiveObject() as any
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      const typingInPage = tag === 'input' || tag === 'textarea'
      if (active?.isEditing || typingInPage) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) doRedo(); else doUndo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        const obj = canvas.getActiveObject()
        if (obj) obj.clone().then((c: any) => { c.set({ left: (obj.left || 0) + 16, top: (obj.top || 0) + 16 }); canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll() })
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const objs = canvas.getActiveObjects()
        if (objs.length) { e.preventDefault(); objs.forEach(o => canvas.remove(o)); canvas.discardActiveObject(); canvas.requestRenderAll() }
        return
      }
      if (!mod) {
        const map: Record<string, Tool> = { v: 'select', p: 'pen', h: 'highlighter', l: 'line', a: 'arrow', r: 'rect', o: 'circle', t: 'text', n: 'note', e: 'eraser', space: 'pan' }
        const k = e.key.toLowerCase()
        if (map[k]) { setTool(map[k]) }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      ro.disconnect()
      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // apply tool state whenever tool/color/stroke changes
  useEffect(() => { applyToolState() }, [tool, color, strokeWidth, applyToolState])
  useEffect(() => { applyGrid(gridOn) }, [gridOn, applyGrid])

  const restore = useCallback((json: string, after?: () => void) => {
    const canvas = fabricRef.current
    if (!canvas) return
    suppress.current = true
    canvas.loadFromJSON(json).then(() => {
      suppress.current = false
      applyToolState()
      applyGrid(gridRef.current)
      canvas.requestRenderAll()
      after?.()
    })
  }, [applyToolState, applyGrid])

  const doUndo = useCallback(() => {
    if (undoStack.current.length < 2) return
    const cur = undoStack.current.pop()!
    redoStack.current.push(cur)
    const prev = undoStack.current[undoStack.current.length - 1]
    restore(prev)
    setCanUndo(undoStack.current.length > 1)
    setCanRedo(true)
  }, [restore])

  const doRedo = useCallback(() => {
    if (redoStack.current.length === 0) return
    const next = redoStack.current.pop()!
    undoStack.current.push(next)
    restore(next)
    setCanRedo(redoStack.current.length > 0)
    setCanUndo(undoStack.current.length > 1)
  }, [restore])

  const resetHistory = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    undoStack.current = [JSON.stringify(canvas.toJSON())]
    redoStack.current = []
    setCanUndo(false); setCanRedo(false)
  }, [])

  const clearCanvas = () => {
    const canvas = fabricRef.current
    if (!canvas || !window.confirm('Clear this page?')) return
    suppress.current = true
    canvas.remove(...canvas.getObjects())
    canvas.discardActiveObject()
    suppress.current = false
    canvas.requestRenderAll()
    pushHistory()
  }

  const deleteSelected = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    if (!objs.length) return
    objs.forEach(o => canvas.remove(o))
    canvas.discardActiveObject()
    canvas.requestRenderAll()
  }

  const duplicateSelected = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const obj = canvas.getActiveObject()
    if (!obj) return
    obj.clone().then((c: any) => {
      c.set({ left: (obj.left || 0) + 16, top: (obj.top || 0) + 16 })
      canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll()
    })
  }

  const zoomTo = (z: number) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const nz = Math.min(Math.max(z, 0.2), 5)
    canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), nz)
    setZoomPct(Math.round(nz * 100))
  }
  const resetZoom = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    setZoomPct(100)
  }

  const uploadImage = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      fabric.FabricImage.fromURL(url).then(img => {
        const maxW = canvas.getWidth() * 0.6
        if (img.width && img.width > maxW) { const s = maxW / img.width; img.scale(s) }
        img.set({ left: 60, top: 60 })
        canvas.add(img); canvas.setActiveObject(img); canvas.requestRenderAll()
      })
    }
    input.click()
  }

  const exportPNG = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const data = canvas.toDataURL({ format: 'png', multiplier: 2 })
    const a = document.createElement('a')
    a.href = data; a.download = `whiteboard-page-${pageIndex + 1}.png`; a.click()
  }

  const saveBoard = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    pagesRef.current[pageIndex] = JSON.stringify(canvas.toJSON())
    localStorage.setItem('b44_whiteboard', JSON.stringify({ pages: pagesRef.current, savedAt: Date.now() }))
    setAiTitle('💾 Saved')
    setAiResult('Your whiteboard (all pages) was saved to this browser. Use “Load” to restore it later.')
    setAiError(null); setAiLoading(false); setAiOpen(true)
  }

  const loadBoard = () => {
    const raw = localStorage.getItem('b44_whiteboard')
    if (!raw) {
      setAiTitle('Load'); setAiError('No saved whiteboard found in this browser.'); setAiResult(''); setAiLoading(false); setAiOpen(true)
      return
    }
    try {
      const parsed = JSON.parse(raw)
      const pages: string[] = parsed.pages?.length ? parsed.pages : ['']
      pagesRef.current = pages
      setTotalPages(pages.length)
      setPageIndex(0)
      restore(pages[0] || JSON.stringify({ version: '6', objects: [] }), resetHistory)
    } catch {
      setAiTitle('Load'); setAiError('Saved whiteboard is corrupted and could not be loaded.'); setAiResult(''); setAiLoading(false); setAiOpen(true)
    }
  }

  // ── Pages ──
  const switchToPage = (i: number) => {
    const canvas = fabricRef.current
    if (!canvas || i === pageIndex || i < 0 || i >= pagesRef.current.length) return
    pagesRef.current[pageIndex] = JSON.stringify(canvas.toJSON())
    const data = pagesRef.current[i]
    const finish = () => { resetHistory(); setPageIndex(i) }
    if (!data) {
      suppress.current = true
      canvas.remove(...canvas.getObjects())
      suppress.current = false
      applyGrid(gridRef.current)
      canvas.requestRenderAll()
      finish()
    } else {
      restore(data, finish)
    }
  }
  const addPage = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    pagesRef.current[pageIndex] = JSON.stringify(canvas.toJSON())
    pagesRef.current.push('')
    const n = pagesRef.current.length
    setTotalPages(n)
    switchToPage(n - 1)
  }

  // ── AI ──
  const runAI = useCallback(async (action: AIAction) => {
    const canvas = fabricRef.current
    setAiOpen(true); setAiLoading(true); setAiError(null); setAiResult('')
    setAiTitle(aiLabels[action])
    let text = ''
    if (canvas) {
      const active = canvas.getActiveObject() as any
      if (active && (active.type === 'i-text' || active.type === 'textbox') && active.text) {
        text = active.text
      } else {
        text = canvas.getObjects()
          .filter((o: any) => (o.type === 'i-text' || o.type === 'textbox') && o.text)
          .map((o: any) => o.text)
          .join('\n')
      }
    }
    try {
      const res = await fetch('/api/v1/ai/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text, lang }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAiError(data?.message || data?.error || `AI request failed (${res.status}).`)
      } else {
        setAiResult(data.result || 'No response.')
      }
    } catch (e: any) {
      setAiError(e?.message || 'Could not reach the AI service.')
    } finally {
      setAiLoading(false)
    }
  }, [aiLabels, lang])

  const insertAIResult = () => {
    const canvas = fabricRef.current
    if (!canvas || !aiResult) return
    const box = new fabric.Textbox(aiResult, {
      left: 80, top: 80, width: Math.min(canvas.getWidth() * 0.7, 480),
      fontSize: 16, fill: '#0f172a', backgroundColor: '#fffbe6', padding: 12,
      fontFamily: 'Inter, Arial, sans-serif',
    })
    canvas.add(box); canvas.setActiveObject(box); canvas.requestRenderAll()
    setAiOpen(false)
  }

  const handleWbChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMsg.trim()) return
    setWbChat(prev => [...prev, { sender: 'You', text: chatMsg.trim() }])
    setChatMsg('')
  }

  const toolButtons: { tool: Tool; icon: string; label: string }[] = [
    { tool: 'select', icon: '🖱', label: 'Select' },
    { tool: 'pen', icon: '✏️', label: 'Pen' },
    { tool: 'highlighter', icon: '🖍', label: 'Mark' },
    { tool: 'line', icon: '📏', label: 'Line' },
    { tool: 'arrow', icon: '➡️', label: 'Arrow' },
    { tool: 'rect', icon: '⬜', label: 'Rect' },
    { tool: 'circle', icon: '⭕', label: 'Circle' },
    { tool: 'triangle', icon: '🔺', label: 'Tri' },
    { tool: 'diamond', icon: '🔷', label: 'Dia' },
    { tool: 'text', icon: '🔤', label: 'Text' },
    { tool: 'note', icon: '🗒', label: 'Note' },
    { tool: 'eraser', icon: '🧹', label: 'Erase' },
    { tool: 'pan', icon: '✋', label: 'Pan' },
  ]

  const aiActions: AIAction[] = ['explain', 'translate', 'quiz', 'activity', 'game']

  const btnBase = 'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition whitespace-nowrap'

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 flex flex-col bg-white relative min-w-0">

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-x-0.5 gap-y-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
          {toolButtons.map(btn => (
            <button key={btn.tool} onClick={() => setTool(btn.tool)} title={btn.label}
              className={`${btnBase} ${tool === btn.tool ? 'bg-gold/20 text-navy border border-gold/30' : 'hover:bg-gray-200 text-gray-600'}`}>
              <span className="text-xs">{btn.icon}</span>
              <span className="hidden lg:inline">{btn.label}</span>
            </button>
          ))}

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Color */}
          <div className="relative">
            <button onClick={() => { setShowColors(!showColors); setShowStroke(false) }} title="Color"
              className="w-6 h-6 rounded-full border-2 border-gray-300 shrink-0" style={{ backgroundColor: color }} />
            {showColors && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border p-2 z-30 w-44">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => { setColor(c); setShowColors(false) }}
                      className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex items-center gap-2">
                  <span className="text-[9px] text-gray-500">Custom</span>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-6 cursor-pointer rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Stroke */}
          <div className="relative">
            <button onClick={() => { setShowStroke(!showStroke); setShowColors(false) }} title="Stroke width"
              className="px-2 py-1 rounded-lg hover:bg-gray-200 text-[10px] text-gray-600 font-medium">
              {strokeWidth}px
            </button>
            {showStroke && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border p-2 z-30 min-w-[110px]">
                {STROKE_WIDTHS.map(w => (
                  <button key={w} onClick={() => { setStrokeWidth(w); setShowStroke(false) }}
                    className={`block w-full text-left px-3 py-1.5 rounded text-xs hover:bg-gold/10 transition ${strokeWidth === w ? 'bg-gold/20 text-navy' : 'text-gray-600'}`}>
                    {w}px {w === 3 && '(default)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fill toggle */}
          <button onClick={() => setFillShapes(f => !f)} title="Toggle shape fill"
            className={`${btnBase} ${fillShapes ? 'bg-gold/20 text-navy border border-gold/30' : 'hover:bg-gray-200 text-gray-600'}`}>
            {fillShapes ? '🎨 Fill' : '⬚ Outline'}
          </button>

          {/* Note color (only relevant for sticky notes) */}
          {tool === 'note' && (
            <div className="flex items-center gap-1 pl-1">
              {NOTE_COLORS.map(c => (
                <button key={c} onClick={() => setNoteColor(c)}
                  className={`w-4 h-4 rounded ${noteColor === c ? 'ring-2 ring-navy' : 'border border-gray-300'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          )}

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* History + edit */}
          <button onClick={doUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            className={`${btnBase} ${canUndo ? 'hover:bg-gray-200 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}>↩</button>
          <button onClick={doRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
            className={`${btnBase} ${canRedo ? 'hover:bg-gray-200 text-gray-600' : 'text-gray-300 cursor-not-allowed'}`}>↪</button>
          <button onClick={duplicateSelected} title="Duplicate (Ctrl+D)" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>⧉</button>
          <button onClick={deleteSelected} title="Delete selected (Del)" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>🗑</button>
          <button onClick={clearCanvas} title="Clear page" className={`${btnBase} hover:bg-red-50 text-red-500`}>Clear</button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Insert / view */}
          <button onClick={uploadImage} title="Insert image" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>🖼</button>
          <button onClick={() => setGridOn(g => !g)} title="Toggle grid"
            className={`${btnBase} ${gridOn ? 'bg-gold/20 text-navy border border-gold/30' : 'hover:bg-gray-200 text-gray-600'}`}>▦</button>
          <button onClick={() => zoomTo((zoomPct / 100) / 1.2)} title="Zoom out" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>➖</button>
          <button onClick={resetZoom} title="Reset zoom" className="px-1.5 py-1 rounded-lg hover:bg-gray-200 text-[10px] text-gray-600 font-medium">{zoomPct}%</button>
          <button onClick={() => zoomTo((zoomPct / 100) * 1.2)} title="Zoom in" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>➕</button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Pages */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => switchToPage(pageIndex - 1)} disabled={pageIndex === 0} title="Previous page"
              className={`${btnBase} ${pageIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}>‹</button>
            <span className="text-[10px] text-gray-500 font-medium px-1">P{pageIndex + 1}/{totalPages}</span>
            <button onClick={() => switchToPage(pageIndex + 1)} disabled={pageIndex >= totalPages - 1} title="Next page"
              className={`${btnBase} ${pageIndex >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}>›</button>
            <button onClick={addPage} title="Add page" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>＋</button>
          </div>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Save / export */}
          <button onClick={saveBoard} title="Save to browser" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>💾</button>
          <button onClick={loadBoard} title="Load saved" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>📂</button>
          <button onClick={exportPNG} title="Export PNG" className={`${btnBase} hover:bg-gray-200 text-gray-600`}>⬇ PNG</button>

          <button onClick={() => setPinnedSide(pinnedSide === 'chat' ? null : 'chat')} title="Whiteboard chat"
            className={`${btnBase} ${pinnedSide === 'chat' ? 'bg-gold/20 text-navy' : 'hover:bg-gray-200 text-gray-600'}`}>💬</button>

          {/* AI cluster */}
          <div className="ml-auto flex items-center gap-1" dir={lang === 'ar' ? 'rtl' : undefined}>
            {aiActions.map(a => (
              <button key={a} onClick={() => runAI(a)}
                className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition font-medium text-[9px]">
                {aiLabels[a]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Canvas ── */}
        <div ref={wrapRef} className="flex-1 relative bg-gray-100">
          <canvas ref={canvasRef} className="absolute inset-0" />

          {/* AI result overlay */}
          {aiOpen && (
            <div className="absolute top-3 right-3 w-80 max-w-[80%] max-h-[85%] flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white z-40 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <span className="text-xs font-bold text-navy">{aiTitle || 'AI Assistant'}</span>
                <button onClick={() => setAiOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scroll">
                {aiLoading && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs py-6 justify-center">
                    <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Thinking…
                  </div>
                )}
                {aiError && !aiLoading && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 leading-relaxed">
                    {aiError}
                  </div>
                )}
                {aiResult && !aiLoading && (
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                )}
              </div>
              {aiResult && !aiLoading && (
                <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
                  <button onClick={insertAIResult} className="bg-navy text-white px-3 py-1 rounded-full text-[10px] font-bold hover:bg-navy/90 transition">＋ Insert to board</button>
                  <button onClick={() => navigator.clipboard?.writeText(aiResult)} className="text-[10px] text-gray-500 hover:text-gray-800 px-2">Copy</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat zone ── */}
      {pinnedSide === 'chat' && (
        <div className="w-60 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-navy">💬 Whiteboard Chat</span>
            <button onClick={() => setPinnedSide(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scroll">
            {wbChat.length === 0 && (
              <p className="text-[9px] text-gray-400 text-center py-4">Discuss the whiteboard here</p>
            )}
            {wbChat.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-lg px-2 py-1.5">
                <p className="text-[8px] font-bold text-navy">{m.sender}</p>
                <p className="text-[10px] text-gray-600">{m.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleWbChat} className="p-2 border-t border-gray-100 flex gap-1">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              placeholder="Type…"
              className="flex-1 border border-gray-200 rounded-full px-2.5 py-1 text-[10px] outline-none focus:border-gold" />
            <button type="submit" className="bg-gold text-navy px-2.5 py-1 rounded-full text-[9px] font-bold hover:bg-gold/90">Send</button>
          </form>
        </div>
      )}
    </div>
  )
}
