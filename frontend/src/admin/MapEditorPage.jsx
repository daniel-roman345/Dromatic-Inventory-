import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mapAdminApi, mapsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import MapCanvas from '../maps/MapCanvas'
import Icon from '../shared/Icon'
import { Field, Loading, Modal, Notice, useToast } from '../shared/ui'

/**
 * Editor de mapas (solo administrador). Todo es libre: cuartos del tamaño que
 * se quiera, paredes para darles forma, pasillos y muros en las cuatro
 * direcciones, estanterías de cualquier largo y con los pisos o filas que sean.
 */
const DIRECTIONS = [
  { key: 'right', label: '→', title: 'Hacia la derecha', orientation: 'H', reversed: false },
  { key: 'down', label: '↓', title: 'Hacia abajo', orientation: 'V', reversed: false },
  { key: 'left', label: '←', title: 'Hacia la izquierda', orientation: 'H', reversed: true },
  { key: 'up', label: '↑', title: 'Hacia arriba', orientation: 'V', reversed: true },
]
const dirOf = (s) => DIRECTIONS.find((d) => d.orientation === s.orientation && d.reversed === Boolean(s.reversed)) || DIRECTIONS[0]

const ADD_KINDS = [
  { kind: 'PASILLO', label: 'Pasillo o fila', icon: 'list', section: true },
  { kind: 'MURO', label: 'Muro', icon: 'wall', section: true },
  { kind: 'ZONA', label: 'Zona o arrume', icon: 'layers', section: true },
  { kind: 'PARED', label: 'Pared o columna', icon: 'wall' },
  { kind: 'PUERTA', label: 'Puerta', icon: 'door' },
  { kind: 'OFICINA', label: 'Oficina', icon: 'desk' },
  { kind: 'ESCALERA', label: 'Escalera', icon: 'stairs' },
  { kind: 'MAQUINA', label: 'Máquina', icon: 'fan' },
  { kind: 'MALACATE', label: 'Malacate', icon: 'hoist' },
  { kind: 'PASILLO_LIBRE', label: 'Camino (sin estantes)', icon: 'map' },
  { kind: 'TEXTO', label: 'Texto', icon: 'edit' },
]

