import { useState } from 'react'
import { suggestionsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData } from '../app/AppDataContext'
import Icon from '../shared/Icon'
import { Field, Loading, Notice, useLoad, useToast } from '../shared/ui'

/**
 * Listas de sugerencias de los campos libres (contenedores, unidades, tipos y
 * motivos de movimiento...). Son solo ayudas: siempre se puede escribir otra cosa,
 * y el sistema también sugiere lo que ya se ha usado.
 */
const KINDS = [
  ['CONTENEDOR', 'Contenedores'], ['UNIDAD', 'Unidades'], ['TIPO_MATERIAL', 'Tipos de material'],
  ['TIPO_ENTRADA', 'Tipos que suman'], ['TIPO_SALIDA', 'Tipos que restan'], ['TIPO_TRASLADO', 'Tipos de traslado'], ['TIPO_AJUSTE', 'Tipos de ajuste'],
  ['MOTIVO_ENTRADA', 'Motivos de entrada'], ['MOTIVO_SALIDA', 'Motivos de salida'], ['MOTIVO_TRASLADO', 'Motivos de traslado'], ['MOTIVO_AJUSTE', 'Motivos de ajuste'],
]

export default function SuggestionsPage() {
  const toast = useToast()
  const { modules, afterChange } = useAppData()
  const list = useLoad(() => suggestionsApi.adminList(), [])
  const [form, setForm] = useState({ kind: 'CONTENEDOR', moduleId: '', value: '' })

  async function add() {
    if (!form.value.trim()) return
    try {
      await suggestionsApi.create({ kind: form.kind, moduleId: form.moduleId || null, value: form.value.trim() })
      setForm({ ...form, value: '' })
      afterChange()
      list.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  async function remove(s) {
    try {
      await suggestionsApi.remove(s.id)
      afterChange()
      list.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  if (list.loading) return <Loading />
  if (list.error) return <Notice type="error">{errorMessage(list.error)}</Notice>

  return (
    <div>
      <div className="page-header">
        <div><h1>Sugerencias</h1><p>Aparecen como ayuda al escribir. Nunca obligan: siempre se puede escribir otra cosa.</p></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 2fr auto', alignItems: 'end' }}>
          <Field label="Campo">
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </Field>
          <Field label="Módulo">
            <select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
              <option value="">Todos</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Texto"><input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} maxLength={80} onKeyDown={(e) => e.key === 'Enter' && add()} /></Field>
          <div className="field"><button className="btn btn-primary" onClick={add}><Icon name="plus" /> Agregar</button></div>
        </div>
      </div>
      <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {KINDS.map(([k, t]) => {
          const items = list.data.filter((s) => s.kind === k)
          return (
            <div key={k} className="card">
              <h3 style={{ marginBottom: 8 }}>{t}</h3>
              <div className="chips">
                {items.length === 0 && <span className="small muted">Sin sugerencias</span>}
                {items.map((s) => (
                  <span key={s.id} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {s.value}{s.moduleName ? <span className="tiny muted"> · {s.moduleName}</span> : null}
                    <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => remove(s)} aria-label={`Quitar ${s.value}`}><Icon name="close" size={13} /></button>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
