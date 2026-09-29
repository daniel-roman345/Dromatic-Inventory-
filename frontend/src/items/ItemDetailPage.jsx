import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemsApi, lotsApi, mapsApi, movementsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import ItemImages from './ItemImages'
import ItemFormModal from '../inventory/ItemFormModal'
import LabelView from '../lots/LabelView'
import LabelEditModal from '../lots/LabelEditModal'
import MapCanvas from '../maps/MapCanvas'
import MovementTable from '../movements/MovementTable'
import { AdjustModal, ExitModal, TransferModal, toStock } from '../movements/StockActionModals'
import WhatsAppModal from '../alerts/WhatsAppModal'
import Icon from '../shared/Icon'
import { fmtDate, fmtNum } from '../shared/format'
import { Empty, Loading, ModuleBadge, Notice, useToast } from '../shared/ui'

/** Ficha del artículo: cuánto hay, dónde está (en el mapa), sus rótulos, fotos e historial. */
export default function ItemDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const { moduleByCode, afterChange } = useAppData()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(null)
  const [modal, setModal] = useState(null)
  const [showEmptyLots, setShowEmptyLots] = useState(false)

  const load = useCallback(() => {
    itemsApi.get(id).then(setItem).catch(setError)
    movementsApi.search({ itemId: id, size: 20 }).then((p) => setHistory(p.content)).catch(() => setHistory([]))
  }, [id])
  useEffect(() => { setItem(null); load() }, [load])

  if (error) return <Notice type="error">{errorMessage(error)}</Notice>
  if (!item) return <Loading />

  const module = moduleByCode(item.module.code) || item.module
  const canEdit = item.module.canEdit
  const lotsWithStock = item.lots.filter((l) => Number(l.total) > 0)
  const emptyLots = item.lots.filter((l) => Number(l.total) === 0)
  const displayName = `${item.name}${item.presentation ? ` ${item.presentation}` : ''}`
  const min = Number(item.minimumStock)

  function done() {
    setModal(null)
    afterChange()
    load()
  }

  function stockAction(kind, lot, s) {
    setModal({ kind, stock: toStock(s, { itemName: displayName, unitName: item.unitName, moduleId: item.module.id, qualityStatus: lot.qualityStatus, lotNumber: lot.lotNumber }) })
  }

  async function toggleStatus() {
    try {
      setItem(await itemsApi.setStatus(item.id, item.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'))
      toast(item.status === 'ACTIVO' ? 'Artículo inactivado' : 'Artículo activado')
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div className={`stack mod-${item.module.color}`}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="breadcrumb"><Link to={`/inventario/${item.module.code}`}>{item.module.name}</Link> / artículo</div>
          <h1>{displayName}</h1>
          <div className="row" style={{ marginTop: 6, gap: 6 }}>
            <ModuleBadge module={module} />
            {item.code && <span className="badge badge-gray">{item.code}</span>}
            {item.status === 'INACTIVO' && <span className="badge badge-gray">Inactivo</span>}
            {item.lowStock && <span className="badge badge-danger"><Icon name="alert" /> Stock bajo</span>}
          </div>
        </div>
        <div className="row">
          {canEdit && <Link to={`/entrada?articulo=${item.id}`} className="btn btn-primary"><Icon name="entry" /> Entrada</Link>}
          {canEdit && lotsWithStock.length > 0 && <Link to={`/salida?articulo=${item.id}`} className="btn"><Icon name="exit" /> Salida</Link>}
          <button className="btn btn-whatsapp" onClick={() => setModal({ kind: 'whatsapp' })}><Icon name="whatsapp" /> Avisar</button>
          {canEdit && <button className="btn" onClick={() => setModal({ kind: 'edit' })}><Icon name="edit" /> Editar</button>}
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="small muted">Hay en total</div>
          <div className="big-number" style={{ color: item.lowStock ? 'var(--danger)' : 'var(--mod)' }}>{fmtNum(item.total)}</div>
          <div className="strong">{item.unitName}</div>
          {min > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className={`meter ${item.lowStock ? 'low' : ''}`}><div style={{ width: `${Math.min(100, (Number(item.total) / (min * 2)) * 100)}%` }} /></div>
              <div className="tiny muted" style={{ marginTop: 4 }}>Alerta cuando queden {fmtNum(min)} {item.unitName}</div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="small muted">Rótulos con existencia</div>
          <div className="big-number">{lotsWithStock.length}</div>
          <div className="small muted">{lotsWithStock.reduce((n, l) => n + l.stock.length, 0)} ubicaciones</div>
        </div>
        <div className="card">
          <div className="small muted">Última forma de entrada</div>
          <div className="strong" style={{ fontSize: '1.1rem', marginTop: 6 }}>
            {item.lastContainerName ? `${item.lastContainerName} de ${fmtNum(item.lastUnitsPerContainer)}` : '—'}
          </div>
          <div className="tiny muted" style={{ marginTop: 4 }}>Se propone en la próxima entrada</div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2>Imágenes</h2></div>
          <ItemImages item={item} canEdit={canEdit} onChanged={setItem} />
        </div>
        <LocationsMap item={item} />
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <h2>Rótulos</h2>
          {emptyLots.length > 0 && (
            <button className="btn-link small" onClick={() => setShowEmptyLots(!showEmptyLots)}>
              {showEmptyLots ? 'Ocultar agotados' : `Ver ${emptyLots.length} agotados`}
            </button>
          )}
        </div>
        {lotsWithStock.length === 0 && !showEmptyLots && (
          <div className="card"><Empty icon="rotulo" title="No hay existencias">
            {canEdit && <Link to={`/entrada?articulo=${item.id}`} className="btn btn-primary" style={{ marginTop: 10 }}><Icon name="entry" /> Registrar entrada</Link>}
          </Empty></div>
        )}
        <div className="stack">
          {[...lotsWithStock, ...(showEmptyLots ? emptyLots : [])].map((lot) => (
            <div key={lot.id} className="card" style={{ opacity: Number(lot.total) === 0 ? 0.65 : 1 }}>
              <div className="grid-2" style={{ alignItems: 'start' }}>
                <LabelView lot={lot} productName={displayName} />
                <div className="stack-sm">
                  <div className="row-between">
                    <div>
                      <span className="big-number" style={{ fontSize: '1.5rem' }}>{fmtNum(lot.total)}</span> <span className="muted">{item.unitName}</span>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      {!lot.verified && <span className="badge badge-warn">Por verificar</span>}
                      {lot.expiryDate && <span className="badge badge-gray"><Icon name="calendar" /> Vence {fmtDate(lot.expiryDate)}</span>}
                    </div>
                  </div>
                  {lot.stock.map((s) => (
                    <div key={s.id} className="card card-tight" style={{ background: '#fafafa' }}>
                      <div className="row-between">
                        <div>
                          <div className="strong small">
                            {s.rackId
                              ? <Link to={`/mapas/${s.areaCode}?articulo=${item.id}&estanteria=${s.rackId}&piso=${s.level}`}><Icon name="pin" size={14} /> {s.locationName}</Link>
                              : s.locationName}
                          </div>
                          <div className="tiny muted">
                            {fmtNum(s.quantity)} {item.unitName}
                            {s.approxContainers && ` · ≈ ${fmtNum(s.approxContainers)} ${s.containerName || ''}`}
                            {s.weightKg && ` · ${fmtNum(s.weightKg)} kg`}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="row" style={{ gap: 4 }}>
                            <button className="btn btn-sm" onClick={() => stockAction('exit', lot, s)}><Icon name="exit" /> Sacar</button>
                            <button className="btn btn-sm" onClick={() => stockAction('transfer', lot, s)}><Icon name="swap" /></button>
                            <button className="btn btn-sm" onClick={() => stockAction('adjust', lot, s)}><Icon name="adjust" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {canEdit && (
                    <div className="row" style={{ gap: 6 }}>
                      <Link to={`/entrada?rotulo=${lot.id}`} className="btn btn-sm"><Icon name="plus" /> Sumar a este rótulo</Link>
                      <button className="btn btn-sm" onClick={() => setModal({ kind: 'label', lot })}><Icon name="edit" /> Corregir rótulo</button>
                      {!lot.verified && (
                        <button className="btn btn-sm btn-ok" onClick={async () => { await lotsApi.verify(lot.id); toast('Rótulo verificado'); load() }}>
                          <Icon name="check" /> Ya lo verifiqué
                        </button>
                      )}
                    </div>
                  )}
                  <div className="tiny muted">Registró {lot.createdBy} · {fmtDate(lot.createdAt?.slice(0, 10))}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <h2>Historial</h2>
          <Link to={`/movimientos?articulo=${item.id}`} className="btn-link small">Ver todo</Link>
        </div>
        {history === null ? <Loading /> : history.length === 0 ? <div className="card"><Empty icon="history" title="Sin movimientos" /></div>
          : <MovementTable rows={history} showItem={false} />}
      </div>

      {canEdit && (
        <div className="row">
          <button className="btn btn-ghost small" onClick={toggleStatus}>{item.status === 'ACTIVO' ? 'Marcar como inactivo' : 'Volver a activar'}</button>
        </div>
      )}

      {modal?.kind === 'edit' && <ItemFormModal module={item.module} item={item} onClose={() => setModal(null)} onSaved={(i) => { setModal(null); setItem(i) }} />}
      {modal?.kind === 'whatsapp' && <WhatsAppModal itemId={item.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'label' && <LabelEditModal lot={modal.lot} productName={displayName} moduleId={item.module.id} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.kind === 'exit' && <ExitModal stock={modal.stock} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'transfer' && <TransferModal stock={modal.stock} module={item.module} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'adjust' && <AdjustModal stock={modal.stock} onClose={() => setModal(null)} onDone={done} />}
    </div>
  )
}

/** Mini mapa con el punto rojo en cada ubicación del producto. */
function LocationsMap({ item }) {
  const areas = useMemo(() => [...new Set(item.lots.flatMap((l) => l.stock.filter((s) => s.areaCode).map((s) => s.areaCode)))], [item])
  const [area, setArea] = useState(areas[0])
  const [layout, setLayout] = useState(null)
  const navigate = useNavigate()
  const highlights = item.lots.flatMap((l) => l.stock.filter((s) => s.rackId).map((s) => ({ rackId: s.rackId, level: s.level })))

  useEffect(() => { setArea(areas[0]) }, [areas])
  useEffect(() => {
    if (!area) return
    setLayout(null)
    mapsApi.layout(area).then(setLayout).catch(() => setLayout(null))
  }, [area])

  const notes = item.lots.flatMap((l) => l.stock.filter((s) => !s.rackId).map((s) => s.locationName))
  return (
    <div className="card">
      <div className="card-header">
        <h2>¿Dónde está?</h2>
        {area && <Link to={`/mapas/${area}?articulo=${item.id}`} className="btn-link small">Abrir mapa grande</Link>}
      </div>
      {areas.length > 1 && (
        <div className="area-tabs">{areas.map((a) => <button key={a} className={`chip ${a === area ? 'active' : ''}`} onClick={() => setArea(a)}>{a}</button>)}</div>
      )}
      {area ? (layout ? (
        <div className="map-frame" style={{ padding: 6 }}>
          <MapCanvas layout={layout} highlights={highlights}
                     onRackClick={(r) => navigate(`/mapas/${area}?articulo=${item.id}&estanteria=${r.id}`)} />
        </div>
      ) : <Loading text="Cargando mapa…" />) : null}
      {notes.length > 0 && (
        <div className="stack-sm" style={{ marginTop: area ? 10 : 0 }}>
          {[...new Set(notes)].map((n) => <div key={n} className="row small"><Icon name="pin" size={15} className="text-danger" /> {n}</div>)}
        </div>
      )}
      {!area && notes.length === 0 && <Empty icon="pin" title="Sin ubicación" />}
    </div>
  )
}
