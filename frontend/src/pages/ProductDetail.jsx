import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { MovementTypeBadge, StockBadge } from '../components/Badges.jsx'
import Product3DViewer from '../components/Product3DViewer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getProduct } from '../services/productService'
import { getMovements } from '../services/movementService'
import { errorMessage, formatDate, formatNumber, formatTime } from '../utils/format'

export default function ProductDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { hasRole } = useAuth()
  const canMove = hasRole('ADMINISTRADOR', 'OPERADOR')

  const [product, setProduct] = useState(null)
  const [movements, setMovements] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((err) => setError(errorMessage(err, 'No se encontró el producto.')))
    if (canMove) {
      getMovements({ productId: id }).then(setMovements).catch(() => {})
    }
  }, [id, canMove])

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>{product ? product.name : 'Producto'}</h1>
          {product && <p className="muted">Código {product.code}</p>}
        </div>
        <Link to="/inventory" className="btn btn-ghost">← Volver al inventario</Link>
      </div>

      <Alert type="success" message={location.state?.message} />
      <Alert type="error" message={error} />
      {!product && !error && <Loading />}

      {product && (
        <>
          <div className="detail-layout">
            <section className="card viewer3d-card">
              <Product3DViewer src={product.imageUrl} alt={product.name} />
            </section>
            <div className="detail-side">
              <section className="card">
                <dl className="details">
                  <dt>Cantidad disponible</dt>
                  <dd>
                    <span className={`huge-number ${product.lowStock ? 'text-red' : ''}`}>{formatNumber(product.quantity)}</span>{' '}
                    <StockBadge product={product} />
                  </dd>
                  <dt>Stock mínimo</dt><dd>{product.minimumStock}</dd>
                  <dt>Ubicación</dt><dd>📍 {product.locationLabel}</dd>
                  <dt>Descripción</dt><dd>{product.description || '—'}</dd>
                  <dt>Fecha de ingreso</dt><dd>{formatDate(product.entryDate)}</dd>
                  <dt>Estado</dt><dd>{product.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}</dd>
                </dl>
              </section>

              {canMove && (
                <section className="card stack-sm">
                  <h2 className="card-title">Acciones</h2>
                  {product.status === 'ACTIVO' && (
                    <>
                      <Link to="/entries" state={{ productId: product.id }} className="btn btn-success btn-lg btn-block">📥 Registrar entrada</Link>
                      <Link to="/exits" state={{ productId: product.id }} className="btn btn-danger btn-lg btn-block">📤 Registrar salida</Link>
                    </>
                  )}
                  {hasRole('ADMINISTRADOR') && (
                    <Link to={`/inventory/${product.id}/edit`} className="btn btn-ghost btn-block">✏️ Editar producto</Link>
                  )}
                </section>
              )}
            </div>
          </div>

          {canMove && (
            <section className="card">
              <h2 className="card-title">Movimientos de este producto</h2>
              {movements.length === 0 ? (
                <div className="empty">Este producto no tiene movimientos.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Fecha</th><th>Tipo</th><th className="num">Cantidad</th><th>Motivo</th><th>Documento</th><th>Usuario</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                      {movements.map((m) => (
                        <tr key={m.id} className={m.voided ? 'row-voided' : ''}>
                          <td>{formatDate(m.movementDate)} <span className="muted small">{formatTime(m.createdAt)}</span></td>
                          <td><MovementTypeBadge type={m.type} /></td>
                          <td className="num">{m.quantity}</td>
                          <td>{m.reason || '—'}</td>
                          <td>{m.reference || '—'}</td>
                          <td>{m.username}</td>
                          <td>{m.voided ? <span className="badge badge-gray" title={m.voidReason}>Anulado</span> : 'Vigente'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </PrivateLayout>
  )
}