export default function MapEditorPage() {
  const { areaCode } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { modules } = useAppData()
  const [areas, setAreas] = useState(null)
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sel, setSel] = useState(null) // { type: 'cell'|'section'|'landmark', ... }
  const [newArea, setNewArea] = useState(false)

  const loadAreas = () => mapsApi.areas().then(setAreas).catch(setError)
  useEffect(() => { loadAreas() }, [])
  const current = areaCode || areas?.[0]?.code
  useEffect(() => {
    if (!current) return
    setLayout(null)
    setSel(null)
    mapsApi.layout(current).then(setLayout).catch(setError)
  }, [current])

  /** Ejecuta un cambio y actualiza el mapa con la respuesta. */
  async function run(action, message, keep) {
    setBusy(true)
    try {
      const next = await action()
      if (next?.area) setLayout(next)
      if (message) toast(message)
      if (keep) keep(next)
      else setSel(null)
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  const selectedSection = sel?.type === 'section' ? layout?.sections.find((s) => s.id === sel.id) : null
  const selectedLandmark = sel?.type === 'landmark' ? layout?.landmarks.find((l) => l.id === sel.id) : null

  if (error) return <Notice type="error">{errorMessage(error)}</Notice>
  if (!areas) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Editor de mapas</h1>
          <p>Toque una celda vacía para agregar algo, o toque cualquier cosa del mapa para cambiarla.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setNewArea(true)}><Icon name="plus" /> Nuevo cuarto</button>
          {layout && <button className="btn" onClick={() => navigate(`/mapas/${layout.area.code}`)}><Icon name="eye" /> Ver como usuario</button>}
        </div>
      </div>

      <div className="area-tabs">
        {areas.map((a) => (
          <button key={a.code} className={`chip ${a.code === current ? 'active' : ''}`} onClick={() => navigate(`/admin/mapas/${a.code}`)}>{a.name}</button>
        ))}
      </div>

      {!layout ? <Loading text="Dibujando el mapa…" /> : (
        <div className="map-layout">
          <div className="map-frame">
            <MapCanvas layout={layout} editing
                       pendingCell={sel?.type === 'cell' ? sel : null}
                       selectedSectionId={selectedSection?.id}
                       selectedLandmarkId={selectedLandmark?.id}
                       onCellClick={(x, y) => setSel({ type: 'cell', x, y })}
                       onRackClick={(r, s) => setSel({ type: 'section', id: s.id, rackId: r.id })}
                       onSectionClick={(s) => setSel({ type: 'section', id: s.id })}
                       onLandmarkClick={(l) => setSel({ type: 'landmark', id: l.id })} />
            <div className="map-legend">
              <span>Celdas de {layout.area.gridWidth} × {layout.area.gridHeight}</span>
              <span>Toque una celda vacía para agregar</span>
            </div>
          </div>
          <div className="card panel-sticky">
            {sel?.type === 'cell' && (
              <AddPanel key={`${sel.x}-${sel.y}`} cell={sel} layout={layout} modules={modules} busy={busy} run={run} onCancel={() => setSel(null)} />
            )}
            {selectedSection && (
              <SectionPanel key={selectedSection.id} s={selectedSection} layout={layout} modules={modules} busy={busy} run={run}
                            onClose={() => setSel(null)} keepSelected={() => setSel({ type: 'section', id: selectedSection.id })} />
            )}
            {selectedLandmark && (
              <LandmarkPanel key={selectedLandmark.id} l={selectedLandmark} busy={busy} run={run} onClose={() => setSel(null)}
                             keepSelected={() => setSel({ type: 'landmark', id: selectedLandmark.id })} />
            )}
            {!sel && <AreaPanel key={layout.area.id} layout={layout} modules={modules} busy={busy} run={run} onRenamed={loadAreas} />}
          </div>
        </div>
      )}

      {newArea && (
        <NewAreaModal onClose={() => setNewArea(false)} onCreated={(l) => { setNewArea(false); loadAreas(); navigate(`/admin/mapas/${l.area.code}`) }} />
      )}
    </div>
  )
}

