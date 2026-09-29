import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { fmtDate, fmtDateTime, fmtNum } from '../shared/format'

const EFFECT_ICON = { ENTRADA: 'entry', SALIDA: 'exit', TRASLADO: 'swap', AJUSTE: 'adjust' }

/** Tabla del historial. {@code showItem} muestra la columna del artículo. */
export default function MovementTable({ rows, showItem = true, onVoid }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th><th>Tipo</th>{showItem && <th>Artículo</th>}<th className="right">Cantidad</th><th>Desde</th><th>Hacia</th><th>Motivo</th><th>Registró</th>{onVoid && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className={m.voided ? 'voided' : ''} title={m.voided ? `Anulado por ${m.voidedBy}: ${m.voidReason}` : m.note || ''}>
              <td className="nowrap">
                <div>{fmtDate(m.movementDate)}</div>
                <div className="tiny muted">{fmtDateTime(m.createdAt).split(',')[1]}</div>
              </td>
              <td>
                <span className={`row ${m.stockDelta > 0 ? 'text-ok' : m.stockDelta < 0 ? 'text-danger' : ''}`} style={{ gap: 5, flexWrap: 'nowrap' }}>
                  <Icon name={EFFECT_ICON[m.effect]} size={16} /> <span className="strong">{m.movementType}</span>
                </span>
                {m.voided && <span className="badge badge-gray">Anulado</span>}
              </td>
              {showItem && (
                <td><Link to={`/articulos/${m.itemId}`} className="strong">{m.itemName}{m.presentation ? ` ${m.presentation}` : ''}</Link>
                  <div className="tiny muted">{m.moduleName}{m.lotNumber ? ` · Lote ${m.lotNumber}` : ''}</div></td>
              )}
              <td className="right nowrap">
                <span className="strong">{m.stockDelta > 0 ? '+' : m.stockDelta < 0 ? '−' : ''}{fmtNum(m.quantity)}</span> <span className="small muted">{m.unitName}</span>
                {m.containers && <div className="tiny muted">{fmtNum(m.containers)} {m.containerName} × {fmtNum(m.unitsPerContainer)}</div>}
                {m.weightKg && <div className="tiny muted">{fmtNum(m.weightKg)} kg</div>}
              </td>
              <td className="small">{m.fromLocation || '—'}</td>
              <td className="small">{m.toLocation || '—'}</td>
              <td className="small">{m.reason || '—'}{m.reference && <div className="tiny muted">Ref. {m.reference}</div>}</td>
              <td className="small">{m.createdBy}</td>
              {onVoid && (
                <td>{!m.voided && <button className="btn btn-sm btn-ghost" onClick={() => onVoid(m)} title="Anular este movimiento"><Icon name="close" /></button>}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
