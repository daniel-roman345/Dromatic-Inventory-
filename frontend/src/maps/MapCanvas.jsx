import Icon from '../shared/Icon'

/**
 * Mapa visto desde arriba, dibujado en SVG a partir del layout del backend.
 * Estilo amigable: bloques grandes con la letra de la estantería, el número
 * del pasillo en un círculo como letrero y el bloque lleno de color cuando
 * hay mercancía. Los pisos (o filas) se ven al tocar la estantería.
 *
 * highlights:     [{ rackId, level }] → pin rojo (dónde está un producto)
 * picked:         { rackId, level }   → ubicación escogida
 * selectedRackId: estantería abierta en el panel
 * editing:        muestra la cuadrícula y permite tocar celdas vacías
 */
export const CELL = 40

const LANDMARK_ICONS = {
  ESCALERA: 'stairs', OFICINA: 'desk', PUERTA: 'door', MAQUINA: 'fan', MALACATE: 'hoist', OBSTACULO: 'alert',
}

/** Celdas de cada estantería de un tramo según su dirección y largo. */
export function sectionRackRects(s) {
  const dx = s.orientation === 'V' ? 0 : s.reversed ? -1 : 1
  const dy = s.orientation === 'V' ? (s.reversed ? -1 : 1) : 0
  let offset = 0
  return s.racks.map((r) => {
    const len = r.length || 1
    const x0 = s.x + dx * offset
    const y0 = s.y + dy * offset
    const x1 = s.x + dx * (offset + len - 1)
    const y1 = s.y + dy * (offset + len - 1)
    offset += len
    return { r, x: Math.min(x0, x1), y: Math.min(y0, y1), w: dx ? len : 1, h: dy ? len : 1 }
  })
}

/** Texto corto del letrero: "Pasillo 4" → 4; si no, el código. */
function signText(s) {
  const m = /^P(\d+)$/i.exec(s.code)
  return m ? m[1] : s.code
}

