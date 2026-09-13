import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import ProductPicker from '../components/ProductPicker.jsx'
import { MovementTypeBadge } from '../components/Badges.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getMovements, voidMovement } from '../services/movementService'
import { getProducts } from '../services/productService'
import { daysAgoISO, errorMessage, formatDate, formatDateTime, formatNumber, formatTime, todayISO } from '../utils/format'

const initialFilters = () => ({ product: null, startDate: daysAgoISO(30), endDate: todayISO(), type: '' })

export default function Movements() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMINISTRADOR')

  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load(f = filters) {
    if (f.startDate && f.endDate && f.startDate > f.endDate) {
      setError('La fecha "Desde" no puede ser mayor que la fecha "Hasta".')
      return
    }
    setLoading(true)
    setError('')
    try {
      setMovements(await getMovements({
        productId: f.product?.id, startDate: f.startDate, endDate: f.endDate, type: f.type,
      }))
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar el historial.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    getProducts().then(setProducts).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSuccess('')
    load()
  }

  function handleClear() {
    const fresh = initialFilters()
    setFilters(fresh)
    setSuccess('')
    load(fresh)
  }

  async function handleVoid(m) {
    const reason = window.prompt(
      `ANULAR ${m.type} de ${m.quantity} unidades de ${m.productCode} - ${m.productName}.\n\n` +
      'El stock se revertirá y el movimiento quedará marcado como ANULADO en el historial.\n\n' +
      'Escriba el motivo de la anulación:'
    )
    if (reason === null) return
    if (!reason.trim()) {
      setError('Debe escribir el motivo de la anulación.')
      return
    }
    setError('')
    try {
      await voidMovement(m.id, reason.trim())
      setSuccess('Movimiento anulado y stock revertido correctamente.')
      load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo anular el movimiento.'))
    }
  }

  const active = movements.filter((m) => !m.voided)
  const entries = active.filter((m) => m.type === 'ENTRADA').reduce((s, m) => s + m.quantity, 0)
  const exits = active.filter((m) => m.type === 'SALIDA').reduce((s, m) => s + m.quantity, 0)

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>🕘 Historial de movimientos</h1>
          <p className="muted">Todas las entradas y salidas con fecha, hora y usuario responsable.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card toolbar">
        <div className="form-group grow">
          <label>Producto</label>
          {filters.product ? (
            <div className="selected-product">
              <span><strong>{filters.product.code}</strong> — {filters.product.name}</span>
              <button type="button" className="link-btn" onClick={() => setFilters((f) => ({ ...f, product: null }))}>Quitar</button>
            </div>
          ) : (
            <ProductPicker products={products} placeholder="Todos los productos (buscar...)"
              onSelect={(p) => setFilters((f) => ({ ...f, product: p }))} />
          )}
        </div>
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
        <div className="toolbar-buttons">
          <button className="btn btn-primary" type="submit">🔍 Buscar</button>
          <button className="btn btn-ghost" type="button" onClick={handleClear}>Limpiar</button>
        </div>
      </form>

      <Alert type="error" message={error} onClose={error ? () => setError('') : undefined} />
      <Alert type="success" message={success} onClose={success ? () => setSuccess('') : undefined} />

      <section className="card">
        <p className="muted small table-caption">
          {movements.length} movimiento(s) · Entraron <strong className="text-green">{formatNumber(entries)}</strong> unidades ·
          Salieron <strong className="text-red">{formatNumber(exits)}</strong> unidades (sin contar anulados)
        </p>
        {loading ? <Loading /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Tipo</th><th>Producto</th><th className="num">Cant.</th>
                  <th>Motivo</th><th>Documento</th><th>Usuario</th><th>Estado</th>{isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className={m.voided ? 'row-voided' : ''}>
                    <td className="nowrap">{formatDate(m.movementDate)}<div className="muted small">registrado {formatTime(m.createdAt)}</div></td>
                    <td><MovementTypeBadge type={m.type} /></td>
                    <td><strong>{m.productCode}</strong> — {m.productName}</td>
                    <td className={`num big-number ${m.type === 'ENTRADA' ? 'text-green' : 'text-red'}`}>
                      {m.type === 'ENTRADA' ? '+' : '−'}{m.quantity}
                    </td>
                    <td>{m.reason || '—'}{m.observation && <div className="muted small">{m.observation}</div>}</td>
                    <td>{m.reference || '—'}</td>
                    <td>{m.username}</td>
                    <td>
                      {m.voided ? (
                        <>
                          <span className="badge badge-gray">Anulado</span>
                          <div className="muted small">por {m.voidedBy} · {formatDateTime(m.voidedAt)}</div>
                          <div className="muted small">“{m.voidReason}”</div>
                        </>
                      ) : 'Vigente'}
                    </td>
                    {isAdmin && (
                      <td>
                        {!m.voided && (
                          <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => handleVoid(m)}>Anular</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr><td colSpan={isAdmin ? 9 : 8} className="empty">No hay movimientos para los filtros seleccionados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PrivateLayout>
  )
}
