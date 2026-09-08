import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { getMovements } from '../services/movementService'
import { getProducts } from '../services/productService'

export default function Movements() {
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ productId: '', startDate: '', endDate: '', type: '' })
  const [error, setError] = useState('')

  function load(params = {}) {
    getMovements(params).then(setMovements).catch(() => setError('No se encontraron movimientos.'))
  }

  useEffect(() => {
    load()
    getProducts().then(setProducts).catch(() => {})
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  function handleFilter(e) {
    e.preventDefault()
    const params = {}
    if (filters.productId) params.productId = filters.productId
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    if (filters.type) params.type = filters.type
    load(params)
  }

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>Movimientos</h2>

      <form onSubmit={handleFilter} className="card" style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <label>Producto</label>
          <select name="productId" value={filters.productId} onChange={handleChange}>
            <option value="">Todos</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        </div>
        <div>
          <label>Desde</label>
          <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} />
        </div>
        <div>
          <label>Hasta</label>
          <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} />
        </div>
        <div>
          <label>Tipo</label>
          <select name="type" value={filters.type} onChange={handleChange}>
            <option value="">Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
          </select>
        </div>
        <button className="btn-outline" type="submit">Filtrar</button>
      </form>

      <Alert type="error" message={error} />

      <div className="card">
        <table>
          <thead>
            <tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Fecha</th><th>Usuario</th><th>Observación</th></tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{m.productCode} — {m.productName}</td>
                <td>{m.type}</td>
                <td>{m.quantity}</td>
                <td>{m.movementDate}</td>
                <td>{m.username}</td>
                <td>{m.observation || '—'}</td>
              </tr>
            ))}
            {movements.length === 0 && <tr><td colSpan="6">No se encontraron movimientos.</td></tr>}
          </tbody>
        </table>
      </div>
    </PrivateLayout>
  )
}
