import { Link, useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api/services'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useAppData } from '../app/AppDataContext'
import Icon from '../shared/Icon'
import { fmtAgo, fmtDate, fmtNum } from '../shared/format'
import { Empty, Loading, Notice, useLoad } from '../shared/ui'

/** Pantalla de inicio: lo más importante del día en un vistazo. */
export default function DashboardPage() {
  const { user } = useAuth()
  const { canEditAny } = useAppData()
  const navigate = useNavigate()
  const { data, error, loading } = useLoad(() => dashboardApi.get(), [])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  if (loading) return <Loading />
  if (error) return <Notice type="error">{errorMessage(error)}</Notice>

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>{greeting}, {user.fullName.split(' ')[0]}</h1>
          <p>{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })} · {data.movementsToday} {data.movementsToday === 1 ? 'movimiento' : 'movimientos'} hoy</p>
        </div>
      </div>

      <div className="grid-auto">
        {canEditAny && <QuickAction to="/entrada" icon="entry" title="Registrar entrada" hint="Llegó mercancía" tone="ok" />}
        {canEditAny && <QuickAction to="/salida" icon="exit" title="Registrar salida" hint="Sale mercancía" tone="danger" />}
        <QuickAction to="/donde-esta" icon="search" title="¿Dónde está?" hint="Buscar un producto o lote" />
        <QuickAction to="/mapas" icon="map" title="Ver los mapas" hint="Bodega 1 y cuarto de etiquetas" />
      </div>

      {(data.openAlerts > 0 || data.unverifiedLots > 0) && (
        <div className="grid-2">
          {data.openAlerts > 0 && (
            <Link to="/alertas" className="card card-link row" style={{ borderLeft: '4px solid var(--danger)', borderRadius: 0 }}>
              <Icon name="bell" size={26} className="text-danger" />
              <div className="grow">
                <div className="strong">{data.openAlerts} {data.openAlerts === 1 ? 'producto en stock bajo' : 'productos en stock bajo'}</div>
                <div className="small muted">Ver las alertas y avisar por WhatsApp</div>
              </div>
              <Icon name="chevronRight" />
            </Link>
          )}
          {data.unverifiedLots > 0 && (
            <div className="card row" style={{ borderLeft: '4px solid var(--warn)', borderRadius: 0 }}>
              <Icon name="alert" size={26} className="text-warn" />
              <div className="grow">
                <div className="strong">{data.unverifiedLots} {data.unverifiedLots === 1 ? 'rótulo por verificar' : 'rótulos por verificar'}</div>
                <div className="small muted">Cargados desde los videos: confírmelos en la bodega</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: 10 }}>Inventarios</h2>
        <div className="grid-auto">
          {data.modules.map((m) => (
            <button key={m.code} className={`card card-link module-card mod-${m.color}`} style={{ textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => navigate(`/inventario/${m.code}`)}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <div className="mod-icon"><Icon name={m.icon} /></div>
                <div className="grow">
                  <div className="strong">{m.name}</div>
                  <div className="tiny muted">{m.canEdit ? 'Usted lo modifica' : 'Solo consulta'}</div>
                </div>
              </div>
              <div className="stats">
                <div className="stat"><b>{m.itemsWithStock}</b><span>con existencia</span></div>
                <div className="stat"><b className={m.lowStock ? 'text-danger' : ''}>{m.lowStock}</b><span>stock bajo</span></div>
                {m.unverified > 0 && <div className="stat"><b className="text-warn">{m.unverified}</b><span>por verificar</span></div>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2>Últimos movimientos</h2><Link to="/movimientos" className="btn-link small">Ver todos</Link></div>
          {data.recentMovements.length === 0 ? <Empty icon="history" title="Todavía no hay movimientos" /> : (
            <div className="stack-sm">
              {data.recentMovements.map((m) => (
                <Link key={m.id} to={`/articulos/${m.itemId}`} className="row" style={{ flexWrap: 'nowrap', opacity: m.voided ? 0.5 : 1 }}>
                  <span className={`mod-icon mod-${m.moduleColor}`} style={{ width: 34, height: 34 }}>
                    <Icon name={m.effect === 'ENTRADA' ? 'entry' : m.effect === 'SALIDA' ? 'exit' : m.effect === 'TRASLADO' ? 'swap' : 'adjust'} size={18} />
                  </span>
                  <div className="grow">
                    <div className="strong small">{m.movementType}{m.voided ? ' (anulado)' : ''} · {m.itemName}{m.presentation ? ` ${m.presentation}` : ''}</div>
                    <div className="tiny muted">{m.createdBy} · {fmtAgo(m.createdAt)}</div>
                  </div>
                  <span className={`strong small ${m.stockDelta > 0 ? 'text-ok' : m.stockDelta < 0 ? 'text-danger' : ''}`}>
                    {m.stockDelta > 0 ? '+' : m.stockDelta < 0 ? '−' : ''}{fmtNum(m.quantity)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header"><h2>Por vencer</h2><span className="small muted">próximos 60 días</span></div>
          {data.expiringLots.length === 0 ? <Empty icon="calendar" title="Nada por vencer" /> : (
            <div className="stack-sm">
              {data.expiringLots.map((l) => (
                <Link key={l.lotId} to={`/articulos/${l.itemId}`} className="row-between">
                  <div>
                    <div className="strong small">{l.itemName}</div>
                    <div className="tiny muted">{l.lotNumber ? `Lote ${l.lotNumber} · ` : ''}{fmtNum(l.total)} {l.unitName}</div>
                  </div>
                  <span className={`badge ${l.daysLeft <= 0 ? 'badge-danger' : l.daysLeft <= 15 ? 'badge-warn' : 'badge-gray'}`}>
                    {l.daysLeft <= 0 ? 'Vencido' : `${l.daysLeft} días`} · {fmtDate(l.expiryDate)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ to, icon, title, hint, tone }) {
  return (
    <Link to={to} className="card card-link row" style={{ flexWrap: 'nowrap' }}>
      <span className="mod-icon" style={{ background: tone === 'ok' ? 'var(--ok-soft)' : tone === 'danger' ? 'var(--danger-soft)' : 'var(--brand-soft)', color: tone === 'ok' ? 'var(--ok)' : tone === 'danger' ? 'var(--danger)' : 'var(--brand)' }}>
        <Icon name={icon} />
      </span>
      <div>
        <div className="strong">{title}</div>
        <div className="small muted">{hint}</div>
      </div>
    </Link>
  )
}
