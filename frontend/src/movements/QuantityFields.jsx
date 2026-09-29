import { useEffect, useState } from 'react'
import { fmtNum, parseNum } from '../shared/format'

/**
 * Cantidad como se cuenta en la bodega: primero cuántas canastas (o rollos,
 * cajas, bultos…) y cuántas unidades trae cada una; el total se calcula solo
 * y se guardan las unidades exactas. Si no viene en contenedores, se escribe
 * el total directo. Nada es fijo: el contenedor se escoge o se escribe.
 *
 * value = { mode, containers, containerName, unitsPerContainer, total, weightKg }
 */
export function emptyQuantity(item, module) {
  const container = item?.lastContainerName || module?.defaultContainer || ''
  return {
    mode: container ? 'containers' : 'total',
    containers: '',
    containerName: container,
    unitsPerContainer: item?.lastUnitsPerContainer ? String(Number(item.lastUnitsPerContainer)) : '',
    total: '',
    weightKg: '',
  }
}

/** Total calculado a partir de lo escrito (o null si falta algo). */
export function quantityTotal(q) {
  if (q.mode === 'total') return parseNum(q.total)
  const c = parseNum(q.containers)
  const u = parseNum(q.unitsPerContainer)
  return c && u ? Math.round(c * u * 1000) / 1000 : null
}

/** Cuerpo QuantityInput para el backend. */
export function quantityToRequest(q) {
  const weight = parseNum(q.weightKg)
  if (q.mode === 'total') return { total: parseNum(q.total), weightKg: weight }
  return {
    containers: parseNum(q.containers),
    containerName: q.containerName?.trim() || null,
    unitsPerContainer: parseNum(q.unitsPerContainer),
    weightKg: weight,
  }
}

/** "canasta" → "canastas", "granel" → "graneles". */
export function plural(name) {
  const n = (name || '').trim().toLowerCase()
  if (!n) return 'contenedores'
  if (/[aeiouáéó]$/.test(n)) return `${n}s`
  if (n.endsWith('z')) return `${n.slice(0, -1)}ces`
  return `${n}es`
}

/** "¿Cuántas canastas?" / "¿Cuántos rollos?" */
function howMany(name) {
  const n = (name || '').trim().toLowerCase()
  return `${n.endsWith('a') ? '¿Cuántas' : '¿Cuántos'} ${plural(n)}?`
}

/** Texto para el rótulo: "3 canastas x 230". */
export function quantityText(q) {
  if (q.mode === 'total') return q.total ? String(q.total) : ''
  const c = parseNum(q.containers)
  return `${q.containers} ${c === 1 ? (q.containerName || 'contenedor') : plural(q.containerName)} x ${q.unitsPerContainer}`
}

const COMMON = ['canasta', 'caja', 'rollo', 'bulto', 'bolsa', 'paquete']

export default function QuantityFields({ value, onChange, unitName, containerSuggestions = [], packagings = [], showWeight, max }) {
  const [weightOpen, setWeightOpen] = useState(Boolean(showWeight))
  useEffect(() => { if (showWeight) setWeightOpen(true) }, [showWeight])
  const set = (field) => (v) => onChange({ ...value, [field]: v?.target ? v.target.value : v })
  const total = quantityTotal(value)
  const over = max !== undefined && total !== null && total > Number(max)
  const containerChips = [...new Set([...containerSuggestions, ...COMMON].map((s) => s.toLowerCase()))].slice(0, 8)
  const name = value.containerName || 'contenedor'
  const unit = unitName || 'unidades'

  return (
    <div className="stack">
      <div className="segmented" role="tablist" aria-label="Cómo va a contar">
        <button type="button" className={value.mode === 'containers' ? 'active' : ''} onClick={() => onChange({ ...value, mode: 'containers' })}>
          Por {plural(value.containerName)}
        </button>
        <button type="button" className={value.mode === 'total' ? 'active' : ''} onClick={() => onChange({ ...value, mode: 'total' })}>
          Solo sé el total
        </button>
      </div>

      {value.mode === 'containers' ? (
        <>
          <div>
            <div className="label">¿En qué viene?</div>
            <div className="row" style={{ gap: 6 }}>
              <div className="chips">
                {containerChips.map((c) => (
                  <button type="button" key={c} className={`chip ${value.containerName?.toLowerCase() === c ? 'active' : ''}`} onClick={() => set('containerName')(c)}>{c}</button>
                ))}
              </div>
              <input value={value.containerName} onChange={set('containerName')} maxLength={40} placeholder="u otro…" style={{ width: 150 }} aria-label="Otro contenedor" />
            </div>
          </div>

          <div className="row" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ marginBottom: 0, width: 180 }}>
              <label htmlFor="q-containers">{howMany(name)}</label>
              <input id="q-containers" inputMode="decimal" className="input-big" value={value.containers} onChange={set('containers')} placeholder="3" autoFocus />
            </div>
            <span className="big-number muted" style={{ paddingBottom: 10 }}>×</span>
            <div className="field" style={{ marginBottom: 0, width: 240 }}>
              <label htmlFor="q-units">¿Cuántas {unit} trae cada {name}?</label>
              <input id="q-units" inputMode="decimal" className="input-big" value={value.unitsPerContainer} onChange={set('unitsPerContainer')} placeholder="230" />
            </div>
          </div>
          {packagings.length > 0 && (
            <div>
              <div className="label">Igual que antes</div>
              <div className="chips">
                {packagings.map((p) => (
                  <button type="button" key={`${p.containerName}-${p.unitsPerContainer}`} className="chip"
                          onClick={() => onChange({ ...value, containerName: p.containerName, unitsPerContainer: String(Number(p.unitsPerContainer)) })}>
                    {p.containerName} de {fmtNum(p.unitsPerContainer)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="q-total">Cantidad total ({unit})</label>
          <input id="q-total" inputMode="decimal" className="input-big" value={value.total} onChange={set('total')} placeholder="0" autoFocus />
        </div>
      )}

      {weightOpen ? (
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="q-weight">Peso total (kg){showWeight ? '' : ' · opcional'}</label>
          <input id="q-weight" inputMode="decimal" value={value.weightKg} onChange={set('weightKg')} placeholder="250" />
        </div>
      ) : (
        <button type="button" className="btn-link small" style={{ alignSelf: 'flex-start' }} onClick={() => setWeightOpen(true)}>
          + Agregar el peso en kg
        </button>
      )}

      <div className="total-box" aria-live="polite">
        <span className="muted">Se guardan:</span>
        <span className="big-number">{total === null ? '—' : fmtNum(total)}</span>
        <span className="strong">{unit}</span>
        {value.mode === 'containers' && total !== null && (
          <span className="small muted">({fmtNum(parseNum(value.containers))} {parseNum(value.containers) === 1 ? name : plural(name)} × {fmtNum(parseNum(value.unitsPerContainer))} {unit})</span>
        )}
        {over && <span className="badge badge-danger">Solo hay {fmtNum(max)}</span>}
      </div>
    </div>
  )
}
