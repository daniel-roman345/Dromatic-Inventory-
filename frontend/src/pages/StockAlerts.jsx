import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { StockBadge } from '../components/Badges.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getLowStockProducts } from '../services/productService'
import { errorMessage } from '../utils/format'

export default function StockAlerts() {
  const { hasRole } = useAuth()
  const canRegister = hasRole('ADMINISTRADOR', 'OPERADOR')
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getLowStockProducts()
      .then(setProducts)
      .catch((err) => setError(errorMessage(err, 'No se pudieron cargar las alertas.')))
  }, [])

  const outOfStock = products?.filter((p) => p.quantity === 0).length ?? 0

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>⚠️ Alertas de stock</h1>
          <p className="muted">Productos activos cuya cantidad es igual o menor al stock mínimo.</p>
        </div>
      </div>

      <Alert type="error" message={error} />
      {!products && !error && <Loading />}

      {products && products.length === 0 && (
        <Alert type="success" message="No hay alertas: todos los productos están por encima de su stock mínimo." />
      )}

      {products && products.length > 0 && (
        <>
          <Alert type="warning">
            <strong>{products.length}</strong> producto(s) necesitan reposición
            {outOfStock > 0 && <>, de los cuales <strong>{outOfStock}</strong> están agotados</>}.
          </Alert>

          <section className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th><th>Producto</th><th>Ubicación</th><th className="num">Disponible</th>
                    <th className="num">Mínimo</th><th className="num">Faltan para el mínimo</th><th>Estado</th>
                    {canRegister && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.quantity === 0 ? 'row-critical' : ''}>
                      <td><Link to={`/inventory/${p.id}`}><strong>{p.code}</strong></Link></td>
                      <td>{p.name}</td>
                      <td className="muted">{p.locationLabel}</td>
                      <td className="num big-number text-red">{p.quantity}</td>
                      <td className="num">{p.minimumStock}</td>
                      <td className="num"><strong>{Math.max(p.minimumStock - p.quantity, 0)}</strong></td>
                      <td><StockBadge product={p} /></td>
                      {canRegister && (
                        <td>
                          <Link to="/entries" state={{ productId: p.id }} className="btn btn-success btn-sm">📥 Registrar entrada</Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PrivateLayout>
  )
}
