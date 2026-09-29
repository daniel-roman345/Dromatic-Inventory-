import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { lotsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import Icon from '../shared/Icon'
import { fmtDate, fmtNum } from '../shared/format'
import { Loading, Notice, QualityBadge } from '../shared/ui'

/**
 * Panel de una estantería: sus pisos (o filas) como se ven de frente y lo que
 * hay en el escogido. En la bodega arriba va el piso más alto; en el cuarto de
 * etiquetas la fila 1 es la de arriba (area.levelsFromTop).
 *
 * mode="view": muestra el contenido y acciones (sacar, trasladar, contar).
 * mode="pick": sirve para escoger dónde se va a guardar algo.
 */
export default function RackPanel({ rack, section, area, mode = 'view', activeLevel, onLevel, highlights = [], onAction, refreshKey }) {
  const hitLevels = new Set(highlights.filter((h) => h.rackId === rack.id).map((h) => h.level))
  const levels = area?.levelsFromTop ? rack.levelStats : [...rack.levelStats].reverse()
  const unit = (area?.levelLabel || 'Piso').toLowerCase()
  const isRow = unit === 'fila'
  const title = rack.length > 1 ? `${section.name}` : `Estantería ${rack.code}`
  const levelName = (l) => (isRow ? `F${l.level}` : l.label)

  return (
    <div className={`stack mod-${section.color || 'gray'}`}>
      <div>
        <div className="breadcrumb">{rack.length > 1 ? area?.name : section.name}</div>
        <h2>{title}</h2>
        <div className="small muted">
          {rack.levels} {rack.levels === 1 ? unit : `${unit}s`}
          {' · '}
          {mode === 'pick' ? `escoja ${isRow ? 'la fila' : 'el piso'}` : `toque ${isRow ? 'una fila' : 'un piso'} para ver qué hay`}
        </div>
        {(section.notes || rack.notes) && <div className="tiny muted" style={{ marginTop: 4 }}>{rack.notes || section.notes}</div>}
      </div>
      <div className="shelf" role="list">
        {levels.map((l) => (
          <button type="button" key={l.level} role="listitem"
                  className={`shelf-level ${activeLevel === l.level ? 'active' : ''} ${hitLevels.has(l.level) ? 'hit' : ''}`}
                  onClick={() => onLevel(l.level)}>
            <span className="lv">{levelName(l)}</span>
            <span className="info">
              {l.lots > 0 ? `${l.lots} ${l.lots === 1 ? 'rótulo' : 'rótulos'} · ${l.items} ${l.items === 1 ? 'producto' : 'productos'}` : 'Vacío'}
              {l.unverified > 0 && <span className="badge badge-warn" style={{ marginLeft: 6 }}>{l.unverified} por verificar</span>}
            </span>
            {hitLevels.has(l.level) && <Icon name="pin" size={18} className="text-danger" />}
            {mode === 'pick' && activeLevel === l.level && <Icon name="check" size={20} />}
          </button>
        ))}
      </div>
      {mode === 'view' && activeLevel && (
        <LevelContent rackId={rack.id} level={activeLevel} onAction={onAction} refreshKey={refreshKey} isRow={isRow} />
      )}
    </div>
  )
}

function LevelContent({ rackId, level, onAction, refreshKey, isRow }) {
  const { moduleByCode } = useAppData()
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let alive = true
    setState({ loading: true })
    lotsApi.contentAt(rackId, level)
      .then((data) => alive && setState({ data }))
      .catch((error) => alive && setState({ error }))
    return () => { alive = false }
  }, [rackId, level, refreshKey])

  if (state.loading) return <Loading text={`Buscando qué hay en ${isRow ? 'la fila' : 'el piso'}…`} />
  if (state.error) return <Notice type="error">{errorMessage(state.error)}</Notice>
  const { data } = state
  return (
    <div className="stack-sm">
      <div className="row-between">
        <h3>{isRow ? `Fila ${level}` : data.levelLabel} · {data.entries.length ? 'Contenido' : 'Vacío'}</h3>
        <span className="tiny muted mono">{data.locationCode}</span>
      </div>
      {data.entries.length === 0 && (
        <div className="small muted">{`No hay nada registrado en ${isRow ? 'esta fila' : 'este piso'}.`}</div>
      )}
      {data.entries.map((e) => {
        const canEdit = moduleByCode(e.moduleCode)?.canEdit
        return (
          <div key={e.stockId} className={`card card-tight mod-${e.moduleColor}`} style={{ borderLeft: '4px solid var(--mod)', borderRadius: 0 }}>
            <Link to={`/articulos/${e.itemId}`} className="strong">{e.itemName}{e.presentation ? ` ${e.presentation}` : ''}</Link>
            <div className="small muted">
              {e.lotNumber ? `Lote ${e.lotNumber} · ` : ''}Rótulo del {fmtDate(e.labelDate)}
            </div>
            <div className="row" style={{ marginTop: 6, gap: 6 }}>
              <span className="strong">{fmtNum(e.quantity)} {e.unitName}</span>
              {e.approxContainers && <span className="small muted">≈ {fmtNum(e.approxContainers)} {e.containerName || ''}</span>}
              {e.weightKg && <span className="small muted">· {fmtNum(e.weightKg)} kg</span>}
              <QualityBadge status={e.qualityStatus} />
              {!e.verified && <span className="badge badge-warn">Por verificar</span>}
            </div>
            {canEdit && onAction && (
              <div className="row" style={{ marginTop: 8, gap: 6 }}>
                <button className="btn btn-sm" onClick={() => onAction('exit', e)}><Icon name="exit" /> Sacar</button>
                <button className="btn btn-sm" onClick={() => onAction('transfer', e)}><Icon name="swap" /> Trasladar</button>
                <button className="btn btn-sm" onClick={() => onAction('adjust', e)}><Icon name="adjust" /> Contar</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
