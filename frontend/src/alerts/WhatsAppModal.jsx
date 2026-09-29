import { useEffect, useState } from 'react'
import { alertsApi, itemsApi } from '../api/services'
import { errorMessage } from '../api/client'
import Icon from '../shared/Icon'
import { Loading, Modal, Notice, SuggestInput, useDebounced } from '../shared/ui'

/**
 * Aviso por WhatsApp con el mensaje listo (producto, novedad, cuánto hay y dónde).
 * No se envía solo: se abre el chat de WhatsApp y la persona presiona enviar.
 */
const HEADLINES = ['Stock bajo', 'Producto agotado', 'Producto dañado', 'Revisar con calidad', 'Llegó el pedido']

export default function WhatsAppModal({ itemId, alertId, onClose }) {
  const [headline, setHeadline] = useState('')
  const [note, setNote] = useState('')
  const [state, setState] = useState({ loading: true })
  const h = useDebounced(headline, 400)
  const n = useDebounced(note, 400)

  useEffect(() => {
    let alive = true
    const request = alertId && !h && !n ? alertsApi.whatsapp(alertId) : itemsApi.whatsapp(itemId, h || undefined, n || undefined)
    request.then((data) => alive && setState({ data })).catch((error) => alive && setState({ error }))
    return () => { alive = false }
  }, [itemId, alertId, h, n])

  return (
    <Modal title="Avisar por WhatsApp" size="lg" onClose={onClose}>
      <div className="stack">
        <div className="form-grid">
          <div className="field">
            <label>Novedad</label>
            <SuggestInput value={headline} onChange={setHeadline} suggestions={HEADLINES} chips={5} placeholder="Si la deja vacía se calcula sola" maxLength={80} />
          </div>
          <div className="field">
            <label>Comentario</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Opcional" />
          </div>
        </div>
        {state.loading ? <Loading text="Armando el mensaje…" /> : state.error ? <Notice type="error">{errorMessage(state.error)}</Notice> : (
          <>
            <div className="card" style={{ background: '#e7fbe9', borderColor: '#bfe8c5', whiteSpace: 'pre-wrap', fontSize: '.92rem' }}>
              {state.data.message}
            </div>
            <div className="row">
              {state.data.recipients.map((r) => (
                <a key={r.phone} href={r.url} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" /> Enviar a {r.name}
                </a>
              ))}
              <a href={state.data.anyContactUrl} target="_blank" rel="noreferrer" className="btn">
                <Icon name="whatsapp" /> Escoger otro contacto
              </a>
              <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(state.data.message)}><Icon name="copy" /> Copiar texto</button>
            </div>
            {state.data.recipients.length === 0 && (
              <Notice type="info">Nadie tiene WhatsApp registrado para recibir alertas. El administrador lo configura en Usuarios.</Notice>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
