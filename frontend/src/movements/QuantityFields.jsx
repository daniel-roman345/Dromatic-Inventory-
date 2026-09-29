import { useEffect, useState } from 'react'
import { fmtNum, parseNum } from '../shared/format'
import { SuggestInput } from '../shared/ui'

/**
 * Cantidad escrita libremente: "por contenedores" (15 cajas × 350) o
 * "número total". Nada está fijo: el contenedor, las unidades por contenedor
 * y la unidad se escriben; las sugerencias solo ayudan.
 *
 * value = { mode, containers, containerName, unitsPerContainer, total, weightKg }
 */
export function emptyQuantity(item) {
  const hasLast = item?.lastContainerName && item?.lastUnitsPerContainer
  return {
    mode: hasLast ? 'containers' : 'total',
    containers: '',
    containerName: item?.lastContainerName || '',
    unitsPerContainer: item?.lastUnitsPerContainer ? String(item.lastUnitsPerContainer) : '',
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
  if (q.mode === 'total') {
    return { total: parseNum(q.total), weightKg: weight }
  }
  return {
    containers: parseNum(q.containers),
    containerName: q.containerName?.trim() || null,
    unitsPerContainer: parseNum(q.unitsPerContainer),
    weightKg: weight,
  }
}

export default function QuantityFields({ value, onChange, unitName, containerSuggestions = [], packagings = [], showWeight, max }) {
  const [weightOpen, setWeightOpen] = useState(Boolean(showWeight))
  useEffect(() => { if (showWeight) setWeightOpen(true) }, [showWeight])
  const set = (field) => (v) => onChange({ ...value, [field]: v?.target ? v.target.value : v })
  const total = quantityTotal(value)
  const over = max !== undefined && total !== null && total > Number(max)

  return (
    <div className="stack">
      <div className="segmented" role="tablist" aria-label="Cómo va a contar">
        <button type="button" className={value.mode === 'containers' ? 'active' : ''} onClick={() => onChange({ ...value, mode: 'containers' })}>
          Por contenedores
        </button>
        <button type="button" className={value.mode === 'total' ? 'active' : ''} onClick={() => onChange({ ...value, mode: 'total' })}>
          Número total
        </button>
      </div>

      {value.mode === 'containers' ? (
        <>
          {packagings.length > 0 && (
            <div>
              <div className="label">Igual que antes</div>
              <div className="chips">
                {packagings.map((p) => (
                  <button type="button" key={`${p.containerName}-${p.unitsPerContainer}`} className="chip"
                          onClick={() => onChange({ ...value, containerName: p.containerName, unitsPerContainer: String(p.unitsPerContainer) })}>
                    {p.containerName} de {fmtNum(p.unitsPerContainer)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div className="field">
              <label htmlFor="q-containers">¿Cuántos?</label>
              <input id="q-containers" inputMode="decimal" className="input-big" value={value.containers} onChange={set('containers')} placeholder="15" autoFocus />
            </div>
            <div className="field">
              <label htmlFor="q-container">¿De qué?</label>
              <SuggestInput id="q-container" value={value.containerName} onChange={set('containerName')}
                            suggestions={containerSuggestions} chips={5} placeholder="canasta, caja, rollo…" maxLength={40} />
            </div>
            <div className="field">
              <label htmlFor="q-units">¿Cuántas {unitName || 'unidades'} trae cada uno?</label>
              <input id="q-units" inputMode="decimal" className="input-big" value={value.unitsPerContainer} onChange={set('unitsPerContainer')} placeholder="350" />
            </div>
          </div>
        </>
      ) : (
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="q-total">Cantidad total ({unitName || 'unidades'})</label>
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
        <span className="muted">Total:</span>
        <span className="big-number">{total === null ? '—' : fmtNum(total)}</span>
        <span className="strong">{unitName}</span>
        {value.mode === 'containers' && total !== null && (
          <span className="small muted">({fmtNum(parseNum(value.containers))} {value.containerName || 'contenedores'} × {fmtNum(parseNum(value.unitsPerContainer))})</span>
        )}
        {over && <span className="badge badge-danger">Solo hay {fmtNum(max)}</span>}
      </div>
    </div>
  )
}
