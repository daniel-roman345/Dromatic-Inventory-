import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import { getDashboardSummary } from '../services/dashboardService'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError('No se pudo cargar el dashboard.'))
  }, [])

  return (
    <PrivateLayout>
      <div className="topbar"><h2>Dashboard</h2></div>

      {error && <p className="error-text">{error}</p>}

      {summary && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="val">{summary.totalProducts}</div><div className="lbl">Total de productos</div></div>
            <div className="stat-card"><div className="val">{summary.totalUnits}</div><div className="lbl">Unidades disponibles</div></div>
            <div className="stat-card"><div className="val">{summary.lowStockCount}</div><div className="lbl">Productos con stock bajo</div></div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Últimos movimientos</h3>
            <table>
              <thead>
                <tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Fecha</th><th>Usuario</th></tr>
              </thead>
              <tbody>
                {summary.recentMovements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.productName}</td>
                    <td>{m.type}</td>
                    <td>{m.quantity}</td>
                    <td>{m.movementDate}</td>
                    <td>{m.username}</td>
                  </tr>
                ))}
                {summary.recentMovements.length === 0 && (
                  <tr><td colSpan="5">No hay movimientos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PrivateLayout>
  )
}