/* ── Agregar en una celda vacía ────────────────────────────────────── */
function AddPanel({ cell, layout, modules, busy, run, onCancel }) {
  const [kind, setKind] = useState(null)
  const nextCode = useMemo(() => {
    const nums = layout.sections.map((s) => /^P(\d+)$/.exec(s.code)).filter(Boolean).map((m) => Number(m[1]))
    return `P${(nums.length ? Math.max(...nums) : 0) + 1}`
  }, [layout])
  const def = ADD_KINDS.find((k) => k.kind === kind)
  const isRow = layout.area.levelLabel === 'Fila'
  const [form, setForm] = useState({
    name: '', code: '', moduleId: '', dir: 'right', rackCount: 5, startCode: 'A', rackLevels: 3, rackLength: 1,
    doubleSided: false, label: '', width: 1, height: 1,
  })
  const set = (f) => (e) => setForm({ ...form, [f]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e })

  function choose(k) {
    setKind(k)
    const base = { ...form }
    if (k === 'PASILLO') Object.assign(base, { code: nextCode, name: `Pasillo ${nextCode.slice(1)}` })
    if (k === 'MURO') Object.assign(base, { code: `M${layout.sections.length + 1}`, name: 'Muro' })
    if (k === 'ZONA') Object.assign(base, { code: `Z${layout.sections.length + 1}`, name: 'Zona', rackCount: 1, rackLevels: 1 })
    if (!ADD_KINDS.find((x) => x.kind === k)?.section) Object.assign(base, { label: ADD_KINDS.find((x) => x.kind === k).label })
    setForm(base)
  }

  function save() {
    const d = DIRECTIONS.find((x) => x.key === form.dir)
    if (def.section) {
      run(() => mapAdminApi.createSection(layout.area.id, {
        code: form.code, name: form.name, kind, moduleId: form.moduleId || null, x: cell.x, y: cell.y,
        orientation: d.orientation, reversed: d.reversed, doubleSided: form.doubleSided,
        rackCount: Number(form.rackCount) || 0, startCode: form.startCode, rackLevels: Number(form.rackLevels) || 1, rackLength: Number(form.rackLength) || 1,
      }), `${form.name} agregado`)
    } else {
      run(() => mapAdminApi.createLandmark(layout.area.id, {
        kind: kind === 'PASILLO_LIBRE' ? 'PASILLO' : kind, label: form.label, x: cell.x, y: cell.y,
        width: Number(form.width) || 1, height: Number(form.height) || 1,
      }), `${def.label} agregado`)
    }
  }

  return (
    <div className="stack">
      <div>
        <div className="breadcrumb">Celda {cell.x + 1}, {cell.y + 1}</div>
        <h2>{def ? `Agregar ${def.label.toLowerCase()}` : '¿Qué va aquí?'}</h2>
      </div>
      {!def ? (
        <div className="option-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {ADD_KINDS.map((k) => (
            <button key={k.kind} className="option" onClick={() => choose(k.kind)}>
              <Icon name={k.icon} size={22} />
              <b>{k.label}</b>
            </button>
          ))}
        </div>
      ) : def.section ? (
        <>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 110px' }}>
            <Field label="Nombre"><input value={form.name} onChange={set('name')} maxLength={60} /></Field>
            <Field label="Código"><input value={form.code} onChange={set('code')} maxLength={20} /></Field>
          </div>
          <Field label="Qué se guarda aquí">
            <select value={form.moduleId} onChange={set('moduleId')}>
              <option value="">Varios / sin definir</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <DirectionPicker value={form.dir} onChange={set('dir')} />
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Field label="¿Cuántas estanterías?"><input type="number" min="0" max="60" value={form.rackCount} onChange={set('rackCount')} /></Field>
            <Field label="Empieza en la letra"><input value={form.startCode} onChange={set('startCode')} maxLength={10} /></Field>
            <Field label={`¿Cuántos ${isRow ? 'filas' : 'pisos'} cada una?`}><input type="number" min="1" max="20" value={form.rackLevels} onChange={set('rackLevels')} /></Field>
            <Field label="Largo de cada una (celdas)" hint="Más de 1 para estanterías largas sin divisiones"><input type="number" min="1" max="40" value={form.rackLength} onChange={set('rackLength')} /></Field>
          </div>
          <label className="check"><input type="checkbox" checked={form.doubleSided} onChange={set('doubleSided')} /> Estantería doble (se saca por los dos lados)</label>
        </>
      ) : (
        <>
          {kind !== 'PARED' && <Field label="Texto"><input value={form.label} onChange={set('label')} maxLength={60} /></Field>}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Field label="Ancho (celdas)"><input type="number" min="1" max="60" value={form.width} onChange={set('width')} /></Field>
            <Field label="Alto (celdas)"><input type="number" min="1" max="60" value={form.height} onChange={set('height')} /></Field>
          </div>
        </>
      )}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={def ? () => setKind(null) : onCancel} disabled={busy}>{def ? 'Atrás' : 'Cancelar'}</button>
        {def && <button className="btn btn-primary" onClick={save} disabled={busy}><Icon name="check" /> {busy ? 'Guardando…' : 'Agregar'}</button>}
      </div>
    </div>
  )
}

function DirectionPicker({ value, onChange }) {
  return (
    <div className="field">
      <label>Dirección</label>
      <div className="segmented">
        {DIRECTIONS.map((d) => (
          <button type="button" key={d.key} title={d.title} className={value === d.key ? 'active' : ''} onClick={() => onChange(d.key)}
                  style={{ fontSize: '1.1rem', minWidth: 46 }}>{d.label}</button>
        ))}
      </div>
    </div>
  )
}

