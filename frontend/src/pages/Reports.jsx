import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { downloadInventoryReport, downloadLowStockReport, downloadMovementsReport } from '../services/reportService'
import { getProducts } from '../services/productService'
import { errorMessage, firstDayOfMonthISO, todayISO } from '../utils/format'

export default function Reports() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState('')
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ productId: '', startDate: firstDayOfMonthISO(), endDate: todayISO(), type: '' })

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {})
  }, [])

  async function generate(key, fn) {
    setError('')
    setSuccess('')
    setBusy(key)
    try {
      await fn()
      setSuccess('Reporte generado. Revise la carpeta de descargas.')
    } catch (err) {
      setError(errorMessage(err, 'No se pudo generar el reporte.'))
    } finally {
      setBusy('')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  function handleMovements() {
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setError('La fecha "Desde" no puede ser mayor que la fecha "Hasta".')
      return
    }
    generate('movements', () => downloadMovementsReport(filters))
  }

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>📄 Reportes PDF</h1>
          <p className="muted">Los reportes se generan con los datos actuales del sistema.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={error ? () => setError('') : undefined} />
      <Alert type="success" message={success} onClose={success ? () => setSuccess('') : undefined} />

      <div className="report-grid">
        <section className="card report-card">
          <h2 className="card-title">📦 Inventario general</h2>
          <p className="muted">Todos los productos con cantidad, stock mínimo, ubicación y estado.</p>
          <button className="btn btn-primary" disabled={!!busy} onClick={() => generate('inventory', downloadInventoryReport)}>
            {busy === 'inventory' ? 'Generando...' : 'Descargar PDF'}
          </button>
        </section>

        <section className="card report-card">
          <h2 className="card-title">⚠️ Stock bajo</h2>
          <p className="muted">Productos activos con cantidad igual o menor al stock mínimo.</p>
          <button className="btn btn-primary" disabled={!!busy} onClick={() => generate('low', downloadLowStockReport)}>
            {busy === 'low' ? 'Generando...' : 'Descargar PDF'}
          </button>
        </section>
      </div>

      <section className="card">
        <h2 className="card-title">🕘 Movimientos por fecha</h2>
        <p className="muted">Entradas y salidas del período, con totales, usuario responsable y anulaciones.</p>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="startDate">Desde</label>
            <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Hasta</label>
            <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="type">Tipo</label>
            <select id="type" name="type" value={filters.type} onChange={handleChange}>
              <option value="">Entradas y salidas</option>
              <option value="ENTRADA">Solo entradas</option>
              <option value="SALIDA">Solo salidas</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="productId">Producto</label>
            <select id="productId" name="productId" value={filters.productId} onChange={handleChange}>
              <option value="">Todos</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" disabled={!!busy} onClick={handleMovements}>
          {busy === 'movements' ? 'Generando...' : 'Descargar PDF'}
        </button>
      </section>
    </PrivateLayout>
  )
}
