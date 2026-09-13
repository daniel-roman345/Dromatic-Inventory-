import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { MovementTypeBadge, StockBadge } from '../components/Badges.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardSummary } from '../services/dashboardService'
import { errorMessage, formatDate, formatNumber, formatTime } from '../utils/format'

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(errorMessage(err, 'No se pudo cargar el resumen.')))
  }, [])

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>Hola, {user?.username} 👋</h1>
          <p className="muted">Resumen de la bodega a hoy, {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/entries" className="quick-action qa-entry">
          <span className="qa-icon">📥</span>
          <span><strong>Registrar entrada</strong><small>Llegó mercancía</small></span>
        </Link>
        <Link to="/exits" className="quick-action qa-exit">
          <span className="qa-icon">📤</span>
          <span><strong>Registrar salida</strong><small>Sale mercancía</small></span>
        </Link>
        <Link to="/inventory" className="quick-action qa-search">
          <span className="qa-icon">🔍</span>
          <span><strong>Consultar inventario</strong><small>Buscar por código o nombre</small></span>
        </Link>
      </div>

      <Alert type="error" message={error} />
      {!summary && !error && <Loading />}

      {summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="lbl">Productos activos</div>
              <div className="val">{formatNumber(summary.totalProducts)}</div>
              <div className="sub">{formatNumber(summary.totalUnits)} unidades en bodega</div>
            </div>
            <div className="stat-card stat-green">
              <div className="lbl">Entradas hoy</div>
              <div className="val">{formatNumber(summary.entriesToday)}</div>
              <div className="sub">unidades · {formatNumber(summary.entriesMonth)} en el mes</div>
            </div>
            <div className="stat-card stat-red">
              <div className="lbl">Salidas hoy</div>
              <div className="val">{formatNumber(summary.exitsToday)}</div>
              <div className="sub">unidades · {formatNumber(summary.exitsMonth)} en el mes</div>
            </div>
            <Link to="/alerts" className={`stat-card ${summary.lowStockCount > 0 ? 'stat-amber' : ''}`}>
              <div className="lbl">Productos con stock bajo</div>
              <div className="val">{formatNumber(summary.lowStockCount)}</div>
              <div className="sub">{summary.lowStockCount > 0 ? 'Ver alertas →' : 'Todo en orden'}</div>
            </Link>
          </div>

          <div className="two-columns">
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">Últimos movimientos</h2>
                <Link to="/movements" className="link">Ver historial →</Link>
              </div>
              {summary.recentMovements.length === 0 ? (
                <div className="empty">Aún no hay movimientos registrados.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th className="num">Cant.</th><th>Usuario</th></tr>
                    </thead>
                    <tbody>
                      {summary.recentMovements.map((m) => (
                        <tr key={m.id} className={m.voided ? 'row-voided' : ''}>
                          <td>{formatDate(m.movementDate)} <span className="muted small">{formatTime(m.createdAt)}</span></td>
                          <td><MovementTypeBadge type={m.type} />{m.voided && <span className="badge badge-gray">Anulado</span>}</td>
                          <td>{m.productCode} — {m.productName}</td>
                          <td className="num">{m.quantity}</td>
                          <td>{m.username}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card">
              <div className="card-header">
                <h2 className="card-title">⚠️ Stock bajo</h2>
                <Link to="/alerts" className="link">Ver todas →</Link>
              </div>
              {summary.lowStockProducts.length === 0 ? (
                <div className="empty">No hay productos por debajo del stock mínimo.</div>
              ) : (
                <ul className="low-stock-list">
                  {summary.lowStockProducts.map((p) => (
                    <li key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <div className="muted small">{p.code} · mínimo {p.minimumStock}</div>
                      </div>
                      <div className="low-stock-qty">
                        <span className="big-number">{p.quantity}</span>
                        <StockBadge product={p} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </PrivateLayout>
  )
}
