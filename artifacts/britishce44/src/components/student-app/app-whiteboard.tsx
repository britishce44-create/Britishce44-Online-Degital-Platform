import { useRef, useState, useEffect, useCallback } from 'react'

export function AppWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState('#2563eb')
  const [lineWidth, setLineWidth] = useState(3)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.clientWidth * 2
    canvas.height = canvas.clientHeight * 2
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(2, 2)
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [canvasRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
    }
  }, [color, lineWidth])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => { setDrawing(false); lastPos.current = null }

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const COLORS = ['#2563eb', '#ef4444', '#22c55e', '#D4A017', '#a855f7', '#f97316', '#000000', '#ffffff']

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5 flex-shrink-0">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition border-2 flex-shrink-0"
              style={{ background: c, borderColor: color === c ? '#D4A017' : 'transparent' }} />
          ))}
        </div>
        <div className="w-px h-6 bg-white/10 mx-2 flex-shrink-0" />
        {[2, 4, 6].map(w => (
          <button key={w} onClick={() => setLineWidth(w)}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex-shrink-0"
            style={{ background: lineWidth === w ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)', color: lineWidth === w ? '#60a5fa' : 'rgba(255,255,255,0.5)', border: `1px solid ${lineWidth === w ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
            {w}px
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-2 flex-shrink-0" />
        <button onClick={clearCanvas}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
          🗑 Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 mx-4 my-4 rounded-2xl overflow-hidden" style={{ background: '#f8fafc', border: '1px solid rgba(255,255,255,0.08)' }}>
        <canvas ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </div>
    </div>
  )
}
