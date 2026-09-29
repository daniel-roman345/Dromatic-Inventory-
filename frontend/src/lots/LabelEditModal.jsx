import { useState } from 'react'
import { lotsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useSuggestions } from '../app/AppDataContext'
import LabelForm, { labelToRequest } from './LabelForm'
import { Modal, Notice, useToast } from '../shared/ui'

/** Corregir lo que se copió del rótulo (ej. un número de lote mal escrito). */
export default function LabelEditModal({ lot, productName, moduleId, onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const suggestions = useSuggestions(moduleId)
  const [label, setLabel] = useState(() => {
    const v = {}
    for (const k of ['labelDate', 'materialType', 'lotNumber', 'declaredQuantity', 'supplier', 'receptionDate', 'analysisDate',
      'reanalysisDate', 'expiryDate', 'analysisNumber', 'reanalysisNumber', 'responsible', 'qcSignature', 'nfpaSpecial', 'notes']) {
      v[k] = lot[k] ?? ''
    }
    v.qualityStickers = lot.qualityStickers?.length ? [...lot.qualityStickers] : lot.qualityStatus ? [lot.qualityStatus] : []
    v.nfpaHealth = lot.nfpaHealth ?? null
    v.nfpaFlammability = lot.nfpaFlammability ?? null
    v.nfpaReactivity = lot.nfpaReactivity ?? null
    return v
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!label.labelDate || !label.materialType) return setError('La fecha y el tipo de material son obligatorios.')
    setBusy(true)
    try {
      await lotsApi.update(lot.id, labelToRequest(label))
      toast('Rótulo corregido')
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Modal title="Corregir rótulo" size="xl" onClose={onClose} busy={busy}
           footer={<><button className="btn" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={busy}>Guardar</button></>}>
      <div className="stack">
        <LabelForm value={label} onChange={setLabel} productName={productName} userName={user.fullName}
                   supplierSuggestions={suggestions.PROVEEDOR || []} responsibleSuggestions={suggestions.RESPONSABLE || []} />
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}
