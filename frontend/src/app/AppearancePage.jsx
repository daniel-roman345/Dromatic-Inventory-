import MapCanvas from '../maps/MapCanvas'
import Icon from '../shared/Icon'
import { DEFAULT_PREFERENCES, PREFERENCE_OPTIONS, usePreferences } from './preferences'

/** Ejemplo pequeño para ver los cambios al instante. */
const lv = (n, busy = []) => Array.from({ length: n }, (_, i) => ({ level: i + 1, label: '', locationCode: '', lots: busy.includes(i + 1) ? 1 : 0, items: busy.includes(i + 1) ? 1 : 0, unverified: 0 }))
const SAMPLE = {
  area: { id: 0, code: 'EJ', name: 'Ejemplo', gridWidth: 9, gridHeight: 6, levelLabel: 'Piso', levelsFromTop: false },
  landmarks: [
    { id: 1, kind: 'ESCALERA', label: 'Salida', x: 0, y: 0, width: 1, height: 1 },
    { id: 2, kind: 'PASILLO', label: 'Pasillo general', x: 0, y: 1, width: 1, height: 5 },
    { id: 3, kind: 'OFICINA', label: 'Oficina', x: 7, y: 4, width: 2, height: 2 },
    { id: 4, kind: 'PARED', label: 'Columna', x: 8, y: 1, width: 1, height: 1 },
  ],
  sections: [
    { id: 1, code: 'M', name: 'Muro de tapas', kind: 'MURO', moduleId: 2, color: 'amber', x: 2, y: 0, orientation: 'H', reversed: false, doubleSided: false,
      racks: ['A', 'B', 'C', 'D', 'E'].map((c, i) => ({ id: 10 + i, code: c, levels: 3, length: 1, levelStats: lv(3, i % 2 ? [1] : []) })) },
    { id: 2, code: 'P1', name: 'Pasillo 1', kind: 'PASILLO', moduleId: 1, color: 'teal', x: 2, y: 2, orientation: 'H', reversed: false, doubleSided: false,
      racks: ['A', 'B', 'C', 'D', 'E'].map((c, i) => ({ id: 20 + i, code: c, levels: 3, length: 1, levelStats: lv(3, i === 1 || i === 3 ? [2] : []) })) },
    { id: 3, code: 'P2', name: 'Pasillo 2', kind: 'PASILLO', moduleId: 1, color: 'teal', x: 2, y: 4, orientation: 'H', reversed: false, doubleSided: true,
      racks: ['A', 'B', 'C', 'D'].map((c, i) => ({ id: 30 + i, code: c, levels: 3, length: 1, levelStats: lv(3, i === 2 ? [1, 3] : []) })) },
  ],
}

export default function AppearancePage() {
  const [prefs, save] = usePreferences()
  const set = (key, value) => save({ ...prefs, [key]: value })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Apariencia</h1>
          <p>Deje el sistema a su gusto. Los cambios se ven al instante y se guardan en este computador.</p>
        </div>
        <button className="btn" onClick={() => save({ ...DEFAULT_PREFERENCES })}><Icon name="history" /> Volver a como venía</button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card stack">
          {Object.entries(PREFERENCE_OPTIONS).map(([key, def]) => (
            <div key={key}>
              <div className="label">{def.label}</div>
              <div className="pref-group" role="radiogroup" aria-label={def.label}>
                {def.options.map((o) => (
                  <button key={o.value} type="button" role="radio" aria-checked={prefs[key] === o.value}
                          className={`pref-option ${prefs[key] === o.value ? 'active' : ''}`} onClick={() => set(key, o.value)}>
                    {o.swatch && <span className="swatch" style={{ background: o.swatch }} />}
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="stack panel-sticky">
          <div className="card">
            <div className="card-header"><h2>Vista previa del mapa</h2><span className="small muted">Toque para probar</span></div>
            <div className="map-frame" style={{ padding: 8 }}>
              <MapCanvas layout={SAMPLE} highlights={[{ rackId: 22, level: 2 }]} selectedRackId={31} onRackClick={() => {}} />
            </div>
          </div>
          <div className="card stack-sm">
            <h2>Vista previa de botones y textos</h2>
            <p className="muted">Así se ven los textos del sistema con el tamaño escogido.</p>
            <div className="row">
              <button className="btn btn-primary"><Icon name="entry" /> Registrar entrada</button>
              <button className="btn"><Icon name="map" /> Ver en el mapa</button>
              <span className="badge badge-ok">Aprobado</span>
              <span className="badge badge-warn">Cuarentena</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
