import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getProducts, deleteProduct } from '../services/productService'
import Alert from '../components/Alert.jsx'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  function load(params = {}) {
    getProducts(params)
      .then(setProducts)
      .catch(() => setError('No se encontraron productos.'))
  }

  useEffect(() => { load() }, [])

  function handleSearch(e) {
    e.preventDefault()
    load(search ? { name: search } : {})
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este producto?')) return
    try {
      await deleteProduct(id)
      setSuccess('Producto eliminado correctamente.')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el producto.')
    }
  }

  return (
    <PrivateLayout>
      <div className="topbar">
        <h2>Inventario</h2>
        {hasRole('ADMINISTRADOR') && (
          <button className="btn-primary" onClick={() => navigate('/inventory/new')}>+ Nuevo producto</button>
        )}
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-outline" type="submit">Buscar</button>
        <button type="button" className="btn-outline" onClick={() => { setSearch(''); load() }}>Ver todos</button>
        <button type="button" className="btn-outline" onClick={() => load({ lowStock: true })}>Stock bajo</button>
      </form>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Producto</th><th>Cantidad</th><th>Stock mín.</th>
              <th>Ubicación</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.quantity}</td>
                <td>{p.minimumStock}</td>
                <td>{p.locationLabel}</td>
                <td className={p.lowStock ? 'badge-low' : 'badge-ok'}>
                  {p.lowStock ? 'Stock bajo' : 'Stock disponible'}
                </td>
                <td>
                  <button className="btn-outline" style={{ marginRight: 6 }} onClick={() => navigate(`/inventory/${p.id}`)}>Ver</button>
                  {hasRole('ADMINISTRADOR') && (
                    <>
                      <button className="btn-outline" style={{ marginRight: 6 }} onClick={() => navigate(`/inventory/${p.id}/edit`)}>Editar</button>
                      <button className="btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="7">No se encontraron productos.</td></tr>}
          </tbody>
        </table>
      </div>
    </PrivateLayout>
  )
}
