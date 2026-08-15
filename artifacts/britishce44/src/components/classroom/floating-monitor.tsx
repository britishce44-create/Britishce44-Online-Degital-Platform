import { useEffect, useRef } from 'react'

export interface FloatingMonitorParticipant {
  id: string
  name: string
  stream?: MediaStream | null
  isLocal?: boolean
}

interface FloatingMonitorProps {
  active: boolean
  participants: FloatingMonitorParticipant[]
  localStream: MediaStream | null
  localName?: string
  onUnsupported?: () => void
}

interface PipWin {
  document: Document
  close: () => void
  addEventListener: (t: string, fn: () => void) => void
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function buildMiniGrid(doc: Document, tiles: { id: string; name: string; stream?: MediaStream | null }[]) {
  const root = doc.createElement('div')
  root.style.cssText = 'position:absolute;inset:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:4px;padding:6px;box-sizing:border-box;align-content:start;overflow:hidden;'
  const bg = doc.createElement('div')
  bg.style.cssText = 'position:absolute;inset:0;background:linear-gradient(160deg,#17125c 0%,#120c4a 100%);'
  root.appendChild(bg)

  tiles.forEach(t => {
    const wrap = doc.createElement('div')
    wrap.style.cssText = 'position:relative;border-radius:8px;overflow:hidden;background:#1d1668;border:1px solid rgba(63,186,235,0.22);aspect-ratio:4/3;box-sizing:border-box;'
    if (t.stream) {
      const v = doc.createElement('video')
      v.srcObject = t.stream
      v.autoplay = true
      v.playsInline = true
      v.muted = true
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;'
      wrap.appendChild(v)
    } else {
      const av = doc.createElement('div')
      av.textContent = (t.name || '?').charAt(0).toUpperCase()
      av.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;background:linear-gradient(135deg,#2620a8,#2563eb);'
      wrap.appendChild(av)
    }
    const label = doc.createElement('div')
    label.textContent = t.isLocal ? (t.name || 'You') : (t.name || '')
    label.style.cssText = 'position:absolute;left:0;right:0;bottom:0;padding:1px 4px;font-size:8px;font-weight:700;color:#fff;background:linear-gradient(to top,rgba(0,0,0,0.7),transparent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:sans-serif;'
    wrap.appendChild(label)
    root.appendChild(wrap)
  })

  doc.body.appendChild(root)
}

/**
 * FloatingMonitor — when `active`, opens an always-on-top Picture-in-Picture
 * window (Document Picture-in-Picture API) showing all participant monitors.
 * It stays visible even when the main app window is minimized. Falls back to a
 * small in-page floating panel when the API is unsupported.
 */
export function FloatingMonitor({ active, participants, localStream, localName, onUnsupported }: FloatingMonitorProps) {
  const pipRef = useRef<PipWin | null>(null)
  const last = useRef({ participants, localStream, localName })
  last.current = { participants, localStream, localName }

  const renderPip = () => {
    const pip = pipRef.current
    if (!pip) return
    const { participants: ps, localStream: ls, localName: ln } = last.current
    const tiles = [
      { id: 'local', name: ln || 'You', stream: ls, isLocal: true },
      ...ps.filter(p => p.id !== 'local'),
    ]
    pip.document.body.innerHTML = ''
    buildMiniGrid(pip.document, tiles)
  }

  useEffect(() => {
    if (!active) {
      pipRef.current?.close()
      pipRef.current = null
      return
    }
    const anyDpip = (window as unknown as { documentPictureInPicture?: { requestWindow: (o: object) => Promise<PipWin> } }).documentPictureInPicture
    if (!anyDpip) {
      onUnsupported?.()
      return
    }
    let cancelled = false
    anyDpip.requestWindow({ width: 440, height: 320 }).then((pip: PipWin) => {
      if (cancelled) { pip.close(); return }
      pipRef.current = pip
      pip.document.head.appendChild(Object.assign(document.createElement('style'), {
        textContent: 'html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#120c4a}',
      }))
      renderPip()
      pip.addEventListener('pagehide', () => {
        if (pipRef.current === pip) pipRef.current = null
      })
    }).catch(() => {
      onUnsupported?.()
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    if (active) renderPip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, localStream, active])

  return null
}