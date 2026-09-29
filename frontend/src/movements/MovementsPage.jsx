import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { movementsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useAppData } from '../app/AppDataContext'
import MovementTable from './MovementTable'
import Icon from '../shared/Icon'
import { fmtNum } from '../shared/format'
import { Empty, Field, Loading, Modal, Notice, useDebounced, useToast } from '../shared/ui'

/** Historial de todo lo que ha entrado, salido, se ha movido o corregido. */
export default function MovementsPage() {
  const [params] = useSearchParams()
  const { isAdmin } = useAuth()
  const { modules, afterChange } = useAppData()
  const toast = useToast()
  const [filters, setFilters] = useState({ module: '', effect: '', from: '', to: '', q: '', includeVoided: true })
  const [state, setState] = useState({ loading: true, rows: [], total: 0, page: 0 })
  const [voiding, setVoiding] = useState(null)
  const q = useDebounced(filters.q, 300)
  const itemId = params.get('articulo')

  function load(page = 0) {
    setState((s) => ({ ...s, loading: true, error: null }))
    movementsApi.search({
      module: filters.module || undefined, effect: filters.effect || undefined, from: filters.from || undefined, to: filters.to || undefined,
      q: q || undefined, includeVoided: filters.includeVoided, itemId: itemId || undefined, page, size: 40,
    })
      .then((p) => setState((s) => ({ loading: false, rows: page === 0 ? p.content : [...s.rows, ...p.content], total: p.totalElements, page })))
      .catch((error) => setState((s) => ({ ...s, loading: false, error })))
  }
  useEffect(() => { load(0) }, [filters.module, filters.effect, filters.from, filters.to, q, filters.includeVoided, itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (f) => (e) => setFilters({ ...filters, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Movimientos</h1>
          <p>{itemId ? 'Historial de un artículo.' : 'Todo lo que ha entrado, salido, se ha trasladado o corregido.'} {state.total} en total.</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <Field label="Buscar"><input value={filters.q} onChange={set('q')} placeholder="Producto, lote, tipo, persona…" /></Field>
          <Field label="Módulo">
            <select value={filters.module} onChange={set('module')}>
              <option value="">Todos</option>
              {modules.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Qué pasó">
            <select value={filters.effect} onChange={set('effect')}>
              <option value="">Todo</option><option value="ENTRADA">Entradas</option><option value="SALIDA">Salidas</option>
              <option value="TRASLADO">Traslados</option><option value="AJUSTE">Conteos y ajustes</option>
            </select>
          </Field>
          <Field label="Desde"><input type="date" value={filters.from} onChange={set('from')} /></Field>
          <Field label="Hasta"><input type="date" value={filters.to} onChange={set('to')} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={filters.includeVoided} onChange={set('includeVoided')} /> Mostrar anulados</label>
      </div>
      {state.error && <Notice type="error">{errorMessage(state.error)}</Notice>}
      {state.loading && state.rows.length === 0 ? <Loading /> : state.rows.length === 0 ? <div className="card"><Empty icon="history" title="No hay movimientos con esos filtros" /></div>
        : <MovementTable rows={state.rows} onVoid={isAdmin ? setVoiding : undefined} />}
      {state.rows.length < state.total && (
        <div className="center" style={{ marginTop: 12 }}><button className="btn" onClick={() => load(state.page + 1)} disabled={state.loading}>Ver más</button></div>
      )}
      {voiding && (
        <VoidModal movement={voiding} onClose={() => setVoiding(null)}
                   onDone={() => { setVoiding(null); afterChange(); toast('Movimiento anulado'); load(0) }} />
      )}
    </div>
  )
}

function VoidModal({ movement, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run() {
    if (!reason.trim()) return setError('Escriba por qué se anula.')
    setBusy(true)
    try {
      await movementsApi.voidMovement(movement.id, reason.trim())
      onDone()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return (
    <Modal title="Anular movimiento" onClose={onClose} busy={busy}
           footer={<><button className="btn" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn btn-danger" onClick={run} disabled={busy}><Icon name="close" /> Anular</button></>}>
      <div className="stack">
        <p>Se deshace <b>{movement.movementType}</b> de {fmtNum(movement.quantity)} {movement.unitName} de <b>{movement.itemName}</b>. El registro no se borra: queda marcado como anulado.</p>
        <Field label="¿Por qué se anula?" required><textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} autoFocus /></Field>
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}