/* ── Pasillo, muro o zona seleccionada ─────────────────────────────── */
function SectionPanel({ s, layout, modules, busy, run, onClose, keepSelected }) {
  const [form, setForm] = useState({ name: s.name, code: s.code, kind: s.kind, moduleId: s.moduleId || '', dir: dirOf(s).key, doubleSided: s.doubleSided, notes: s.notes || '' })
  const [copyFrom, setCopyFrom] = useState('')
  const [addAfter, setAddAfter] = useState(null)
  const set = (f) => (e) => setForm({ ...form, [f]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e })
  const unit = layout.area.levelLabel === 'Fila' ? 'filas' : 'pisos'
  const keep = () => keepSelected()

  const body = (over = {}) => {
    const d = DIRECTIONS.find((x) => x.key === (over.dir || form.dir))
    return {
      code: form.code, name: form.name, kind: form.kind, moduleId: form.moduleId || null,
      x: over.x ?? s.x, y: over.y ?? s.y, orientation: d.orientation, reversed: d.reversed,
      doubleSided: form.doubleSided, notes: form.notes || null,
    }
  }
  const move = (dx, dy) => run(() => mapAdminApi.updateSection(s.id, body({ x: s.x + dx, y: s.y + dy })), null, keep)
  const rackBody = (r, over = {}) => ({ code: r.code, levels: r.levels, length: r.length, notes: r.notes || null, ...over })

  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <div className="breadcrumb">{s.kind === 'MURO' ? 'Muro' : s.kind === 'ZONA' ? 'Zona' : 'Pasillo'} · {s.racks.length} estanterías</div>
          <h2>{s.name}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button>
      </div>

      <div>
        <div className="label">Mover</div>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn btn-sm" onClick={() => move(-1, 0)} disabled={busy}>←</button>
          <button className="btn btn-sm" onClick={() => move(0, -1)} disabled={busy}>↑</button>
          <button className="btn btn-sm" onClick={() => move(0, 1)} disabled={busy}>↓</button>
          <button className="btn btn-sm" onClick={() => move(1, 0)} disabled={busy}>→</button>
          <span className="small muted">Empieza en la celda {s.x + 1}, {s.y + 1}</span>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 100px' }}>
        <Field label="Nombre"><input value={form.name} onChange={set('name')} maxLength={60} /></Field>
        <Field label="Código"><input value={form.code} onChange={set('code')} maxLength={20} /></Field>
      </div>
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <Field label="Tipo">
          <select value={form.kind} onChange={set('kind')}>
            <option value="PASILLO">Pasillo o fila</option><option value="MURO">Muro</option><option value="ZONA">Zona</option>
          </select>
        </Field>
        <Field label="Qué se guarda">
          <select value={form.moduleId} onChange={set('moduleId')}>
            <option value="">Varios / sin definir</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
      </div>
      <DirectionPicker value={form.dir} onChange={set('dir')} />
      <label className="check"><input type="checkbox" checked={form.doubleSided} onChange={set('doubleSided')} /> Estantería doble</label>
      <Field label="Notas"><input value={form.notes} onChange={set('notes')} maxLength={255} placeholder="Opcional" /></Field>
      <button className="btn btn-primary" disabled={busy} onClick={() => run(() => mapAdminApi.updateSection(s.id, body()), 'Cambios guardados', keep)}>
        <Icon name="check" /> Guardar cambios
      </button>

      <hr className="divider" />
      <div className="row-between"><h3>Estanterías</h3><span className="small muted">en el orden de la dirección</span></div>
      <div className="stack-sm">
        {s.racks.map((r) => (
          <div key={r.id} className="card card-tight">
            <div className="row-between">
              <span className="strong" style={{ fontSize: '1.05rem' }}>{r.code}</span>
              <div className="row" style={{ gap: 4 }}>
                <button className="btn btn-sm" title="Agregar una estantería después de esta" onClick={() => setAddAfter(r)} disabled={busy}><Icon name="plus" /> Después</button>
                <button className="btn btn-sm" title="Quitar esta estantería" disabled={busy}
                        onClick={() => window.confirm(`¿Quitar la estantería ${r.code}? Solo se puede si está vacía.`) && run(() => mapAdminApi.deleteRack(r.id), `Estantería ${r.code} quitada`, keep)}>
                  <Icon name="trash" />
                </button>
              </div>
            </div>
            <div className="row" style={{ marginTop: 6, gap: 6 }}>
              <span className="small muted" style={{ minWidth: 44 }}>{unit}:</span>
              <button className="btn btn-sm" disabled={busy || r.levels <= 1} title={`Quitar ${unit === 'filas' ? 'la fila' : 'el piso'} de más arriba`}
                      onClick={() => run(() => mapAdminApi.removeLevel(r.id, r.levels), null, keep)}><Icon name="minus" /></button>
              <span className="strong">{r.levels}</span>
              <button className="btn btn-sm" disabled={busy || r.levels >= 20} onClick={() => run(() => mapAdminApi.addLevel(r.id), null, keep)}><Icon name="plus" /></button>
              <span className="small muted" style={{ marginLeft: 8 }}>largo:</span>
              <button className="btn btn-sm" disabled={busy || r.length <= 1} onClick={() => run(() => mapAdminApi.updateRack(r.id, rackBody(r, { length: r.length - 1 })), null, keep)}><Icon name="minus" /></button>
              <span className="strong">{r.length}</span>
              <button className="btn btn-sm" disabled={busy} onClick={() => run(() => mapAdminApi.updateRack(r.id, rackBody(r, { length: r.length + 1 })), null, keep)}><Icon name="plus" /></button>
            </div>
          </div>
        ))}
        <button className="btn" disabled={busy} onClick={() => setAddAfter({ id: null, code: '' })}><Icon name="plus" /> Agregar estantería al final</button>
      </div>

      <div className="stack-sm">
        <label>Igual a otro pasillo (mismas estanterías y {unit})</label>
        <div className="row">
          <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} style={{ flex: 1 }}>
            <option value="">Escoja…</option>
            {layout.sections.filter((x) => x.id !== s.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <button className="btn" disabled={!copyFrom || busy} onClick={() => run(() => mapAdminApi.copyRacks(s.id, copyFrom), 'Copiado', keep)}>Copiar</button>
        </div>
      </div>

      <button className="btn btn-link text-danger" style={{ color: 'var(--danger)', alignSelf: 'flex-start' }} disabled={busy}
              onClick={() => window.confirm(`¿Borrar "${s.name}" completo? Solo se puede si está vacío.`) && run(() => mapAdminApi.deleteSection(s.id), `${s.name} borrado`)}>
        <Icon name="trash" /> Borrar {s.kind === 'MURO' ? 'este muro' : 'este pasillo'}
      </button>

      {addAfter && (
        <AddRackModal section={s} after={addAfter} unit={unit} onClose={() => setAddAfter(null)}
                      onSave={(b) => run(() => mapAdminApi.createRack(s.id, b), `Estantería ${b.code} agregada`, () => { setAddAfter(null); keep() })} busy={busy} />
      )}
    </div>
  )
}

