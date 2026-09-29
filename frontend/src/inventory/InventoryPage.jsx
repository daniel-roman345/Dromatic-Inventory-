import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import ItemFormModal from './ItemFormModal'
import Icon from '../shared/Icon'
import { fmtNum } from '../shared/format'
import { Empty, Loading, Notice, useDebounced } from '../shared/ui'

/** Inventario de un módulo: buscar, filtrar y entrar a la ficha de cada artículo. */
export default function InventoryPage() {
  const { moduleCode } = useParams()
  const navigate = useNavigate()
  const { moduleByCode, modulesLoaded } = useAppData()
  const module = moduleByCode(moduleCode)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('todos')
  const [state, setState] = useState({ loading: true, rows: [], total: 0, page: 0 })
  const [creating, setCreating] = useState(false)
  const query = useDebounced(q, 300)

  function load(page = 0) {
    setState((s) => ({ ...s, loading: true, error: null }))
    itemsApi.search({
      module: moduleCode, q: query || undefined, page, size: 50,
      lowStock: filter === 'bajo', unverified: filter === 'verificar', status: filter === 'inactivos' ? 'INACTIVO' : 'ACTIVO',
    })
      .then((p) => setState((s) => ({ loading: false, rows: page === 0 ? p.content : [...s.rows, ...p.content], total: p.totalElements, page })))
      .catch((error) => setState((s) => ({ ...s, loading: false, error })))
  }

  useEffect(() => { load(0) }, [moduleCode, query, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!modulesLoaded) return <Loading />
  if (!module) return <Notice type="error">El módulo {moduleCode} no existe.</Notice>

  return (
    <div className={`mod-${module.color}`}>
      <div className="page-header">
        <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
          <div className="mod-icon" style={{ width: 52, height: 52 }}><Icon name={module.icon} size={28} /></div>
          <div>
            <h1>{module.name}</h1>
            <p>{module.description}</p>
          </div>
        </div>
        {module.canEdit ? (
          <div className="row">
            <button className="btn" onClick={() => setCreating(true)}><Icon name="plus" /> Nuevo artículo</button>
            <Link to={`/entrada?modulo=${module.code}`} className="btn btn-primary"><Icon name="entry" /> Registrar entrada</Link>
          </div>
        ) : <span className="badge badge-gray"><Icon name="eye" /> Solo consulta</span>}
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="topbar-search grow" style={{ maxWidth: 420 }}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar en ${module.name.toLowerCase()}…`} style={{ background: 'var(--white)', borderColor: 'var(--line-strong)' }} />
        </div>
        <div className="segmented">
          {[['todos', 'Todos'], ['bajo', 'Stock bajo'], ['verificar', 'Por verificar'], ['inactivos', 'Inactivos']].map(([k, t]) => (
            <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{t}</button>
          ))}
        </div>
        <span className="small muted">{state.total} {state.total === 1 ? 'artículo' : 'artículos'}</span>
      </div>

      {state.error && <Notice type="error">{errorMessage(state.error)}</Notice>}
      {state.loading && state.rows.length === 0 ? <Loading /> : state.rows.length === 0 ? (
        <div className="card">
          <Empty icon={module.icon} title={q || filter !== 'todos' ? 'No hay artículos con ese filtro' : 'Todavía no hay artículos'}>
            {module.canEdit && !q && filter === 'todos' && (
              <Link to={`/entrada?modulo=${module.code}`} className="btn btn-primary" style={{ marginTop: 12 }}><Icon name="entry" /> Registrar la primera entrada</Link>
            )}
          </Empty>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Artículo</th><th className="right">Cantidad</th><th className="right">Mínimo</th><th className="right">Rótulos</th><th>Ubicaciones</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {state.rows.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => navigate(`/articulos/${r.id}`)}>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
                      {(r.hasFrontImage || r.hasBackImage) && <Icon name="image" size={16} className="muted" />}
                      <div>
                        <div className="strong">{r.name}{r.presentation ? ` ${r.presentation}` : ''}</div>
                        {r.code && <div className="tiny muted">{r.code}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="right nowrap"><span className={`strong ${r.lowStock ? 'text-danger' : ''}`} style={{ fontSize: '1.05rem' }}>{fmtNum(r.total)}</span> <span className="small muted">{r.unitName}</span></td>
                  <td className="right muted">{Number(r.minimumStock) > 0 ? fmtNum(r.minimumStock) : '—'}</td>
                  <td className="right">{r.lots}</td>
                  <td className="small">{r.locations} {r.locations === 1 ? 'lugar' : 'lugares'}</td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      {Number(r.total) === 0 ? <span className="badge badge-gray">Agotado</span> : r.lowStock ? <span className="badge badge-danger">Stock bajo</span> : <span className="badge badge-ok">Disponible</span>}
                      {r.unverified > 0 && <span className="badge badge-warn">{r.unverified} por verificar</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state.rows.length < state.total && (
        <div className="center" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => load(state.page + 1)} disabled={state.loading}>{state.loading ? 'Cargando…' : 'Ver más'}</button>
        </div>
      )}

      {creating && (
        <ItemFormModal module={module} onClose={() => setCreating(false)} onSaved={(item) => navigate(`/articulos/${item.id}`)} />
      )}
    </div>
  )
}
