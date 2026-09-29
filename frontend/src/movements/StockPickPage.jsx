import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { itemsApi } from '../api/services'
import { useAppData } from '../app/AppDataContext'
import ItemStockPicker, { stockRowsFefo } from './ItemStockPicker'
import { AdjustModal, TransferModal, toStock } from './StockActionModals'
import Icon from '../shared/Icon'
import { fmtDate, fmtNum } from '../shared/format'
import { QualityBadge } from '../shared/ui'

/** Trasladar o contar: escoger el producto y el rótulo, y abrir la ventana correspondiente. */
export default function StockPickPage({ mode }) {
  const [params] = useSearchParams()
  const { afterChange, moduleById } = useAppData()
  const [item, setItem] = useState(null)
  const [modal, setModal] = useState(null)
  const isTransfer = mode === 'TRASLADO'
  const type = params.get('tipo') || (isTransfer ? 'Traslado' : 'Conteo físico')

  useEffect(() => {
    const id = params.get('articulo')
    if (id) itemsApi.get(id).then(setItem).catch(() => {})
  }, [params])

  function reload() {
    afterChange()
    if (item) itemsApi.get(item.id).then(setItem)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isTransfer ? 'Trasladar' : 'Contar y corregir'}</h1>
          <p>{isTransfer ? 'Mueva mercancía de un piso o fila a otro. El total no cambia.' : 'Escriba lo que contó y el sistema corrige la diferencia.'}</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: '.85rem' }}>Tipo: {type}</span>
      </div>
      <div className="stack">
        <div className="card"><ItemStockPicker onPick={setItem} /></div>
        {item && (
          <div className={`card mod-${item.module.color}`}>
            <div className="card-header"><h2>{item.name}{item.presentation ? ` ${item.presentation}` : ''}</h2><span className="small muted">Hay {fmtNum(item.total)} {item.unitName}</span></div>
            <div className="stack-sm">
              {stockRowsFefo(item).map(({ lot, s }) => (
                <div key={s.id} className="card card-tight row-between">
                  <div>
                    <div className="row" style={{ gap: 6 }}><span className="strong">{fmtNum(s.quantity)} {item.unitName}</span><QualityBadge status={lot.qualityStatus} /></div>
                    <div className="tiny muted"><Icon name="pin" size={12} /> {s.locationName} · rótulo del {fmtDate(lot.labelDate)}{lot.lotNumber ? ` · lote ${lot.lotNumber}` : ''}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal(toStock(s, {
                    itemName: `${item.name}${item.presentation ? ` ${item.presentation}` : ''}`, unitName: item.unitName, moduleId: item.module.id,
                    qualityStatus: lot.qualityStatus, lotNumber: lot.lotNumber,
                  }))}>
                    <Icon name={isTransfer ? 'swap' : 'adjust'} /> {isTransfer ? 'Trasladar' : 'Contar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {modal && isTransfer && <TransferModal stock={modal} module={moduleById(item.module.id) || item.module} defaultType={type} onClose={() => setModal(null)} onDone={reload} />}
      {modal && !isTransfer && <AdjustModal stock={modal} defaultType={type} onClose={() => setModal(null)} onDone={reload} />}
    </div>
  )
}