function AddRackModal({ section, after, unit, onClose, onSave, busy }) {
  const last = section.racks[section.racks.length - 1]
  const [form, setForm] = useState({ code: '', levels: after.levels || last?.levels || 3, length: after.length || last?.length || 1 })
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  return (
    <Modal title={after.id ? `Agregar después de la ${after.code}` : 'Agregar estantería al final'} onClose={onClose} busy={busy}
           footer={<>
             <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
             <button className="btn btn-primary" disabled={busy || !form.code.trim()}
                     onClick={() => onSave({ code: form.code.trim(), levels: Number(form.levels) || 1, length: Number(form.length) || 1, afterRackId: after.id || null })}>
               Agregar
             </button>
           </>}>
      <div className="stack">
        <p className="small muted">Las que siguen se corren un puesto y conservan su letra, porque está marcada en la bodega.</p>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <Field label="Letra o número"><input value={form.code} onChange={set('code')} maxLength={10} autoFocus /></Field>
          <Field label={unit === 'filas' ? 'Filas' : 'Pisos'}><input type="number" min="1" max="20" value={form.levels} onChange={set('levels')} /></Field>
          <Field label="Largo (celdas)"><input type="number" min="1" max="40" value={form.length} onChange={set('length')} /></Field>
        </div>
      </div>
    </Modal>
  )
}

