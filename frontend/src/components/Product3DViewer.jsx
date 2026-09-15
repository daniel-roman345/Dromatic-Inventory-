import { useEffect, useRef, useState } from 'react'

/**
 * Visor "3D" del producto:
 * - Arrastre con el mouse o el dedo para inclinar la imagen en X y Y.
 * - Rueda del mouse para acercar / alejar.
 * - Doble clic para volver al ángulo inicial.
 * - Rota sola lentamente mientras nadie la toca.
 * - Si el producto no tiene imagen, muestra un icono grande.
 */
export default function Product3DViewer({ src, alt }) {
  const [rotY, setRotY] = useState(0)
  const [rotX, setRotX] = useState(-8)
  const [zoom, setZoom] = useState(1)
  const [autoSpin, setAutoSpin] = useState(true)
  const [imgError, setImgError] = useState(false)
  const dragging = useRef(null)
  const frame = useRef(null)

  useEffect(() => {
    setImgError(false)
    setRotY(0); setRotX(-8); setZoom(1)
  }, [src])

  // Giro automático suave si nadie interactúa.
  useEffect(() => {
    if (!autoSpin) return undefined
    let last = performance.now()
    const tick = (now) => {
      const delta = (now - last) / 1000
      last = now
      setRotY((y) => y + delta * 18) // 18°/segundo
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [autoSpin])

  function startDrag(clientX, clientY) {
    dragging.current = { x: clientX, y: clientY, rotY, rotX }
    setAutoSpin(false)
  }
  function moveDrag(clientX, clientY) {
    if (!dragging.current) return
    const dx = clientX - dragging.current.x
    const dy = clientY - dragging.current.y
    setRotY(dragging.current.rotY + dx * 0.4)
    setRotX(Math.max(-45, Math.min(45, dragging.current.rotX - dy * 0.4)))
  }
  function endDrag() {
    dragging.current = null
  }

  function handleWheel(e) {
    e.preventDefault()
    setZoom((z) => Math.max(0.6, Math.min(2, z + (e.deltaY < 0 ? 0.08 : -0.08))))
  }
  function reset() {
    setRotY(0); setRotX(-8); setZoom(1)
  }

  if (!src || imgError) {
    return (
      <div className="viewer3d viewer3d-empty" aria-label={`${alt} sin imagen`}>
        <span aria-hidden="true">📦</span>
        <small>{imgError ? 'No se pudo cargar la imagen' : 'Sin imagen'}</small>
      </div>
    )
  }

  return (
    <div className="viewer3d-wrapper">
      <div
        className="viewer3d"
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => dragging.current && moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
        onWheel={handleWheel}
        onDoubleClick={reset}
        role="img"
        aria-label={alt}
      >
        <div
          className="viewer3d-stage"
          style={{
            transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`,
          }}
        >
          <img src={src} alt={alt} draggable="false" onError={() => setImgError(true)} />
        </div>
        <div className="viewer3d-floor" aria-hidden="true" />
      </div>
      <div className="viewer3d-controls">
        <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => setAutoSpin((s) => !s)}>
          {autoSpin ? '⏸ Detener giro' : '▶ Girar automático'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>↺ Reiniciar</button>
        <span className="hint">Arrastra para girar · Rueda para acercar · Doble clic para reiniciar</span>
      </div>
    </div>
  )
}
