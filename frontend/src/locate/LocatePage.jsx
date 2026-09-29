import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { locateApi, mapsApi } from '../api/services'
import { errorMessage } from '../api/client'
import MapCanvas from '../maps/MapCanvas'
import Icon from '../shared/Icon'
import { fmtDate, fmtNum } from '../shared/format'
import { Empty, Loading, Notice, useDebounced } from '../shared/ui'

/** ¿Dónde está? Busque un producto, lote o proveedor y véalo marcado en el mapa. */
export default function LocatePage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const query = useDebounced(q, 300)
  const [state, setState] = useState({ results: null })
  const [selected, setSelected] = useState(null)
  const [layout, setLayout] = useState(null)

  useEffect(() => { setQ(params.get('q') || '') }, [params])
  useEffect(() => {
    if (query.trim().length < 2) { setState({ results: null }); return }
    setState({ loading: true })
    setParams({ q: query }, { replace: true })
    locateApi.search(query).then((results) => {
      setState({ results })
      setSelected(results.find((r) => r.areaCode) || null)
    }).catch((error) => setState({ error }))
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const areaCode = selected?.areaCode
  useEffect(() => {
    if (!areaCode) { setLayout(null); return }
    mapsApi.layout(areaCode).then(setLayout).catch(() => setLayout(null))
  }, [areaCode])

  const highlights = useMemo(() => (state.results || []).filter((r) => r.areaCode === areaCode && r.rackId).map((r) => ({ rackId: r.rackId, level: r.level })), [state.results, areaCode])

  return (
    <div>
      <div className="page-header"><div><h1>¿Dónde está?</h1><p>Escriba el producto, la presentación, el número de lote o el proveedor.</p></div></div>
      <div className="topbar-search" style={{ maxWidth: 640, marginBottom: 16 }}>
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Ej.: pote x250, etiqueta shampoo, CB-77…"
               style={{ background: 'var(--white)', borderColor: 'var(--line-strong)', padding: '12px 12px 12px 38px', fontSize: '1.05rem' }} />
      </div>
      {state.error && <Notice type="error">{errorMessage(state.error)}</Notice>}
      {state.loading && <Loading text="Buscando…" />}
      {state.results && state.results.length === 0 && <div className="card"><Empty icon="search" title="No se encontró nada con existencias">Pruebe con otra palabra o revise en el inventario.</Empty></div>}
      {state.results && state.results.length > 0 && (
        <div className="map-layout" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)' }}>
          <div className="stack-sm">
            <div className="small muted">{state.results.length} {state.results.length === 1 ? 'ubicación' : 'ubicaciones'}</div>
            {state.results.map((r) => (
              <button key={r.stockId} className={`card card-tight mod-${r.moduleColor}`} onClick={() => setSelected(r)}
                      style={{ textAlign: 'left', cursor: 'pointer', borderColor: selected?.stockId === r.stockId ? 'var(--mod)' : undefined, borderWidth: selected?.stockId === r.stockId ? 2 : 1 }}>
                <div className="row-between">
                  <div>
                    <div className="strong">{r.itemName}{r.presentation ? ` ${r.presentation}` : ''}</div>
                    <div className="small"><Icon name="pin" size={13} className="text-danger" /> {r.locationName}</div>
                    <div className="tiny muted">{r.moduleName}{r.lotNumber ? ` · lote ${r.lotNumber}` : ''} · rótulo del {fmtDate(r.labelDate)}{!r.verified ? ' · por verificar' : ''}</div>
                  </div>
                  <div className="right">
                    <div className="strong">{fmtNum(r.quantity)}</div>
                    <div className="tiny muted">{r.unitName}</div>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 6, gap: 8 }}>
                  <Link to={`/articulos/${r.itemId}`} className="btn-link small" onClick={(e) => e.stopPropagation()}>Ver ficha</Link>
                  {r.rackId && <Link to={`/mapas/${r.areaCode}?articulo=${r.itemId}&estanteria=${r.rackId}&piso=${r.level}`} className="btn-link small" onClick={(e) => e.stopPropagation()}>Abrir en el mapa</Link>}
                </div>
              </button>
            ))}
          </div>
          <div className="card panel-sticky">
            {layout ? (
              <>
                <div className="card-header"><h2>{layout.area.name}</h2><span className="small muted">punto rojo = aquí está</span></div>
                <div className="map-frame" style={{ padding: 6 }}><MapCanvas layout={layout} highlights={highlights} selectedRackId={selected?.rackId} /></div>
              </>
            ) : <Empty icon="map" title="Sin mapa">{selected ? `Está en: ${selected.locationName}` : 'Escoja un resultado.'}</Empty>}
          </div>
        </div>
      )}
    </div>
  )
}
