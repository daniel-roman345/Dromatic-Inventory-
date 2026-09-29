import { fmtDate } from '../shared/format'
import { QualityBadge } from '../shared/ui'

/** Rótulo en pequeño y de solo lectura, con los datos que se copiaron del papel. */
export default function LabelView({ lot, productName }) {
  const cell = (key, value) => (
    <div className="rotulo-cell">
      <span className="rotulo-key">{key}</span>
      <span className="readonly-hand grow" style={{ fontSize: '.9rem' }}>{value || '—'}</span>
    </div>
  )
  const nfpa = [lot.nfpaHealth, lot.nfpaFlammability, lot.nfpaReactivity].some((v) => v !== null && v !== undefined)
  return (
    <div className="rotulo mini">
      <div className="rotulo-row rotulo-head">
        <div className="rotulo-cell rotulo-title">RÓTULO DE IDENTIFICACIÓN</div>
        <div className="rotulo-cell" style={{ gap: 6 }}>
          <QualityBadge status={lot.qualityStatus} />
          {nfpa && (
            <span className="tiny muted" title="Rombo NFPA: salud · inflamabilidad · reactividad">
              NFPA {lot.nfpaHealth ?? '–'}·{lot.nfpaFlammability ?? '–'}·{lot.nfpaReactivity ?? '–'}{lot.nfpaSpecial ? ` ${lot.nfpaSpecial}` : ''}
            </span>
          )}
        </div>
      </div>
      <div className="rotulo-row" style={{ gridTemplateColumns: '1fr' }}>{cell('Producto:', productName)}</div>
      <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {cell('Fecha:', fmtDate(lot.labelDate))}
        {cell('Cantidad:', lot.declaredQuantity)}
        {cell('Lote:', lot.lotNumber)}
      </div>
      <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {cell('Tipo:', lot.materialType)}
        {cell('Proveedor:', lot.supplier)}
      </div>
      {(lot.receptionDate || lot.expiryDate || lot.analysisNumber || lot.analysisDate) && (
        <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {cell('Recepción:', fmtDate(lot.receptionDate))}
          {cell('Vence:', fmtDate(lot.expiryDate))}
          {cell('Análisis:', lot.analysisNumber)}
        </div>
      )}
      {(lot.responsible || lot.qcSignature) && (
        <div className="rotulo-row split" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {cell('Responsable:', lot.responsible)}
          {cell('Control calidad:', lot.qcSignature)}
        </div>
      )}
    </div>
  )
}
