import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { itemsApi, movementsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAppData, useSuggestions } from '../app/AppDataContext'
import ItemStockPicker, { stockRowsFefo } from './ItemStockPicker'
import Icon from '../shared/Icon'
import { fmtDate, fmtNum, parseNum, todayIso } from '../shared/format'
import { Empty, Field, Notice, QualityBadge, SuggestInput, useToast } from '../shared/ui'

/**
 * Registrar salida de uno o varios productos. Se muestra primero el rótulo que
 * vence antes (o el más antiguo), como piden las buenas prácticas de almacenamiento.
 */
export default function ExitPage() {
  const [params] = useSearchParams()
  const toast = useToast()
  const { afterChange } = useAppData()
  const [item, setItem] = useState(null)
  const [cart, setCart] = useState([])
  const [meta, setMeta] = useState({ movementType: params.get('tipo') || 'Salida', reason: '', reference: '', note: '', movementDate: todayIso() })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const suggestions = useSuggestions(item?.module.id ?? null)

  useEffect(() => {
    const id = params.get('articulo')
    if (id) itemsApi.get(id).then(setItem).catch(() => {})
  }, [params])

  function add(lot, s, quantity) {
    const q = parseNum(quantity)
    if (!q || q <= 0) return toast('Escriba cuánto sale.', 'error')
    if (q > Number(s.quantity)) return toast(`Solo hay ${fmtNum(s.quantity)} ${item.unitName} ahí.`, 'error')
    setCart((c) => [...c.filter((l) => l.stockId !== s.id), {
      stockId: s.id, quantity: q, itemName: `${item.name}${item.presentation ? ` ${item.presentation}` : ''}`, unitName: item.unitName,
      location: s.locationName, lotNumber: lot.lotNumber, labelDate: lot.labelDate, qualityStatus: lot.qualityStatus, max: Number(s.quantity),
    }])
  }

  async function save() {
    if (cart.length === 0) return setError('Agregue al menos un producto a la salida.')
    setBusy(true)
    setError('')
    const clean = (v) => (v && String(v).trim() ? String(v).trim() : null)
    try {
      const result = await movementsApi.exit({
        lines: cart.map((l) => ({ stockId: l.stockId, quantity: { total: l.quantity } })),
        movementType: clean(meta.movementType), reason: clean(meta.reason), note: clean(meta.note), reference: clean(meta.reference), movementDate: meta.movementDate,
      })
      afterChange()
      toast('Salida registrada')
      setDone(result)
      setCart([])
      setItem(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="card center stack" style={{ maxWidth: 560, margin: '30px auto', padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
          <Icon name="check" size={36} />
        </div>
        <h1>¡Salida registrada!</h1>
        <div className="stack-sm">
          {done.map((m) => <div key={m.id}>{fmtNum(m.quantity)} {m.unitName} de <b>{m.itemName}</b> desde {m.fromLocation || 'sin ubicación'}</div>)}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setDone(null)}><Icon name="plus" /> Registrar otra salida</button>
          <Link to="/movimientos" className="btn">Ver movimientos</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Registrar salida</h1>
          <p>Busque el producto, escoja de qué rótulo sale y cuánto. Puede sacar varios productos a la vez.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
        <div className="stack">
          <div className="card"><ItemStockPicker onPick={setItem} /></div>
          {item && <ItemRows item={item} onAdd={add} cart={cart} />}
        </div>

        <div className="card panel-sticky stack">
          <h2>Lo que sale ({cart.length})</h2>
          {cart.length === 0 ? <Empty icon="exit" title="Todavía no ha agregado nada" /> : (
            <div className="stack-sm">
              {cart.map((l) => (
                <div key={l.stockId} className="card card-tight">
                  <div className="row-between">
                    <div>
                      <div className="strong small">{l.itemName}</div>
                      <div className="tiny muted">{l.location}{l.lotNumber ? ` · lote ${l.lotNumber}` : ''}</div>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="strong text-danger">−{fmtNum(l.quantity)}</span>
                      <button className="icon-btn" onClick={() => setCart((c) => c.filter((x) => x.stockId !== l.stockId))} aria-label="Quitar"><Icon name="close" /></button>
                    </div>
                  </div>
                  {(l.qualityStatus === 'CUARENTENA' || l.qualityStatus === 'RECHAZADO') && (
                    <div style={{ marginTop: 6 }}><Notice type="warn">Está en {l.qualityStatus === 'CUARENTENA' ? 'cuarentena' : 'estado rechazado'}: verifique con calidad.</Notice></div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Field label="Tipo de movimiento" hint="Escriba el que sea">
            <SuggestInput value={meta.movementType} onChange={(v) => setMeta({ ...meta, movementType: v })} suggestions={suggestions.TIPO_SALIDA || []} chips={4} maxLength={60} />
          </Field>
          <Field label="Motivo">
            <SuggestInput value={meta.reason} onChange={(v) => setMeta({ ...meta, reason: v })} suggestions={suggestions.MOTIVO_SALIDA || []} chips={3} maxLength={120} placeholder="Opcional" />
          </Field>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Field label="Orden o remisión"><input value={meta.reference} onChange={(e) => setMeta({ ...meta, reference: e.target.value })} maxLength={60} placeholder="Opcional" /></Field>
            <Field label="Fecha"><input type="date" value={meta.movementDate} max={todayIso()} onChange={(e) => setMeta({ ...meta, movementDate: e.target.value })} /></Field>
          </div>
          <Field label="Nota"><textarea rows={2} value={meta.note} onChange={(e) => setMeta({ ...meta, note: e.target.value })} maxLength={500} placeholder="Opcional" /></Field>
          <Notice type="error">{error}</Notice>
          <button className="btn btn-danger btn-lg" onClick={save} disabled={busy || cart.length === 0}><Icon name="exit" /> {busy ? 'Guardando…' : 'Registrar salida'}</button>
        </div>
      </div>
    </div>
  )
}

function ItemRows({ item, onAdd, cart }) {
  const rows = stockRowsFefo(item)
  return (
    <div className={`card mod-${item.module.color}`}>
      <div className="card-header">
        <div>
          <h2>{item.name}{item.presentation ? ` ${item.presentation}` : ''}</h2>
          <div className="small muted">Hay {fmtNum(item.total)} {item.unitName} · el primero es el que debe salir primero</div>
        </div>
      </div>
      <div className="stack-sm">
        {rows.map(({ lot, s }, i) => (
          <StockRow key={s.id} lot={lot} s={s} first={i === 0 && rows.length > 1} unit={item.unitName} onAdd={onAdd} inCart={cart.some((c) => c.stockId === s.id)} />
        ))}
      </div>
    </div>
  )
}

function StockRow({ lot, s, first, unit, onAdd, inCart }) {
  const [value, setValue] = useState('')
  const per = s.unitsPerContainer ? Number(s.unitsPerContainer) : null
  return (
    <div className="card card-tight" style={{ borderLeft: first ? '4px solid var(--ok)' : undefined, borderRadius: first ? 0 : undefined }}>
      <div className="row-between">
        <div>
          <div className="row" style={{ gap: 6 }}>
            <span className="strong">{fmtNum(s.quantity)} {unit}</span>
            {first && <span className="badge badge-ok">Sale primero</span>}
            <QualityBadge status={lot.qualityStatus} />
            {inCart && <span className="badge badge-info">En la salida</span>}
          </div>
          <div className="tiny muted">
            <Icon name="pin" size={12} /> {s.locationName} · rótulo del {fmtDate(lot.labelDate)}{lot.lotNumber ? ` · lote ${lot.lotNumber}` : ''}{lot.expiryDate ? ` · vence ${fmtDate(lot.expiryDate)}` : ''}
          </div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 8, gap: 6 }}>
        <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="¿Cuánto?" style={{ width: 120 }}
               onKeyDown={(e) => e.key === 'Enter' && (onAdd(lot, s, value), setValue(''))} />
        {per && Number(s.quantity) >= per && <button className="chip" onClick={() => setValue(String(per))}>1 {s.containerName || 'contenedor'} ({fmtNum(per)})</button>}
        <button className="chip" onClick={() => setValue(String(Number(s.quantity)))}>Todo ({fmtNum(s.quantity)})</button>
        <button className="btn btn-sm btn-primary" onClick={() => { onAdd(lot, s, value); setValue('') }}><Icon name="plus" /> Agregar</button>
      </div>
    </div>
  )
}
