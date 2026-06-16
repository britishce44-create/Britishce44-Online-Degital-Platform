
import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'

type ResizeDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const FONT_NAMES = [
  'Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Tahoma', 'Cairo', 'Tajawal', 'Comic Sans MS', 'Impact',
]
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 42, 48, 56, 64, 72, 96, 120]
const TEXT_COLORS = [
  '#000000', '#ffffff', '#1e3a5f', '#c8a84e', '#ef4444',
  '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#64748b', '#0f172a', '#7c3aed', '#dc2626',
]

type Section = 'text' | 'style' | 'transform' | 'layers'

interface Props {
  fabricRef: React.RefObject<fabric.Canvas | null>
  onPushHistory: () => void
  onClose: () => void
}

export function WhiteboardToolbox({ fabricRef, onPushHistory, onClose }: Props) {
  const [pos, setPos] = useState({ x: 12, y: 56 })
  const [size, setSize] = useState({ w: 272, h: 520 })
  const [minimized, setMinimized] = useState(false)
  const [section, setSection] = useState<Section>('text')

  /* ── Text state ── */
  const [fontFamily, setFontFamilyS] = useState('Inter')
  const [fontSize, setFontSizeS] = useState(22)
  const [bold, setBoldS] = useState(false)
  const [italic, setItalicS] = useState(false)
  const [underline, setUnderlineS] = useState(false)
  const [strikethrough, setStrikethroughS] = useState(false)
  const [textAlign, setTextAlignS] = useState('left')
  const [textColor, setTextColorS] = useState('#000000')
  const [textBg, setTextBgS] = useState('')
  const [lineHeight, setLineHeightS] = useState(1.4)
  const [charSpacing, setCharSpacingS] = useState(0)
  const [direction, setDirectionS] = useState<'ltr' | 'rtl'>('ltr')

  /* ── Object state ── */
  const [opacity, setOpacityS] = useState(100)
  const [angle, setAngleS] = useState(0)
  const [objX, setObjX] = useState(0)
  const [objY, setObjY] = useState(0)
  const [objW, setObjW] = useState(0)
  const [objH, setObjH] = useState(0)
  const [strokeColor, setStrokeColorS] = useState('#000000')
  const [strokeWidth, setStrokeWidthS] = useState(2)

  const [selectedType, setSelectedType] = useState<string | null>(null)

  /* ── Drag ── */
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  /* ── Resize ── */
  const resizeRef = useRef<{ dir: ResizeDir; mx: number; my: number; px: number; py: number; pw: number; ph: number } | null>(null)

  /* ── Read selection from fabric ── */
  const readSelection = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const obj = canvas.getActiveObject() as any
    if (!obj) { setSelectedType(null); return }
    setSelectedType(obj.type ?? 'unknown')
    setOpacityS(Math.round((obj.opacity ?? 1) * 100))
    setAngleS(Math.round(obj.angle ?? 0))
    setObjX(Math.round(obj.left ?? 0))
    setObjY(Math.round(obj.top ?? 0))
    setObjW(Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)))
    setObjH(Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)))
    setStrokeColorS(typeof obj.stroke === 'string' ? obj.stroke : '#000000')
    setStrokeWidthS(obj.strokeWidth ?? 2)
    if (obj.type === 'i-text' || obj.type === 'textbox') {
      setFontFamilyS(obj.fontFamily ?? 'Inter')
      setFontSizeS(Math.round(obj.fontSize ?? 22))
      setBoldS(obj.fontWeight === 'bold')
      setItalicS(obj.fontStyle === 'italic')
      setUnderlineS(!!obj.underline)
      setStrikethroughS(!!obj.linethrough)
      setTextAlignS(obj.textAlign ?? 'left')
      setTextColorS(typeof obj.fill === 'string' ? obj.fill : '#000000')
      setTextBgS(obj.backgroundColor ?? '')
      setLineHeightS(Number((obj.lineHeight ?? 1.4).toFixed(2)))
      setCharSpacingS(obj.charSpacing ?? 0)
      setDirectionS(obj.direction === 'rtl' ? 'rtl' : 'ltr')
    }
  }, [fabricRef])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const onCreated = () => readSelection()
    const onUpdated = () => readSelection()
    const onCleared = () => setSelectedType(null)
    const onModified = () => readSelection()
    canvas.on('selection:created', onCreated)
    canvas.on('selection:updated', onUpdated)
    canvas.on('selection:cleared', onCleared)
    canvas.on('object:modified', onModified)
    return () => {
      canvas.off('selection:created', onCreated)
      canvas.off('selection:updated', onUpdated)
      canvas.off('selection:cleared', onCleared)
      canvas.off('object:modified', onModified)
    }
  }, [fabricRef, readSelection])

  /* ── Apply helpers ── */
  const applyText = useCallback((patch: Record<string, any>) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    if (!objs.length) return
    objs.forEach((o: any) => {
      if (o.type === 'i-text' || o.type === 'textbox') o.set(patch)
    })
    canvas.requestRenderAll()
    onPushHistory()
  }, [fabricRef, onPushHistory])

  const applyObj = useCallback((patch: Record<string, any>) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getActiveObjects()
    if (!objs.length) return
    objs.forEach((o: any) => { o.set(patch); o.setCoords() })
    canvas.requestRenderAll()
    onPushHistory()
  }, [fabricRef, onPushHistory])

  const isText = selectedType === 'i-text' || selectedType === 'textbox'
  const hasSelection = selectedType !== null

  /* ── Drag ── */
  const onTitleDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragRef.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onTitleMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    setPos({
      x: dragRef.current.px + e.clientX - dragRef.current.mx,
      y: dragRef.current.py + e.clientY - dragRef.current.my,
    })
  }
  const onTitleUp = () => { dragRef.current = null }

  /* ── Resize ── */
  const onHandleDown = (e: React.PointerEvent, dir: ResizeDir) => {
    e.preventDefault(); e.stopPropagation()
    resizeRef.current = { dir, mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y, pw: size.w, ph: size.h }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onHandleMove = (e: React.PointerEvent) => {
    const r = resizeRef.current
    if (!r) return
    const dx = e.clientX - r.mx, dy = e.clientY - r.my
    let { px, py, pw, ph } = r
    const MIN_W = 240, MIN_H = 180
    if (r.dir.includes('e')) pw = Math.max(MIN_W, r.pw + dx)
    if (r.dir.includes('w')) { const nw = Math.max(MIN_W, r.pw - dx); px = r.px + (r.pw - nw); pw = nw }
    if (r.dir.includes('s')) ph = Math.max(MIN_H, r.ph + dy)
    if (r.dir.includes('n')) { const nh = Math.max(MIN_H, r.ph - dy); py = r.py + (r.ph - nh); ph = nh }
    setPos({ x: px, y: py })
    setSize({ w: pw, h: ph })
  }
  const onHandleUp = () => { resizeRef.current = null }

  /* ── Layer ops ── */
  const bringFront = () => { const c = fabricRef.current; const o = c?.getActiveObject(); if (c && o) { c.bringObjectToFront(o); c.requestRenderAll(); onPushHistory() } }
  const sendBack = () => { const c = fabricRef.current; const o = c?.getActiveObject(); if (c && o) { c.sendObjectToBack(o); c.requestRenderAll(); onPushHistory() } }
  const bringForward = () => { const c = fabricRef.current; const o = c?.getActiveObject(); if (c && o) { c.bringObjectForward(o); c.requestRenderAll(); onPushHistory() } }
  const sendBackward = () => { const c = fabricRef.current; const o = c?.getActiveObject(); if (c && o) { c.sendObjectBackwards(o); c.requestRenderAll(); onPushHistory() } }
  const flipH = () => { const o = fabricRef.current?.getActiveObject() as any; if (o) { o.set({ flipX: !o.flipX }); fabricRef.current?.requestRenderAll(); onPushHistory() } }
  const flipV = () => { const o = fabricRef.current?.getActiveObject() as any; if (o) { o.set({ flipY: !o.flipY }); fabricRef.current?.requestRenderAll(); onPushHistory() } }
  const lockObj = () => {
    const o = fabricRef.current?.getActiveObject() as any
    if (!o) return
    const locked = !o.lockMovementX
    o.set({ lockMovementX: locked, lockMovementY: locked, lockRotation: locked, lockScalingX: locked, lockScalingY: locked, selectable: !locked })
    fabricRef.current?.requestRenderAll()
  }

  /* ── Resize handles ── */
  const handles: Array<{ dir: ResizeDir; style: React.CSSProperties }> = [
    { dir: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)', width: 32, height: 8, cursor: 'ns-resize' } },
    { dir: 'ne', style: { top: -4, right: -4, width: 12, height: 12, cursor: 'nesw-resize' } },
    { dir: 'e',  style: { top: '50%', right: -4, transform: 'translateY(-50%)', width: 8, height: 32, cursor: 'ew-resize' } },
    { dir: 'se', style: { bottom: -4, right: -4, width: 12, height: 12, cursor: 'nwse-resize' } },
    { dir: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 32, height: 8, cursor: 'ns-resize' } },
    { dir: 'sw', style: { bottom: -4, left: -4, width: 12, height: 12, cursor: 'nesw-resize' } },
    { dir: 'w',  style: { top: '50%', left: -4, transform: 'translateY(-50%)', width: 8, height: 32, cursor: 'ew-resize' } },
    { dir: 'nw', style: { top: -4, left: -4, width: 12, height: 12, cursor: 'nwse-resize' } },
  ]

  /* ── Shared UI ── */
  const Row = ({ children, gap = 6 }: { children: React.ReactNode; gap?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap, flexWrap: 'wrap' as const }}>{children}</div>
  )
  const Label = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: 1 }}>{children}</span>
  )
  const Divider = () => <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />

  const ToggleBtn = ({
    active, onClick, children, title,
  }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '3px 8px', borderRadius: 6, border: active ? '1.5px solid #c8a84e' : '1px solid #e5e7eb',
        background: active ? '#fef9ec' : '#f9fafb', color: active ? '#92620a' : '#374151',
        fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .12s',
        minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{children}</button>
  )

  const IconBtn = ({
    onClick, children, title, danger = false, disabled = false,
  }: { onClick: () => void; children: React.ReactNode; title?: string; danger?: boolean; disabled?: boolean }) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb',
        background: danger ? '#fef2f2' : '#f9fafb',
        color: disabled ? '#d1d5db' : danger ? '#dc2626' : '#374151',
        fontSize: 11, cursor: disabled ? 'default' : 'pointer', display: 'flex',
        alignItems: 'center', gap: 3, whiteSpace: 'nowrap' as const,
      }}
    >{children}</button>
  )

  const NumInput = ({
    value, onChange, min, max, step = 1, style = {},
  }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; style?: React.CSSProperties }) => (
    <input
      type="number" value={value} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: 56, padding: '3px 6px', borderRadius: 6, border: '1px solid #d1d5db',
        fontSize: 12, textAlign: 'right' as const, background: '#fff', ...style,
      }}
    />
  )

  const TABS: { key: Section; label: string }[] = [
    { key: 'text', label: '✍️ Text' },
    { key: 'style', label: '🎨 Style' },
    { key: 'transform', label: '📐 Transform' },
    { key: 'layers', label: '📚 Layers' },
  ]

  return (
    <div
      onPointerMove={e => { onTitleMove(e); onHandleMove(e) }}
      onPointerUp={e => { onTitleUp(); onHandleUp() }}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimized ? 'auto' : size.h,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        overflow: 'visible',
        userSelect: 'none',
      }}
    >
      {/* Resize handles */}
      {!minimized && handles.map(h => (
        <div
          key={h.dir}
          onPointerDown={e => onHandleDown(e, h.dir)}
          style={{
            position: 'absolute',
            background: 'rgba(200,168,78,0.45)',
            borderRadius: 2,
            zIndex: 10,
            ...h.style,
          }}
        />
      ))}

      {/* Title bar */}
      <div
        onPointerDown={onTitleDown}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px',
          background: 'linear-gradient(90deg, #1e3a5f, #2550a8)',
          borderRadius: minimized ? 10 : '10px 10px 0 0',
          cursor: 'grab', userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#c8a84e', letterSpacing: 0.5 }}>
          🧰 Whiteboard Toolbox
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMinimized(m => !m)}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 5, color: '#fff', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={minimized ? 'Expand' : 'Minimize'}
          >{minimized ? '▢' : '—'}</button>
          <button
            onClick={onClose}
            style={{ background: 'rgba(220,38,38,0.25)', border: 'none', borderRadius: 5, color: '#fca5a5', width: 20, height: 20, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close toolbox"
          >✕</button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', flexShrink: 0 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setSection(t.key)}
                style={{
                  flex: 1, padding: '5px 2px', fontSize: 9, fontWeight: 700,
                  border: 'none', borderBottom: section === t.key ? '2px solid #c8a84e' : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer',
                  color: section === t.key ? '#92620a' : '#6b7280',
                  letterSpacing: 0.2, whiteSpace: 'nowrap',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 14px', fontSize: 12, color: '#1f2937' }}>

            {/* ────── TEXT TAB ────── */}
            {section === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!isText && (
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                    Select a text object on the board<br />
                    <span style={{ fontSize: 9 }}>or click <b>Text (T)</b> tool to place one</span>
                  </div>
                )}

                {/* Font family */}
                <div>
                  <Label>Font Family</Label>
                  <select
                    value={fontFamily}
                    onChange={e => { setFontFamilyS(e.target.value); applyText({ fontFamily: e.target.value }) }}
                    style={{ width: '100%', marginTop: 4, padding: '4px 6px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 12, background: '#fff' }}
                  >
                    {FONT_NAMES.map(f => (
                      <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Font size */}
                <div>
                  <Label>Font Size</Label>
                  <Row gap={4} >
                    <button
                      onClick={() => { const s = Math.max(6, fontSize - 1); setFontSizeS(s); applyText({ fontSize: s }) }}
                      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >−</button>
                    <input
                      type="number" value={fontSize} min={6} max={200}
                      onChange={e => { const s = Math.max(6, Math.min(200, Number(e.target.value))); setFontSizeS(s); applyText({ fontSize: s }) }}
                      style={{ width: 52, padding: '3px 6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, textAlign: 'center', fontWeight: 700 }}
                    />
                    <button
                      onClick={() => { const s = Math.min(200, fontSize + 1); setFontSizeS(s); applyText({ fontSize: s }) }}
                      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >+</button>
                    <select
                      value={fontSize}
                      onChange={e => { const s = Number(e.target.value); setFontSizeS(s); applyText({ fontSize: s }) }}
                      style={{ flex: 1, padding: '3px 4px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 11, background: '#fff' }}
                    >
                      {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                    </select>
                  </Row>
                </div>

                {/* Style toggles */}
                <div>
                  <Label>Style</Label>
                  <Row gap={4} >
                    <ToggleBtn active={bold} title="Bold (Ctrl+B)" onClick={() => { setBoldS(!bold); applyText({ fontWeight: !bold ? 'bold' : 'normal' }) }}>
                      <b>B</b>
                    </ToggleBtn>
                    <ToggleBtn active={italic} title="Italic (Ctrl+I)" onClick={() => { setItalicS(!italic); applyText({ fontStyle: !italic ? 'italic' : 'normal' }) }}>
                      <i>I</i>
                    </ToggleBtn>
                    <ToggleBtn active={underline} title="Underline (Ctrl+U)" onClick={() => { setUnderlineS(!underline); applyText({ underline: !underline }) }}>
                      <u>U</u>
                    </ToggleBtn>
                    <ToggleBtn active={strikethrough} title="Strikethrough" onClick={() => { setStrikethroughS(!strikethrough); applyText({ linethrough: !strikethrough }) }}>
                      <s>S</s>
                    </ToggleBtn>
                  </Row>
                </div>

                {/* Alignment */}
                <div>
                  <Label>Alignment</Label>
                  <Row gap={3}>
                    {(['left', 'center', 'right', 'justify'] as const).map((a, i) => (
                      <ToggleBtn
                        key={a}
                        active={textAlign === a}
                        title={['Align Left', 'Center', 'Align Right', 'Justify'][i]}
                        onClick={() => { setTextAlignS(a); applyText({ textAlign: a }) }}
                      >
                        {['≡\u200B←', '≡\u200B↔', '≡\u200B→', '⇔'][i]}
                      </ToggleBtn>
                    ))}
                    <ToggleBtn active={direction === 'rtl'} title="Right-to-Left (Arabic)" onClick={() => { const d = direction === 'rtl' ? 'ltr' : 'rtl'; setDirectionS(d); applyText({ direction: d }) }}>
                      ↰ RTL
                    </ToggleBtn>
                  </Row>
                </div>

                {/* Colors */}
                <div>
                  <Label>Text Color</Label>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {TEXT_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setTextColorS(c); applyText({ fill: c }) }}
                        style={{
                          width: 20, height: 20, borderRadius: '50%', border: textColor === c ? '2px solid #c8a84e' : '1.5px solid #d1d5db',
                          background: c, cursor: 'pointer', flexShrink: 0,
                        }}
                      />
                    ))}
                    <label style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #d1d5db', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, background: textColor }}>
                      <input type="color" value={textColor} onChange={e => { setTextColorS(e.target.value); applyText({ fill: e.target.value }) }} style={{ opacity: 0, width: 1, height: 1 }} />
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Background Color</Label>
                  <Row gap={6}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', cursor: 'pointer' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #d1d5db', background: textBg || 'transparent', overflow: 'hidden', position: 'relative' }}>
                        {!textBg && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #f0f0f0 0, #f0f0f0 4px, #fff 4px, #fff 8px)' }} />}
                        <input type="color" value={textBg || '#ffffff'} onChange={e => { setTextBgS(e.target.value); applyText({ backgroundColor: e.target.value }) }} style={{ opacity: 0, position: 'absolute', inset: 0 }} />
                      </div>
                      {textBg ? textBg : 'None'}
                    </label>
                    {textBg && (
                      <button onClick={() => { setTextBgS(''); applyText({ backgroundColor: '' }) }}
                        style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', color: '#6b7280' }}>
                        Clear
                      </button>
                    )}
                  </Row>
                </div>

                <Divider />

                {/* Spacing */}
                <div>
                  <Label>Line Height: {lineHeight.toFixed(1)}</Label>
                  <input
                    type="range" min={0.8} max={3} step={0.1} value={lineHeight}
                    onChange={e => { const v = Number(e.target.value); setLineHeightS(v); applyText({ lineHeight: v }) }}
                    style={{ width: '100%', marginTop: 4, accentColor: '#c8a84e' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af' }}>
                    <span>0.8</span><span>1.4</span><span>2.0</span><span>3.0</span>
                  </div>
                </div>

                <div>
                  <Label>Char Spacing: {charSpacing}</Label>
                  <input
                    type="range" min={-200} max={800} step={10} value={charSpacing}
                    onChange={e => { const v = Number(e.target.value); setCharSpacingS(v); applyText({ charSpacing: v }) }}
                    style={{ width: '100%', marginTop: 4, accentColor: '#c8a84e' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#9ca3af' }}>
                    <span>Tight</span><span>Normal</span><span>Wide</span>
                  </div>
                </div>
              </div>
            )}

            {/* ────── STYLE TAB ────── */}
            {section === 'style' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!hasSelection && (
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                    Select an object to edit its style
                  </div>
                )}

                <div>
                  <Label>Opacity: {opacity}%</Label>
                  <input
                    type="range" min={0} max={100} step={1} value={opacity}
                    onChange={e => { const v = Number(e.target.value); setOpacityS(v); applyObj({ opacity: v / 100 }) }}
                    style={{ width: '100%', marginTop: 4, accentColor: '#c8a84e' }}
                  />
                </div>

                <Divider />

                <div>
                  <Label>Stroke Color</Label>
                  <Row gap={4}>
                    {['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#1e3a5f', '#c8a84e'].map(c => (
                      <button key={c} onClick={() => { setStrokeColorS(c); applyObj({ stroke: c }) }}
                        style={{ width: 20, height: 20, borderRadius: '50%', border: strokeColor === c ? '2px solid #c8a84e' : '1.5px solid #d1d5db', background: c, cursor: 'pointer', flexShrink: 0 }} />
                    ))}
                    <label style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #d1d5db', background: strokeColor, overflow: 'hidden', cursor: 'pointer' }}>
                      <input type="color" value={strokeColor} onChange={e => { setStrokeColorS(e.target.value); applyObj({ stroke: e.target.value }) }} style={{ opacity: 0, width: 1, height: 1 }} />
                    </label>
                  </Row>
                </div>

                <div>
                  <Label>Stroke Width: {strokeWidth}px</Label>
                  <input
                    type="range" min={0} max={20} step={1} value={strokeWidth}
                    onChange={e => { const v = Number(e.target.value); setStrokeWidthS(v); applyObj({ strokeWidth: v }) }}
                    style={{ width: '100%', marginTop: 4, accentColor: '#c8a84e' }}
                  />
                </div>

                <Divider />

                <div>
                  <Label>Flip</Label>
                  <Row gap={6}>
                    <IconBtn onClick={flipH} disabled={!hasSelection} title="Flip Horizontal">↔ Flip H</IconBtn>
                    <IconBtn onClick={flipV} disabled={!hasSelection} title="Flip Vertical">↕ Flip V</IconBtn>
                  </Row>
                </div>

                <div>
                  <Label>Lock Object</Label>
                  <IconBtn onClick={lockObj} disabled={!hasSelection} title="Toggle lock">🔒 Lock / Unlock</IconBtn>
                </div>
              </div>
            )}

            {/* ────── TRANSFORM TAB ────── */}
            {section === 'transform' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!hasSelection && (
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                    Select an object to edit its position
                  </div>
                )}

                <div>
                  <Label>Position</Label>
                  <Row gap={6}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
                      X
                      <NumInput value={objX} min={-9999} max={9999} onChange={v => { setObjX(v); applyObj({ left: v }) }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
                      Y
                      <NumInput value={objY} min={-9999} max={9999} onChange={v => { setObjY(v); applyObj({ top: v }) }} />
                    </label>
                  </Row>
                </div>

                <div>
                  <Label>Size</Label>
                  <Row gap={6}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
                      W
                      <NumInput value={objW} min={1} max={9999} onChange={v => {
                        const canvas = fabricRef.current; const o = canvas?.getActiveObject() as any
                        if (o && o.width) { const s = v / o.width; o.set({ scaleX: s }); o.setCoords(); canvas?.requestRenderAll(); onPushHistory(); setObjW(v) }
                      }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
                      H
                      <NumInput value={objH} min={1} max={9999} onChange={v => {
                        const canvas = fabricRef.current; const o = canvas?.getActiveObject() as any
                        if (o && o.height) { const s = v / o.height; o.set({ scaleY: s }); o.setCoords(); canvas?.requestRenderAll(); onPushHistory(); setObjH(v) }
                      }} />
                    </label>
                  </Row>
                </div>

                <div>
                  <Label>Rotation: {angle}°</Label>
                  <Row gap={6}>
                    <input
                      type="range" min={-180} max={180} step={1} value={angle}
                      onChange={e => { const v = Number(e.target.value); setAngleS(v); applyObj({ angle: v }) }}
                      style={{ flex: 1, accentColor: '#c8a84e' }}
                    />
                    <NumInput value={angle} min={-180} max={180} onChange={v => { setAngleS(v); applyObj({ angle: v }) }} style={{ width: 50 }} />
                  </Row>
                  <Row gap={4}>
                    {[0, 45, 90, 135, 180, -90, -45].map(deg => (
                      <button key={deg} onClick={() => { setAngleS(deg); applyObj({ angle: deg }) }}
                        style={{ padding: '2px 6px', borderRadius: 5, border: '1px solid #e5e7eb', fontSize: 10, cursor: 'pointer', background: angle === deg ? '#fef9ec' : '#f9fafb', color: angle === deg ? '#92620a' : '#374151' }}>
                        {deg}°
                      </button>
                    ))}
                  </Row>
                </div>

                <Divider />

                <div>
                  <Label>Flip</Label>
                  <Row gap={6}>
                    <IconBtn onClick={flipH} disabled={!hasSelection}>↔ Flip H</IconBtn>
                    <IconBtn onClick={flipV} disabled={!hasSelection}>↕ Flip V</IconBtn>
                  </Row>
                </div>
              </div>
            )}

            {/* ────── LAYERS TAB ────── */}
            {section === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!hasSelection && (
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                    Select an object to change its layer order
                  </div>
                )}

                <div>
                  <Label>Layer Order</Label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                    <IconBtn onClick={bringFront} disabled={!hasSelection} title="Bring to Front">⬆⬆ Bring Front</IconBtn>
                    <IconBtn onClick={bringForward} disabled={!hasSelection} title="Bring Forward">⬆ Forward</IconBtn>
                    <IconBtn onClick={sendBackward} disabled={!hasSelection} title="Send Backward">⬇ Backward</IconBtn>
                    <IconBtn onClick={sendBack} disabled={!hasSelection} title="Send to Back">⬇⬇ Send Back</IconBtn>
                  </div>
                </div>

                <Divider />

                <div>
                  <Label>Current Object</Label>
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e5e7eb', marginTop: 4, fontSize: 11, color: '#374151' }}>
                    {hasSelection ? (
                      <>
                        <div><b>Type:</b> {selectedType}</div>
                        <div><b>X:</b> {objX}  <b>Y:</b> {objY}</div>
                        <div><b>W:</b> {objW}  <b>H:</b> {objH}</div>
                        <div><b>Angle:</b> {angle}°  <b>Opacity:</b> {opacity}%</div>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Nothing selected</span>
                    )}
                  </div>
                </div>

                <Divider />

                <div>
                  <Label>Actions</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    <IconBtn onClick={lockObj} disabled={!hasSelection} title="Lock/Unlock">🔒 Lock</IconBtn>
                    <IconBtn onClick={flipH} disabled={!hasSelection} title="Flip Horizontal">↔ Flip H</IconBtn>
                    <IconBtn onClick={flipV} disabled={!hasSelection} title="Flip Vertical">↕ Flip V</IconBtn>
                    <IconBtn
                      disabled={!hasSelection}
                      onClick={() => {
                        const c = fabricRef.current; const o = c?.getActiveObject()
                        if (c && o) { c.remove(o); c.requestRenderAll(); onPushHistory(); setSelectedType(null) }
                      }}
                      danger title="Delete selected"
                    >🗑 Delete</IconBtn>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
