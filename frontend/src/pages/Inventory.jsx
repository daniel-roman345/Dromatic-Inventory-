import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { StockBadge } from '../components/Badges.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteProduct, getProducts } from '../services/productService'
import { errorMessage, formatNumber } from '../utils/format'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ACTIVO')
  const [onlyLowStock, setOnlyLowStock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const requestId = useRef(0)
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMINISTRADOR')

  async function load() {
    const id = ++requestId.current
    setLoading(true)
    try {
      const data = await getProducts({ search: search.trim(), status })
      if (id === requestId.current) {
        setProducts(data)
        setError('')
      }
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err, 'No se pudo consultar el inventario.'))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  // Busca automáticamente mientras se escribe.
  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  async function handleDelete(product) {
    if (!window.confirm(`¿Eliminar definitivamente el producto ${product.code} - ${product.name}?`)) return
    setError('')
    setSuccess('')
    try {
      await deleteProduct(product.id)
      setSuccess(`Producto ${product.code} eliminado correctamente.`)
      load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo eliminar el producto.'))
    }
  }

  const visible = onlyLowStock ? products.filter((p) => p.lowStock) : products
  const totalUnits = visible.reduce((sum, p) => sum + p.quantity, 0)

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>📦 Inventario</h1>
          <p className="muted">Consulte las existencias por código o nombre.</p>
        </div>
        {hasRole('ADMINISTRADOR', 'OPERADOR') && (
          <Link to="/inventory/new" className="btn btn-primary">➕ Nuevo producto</Link>
        )}
      </div>

      <div className="card toolbar">
        <div className="form-group grow">
          <label htmlFor="search">Buscar</label>
          <input id="search" type="search" placeholder="Código o nombre del producto..." autoFocus
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="status">Estado</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={onlyLowStock} onChange={(e) => setOnlyLowStock(e.target.checked)} />
          Solo stock bajo
        </label>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} onClose={success ? () => setSuccess('') : undefined} />

      <section className="card">
        <p className="muted small table-caption">
          {loading ? 'Buscando...' : `${visible.length} producto(s) · ${formatNumber(totalUnits)} unidades`}
        </p>
        {loading && products.length === 0 ? <Loading /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th><th>Producto</th><th className="num">Cantidad</th><th className="num">Stock mín.</th>
                  <th>Ubicación</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => navigate(`/inventory/${p.id}`)}>
                    <td><strong>{p.code}</strong></td>
                    <td>{p.name}</td>
                    <td className={`num big-number ${p.lowStock ? 'text-red' : ''}`}>{formatNumber(p.quantity)}</td>
                    <td className="num">{p.minimumStock}</td>
                    <td className="muted">{p.locationLabel}</td>
                    <td><StockBadge product={p} /></td>
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/inventory/${p.id}`} className="btn btn-ghost btn-sm">Ver</Link>
                      {isAdmin && (
                        <>
                          <Link to={`/inventory/${p.id}/edit`} className="btn btn-ghost btn-sm">Editar</Link>
                          <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => handleDelete(p)}>Eliminar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && visible.length === 0 && (
                  <tr><td colSpan="7" className="empty">No se encontraron productos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PrivateLayout>
  )
}
