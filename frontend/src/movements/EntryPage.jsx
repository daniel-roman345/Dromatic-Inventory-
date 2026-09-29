import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { itemsApi, lotsApi, movementsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useAppData, useSuggestions } from '../app/AppDataContext'
import LabelForm, { emptyLabel, labelToRequest } from '../lots/LabelForm'
import LabelView from '../lots/LabelView'
import LocationPicker from '../maps/LocationPicker'
import QuantityFields, { emptyQuantity, quantityText, quantityToRequest, quantityTotal } from './QuantityFields'
import Icon from '../shared/Icon'
import { fmtDate, fmtNum, parseNum, todayIso } from '../shared/format'
import { Field, Loading, Notice, SuggestInput, useDebounced, useToast } from '../shared/ui'

/**
 * Registrar una entrada paso a paso, como se hace en la bodega:
 * 1 qué entra · 2 cuánto · 3 el rótulo (igual al papel) · 4 dónde queda · 5 confirmar.
 */
const STEPS = ['Qué entra', 'Cuánto', 'Rótulo', 'Dónde queda', 'Confirmar']

export default function EntryPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { editableModules, moduleByCode, moduleById, afterChange, modulesLoaded } = useAppData()
  const [step, setStep] = useState(0)
  const [module, setModule] = useState(null)
  const [item, setItem] = useState(null)          // artículo existente (detalle)
  const [newItem, setNewItem] = useState(null)    // artículo por crear
  const [lot, setLot] = useState(null)            // rótulo existente al que se suma
  const [qty, setQty] = useState(emptyQuantity(null))
  const [label, setLabel] = useState(emptyLabel('', todayIso()))
  const [location, setLocation] = useState(null)
  const [meta, setMeta] = useState({ movementType: params.get('tipo') || 'Entrada', reason: '', reference: '', note: '', movementDate: todayIso() })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(null)
  const suggestions = useSuggestions(module?.id)

  // Llegar con ?modulo=, ?articulo= o ?rotulo= ya escogidos.
  useEffect(() => {
    if (!modulesLoaded) return
    const lotId = params.get('rotulo')
    const itemId = params.get('articulo')
    if (lotId) {
      lotsApi.get(lotId).then((l) => itemsApi.get(l.itemId).then((it) => { pickItem(it); setLot(l) })).catch(() => {})
    } else if (itemId) {
      itemsApi.get(itemId).then(pickItem).catch(() => {})
    } else {
      const m = moduleByCode(params.get('modulo')) || (editableModules.length === 1 ? editableModules[0] : null)
      if (m?.canEdit) chooseModule(m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesLoaded])

  function chooseModule(m) {
    setModule(m)
    setItem(null)
    setNewItem(null)
    setLot(null)
    setQty(emptyQuantity(null, m))
    setLabel(emptyLabel(m.defaultMaterial, todayIso()))
  }

  function pickItem(detail) {
    const m = moduleById(detail.module.id) || detail.module
    setModule(m)
    setItem(detail)
    setNewItem(null)
    setLot(null)
    setQty(emptyQuantity(detail, m))
    setLabel(emptyLabel(m.defaultMaterial, todayIso()))
  }

  const unitName = item?.unitName || newItem?.unitName || module?.defaultUnit || 'unidades'
  const productName = item ? `${item.name}${item.presentation ? ` ${item.presentation}` : ''}` : newItem ? `${newItem.name}${newItem.presentation ? ` ${newItem.presentation}` : ''}` : ''
  const total = quantityTotal(qty)

  function next() {
    setError('')
    if (step === 0 && !item && !(newItem?.name?.trim())) return setError('Escoja el artículo o escriba el nombre de uno nuevo.')
    if (step === 1 && !total) return setError('Escriba la cantidad: el total, o cuántos contenedores y cuántas unidades trae cada uno.')
    if (step === 1 && !lot && !label.declaredQuantity) {
      setLabel({ ...label, declaredQuantity: quantityText(qty) })
    }
    if (step === 2 && !lot && (!label.labelDate || !label.materialType)) return setError('El rótulo necesita la fecha y el tipo de material.')
    setStep(step === 1 && lot ? 3 : step + 1)
  }

  function back() {
    setError('')
    setStep(step === 3 && lot ? 1 : step - 1)
  }

  async function save() {
    setBusy(true)
    setError('')
    const clean = (v) => (v && String(v).trim() ? String(v).trim() : null)
    try {
      const result = await movementsApi.entry({
        itemId: item?.id || null,
        newItem: item ? null : {
          moduleId: module.id, name: newItem.name.trim(), presentation: clean(newItem.presentation), unitName: clean(newItem.unitName),
          minimumStock: parseNum(newItem.minimumStock) ?? 0,
        },
        lotId: lot?.id || null,
        label: lot ? null : labelToRequest(label),
        quantity: quantityToRequest(qty),
        location: location ? { rackId: location.rackId, level: location.level, note: clean(location.note) } : null,
        movementType: clean(meta.movementType), reason: clean(meta.reason), note: clean(meta.note), reference: clean(meta.reference),
        movementDate: meta.movementDate,
      })
      afterChange()
      toast('Entrada registrada')
      setSaved(result)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (!modulesLoaded) return <Loading />
  if (editableModules.length === 0) return <Notice type="info">Su rol solo consulta: no registra entradas.</Notice>

  if (saved) {
    return (
      <div className="card center stack" style={{ maxWidth: 560, margin: '30px auto', padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
          <Icon name="check" size={36} />
        </div>
        <h1>¡Entrada registrada!</h1>
        <p className="muted">{fmtNum(saved.quantity)} {saved.unitName} de <b>{saved.itemName}{saved.presentation ? ` ${saved.presentation}` : ''}</b>{saved.toLocation ? ` en ${saved.toLocation}` : ''}.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to={`/articulos/${saved.itemId}`} className="btn btn-primary">Ver el artículo</Link>
          <button className="btn" onClick={() => { setSaved(null); setStep(0); setItem(null); setNewItem(null); setLot(null); setQty(emptyQuantity(null, module)); setLocation(null); setLabel(emptyLabel(module?.defaultMaterial, todayIso())) }}>
            <Icon name="plus" /> Registrar otra
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={module ? `mod-${module.color}` : ''}>
      <div className="page-header">
        <div>
          <h1>Registrar entrada</h1>
          <p>{productName ? `${productName} · ${module?.name}` : 'Llegó mercancía: registre lo que dice el rótulo.'}</p>
        </div>
      </div>

      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i === 2 && lot ? 1 : i)}>
            <span className="n">{i < step ? '✓' : i + 1}</span>{s}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <StepItem module={module} editableModules={editableModules} chooseModule={chooseModule} item={item} pickItem={pickItem}
                    newItem={newItem} setNewItem={setNewItem} lot={lot} setLot={setLot} suggestions={suggestions} />
        )}
        {step === 1 && (
          <QuantityFields value={qty} onChange={setQty} unitName={unitName} containerSuggestions={suggestions.CONTENEDOR || []}
                          packagings={item?.packagings || []} showWeight={module?.tracksWeight} />
        )}
        {step === 2 && (
          <LabelForm value={label} onChange={setLabel} productName={productName} userName={user.fullName}
                     supplierSuggestions={suggestions.PROVEEDOR || []} responsibleSuggestions={suggestions.RESPONSABLE || []} />
        )}
        {step === 3 && <LocationPicker module={module} value={location} onChange={setLocation} />}
        {step === 4 && (
          <div className="stack">
            <div className="grid-2">
              <div className="stack-sm">
                <div className="total-box"><span className="muted">Entran</span><span className="big-number">{fmtNum(total)}</span><span className="strong">{unitName}</span></div>
                <div><span className="muted">Artículo:</span> <b>{productName}</b> <span className="muted">({module.name})</span></div>
                <div><span className="muted">Rótulo:</span> <b>{lot ? `el del ${fmtDate(lot.labelDate)}${lot.lotNumber ? `, lote ${lot.lotNumber}` : ''}` : `nuevo, del ${fmtDate(label.labelDate)}${label.lotNumber ? `, lote ${label.lotNumber}` : ''}`}</b></div>
                <div><span className="muted">Queda en:</span> <b>{location?.label || module.locationHint || 'Sin ubicación asignada'}</b></div>
                <div><span className="muted">Registra:</span> <b>{user.fullName}</b></div>
              </div>
              <div className="form-grid">
                <Field label="Tipo de movimiento" hint="Escriba el que sea">
                  <SuggestInput value={meta.movementType} onChange={(v) => setMeta({ ...meta, movementType: v })} suggestions={suggestions.TIPO_ENTRADA || []} chips={4} maxLength={60} />
                </Field>
                <Field label="Motivo">
                  <SuggestInput value={meta.reason} onChange={(v) => setMeta({ ...meta, reason: v })} suggestions={suggestions.MOTIVO_ENTRADA || []} chips={3} maxLength={120} placeholder="Opcional" />
                </Field>
                <Field label="Remisión o factura"><input value={meta.reference} onChange={(e) => setMeta({ ...meta, reference: e.target.value })} maxLength={60} placeholder="Opcional" /></Field>
                <Field label="Fecha"><input type="date" value={meta.movementDate} max={todayIso()} onChange={(e) => setMeta({ ...meta, movementDate: e.target.value })} /></Field>
                <Field label="Nota" className="span-all"><textarea rows={2} value={meta.note} onChange={(e) => setMeta({ ...meta, note: e.target.value })} maxLength={500} placeholder="Opcional" /></Field>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}><Notice type="error">{error}</Notice></div>
        <div className="row-between" style={{ marginTop: 16 }}>
          <button className="btn" onClick={step === 0 ? () => navigate(-1) : back} disabled={busy}>{step === 0 ? 'Cancelar' : 'Atrás'}</button>
          {step < 4
            ? <button className="btn btn-primary btn-lg" onClick={next}>Siguiente <Icon name="chevronRight" /></button>
            : <button className="btn btn-ok btn-lg" onClick={save} disabled={busy}><Icon name="check" /> {busy ? 'Guardando…' : 'Registrar entrada'}</button>}
        </div>
      </div>
    </div>
  )
}

function StepItem({ module, editableModules, chooseModule, item, pickItem, newItem, setNewItem, lot, setLot, suggestions }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const query = useDebounced(q, 250)

  useEffect(() => {
    if (!module) return
    itemsApi.search({ module: module.code, q: query || undefined, size: 12, status: 'TODOS' })
      .then((p) => setResults(p.content)).catch(() => setResults([]))
  }, [module, query])

  const lotsWithStock = useMemo(() => (item?.lots || []).filter((l) => Number(l.total) > 0), [item])

  return (
    <div className="stack">
      <div>
        <div className="label">Módulo</div>
        <div className="option-grid">
          {editableModules.map((m) => (
            <button key={m.code} type="button" className={`option mod-${m.color} ${module?.code === m.code ? 'active' : ''}`} onClick={() => chooseModule(m)}>
              <span className="mod-icon" style={{ width: 36, height: 36 }}><Icon name={m.icon} size={20} /></span>
              <b>{m.name}</b>
            </button>
          ))}
        </div>
      </div>

      {module && !item && !newItem && (
        <div className="stack-sm">
          <label htmlFor="item-q">¿Qué artículo es?</label>
          <input id="item-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar en ${module.name.toLowerCase()}…`} autoFocus />
          <div className="pick-list">
            {results.map((r) => (
              <button key={r.id} type="button" className="pick-item" onClick={() => itemsApi.get(r.id).then(pickItem)}>
                <div className="grow">
                  <div className="strong">{r.name}{r.presentation ? ` ${r.presentation}` : ''}</div>
                  <div className="tiny muted">{fmtNum(r.total)} {r.unitName} · {r.lots} rótulos</div>
                </div>
                <Icon name="chevronRight" />
              </button>
            ))}
            <button type="button" className="pick-item" onClick={() => setNewItem({ name: q, presentation: '', unitName: module.defaultUnit, minimumStock: '' })}>
              <Icon name="plus" /> <span className="strong">{q ? `Crear “${q}” como artículo nuevo` : 'Es un artículo nuevo'}</span>
            </button>
          </div>
        </div>
      )}

      {newItem && (
        <div className="stack-sm">
          <div className="row-between"><h3>Artículo nuevo</h3><button className="btn-link small" onClick={() => setNewItem(null)}>Buscar otro</button></div>
          <div className="form-grid">
            <Field label="Nombre" required><input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} maxLength={150} autoFocus /></Field>
            <Field label="Presentación"><input value={newItem.presentation} onChange={(e) => setNewItem({ ...newItem, presentation: e.target.value })} maxLength={60} placeholder="x250 ml, delantera…" /></Field>
            <Field label="Se cuenta en"><SuggestInput value={newItem.unitName} onChange={(v) => setNewItem({ ...newItem, unitName: v })} suggestions={suggestions.UNIDAD || []} maxLength={30} /></Field>
            <Field label="Avisar cuando queden" hint="Opcional"><input inputMode="decimal" value={newItem.minimumStock} onChange={(e) => setNewItem({ ...newItem, minimumStock: e.target.value })} /></Field>
          </div>
        </div>
      )}

      {item && (
        <div className="stack">
          <div className="row-between card card-tight" style={{ background: 'var(--mod-soft)' }}>
            <div>
              <div className="strong">{item.name}{item.presentation ? ` ${item.presentation}` : ''}</div>
              <div className="small muted">Hay {fmtNum(item.total)} {item.unitName}</div>
            </div>
            <button className="btn btn-sm" onClick={() => chooseModule(module)}>Cambiar</button>
          </div>
          <div>
            <div className="label">¿El rótulo es nuevo o ya existe?</div>
            <div className="option-grid">
              <button type="button" className={`option ${!lot ? 'active' : ''}`} onClick={() => setLot(null)}>
                <Icon name="rotulo" size={22} /><b>Rótulo nuevo</b><span>Llegó con su propio rótulo</span>
              </button>
              {lotsWithStock.map((l) => (
                <button key={l.id} type="button" className={`option ${lot?.id === l.id ? 'active' : ''}`} onClick={() => setLot(l)}>
                  <Icon name="plus" size={22} /><b>Sumar al del {fmtDate(l.labelDate)}</b>
                  <span>{l.lotNumber ? `Lote ${l.lotNumber} · ` : ''}{fmtNum(l.total)} {item.unitName}</span>
                </button>
              ))}
            </div>
          </div>
          {lot && <LabelView lot={lot} productName={`${item.name}${item.presentation ? ` ${item.presentation}` : ''}`} />}
        </div>
      )}
    </div>
  )
}
