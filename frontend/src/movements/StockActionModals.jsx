import { useState } from 'react'
import { movementsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData, useSuggestions } from '../app/AppDataContext'
import LocationPicker from '../maps/LocationPicker'
import QuantityFields, { emptyQuantity, quantityToRequest, quantityTotal } from './QuantityFields'
import Icon from '../shared/Icon'
import { fmtNum, parseNum, todayIso } from '../shared/format'
import { Field, Modal, Notice, QualityBadge, SuggestInput, useToast } from '../shared/ui'

/**
 * Acciones sobre una existencia (un rótulo en una ubicación).
 * stock = { stockId, itemName, unitName, quantity, containerName, unitsPerContainer,
 *           weightKg, locationName, rackId, level, moduleId, qualityStatus, lotNumber }
 */

function StockSummary({ stock }) {
  return (
    <div className="card card-tight" style={{ background: '#fafafa' }}>
      <div className="strong">{stock.itemName}</div>
      <div className="small muted">{stock.lotNumber ? `Lote ${stock.lotNumber} · ` : ''}{stock.locationName}</div>
      <div className="row" style={{ marginTop: 4, gap: 6 }}>
        <span className="strong">Hay {fmtNum(stock.quantity)} {stock.unitName}</span>
        {stock.weightKg && <span className="small muted">· {fmtNum(stock.weightKg)} kg</span>}
        <QualityBadge status={stock.qualityStatus} />
      </div>
    </div>
  )
}

function MovementMeta({ effect, meta, setMeta, suggestions, withReference }) {
  const set = (f) => (v) => setMeta({ ...meta, [f]: v?.target ? v.target.value : v })
  return (
    <div className="form-grid">
      <Field label="Tipo de movimiento" hint="Escriba el que sea; estos son los más usados.">
        <SuggestInput value={meta.movementType} onChange={set('movementType')} suggestions={suggestions[`TIPO_${effect}`] || []} chips={4} maxLength={60} />
      </Field>
      <Field label="Motivo">
        <SuggestInput value={meta.reason} onChange={set('reason')} suggestions={suggestions[`MOTIVO_${effect}`] || []} chips={4} maxLength={120} placeholder="Opcional" />
      </Field>
      {withReference && (
        <Field label="Documento o referencia">
          <input value={meta.reference} onChange={set('reference')} maxLength={60} placeholder="Remisión, orden de producción… (opcional)" />
        </Field>
      )}
      <Field label="Fecha">
        <input type="date" value={meta.movementDate} max={todayIso()} onChange={set('movementDate')} />
      </Field>
      <Field label="Nota" className="span-all">
        <textarea rows={2} value={meta.note} onChange={set('note')} maxLength={500} placeholder="Cualquier detalle que sirva después (opcional)" />
      </Field>
    </div>
  )
}

const newMeta = (type) => ({ movementType: type, reason: '', reference: '', note: '', movementDate: todayIso() })
const clean = (v) => (v && String(v).trim() ? String(v).trim() : null)