export default function MapCanvas({
  layout, highlights = [], picked, selectedRackId, selectedSectionId, selectedLandmarkId,
  onRackClick, onSectionClick, onLandmarkClick, onCellClick, onlyModuleId, editing = false, pendingCell,
}) {
  const { area, landmarks, sections } = layout
  const W = area.gridWidth * CELL
  const H = area.gridHeight * CELL
  const hitRacks = new Set(highlights.map((h) => h.rackId))

  return (
    <svg className="map-svg" viewBox={`-10 -10 ${W + 20} ${H + 20}`} role="img" aria-label={`Mapa de ${area.name}`}
         style={{ maxWidth: (area.gridWidth + 1) * 62, margin: '0 auto' }}>
      <rect className="floor" x="-6" y="-6" width={W + 12} height={H + 12} rx="14" />

      {editing && Array.from({ length: area.gridWidth * area.gridHeight }, (_, i) => {
        const x = i % area.gridWidth
        const y = Math.floor(i / area.gridWidth)
        const isPending = pendingCell && pendingCell.x === x && pendingCell.y === y
        return (
          <rect key={`c${i}`} className={isPending ? 'cell-picked' : 'cell-target'} x={x * CELL + 1} y={y * CELL + 1}
                width={CELL - 2} height={CELL - 2} rx="6" onClick={() => onCellClick?.(x, y)} />
        )
      })}

      {landmarks.map((l) => (
        <Landmark key={`l${l.id}`} l={l} selected={selectedLandmarkId === l.id} onClick={onLandmarkClick} />
      ))}

      {sections.map((s) => {
        const dim = onlyModuleId && s.moduleId && s.moduleId !== onlyModuleId
        const rects = sectionRackRects(s)
        const long = rects.some((x) => x.w > 1 || x.h > 1)
        return (
          <g key={`s${s.id}`} className={`mod-${s.color || 'gray'} ${dim ? 'dimmed' : ''}`}>
            {rects.map(({ r, x, y, w, h }) => {
              const busy = r.levelStats.some((l) => l.lots > 0)
              const unverified = r.levelStats.some((l) => l.unverified > 0)
              const isPicked = picked && picked.rackId === r.id
              const selected = selectedRackId === r.id || isPicked || selectedSectionId === s.id
              const px = x * CELL
              const py = y * CELL
              const pw = w * CELL
              const ph = h * CELL
              return (
                <g key={r.id} className={`rack ${busy ? 'busy' : ''} ${selected ? 'selected' : ''} ${hitRacks.has(r.id) ? 'hit' : ''}`}
                   onClick={() => onRackClick?.(r, s)}>
                  <title>{`${s.name} · ${long ? '' : 'estantería '}${r.code} · ${r.levels} ${r.levels === 1 ? area.levelLabel.toLowerCase() : `${area.levelLabel.toLowerCase()}s`}${busy ? ' · con mercancía' : ' · vacía'}`}</title>
                  <rect className="tile" x={px + 3} y={py + 3} width={pw - 6} height={ph - 6} rx="9" />
                  {s.doubleSided && (w >= h
                    ? <rect className="double" x={px + 10} y={py + ph - 9} width={pw - 20} height="2" rx="1" />
                    : <rect className="double" x={px + pw - 9} y={py + 10} width="2" height={ph - 20} rx="1" />)}
                  <text className="letter" x={px + pw / 2} y={py + ph / 2 + 5.5} textAnchor="middle"
                        transform={h > w ? `rotate(-90 ${px + pw / 2} ${py + ph / 2})` : undefined}>
                    {long ? `${s.code} · ${r.code}` : r.code}
                  </text>
                  {unverified && <circle className="unverified" cx={px + 10} cy={py + 10} r="3.5" />}
                  {hitRacks.has(r.id) && <Pin x={px + pw - 8} y={py + 8} />}
                  {isPicked && <circle cx={px + pw - 8} cy={py + 8} r="6" className="picked-dot" />}
                </g>
              )
            })}
            {!long && s.kind !== 'MURO' && rects.length > 0 && (
              <Sign s={s} first={rects[0]} selected={selectedSectionId === s.id} onClick={onSectionClick} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Letrero redondo del pasillo, antes de la primera estantería (del lado contrario a la dirección). */
function Sign({ s, first, selected, onClick }) {
  const text = signText(s)
  const r = text.length > 2 ? 15 : 13
  let cx = first.x * CELL + CELL / 2
  let cy = first.y * CELL + CELL / 2
  const gap = CELL * 0.5 + r - 1
  if (s.orientation === 'V') cy += s.reversed ? gap : -gap
  else cx += s.reversed ? gap : -gap
  return (
    <g className={`sign ${selected ? 'selected' : ''}`} onClick={() => onClick?.(s)}>
      <title>{s.name}{s.notes ? ` — ${s.notes}` : ''}</title>
      <rect className="plate" x={cx - r} y={cy - r} width={r * 2} height={r * 2} />
      <text x={cx} y={cy + (text.length > 2 ? 4 : 5)} textAnchor="middle" style={{ fontSize: text.length > 2 ? 11 : 14 }}>{text}</text>
    </g>
  )
}

function Landmark({ l, selected, onClick }) {
  const x = l.x * CELL
  const y = l.y * CELL
  const w = l.width * CELL
  const h = l.height * CELL
  const cls = `lm lm-${l.kind} ${selected ? 'selected' : ''} ${onClick ? 'clickable' : ''}`
  if (l.kind === 'TEXTO') {
    return <g className={cls} onClick={() => onClick?.(l)}><text x={x + 6} y={y + h / 2 + 5}>{l.label}</text></g>
  }
  if (l.kind === 'PARED') {
    return <g className={cls} onClick={() => onClick?.(l)}><title>{l.label}</title><rect x={x} y={y} width={w} height={h} rx="3" /></g>
  }
  if (l.kind === 'PASILLO') {
    const vertical = h > w
    return (
      <g className={cls} onClick={() => onClick?.(l)}>
        <rect x={x + 6} y={y + 4} width={w - 12} height={h - 8} rx="10" />
        {(vertical ? h : w) >= CELL * 3 && (
          <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle"
                transform={vertical ? `rotate(-90 ${x + w / 2} ${y + h / 2})` : undefined}>{l.label}</text>
        )}
      </g>
    )
  }
  const icon = LANDMARK_ICONS[l.kind]
  // Una fila de alto: ícono a la izquierda y texto al lado. Más alto: ícono arriba y texto debajo.
  const wide = h <= CELL && w > CELL
  const tall = h > CELL
  const lines = wide ? wrap(l.label, (w - 34) / 6.2, 2) : tall ? wrap(l.label, (w - 10) / 6.2, 3) : []
  return (
    <g className={cls} onClick={() => onClick?.(l)}>
      <title>{l.label}</title>
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx="9" />
      {icon && (
        <g transform={wide ? `translate(${x + 9} ${y + h / 2 - 9})` : `translate(${x + w / 2 - 10} ${y + (tall ? h / 2 - 12 - lines.length * 6 : h / 2 - 10)})`}>
          <Icon name={icon} size={wide ? 18 : 20} />
        </g>
      )}
      {lines.map((line, i) => (
        <text key={i} x={wide ? x + 31 : x + w / 2} textAnchor={wide ? 'start' : 'middle'}
              y={wide ? y + h / 2 + 4 - (lines.length - 1) * 6 + i * 12 : y + h / 2 + 14 - (lines.length - 1) * 6 + i * 12}>
          {line}
        </text>
      ))}
    </g>
  )
}

/** Parte un texto en líneas cortas para que quepa en su cuadro. */
function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(3, Math.floor(maxChars) - 1))}…`
    return kept
  }
  return lines
}

function Pin({ x, y }) {
  return (
    <g className="pin">
      <circle className="pulse" cx={x} cy={y} r="10" />
      <circle cx={x} cy={y} r="6.5" className="pin-dot" />
    </g>
  )
}
