import { useEffect, useState } from 'react'
import { itemsApi } from '../api/services'
import { useAppData } from '../app/AppDataContext'
import Icon from '../shared/Icon'
import { fmtNum } from '../shared/format'
import { useDebounced } from '../shared/ui'

/**
 * Buscar un artículo con existencias en los módulos que el usuario modifica.
 * Devuelve la ficha completa del artículo (con sus rótulos y ubicaciones).
 */
export default function ItemStockPicker({ onPick, autoFocus = true }) {
  const { editableModules } = useAppData()
  const [module, setModule] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const query = useDebounced(q, 250)

  useEffect(() => {
    if (!query && !module) { setResults([]); return }
    itemsApi.search({ module: module || undefined, q: query || undefined, size: 15 })
      .then((p) => setResults(p.content.filter((r) => Number(r.total) > 0 && editableModules.some((m) => m.code === r.moduleCode))))
      .catch(() => setResults([]))
  }, [query, module, editableModules])

  return (
    <div className="stack-sm">
      <div className="row">
        <div className="topbar-search grow">
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} placeholder="Busque el producto, código o presentación…"
                 style={{ background: 'var(--white)', borderColor: 'var(--line-strong)' }} />
        </div>
        <select value={module} onChange={(e) => setModule(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Todos mis módulos</option>
          {editableModules.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
        </select>
      </div>
      {results.length > 0 && (
        <div className="pick-list">
          {results.map((r) => (
            <button key={r.id} type="button" className={`pick-item mod-${r.moduleColor}`} onClick={() => itemsApi.get(r.id).then((d) => { onPick(d); setQ('') })}>
              <span className="mod-icon" style={{ width: 32, height: 32 }}><Icon name={editableModules.find((m) => m.code === r.moduleCode)?.icon || 'box'} size={17} /></span>
              <div className="grow">
                <div className="strong">{r.name}{r.presentation ? ` ${r.presentation}` : ''}</div>
                <div className="tiny muted">{r.moduleName} · hay {fmtNum(r.total)} {r.unitName} en {r.locations} {r.locations === 1 ? 'lugar' : 'lugares'}</div>
              </div>
              <Icon name="chevronRight" />
            </button>
          ))}
        </div>
      )}
      {(q || module) && results.length === 0 && <div className="small muted">No hay productos con existencias con esa búsqueda.</div>}
    </div>
  )
}

/** Existencias del artículo ordenadas para sacar primero lo que vence antes (FEFO) o lo más antiguo (FIFO). */
export function stockRowsFefo(item) {
  const rows = item.lots.flatMap((lot) => lot.stock.map((s) => ({ lot, s })))
  rows.sort((a, b) => {
    const ea = a.lot.expiryDate || '9999-12-31'
    const eb = b.lot.expiryDate || '9999-12-31'
    if (ea !== eb) return ea < eb ? -1 : 1
    return a.lot.labelDate < b.lot.labelDate ? -1 : a.lot.labelDate > b.lot.labelDate ? 1 : a.s.id - b.s.id
  })
  return rows
}
