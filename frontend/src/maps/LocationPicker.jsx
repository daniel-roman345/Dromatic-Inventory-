import { useEffect, useMemo, useState } from 'react'
import { mapsApi } from '../api/services'
import { errorMessage } from '../api/client'
import MapCanvas from './MapCanvas'
import RackPanel from './RackPanel'
import Icon from '../shared/Icon'
import { Loading, Notice } from '../shared/ui'

/**
 * Escoger dónde se guarda algo: en el mapa (estantería + piso o fila) o
 * escribiendo la ubicación (para lo que no tiene mapa, como materias primas o bobinas).
 *
 * value = { rackId, level, note, label } — label es el texto para mostrar.
 */
export default function LocationPicker({ module, value, onChange, exclude, allowNone = true }) {
  const [areas, setAreas] = useState(null)
  const [layouts, setLayouts] = useState({})
  const [areaCode, setAreaCode] = useState(null)
  const [rack, setRack] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(value?.note && !value?.rackId ? 'note' : 'map')

  useEffect(() => {
    let alive = true
    mapsApi.areas()
      .then(async (list) => {
        const loaded = Object.fromEntries(await Promise.all(list.map(async (a) => [a.code, await mapsApi.layout(a.code)])))
        if (!alive) return
        setAreas(list)
        setLayouts(loaded)
        const own = list.find((a) => loaded[a.code].sections.some((s) => s.moduleId === module?.id))
        setAreaCode(own?.code || list[0]?.code || null)
        if (!own && !value?.rackId) setMode('note')
      })
      .catch((e) => alive && setError(e))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?.id])

  const layout = areaCode ? layouts[areaCode] : null
  const rackIndex = useMemo(() => {
    const map = new Map()
    Object.values(layouts).forEach((l) => l.sections.forEach((s) => s.racks.forEach((r) => map.set(r.id, { s, r, area: l.area }))))
    return map
  }, [layouts])

  // Si ya hay una ubicación escogida, abrir su estantería.
  useEffect(() => {
    if (value?.rackId && rackIndex.has(value.rackId)) {
      const found = rackIndex.get(value.rackId)
      setAreaCode(found.area.code)
      setRack(found)
    }
  }, [value?.rackId, rackIndex])

  function pickLevel(level) {
    const { s, r, area } = rack
    if (exclude && exclude.rackId === r.id && exclude.level === level) return
    const where = r.length > 1 ? `${s.name} · F${level}` : `${s.name} · ${r.code}${level}`
    onChange({ rackId: r.id, level, note: null, label: `${area.name} · ${where}` })
  }

  if (error) return <Notice type="error">{errorMessage(error)}</Notice>
  if (!areas) return <Loading text="Cargando mapas…" />

  return (
    <div className="stack">
      <div className="segmented">
        <button type="button" className={mode === 'map' ? 'active' : ''} onClick={() => setMode('map')}>
          <Icon name="map" size={16} /> En el mapa
        </button>
        <button type="button" className={mode === 'note' ? 'active' : ''} onClick={() => setMode('note')}>
          <Icon name="edit" size={16} /> Escribir la ubicación
        </button>
      </div>

      {mode === 'note' ? (
        <div className="stack-sm" style={{ maxWidth: 520 }}>
          <label htmlFor="loc-note">¿Dónde queda guardado?</label>
          <input id="loc-note" value={value?.rackId ? '' : value?.note || ''} maxLength={120} autoFocus
                 placeholder={module?.locationHint || 'Ej.: abajo de la bodega 1, junto a la puerta'}
                 onChange={(e) => onChange({ rackId: null, level: null, note: e.target.value, label: e.target.value })} />
          {module?.locationHint && (
            <div className="chips">
              <button type="button" className="chip" onClick={() => onChange({ rackId: null, level: null, note: module.locationHint, label: module.locationHint })}>
                {module.locationHint}
              </button>
            </div>
          )}
          {allowNone && <div className="field-hint">Si lo deja vacío queda como “{module?.locationHint || 'Sin ubicación asignada'}”.</div>}
        </div>
      ) : (
        <>
          {areas.length > 1 && (
            <div className="area-tabs">
              {areas.map((a) => (
                <button type="button" key={a.code} className={`chip ${areaCode === a.code ? 'active' : ''}`}
                        onClick={() => { setAreaCode(a.code); setRack(null) }}>{a.name}</button>
              ))}
            </div>
          )}
          <div className="map-layout">
            <div className="map-frame">
              {layout && (
                <MapCanvas layout={layout} onlyModuleId={module?.id}
                           selectedRackId={rack?.r.id}
                           picked={value?.rackId ? { rackId: value.rackId, level: value.level } : null}
                           highlights={exclude ? [exclude] : []}
                           onRackClick={(r, s) => setRack({ r, s, area: layout.area })} />
              )}
            </div>
            <div className="card panel-sticky">
              {rack ? (
                <RackPanel rack={rack.r} section={rack.s} area={rack.area} mode="pick"
                           activeLevel={value?.rackId === rack.r.id ? value.level : null}
                           onLevel={pickLevel} highlights={exclude ? [exclude] : []} />
              ) : (
                <div className="empty">
                  <Icon name="pin" />
                  <div className="strong" style={{ color: 'var(--ink)' }}>Toque una estantería en el mapa</div>
                  <div className="small">Luego escoja el piso o la fila.</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {value?.label && <Notice type="ok">Queda en: <b>{value.label}</b></Notice>}
    </div>
  )
}
