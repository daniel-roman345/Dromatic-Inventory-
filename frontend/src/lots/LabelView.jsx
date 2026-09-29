import { fmtDate } from '../shared/format'
import { QualityBadge } from '../shared/ui'

/** Rótulo en pequeño y de solo lectura, con los datos que se copiaron del papel. */
export default function LabelView({ lot, productName }) {
  const cell = (key, value, nowrap = false) => (
    <div className="rotulo-cell">
      <span className="rotulo-key">{key}</span>
      <span className={`readonly-hand grow ${nowrap ? 'nowrap' : ''}`}>{value || '—'}</span>
    </div>
  )
  const row = (...cells) => (
    <div className="rotulo-row split" style={{ gridTemplateColumns: cells.length === 1 ? '1fr' : '1fr 1fr' }}>{cells}</div>
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
      {row(<Cell key="p" c={cell('Producto:', productName)} />)}
      {row(<Cell key="f" c={cell('Fecha:', fmtDate(lot.labelDate), true)} />, <Cell key="l" c={cell('Lote:', lot.lotNumber)} />)}
      {row(<Cell key="c" c={cell('Cantidad:', lot.declaredQuantity)} />, <Cell key="t" c={cell('Tipo:', lot.materialType)} />)}
      {lot.supplier && row(<Cell key="s" c={cell('Proveedor:', lot.supplier)} />)}
      {(lot.receptionDate || lot.expiryDate) && row(
        <Cell key="r" c={cell('Recepción:', fmtDate(lot.receptionDate), true)} />, <Cell key="v" c={cell('Vence:', fmtDate(lot.expiryDate), true)} />,
      )}
      {(lot.analysisNumber || lot.analysisDate) && row(
        <Cell key="an" c={cell('Nº análisis:', lot.analysisNumber)} />, <Cell key="ad" c={cell('Fecha análisis:', fmtDate(lot.analysisDate), true)} />,
      )}
      {(lot.responsible || lot.qcSignature) && row(
        <Cell key="re" c={cell('Responsable:', lot.responsible)} />, <Cell key="qc" c={cell('Calidad:', lot.qcSignature)} />,
      )}
    </div>
  )
}

function Cell({ c }) {
  return c
}
