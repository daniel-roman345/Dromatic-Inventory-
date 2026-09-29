import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

/**
 * Visor de imagen a pantalla completa: rueda del mouse o botones para acercar,
 * arrastrar para moverse y doble clic para volver al tamaño normal.
 */
export default function ImageZoom({ src, title, onClose }) {
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+') setZoom((z) => Math.min(z + 0.5, 6))
      if (e.key === '-') setZoom((z) => Math.max(z - 0.5, 1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => { if (zoom === 1) setPos({ x: 0, y: 0 }) }, [zoom])

  return (
    <div className="zoom-viewer" role="dialog" aria-label={title}>
      <div className="bar">
        <span className="strong grow">{title}</span>
        <button className="icon-btn" onClick={() => setZoom((z) => Math.max(z - 0.5, 1))} aria-label="Alejar"><Icon name="zoomOut" /></button>
        <span className="small" style={{ minWidth: 48, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button className="icon-btn" onClick={() => setZoom((z) => Math.min(z + 0.5, 6))} aria-label="Acercar"><Icon name="zoomIn" /></button>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button>
      </div>
      <div className="zoom-stage"
           onWheel={(e) => setZoom((z) => Math.min(Math.max(z + (e.deltaY < 0 ? 0.25 : -0.25), 1), 6))}
           onPointerDown={(e) => { drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.currentTarget.setPointerCapture(e.pointerId) }}
           onPointerMove={(e) => { if (drag.current && zoom > 1) setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }) }}
           onPointerUp={() => { drag.current = null }}
           onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2.5))}>
        <img src={src} alt={title} draggable={false} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})` }} />
      </div>
    </div>
  )
}
