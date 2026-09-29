import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { itemsApi, mapsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import { useAuth } from '../auth/AuthContext'
import MapCanvas from './MapCanvas'
import RackPanel from './RackPanel'
import { AdjustModal, ExitModal, TransferModal, toStock } from '../movements/StockActionModals'
import Icon from '../shared/Icon'
import { Loading, Notice } from '../shared/ui'

/**
 * Mapas interactivos. Toque una estantería (ej. la C del pasillo 4) y escoja
 * el piso (C1, C2, C3) para ver lo que hay. Con ?articulo=ID se marcan con un
 * pin todas las ubicaciones de ese producto.
 */
export default function MapsPage() {
  const { areaCode } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { moduleByCode, modules } = useAppData()
  const [areas, setAreas] = useState(null)
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [level, setLevel] = useState(null)
  const [focusItem, setFocusItem] = useState(null)
  const [action, setAction] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const itemId = params.get('articulo')

  useEffect(() => { mapsApi.areas().then(setAreas).catch(setError) }, [])

  useEffect(() => {
    if (!itemId) { setFocusItem(null); return }
    itemsApi.get(itemId).then(setFocusItem).catch(() => setFocusItem(null))
  }, [itemId])

  const highlights = useMemo(() => {
    if (!focusItem) return []
    return focusItem.lots.flatMap((l) => l.stock.filter((s) => s.rackId).map((s) => ({ rackId: s.rackId, level: s.level, areaCode: s.areaCode })))
  }, [focusItem])

  const current = areaCode || highlights[0]?.areaCode || areas?.[0]?.code

  const loadLayout = useCallback(() => {
    if (!current) return
    mapsApi.layout(current).then(setLayout).catch(setError)
  }, [current])

  useEffect(() => { setLayout(null); setSelected(null); setLevel(null); loadLayout() }, [loadLayout])

  // Abrir la estantería pedida (?estanteria=ID&piso=N) o la del producto buscado.
  useEffect(() => {
    if (!layout) return
    const rackId = Number(params.get('estanteria')) || highlights.find((h) => h.areaCode === layout.area.code)?.rackId
    if (!rackId) return
    for (const s of layout.sections) {
      const r = s.racks.find((x) => x.id === rackId)
      if (r) {
        setSelected({ r, s })
        setLevel(Number(params.get('piso')) || highlights.find((h) => h.rackId === rackId)?.level || null)
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, highlights])

  function afterAction() {
    setRefreshKey((k) => k + 1)
    mapsApi.layout(current).then((l) => {
      setLayout(l)
      if (selected) {
        const s = l.sections.find((x) => x.id === selected.s.id)
        const r = s?.racks.find((x) => x.id === selected.r.id)
        if (s && r) setSelected({ r, s })
      }
    })
  }

  function openAction(kind, entry) {
    const module = moduleByCode(entry.moduleCode)
    const where = selected.r.length > 1 ? `${selected.s.name} · F${level}` : `${selected.s.name} · ${selected.r.code}${level}`
    const stock = toStock(entry, { moduleId: module?.id, rackId: selected.r.id, level, locationName: `${layout.area.name} · ${where}` })
    setAction({ kind, stock, module })
  }

  if (error) return <Notice type="error">{errorMessage(error)}</Notice>
  if (!areas || !layout) return <Loading text="Dibujando el mapa…" />

  const legendModules = modules.filter((m) => layout.sections.some((s) => s.moduleId === m.id))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mapas</h1>
          <p>Toque una estantería y escoja {layout.area.levelLabel === 'Fila' ? 'la fila' : 'el piso'} para ver qué hay guardado.</p>
        </div>
        {isAdmin && (
          <Link to={`/admin/mapas/${layout.area.code}`} className="btn"><Icon name="edit" /> Editar este mapa</Link>
        )}
      </div>

      <div className="area-tabs">
        {areas.map((a) => (
          <button key={a.code} className={`chip ${a.code === layout.area.code ? 'active' : ''}`}
                  onClick={() => navigate(`/mapas/${a.code}${itemId ? `?articulo=${itemId}` : ''}`)}>
            {a.name}
          </button>
        ))}
      </div>

      {focusItem && (
        <div style={{ marginBottom: 12 }}>
          <Notice type="info">
            Mostrando dónde está <Link to={`/articulos/${focusItem.id}`} className="strong">{focusItem.name}{focusItem.presentation ? ` ${focusItem.presentation}` : ''}</Link>
            {highlights.length ? ` · ${highlights.length} ${highlights.length === 1 ? 'ubicación marcada' : 'ubicaciones marcadas'} con el punto rojo.` : ' · no tiene ubicaciones en los mapas.'}
            {' '}<Link to={`/mapas/${layout.area.code}`} className="btn-link">Quitar</Link>
          </Notice>
        </div>
      )}

      <div className="map-layout">
        <div className="map-frame">
          <MapCanvas layout={layout} highlights={highlights} selectedRackId={selected?.r.id}
                     onRackClick={(r, s) => { setSelected({ r, s }); setLevel(null) }} />
          <div className="map-legend">
            {legendModules.map((m) => (
              <span key={m.code}><i style={{ background: `var(--${m.color})` }} /> {m.name} (lleno = hay mercancía)</span>
            ))}
            <span><i style={{ background: '#f59e0b', borderRadius: '50%' }} /> Por verificar</span>
            <span><i style={{ background: '#ef4444', borderRadius: '50%' }} /> Producto buscado</span>
          </div>
        </div>
        <div className="card panel-sticky">
          {selected ? (
            <RackPanel rack={selected.r} section={selected.s} area={layout.area} activeLevel={level} onLevel={setLevel}
                       highlights={highlights} onAction={openAction} refreshKey={refreshKey} />
          ) : (
            <div className="empty">
              <Icon name="map" />
              <div className="strong" style={{ color: 'var(--ink)' }}>{layout.area.name}</div>
              <div className="small">{layout.area.description}</div>
              <div className="small" style={{ marginTop: 8 }}>Toque cualquier estantería para ver sus {layout.area.levelLabel === 'Fila' ? 'filas' : 'pisos'}.</div>
            </div>
          )}
        </div>
      </div>

      {action?.kind === 'exit' && <ExitModal stock={action.stock} onClose={() => setAction(null)} onDone={afterAction} />}
      {action?.kind === 'transfer' && <TransferModal stock={action.stock} module={action.module} onClose={() => setAction(null)} onDone={afterAction} />}
      {action?.kind === 'adjust' && <AdjustModal stock={action.stock} onClose={() => setAction(null)} onDone={afterAction} />}
    </div>
  )
}
