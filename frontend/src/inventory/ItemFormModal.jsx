import { useState } from 'react'
import { itemsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useSuggestions } from '../app/AppDataContext'
import { parseNum } from '../shared/format'
import { Field, Modal, Notice, SuggestInput } from '../shared/ui'

/** Crear o corregir un artículo. Solo el nombre es obligatorio; la unidad se escribe libre. */
export default function ItemFormModal({ module, item, onClose, onSaved }) {
  const suggestions = useSuggestions(module.id)
  const [form, setForm] = useState({
    name: item?.name || '',
    presentation: item?.presentation || '',
    code: item?.code || '',
    unitName: item?.unitName || module.defaultUnit,
    minimumStock: item?.minimumStock ? String(Number(item.minimumStock)) : '',
    description: item?.description || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (v) => setForm({ ...form, [f]: v?.target ? v.target.value : v })

  async function save() {
    if (!form.name.trim()) return setError('Escriba el nombre del artículo.')
    setBusy(true)
    setError('')
    const body = {
      moduleId: module.id, name: form.name.trim(), presentation: form.presentation || null, code: form.code || null,
      unitName: form.unitName || null, minimumStock: parseNum(form.minimumStock) ?? 0, description: form.description || null,
    }
    try {
      const saved = item ? await itemsApi.update(item.id, body) : await itemsApi.create(body)
      onSaved(saved)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Modal title={item ? 'Corregir artículo' : `Nuevo artículo en ${module.name}`} onClose={onClose} busy={busy}
           footer={<><button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
             <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></>}>
      <div className="stack">
        <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <Field label="Nombre" required><input value={form.name} onChange={set('name')} maxLength={150} autoFocus placeholder="Ej.: Pote PET" /></Field>
          <Field label="Presentación"><input value={form.presentation} onChange={set('presentation')} maxLength={60} placeholder="x250 ml, delantera…" /></Field>
          <Field label="Código interno" hint="Opcional"><input value={form.code} onChange={set('code')} maxLength={50} /></Field>
          <Field label="Se cuenta en" hint="Escriba la unidad que usen">
            <SuggestInput value={form.unitName} onChange={set('unitName')} suggestions={suggestions.UNIDAD || []} maxLength={30} />
          </Field>
        </div>
        <Field label="Avisar cuando queden" hint="Cuando el total llegue a este número se abre una alerta de stock bajo. Vacío = sin alerta.">
          <input inputMode="decimal" value={form.minimumStock} onChange={set('minimumStock')} placeholder="Ej.: 1000" />
        </Field>
        <Field label="Descripción"><textarea rows={2} value={form.description} onChange={set('description')} maxLength={500} /></Field>
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}
