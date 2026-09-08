import { useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { downloadInventoryReport, downloadLowStockReport, downloadMovementsReport } from '../services/reportService'
import { useEffect } from 'react'
import { getProducts } from '../services/productService'

export default function Reports() {
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ productId: '', startDate: '', endDate: '', type: '' })

  useEffect(() => { getProducts().then(setProducts).catch(() => {}) }, [])

  async function safeDownload(fn) {
    setError('')
    try { await fn() } catch { setError('No se pudo generar el reporte.') }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>Reportes</h2>
      <Alert type="error" message={error} />

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Reportes generales</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => safeDownload(downloadInventoryReport)}>Inventario general (PDF)</button>
          <button className="btn-primary" onClick={() => safeDownload(downloadLowStockReport)}>Stock bajo (PDF)</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Reporte de movimientos</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end', marginBottom: 12 }}>
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
        </div>
        <button className="btn-primary" onClick={() => safeDownload(() => downloadMovementsReport(filters))}>Generar PDF</button>
      </div>
    </PrivateLayout>
  )
}