/* ── Referencia seleccionada (pared, puerta, oficina...) ───────────── */
function LandmarkPanel({ l, busy, run, onClose, keepSelected }) {
  const [label, setLabel] = useState(l.label)
  const keep = () => keepSelected()
  const save = (over = {}) => run(() => mapAdminApi.updateLandmark(l.id, {
    kind: l.kind, label, x: l.x, y: l.y, width: l.width, height: l.height, ...over,
  }), null, keep)
  return (
    <div className="stack">
      <div className="row-between">
        <div>
          <div className="breadcrumb">{ADD_KINDS.find((k) => k.kind === l.kind)?.label || l.kind}</div>
          <h2>{l.label}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button>
      </div>
      <Field label="Texto">
        <div className="row"><input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} style={{ flex: 1 }} /><button className="btn" onClick={() => save()} disabled={busy}>Guardar</button></div>
      </Field>
      <div>
        <div className="label">Mover</div>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn btn-sm" onClick={() => save({ x: l.x - 1 })} disabled={busy}>←</button>
          <button className="btn btn-sm" onClick={() => save({ y: l.y - 1 })} disabled={busy}>↑</button>
          <button className="btn btn-sm" onClick={() => save({ y: l.y + 1 })} disabled={busy}>↓</button>
          <button className="btn btn-sm" onClick={() => save({ x: l.x + 1 })} disabled={busy}>→</button>
        </div>
      </div>
      <div className="row">
        <span className="small muted">Ancho</span>
        <button className="btn btn-sm" onClick={() => save({ width: l.width - 1 })} disabled={busy || l.width <= 1}><Icon name="minus" /></button>
        <span className="strong">{l.width}</span>
        <button className="btn btn-sm" onClick={() => save({ width: l.width + 1 })} disabled={busy}><Icon name="plus" /></button>
        <span className="small muted" style={{ marginLeft: 10 }}>Alto</span>
        <button className="btn btn-sm" onClick={() => save({ height: l.height - 1 })} disabled={busy || l.height <= 1}><Icon name="minus" /></button>
        <span className="strong">{l.height}</span>
        <button className="btn btn-sm" onClick={() => save({ height: l.height + 1 })} disabled={busy}><Icon name="plus" /></button>
      </div>
      <button className="btn btn-link" style={{ color: 'var(--danger)', alignSelf: 'flex-start' }} disabled={busy}
              onClick={() => run(() => mapAdminApi.deleteLandmark(l.id), 'Quitado')}>
        <Icon name="trash" /> Quitar
      </button>
    </div>
  )
}