function useSubmit(onDone) {
  const toast = useToast()
  const { afterChange } = useAppData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run(action, message) {
    setBusy(true)
    setError('')
    try {
      const result = await action()
      afterChange()
      toast(message)
      onDone?.(result)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

/* ── Sacar ─────────────────────────────────────────────────────────── */
export function ExitModal({ stock, defaultType = 'Salida', onClose, onDone }) {
  const suggestions = useSuggestions(stock.moduleId)
  const [qty, setQty] = useState(emptyQuantity({ lastContainerName: stock.containerName, lastUnitsPerContainer: stock.unitsPerContainer }))
  const [meta, setMeta] = useState(newMeta(defaultType))
  const { busy, error, setError, run } = useSubmit((r) => { onDone?.(r); onClose() })
  const total = quantityTotal(qty)
  const risky = stock.qualityStatus === 'CUARENTENA' || stock.qualityStatus === 'RECHAZADO'

  function submit() {
    if (!total) return setError('Escriba cuánto va a sacar.')
    if (total > Number(stock.quantity)) return setError(`Solo hay ${fmtNum(stock.quantity)} ${stock.unitName}.`)
    run(() => movementsApi.exit({
      lines: [{ stockId: stock.stockId, quantity: quantityToRequest(qty) }],
      movementType: clean(meta.movementType), reason: clean(meta.reason), note: clean(meta.note),
      reference: clean(meta.reference), movementDate: meta.movementDate,
    }), `Salida registrada: ${fmtNum(total)} ${stock.unitName}`)
  }

  return (
    <Modal title="Sacar mercancía" size="lg" onClose={onClose} busy={busy}
           footer={<>
             <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
             <button className="btn" onClick={() => setQty({ ...qty, mode: 'total', total: String(stock.quantity) })} disabled={busy}>Sacar todo</button>
             <button className="btn btn-danger" onClick={submit} disabled={busy}><Icon name="exit" /> {busy ? 'Guardando…' : 'Registrar salida'}</button>
           </>}>
      <div className="stack">
        <StockSummary stock={stock} />
        {risky && <Notice type="warn">Este rótulo está en <b>{stock.qualityStatus === 'CUARENTENA' ? 'cuarentena' : 'estado rechazado'}</b>. Verifique con control de calidad antes de enviarlo a producción.</Notice>}
        <QuantityFields value={qty} onChange={setQty} unitName={stock.unitName} max={stock.quantity}
                        containerSuggestions={suggestions.CONTENEDOR || []} showWeight={Boolean(stock.weightKg)} />
        <MovementMeta effect="SALIDA" meta={meta} setMeta={setMeta} suggestions={suggestions} withReference />
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}

/* ── Trasladar ─────────────────────────────────────────────────────── */
export function TransferModal({ stock, module, defaultType = 'Traslado', onClose, onDone }) {
  const suggestions = useSuggestions(stock.moduleId)
  const [all, setAll] = useState(true)
  const [qty, setQty] = useState({ ...emptyQuantity(null), mode: 'total' })
  const [to, setTo] = useState(null)
  const [meta, setMeta] = useState(newMeta(defaultType))
  const { busy, error, setError, run } = useSubmit((r) => { onDone?.(r); onClose() })

  function submit() {
    if (!to || (!to.rackId && !clean(to.note))) return setError('Escoja a dónde lo va a trasladar.')
    const total = all ? Number(stock.quantity) : quantityTotal(qty)
    if (!total) return setError('Escriba cuánto va a trasladar.')
    if (total > Number(stock.quantity)) return setError(`Solo hay ${fmtNum(stock.quantity)} ${stock.unitName}.`)
    run(() => movementsApi.transfer({
      stockId: stock.stockId,
      quantity: all ? null : quantityToRequest(qty),
      to: { rackId: to.rackId, level: to.level, note: clean(to.note) },
      movementType: clean(meta.movementType), reason: clean(meta.reason), note: clean(meta.note),
      movementDate: meta.movementDate,
    }), `Trasladado a ${to.label}`)
  }

  return (
    <Modal title="Trasladar a otra ubicación" size="xl" onClose={onClose} busy={busy}
           footer={<>
             <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
             <button className="btn btn-primary" onClick={submit} disabled={busy}><Icon name="swap" /> {busy ? 'Guardando…' : 'Trasladar'}</button>
           </>}>
      <div className="stack">
        <StockSummary stock={stock} />
        <div className="segmented">
          <button type="button" className={all ? 'active' : ''} onClick={() => setAll(true)}>Todo ({fmtNum(stock.quantity)})</button>
          <button type="button" className={!all ? 'active' : ''} onClick={() => setAll(false)}>Solo una parte</button>
        </div>
        {!all && <QuantityFields value={qty} onChange={setQty} unitName={stock.unitName} max={stock.quantity} containerSuggestions={suggestions.CONTENEDOR || []} />}
        <h3>¿A dónde va?</h3>
        <LocationPicker module={module} value={to} onChange={setTo} allowNone={false}
                        exclude={stock.rackId ? { rackId: stock.rackId, level: stock.level } : null} />
        <MovementMeta effect="TRASLADO" meta={meta} setMeta={setMeta} suggestions={suggestions} />
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}

/* ── Contar (ajuste por conteo físico) ─────────────────────────────── */
export function AdjustModal({ stock, defaultType = 'Conteo físico', onClose, onDone }) {
  const suggestions = useSuggestions(stock.moduleId)
  const [counted, setCounted] = useState('')
  const [weight, setWeight] = useState('')
  const [meta, setMeta] = useState({ ...newMeta(defaultType), reason: '' })
  const { busy, error, setError, run } = useSubmit((r) => { onDone?.(r); onClose() })
  const n = parseNum(counted)
  const diff = n === null ? null : Math.round((n - Number(stock.quantity)) * 1000) / 1000

  function submit() {
    if (n === null || n < 0) return setError('Escriba cuánto contó (puede ser 0).')
    if (diff === 0 && !parseNum(weight)) return setError('Lo contado es igual a lo registrado: no hay nada que ajustar.')
    run(() => movementsApi.adjust({
      stockId: stock.stockId, countedQuantity: n, countedWeightKg: parseNum(weight),
      movementType: clean(meta.movementType), reason: clean(meta.reason), note: clean(meta.note), movementDate: meta.movementDate,
    }), 'Conteo guardado')
  }

  return (
    <Modal title="Contar y corregir" size="lg" onClose={onClose} busy={busy}
           footer={<>
             <button className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
             <button className="btn btn-primary" onClick={submit} disabled={busy}><Icon name="check" /> {busy ? 'Guardando…' : 'Guardar conteo'}</button>
           </>}>
      <div className="stack">
        <StockSummary stock={stock} />
        <div className="grid-2">
          <Field label={`¿Cuánto contó? (${stock.unitName})`}>
            <input className="input-big" inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} autoFocus />
          </Field>
          <Field label="Peso contado (kg) · opcional">
            <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>
        {diff !== null && diff !== 0 && (
          <Notice type={diff > 0 ? 'ok' : 'warn'}>
            {diff > 0 ? `Sobran ${fmtNum(diff)}` : `Faltan ${fmtNum(-diff)}`} {stock.unitName} frente a lo registrado.
          </Notice>
        )}
        <MovementMeta effect="AJUSTE" meta={meta} setMeta={setMeta} suggestions={suggestions} />
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}

/** Convierte una fila de la API (contenido de un piso o existencia del artículo) al formato de estas ventanas. */
export function toStock(source, extra = {}) {
  return {
    stockId: source.stockId ?? source.id,
    itemName: source.itemName ?? extra.itemName,
    unitName: source.unitName ?? extra.unitName,
    quantity: source.quantity,
    containerName: source.containerName,
    unitsPerContainer: source.unitsPerContainer,
    weightKg: source.weightKg,
    locationName: source.locationName ?? extra.locationName,
    rackId: source.rackId ?? extra.rackId,
    level: source.level ?? extra.level,
    moduleId: extra.moduleId,
    qualityStatus: source.qualityStatus ?? extra.qualityStatus,
    lotNumber: source.lotNumber ?? extra.lotNumber,
  }
}
