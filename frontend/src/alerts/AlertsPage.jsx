import { useState } from 'react'
import { Link } from 'react-router-dom'
import { alertsApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useAppData } from '../app/AppDataContext'
import WhatsAppModal from './WhatsAppModal'
import Icon from '../shared/Icon'
import { fmtAgo, fmtDateTime, fmtNum } from '../shared/format'
import { Empty, Loading, Notice, useLoad, useToast } from '../shared/ui'

const EMAIL = {
  ENVIADO: ['badge-ok', 'Correo enviado'],
  PENDIENTE: ['badge-gray', 'Enviando correo…'],
  ERROR: ['badge-danger', 'El correo falló'],
  SIN_CONFIGURAR: ['badge-gray', 'Correo sin configurar'],
  SIN_DESTINATARIOS: ['badge-warn', 'Sin destinatario de correo'],
}

/** Productos en stock bajo: avisar por WhatsApp o correo y marcar que ya se pidió. */
export default function AlertsPage() {
  const { isAdmin } = useAuth()
  const { refreshAlerts } = useAppData()
  const toast = useToast()
  const [status, setStatus] = useState('ABIERTA')
  const [whatsapp, setWhatsapp] = useState(null)
  const alerts = useLoad(() => alertsApi.list(status), [status])
  const config = useLoad(() => alertsApi.config(), [])

  async function ack(a) {
    const note = window.prompt('¿Qué se hizo? (por ejemplo: pedido hecho al proveedor)', 'Pedido hecho al proveedor')
    if (note === null) return
    try {
      await alertsApi.ack(a.id, note)
      toast('Marcada como en gestión')
      alerts.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  async function resend(a) {
    try {
      const r = await alertsApi.resend(a.id)
      toast(r.message, r.status === 'ENVIADO' ? 'ok' : 'error')
      alerts.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  async function testEmail() {
    try {
      const r = await alertsApi.testEmail()
      toast(r.message, r.status === 'ENVIADO' ? 'ok' : 'error')
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alertas de stock bajo</h1>
          <p>Se abren solas cuando un producto llega a su mínimo y se cierran solas cuando se repone.</p>
        </div>
        <div className="segmented">
          {[['ABIERTA', 'Abiertas'], ['CERRADA', 'Cerradas'], ['TODAS', 'Todas']].map(([k, t]) => (
            <button key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>{t}</button>
          ))}
        </div>
      </div>

      {config.data && (
        <div className="card row" style={{ marginBottom: 14 }}>
          <Icon name="mail" size={22} className={config.data.emailConfigured ? 'text-ok' : 'muted'} />
          <div className="grow small">
            <b>{config.data.emailConfigured ? 'El correo está listo.' : 'El correo todavía no está configurado'}</b>
            {!config.data.emailConfigured && ' (se puede avisar por WhatsApp).'}
            {' '}Reciben alertas: {config.data.recipients.length ? config.data.recipients.map((r) => `${r.name}${r.phone ? ' (WhatsApp)' : ''}`).join(', ') : 'nadie todavía'}.
          </div>
          {isAdmin && config.data.emailConfigured && <button className="btn btn-sm" onClick={testEmail}><Icon name="mail" /> Enviar correo de prueba</button>}
        </div>
      )}

      {alerts.loading ? <Loading /> : alerts.error ? <Notice type="error">{errorMessage(alerts.error)}</Notice> : alerts.data.length === 0 ? (
        <div className="card"><Empty icon="ok" title={status === 'ABIERTA' ? '¡Todo en orden! No hay productos en stock bajo.' : 'No hay alertas'} /></div>
      ) : (
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {alerts.data.map((a) => {
            const pct = Math.min(100, (Number(a.currentQuantity) / (Number(a.minimumStock) || 1)) * 100)
            const [emailClass, emailText] = EMAIL[a.emailStatus] || EMAIL.PENDIENTE
            return (
              <div key={a.id} className={`card stack-sm mod-${a.moduleColor}`} style={{ borderTop: `4px solid ${a.status === 'ABIERTA' ? 'var(--danger)' : 'var(--ok)'}` }}>
                <div className="row-between">
                  <span className="mod-badge">{a.moduleName}</span>
                  <span className="tiny muted" title={fmtDateTime(a.createdAt)}>{fmtAgo(a.createdAt)}</span>
                </div>
                <Link to={`/articulos/${a.itemId}`} className="strong" style={{ fontSize: '1.05rem' }}>{a.itemName}</Link>
                <div>
                  <span className="big-number text-danger" style={{ fontSize: '1.6rem' }}>{fmtNum(a.currentQuantity)}</span>
                  <span className="muted"> de {fmtNum(a.minimumStock)} {a.unitName} mínimo</span>
                </div>
                <div className="meter low"><div style={{ width: `${pct}%` }} /></div>
                <div className="row" style={{ gap: 6 }}>
                  <span className={`badge ${emailClass}`} title={a.emailError || ''}><Icon name="mail" /> {emailText}</span>
                  {a.ackBy && <span className="badge badge-info" title={a.ackNote}><Icon name="check" /> {a.ackNote} · {a.ackBy}</span>}
                  {a.status === 'CERRADA' && <span className="badge badge-ok">{a.closedReason}</span>}
                </div>
                {a.status === 'ABIERTA' && (
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-whatsapp btn-sm" onClick={() => setWhatsapp(a)}><Icon name="whatsapp" /> Avisar por WhatsApp</button>
                    {!a.ackBy && <button className="btn btn-sm" onClick={() => ack(a)}><Icon name="check" /> Ya se pidió</button>}
                    {isAdmin && a.emailStatus !== 'ENVIADO' && <button className="btn btn-sm btn-ghost" onClick={() => resend(a)}><Icon name="mail" /> Reenviar correo</button>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {whatsapp && <WhatsAppModal itemId={whatsapp.itemId} alertId={whatsapp.id} onClose={() => { setWhatsapp(null); refreshAlerts() }} />}
    </div>
  )
}