/* ── Datos del cuarto y muro alrededor ─────────────────────────────── */
function AreaPanel({ layout, modules, busy, run, onRenamed }) {
  const a = layout.area
  const [form, setForm] = useState({ name: a.name, description: a.description || '', gridWidth: a.gridWidth, gridHeight: a.gridHeight, levelLabel: a.levelLabel, levelsFromTop: a.levelsFromTop })
  const [wall, setWall] = useState({ moduleId: '', levels: 3, startCode: 'A', name: 'Muro', top: true, right: true, bottom: true, left: true })
  const set = (f) => (e) => setForm({ ...form, [f]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e })
  const setW = (f) => (e) => setWall({ ...wall, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const saveArea = (over = {}) => run(() => mapAdminApi.updateArea(a.id, {
    code: a.code, name: form.name, description: form.description, gridWidth: Number(form.gridWidth), gridHeight: Number(form.gridHeight),
    levelLabel: form.levelLabel, levelsFromTop: form.levelsFromTop, ...over,
  }), 'Cuarto actualizado', () => onRenamed())

  return (
    <div className="stack">
      <div>
        <div className="breadcrumb">Cuarto</div>
        <h2>{a.name}</h2>
      </div>
      <Field label="Nombre"><input value={form.name} onChange={set('name')} maxLength={60} /></Field>
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <Field label="Ancho (celdas)"><input type="number" min="3" max="60" value={form.gridWidth} onChange={set('gridWidth')} /></Field>
        <Field label="Largo (celdas)"><input type="number" min="3" max="60" value={form.gridHeight} onChange={set('gridHeight')} /></Field>
        <Field label="Cada nivel se llama"><input value={form.levelLabel} onChange={set('levelLabel')} list="level-labels" maxLength={20} /></Field>
        <Field label="El nivel 1 es">
          <select value={form.levelsFromTop ? 'top' : 'bottom'} onChange={(e) => setForm({ ...form, levelsFromTop: e.target.value === 'top' })}>
            <option value="bottom">El de abajo</option><option value="top">El de arriba</option>
          </select>
        </Field>
      </div>
      <datalist id="level-labels"><option value="Piso" /><option value="Fila" /><option value="Nivel" /></datalist>
      <button className="btn btn-primary" disabled={busy} onClick={() => saveArea()}><Icon name="check" /> Guardar el cuarto</button>

      <hr className="divider" />
      <div>
        <h3>Rodear con muro</h3>
        <p className="small muted">Pone estanterías por el borde del cuarto, salta lo ocupado (puertas, escaleras, pasillos) y las letras siguen de un lado al otro.</p>
      </div>
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <Field label="Qué se guarda">
          <select value={wall.moduleId} onChange={setW('moduleId')}>
            <option value="">Varios</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Nombre"><input value={wall.name} onChange={setW('name')} maxLength={40} /></Field>
        <Field label="Empieza en la letra"><input value={wall.startCode} onChange={setW('startCode')} maxLength={10} /></Field>
        <Field label={a.levelLabel === 'Fila' ? 'Filas' : 'Pisos'}><input type="number" min="1" max="20" value={wall.levels} onChange={setW('levels')} /></Field>
      </div>
      <div className="row">
        {[['top', 'Arriba'], ['right', 'Derecha'], ['bottom', 'Abajo'], ['left', 'Izquierda']].map(([k, t]) => (
          <label key={k} className="check"><input type="checkbox" checked={wall[k]} onChange={setW(k)} /> {t}</label>
        ))}
      </div>
      <button className="btn" disabled={busy} onClick={() => run(() => mapAdminApi.perimeter(a.id, {
        moduleId: wall.moduleId || null, levels: Number(wall.levels) || 3, startCode: wall.startCode, name: wall.name,
        top: wall.top, right: wall.right, bottom: wall.bottom, left: wall.left,
      }), 'Muro agregado alrededor')}>
        <Icon name="wall" /> Rodear el cuarto
      </button>
    </div>
  )
}

function NewAreaModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ code: '', name: '', gridWidth: 12, gridHeight: 10, levelLabel: 'Piso', levelsFromTop: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  async function save() {
    setBusy(true)
    setError('')
    try {
      onCreated(await mapAdminApi.createArea({ ...form, gridWidth: Number(form.gridWidth), gridHeight: Number(form.gridHeight) }))
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return (
    <Modal title="Nuevo cuarto" onClose={onClose} busy={busy}
           footer={<><button className="btn" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={busy}>Crear</button></>}>
      <div className="stack">
        <p className="small muted">Empiece con un rectángulo del tamaño aproximado; después le da forma con paredes y agrega pasillos y muros.</p>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 120px' }}>
          <Field label="Nombre" required><input value={form.name} onChange={set('name')} maxLength={60} autoFocus placeholder="Ej.: Bodega 2" /></Field>
          <Field label="Código" required hint="Corto: B2, CM…"><input value={form.code} onChange={set('code')} maxLength={10} /></Field>
          <Field label="Ancho (celdas)"><input type="number" min="3" max="60" value={form.gridWidth} onChange={set('gridWidth')} /></Field>
          <Field label="Largo (celdas)"><input type="number" min="3" max="60" value={form.gridHeight} onChange={set('gridHeight')} /></Field>
          <Field label="Cada nivel se llama"><input value={form.levelLabel} onChange={set('levelLabel')} list="level-labels-new" maxLength={20} /></Field>
          <Field label="El nivel 1 es">
            <select value={form.levelsFromTop ? 'top' : 'bottom'} onChange={(e) => setForm({ ...form, levelsFromTop: e.target.value === 'top' })}>
              <option value="bottom">El de abajo</option><option value="top">El de arriba</option>
            </select>
          </Field>
        </div>
        <datalist id="level-labels-new"><option value="Piso" /><option value="Fila" /><option value="Nivel" /></datalist>
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}
