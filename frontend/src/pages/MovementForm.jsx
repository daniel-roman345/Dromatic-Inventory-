import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import ProductPicker from '../components/ProductPicker.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getProducts } from '../services/productService'
import { getMovementReasons, registerEntry, registerExit } from '../services/movementService'
import { errorMessage, formatNumber, todayISO } from '../utils/format'

const INITIAL_STOCK_REASON = 'Inventario inicial'

/** Registro de ENTRADA o SALIDA con uno o varios productos. */
export default function MovementForm({ type }) {
  const isEntry = type === 'ENTRADA'
  const word = isEntry ? 'entrada' : 'salida'
  const location = useLocation()
  const { hasRole } = useAuth()

  const [products, setProducts] = useState([])
  const [reasons, setReasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [header, setHeader] = useState({ movementDate: todayISO(), reason: '', reference: '', observation: '' })
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const pickerRef = useRef(null)
  const quantityRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getProducts({ status: 'ACTIVO' }), getMovementReasons()])
      .then(([productList, reasonMap]) => {
        if (cancelled) return
        setProducts(productList)
        const list = (reasonMap[type] || []).filter((r) => r !== INITIAL_STOCK_REASON)
        setReasons(list)
        setHeader((h) => ({ ...h, reason: isEntry ? list[0] || '' : '' }))

        // Viene desde "Alertas de stock" o el detalle del producto con un producto preseleccionado.
        const preselectedId = location.state?.productId
        const preselected = productList.find((p) => p.id === preselectedId)
        if (preselected) selectProduct(preselected)
      })
      .catch((err) => !cancelled && setError(errorMessage(err, 'No se pudieron cargar los productos.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  function focusLater(ref) {
    setTimeout(() => ref.current?.focus(), 0)
  }

  function selectProduct(product) {
    setSelected(product)
    setError('')
    focusLater(quantityRef)
  }

  function addItem() {
    if (!selected) {
      focusLater(pickerRef)
      return
    }
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Escriba una cantidad entera mayor a cero.')
      focusLater(quantityRef)
      return
    }
    setItems((list) => {
      const exists = list.some((i) => i.product.id === selected.id)
      return exists
        ? list.map((i) => (i.product.id === selected.id ? { ...i, quantity: Number(i.quantity) + qty } : i))
        : [...list, { product: selected, quantity: qty }]
    })
    setSelected(null)
    setQuantity('')
    setError('')
    setResult(null)
    focusLater(pickerRef)
  }

  function changeItemQuantity(productId, value) {
    setItems((list) => list.map((i) => (i.product.id === productId ? { ...i, quantity: value } : i)))
  }

  function removeItem(productId) {
    setItems((list) => list.filter((i) => i.product.id !== productId))
  }

  function isInvalid(item) {
    const qty = Number(item.quantity)
    return !Number.isInteger(qty) || qty <= 0 || (!isEntry && qty > item.product.quantity)
  }

  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const hasInvalidItems = items.some(isInvalid)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (items.length === 0) return setError('Agregue al menos un producto a la lista.')
    if (!header.reason) return setError('Seleccione el motivo.')
    if (hasInvalidItems) {
      return setError(isEntry
        ? 'Revise las cantidades marcadas en rojo.'
        : 'Hay productos con cantidad inválida o sin stock suficiente (marcados en rojo).')
    }
    if (!window.confirm(`¿Confirmar la ${word.toUpperCase()} de ${items.length} producto(s), ${totalUnits} unidades en total?`)) {
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...header,
        items: items.map((i) => ({ productId: i.product.id, quantity: Number(i.quantity) })),
      }
      const saved = await (isEntry ? registerEntry(payload) : registerExit(payload))
      setResult({ products: saved.length, units: totalUnits })
      setItems([])
      setHeader((h) => ({ ...h, reference: '', observation: '' }))
      setProducts(await getProducts({ status: 'ACTIVO' }))
      focusLater(pickerRef)
    } catch (err) {
      setError(errorMessage(err, `No se pudo registrar la ${word}.`))
    } finally {
      setSaving(false)
    }
  }

  function handleHeaderChange(e) {
    const { name, value } = e.target
    setHeader((h) => ({ ...h, [name]: value }))
  }

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>{isEntry ? '📥 Registrar entrada' : '📤 Registrar salida'}</h1>
          <p className="muted">
            {isEntry
              ? 'Mercancía que LLEGA a la bodega. El stock de cada producto aumenta.'
              : 'Mercancía que SALE de la bodega. El stock de cada producto disminuye.'}
          </p>
        </div>
      </div>

      {result && (
        <Alert type="success" onClose={() => setResult(null)}>
          <strong>{isEntry ? 'Entrada' : 'Salida'} registrada correctamente:</strong> {result.products} producto(s),{' '}
          {formatNumber(result.units)} unidades. Puede registrar otra o ver el <Link to="/movements">historial</Link>.
        </Alert>
      )}
      <Alert type="error" message={error} onClose={error ? () => setError('') : undefined} />

      {loading ? <Loading /> : (
        <form onSubmit={handleSubmit} className="stack">
          <section className="card">
            <h2 className="card-title">1. Datos del registro</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="movementDate">Fecha</label>
                <input id="movementDate" type="date" name="movementDate" max={todayISO()}
                  value={header.movementDate} onChange={handleHeaderChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="reason">Motivo *</label>
                <select id="reason" name="reason" value={header.reason} onChange={handleHeaderChange} required>
                  <option value="">Seleccione el motivo...</option>
                  {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reference">N.º de remisión / factura / orden</label>
                <input id="reference" name="reference" maxLength={50} placeholder="Opcional"
                  value={header.reference} onChange={handleHeaderChange} />
              </div>
              <div className="form-group span-all">
                <label htmlFor="observation">Observación</label>
                <input id="observation" name="observation" maxLength={500} placeholder="Opcional"
                  value={header.observation} onChange={handleHeaderChange} />
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">2. Productos</h2>

            {products.length === 0 ? (
              <Alert type="warning">
                No hay productos activos registrados.{' '}
                {hasRole('ADMINISTRADOR', 'OPERADOR') && <Link to="/inventory/new">Registrar un producto</Link>}
              </Alert>
            ) : (
              <>
                <div className="add-row">
                  <div className="form-group grow">
                    <label>Producto</label>
                    {selected ? (
                      <div className="selected-product">
                        <span><strong>{selected.code}</strong> — {selected.name}</span>
                        <span className="muted">Stock actual: {selected.quantity}</span>
                        <button type="button" className="link-btn" onClick={() => { setSelected(null); focusLater(pickerRef) }}>
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <ProductPicker ref={pickerRef} products={products} onSelect={selectProduct} autoFocus />
                    )}
                  </div>
                  <div className="form-group qty-field">
                    <label htmlFor="quantity">Cantidad</label>
                    <input id="quantity" ref={quantityRef} type="number" min="1" step="1" inputMode="numeric"
                      value={quantity} disabled={!selected} placeholder="0"
                      onChange={(e) => setQuantity(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }} />
                  </div>
                  <button type="button" className="btn btn-primary add-btn" onClick={addItem} disabled={!selected}>
                    ➕ Agregar
                  </button>
                </div>
                <p className="hint">
                  Busque por código o nombre (o escanee el código de barras), escriba la cantidad y presione <kbd>Enter</kbd>.
                  Repita con cada producto y al final guarde.
                </p>

                {items.length === 0 ? (
                  <div className="empty">Todavía no ha agregado productos.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Código</th><th>Producto</th><th>Ubicación</th>
                          <th className="num">Stock actual</th><th className="num">Cantidad</th>
                          <th className="num">Stock después</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const qty = Number(item.quantity) || 0
                          const after = isEntry ? item.product.quantity + qty : item.product.quantity - qty
                          const invalid = isInvalid(item)
                          return (
                            <tr key={item.product.id} className={invalid ? 'row-invalid' : ''}>
                              <td><strong>{item.product.code}</strong></td>
                              <td>{item.product.name}</td>
                              <td className="muted">{item.product.locationLabel}</td>
                              <td className="num">{item.product.quantity}</td>
                              <td className="num">
                                <input className="qty-input" type="number" min="1" step="1" inputMode="numeric"
                                  aria-label={`Cantidad de ${item.product.name}`}
                                  value={item.quantity}
                                  onChange={(e) => changeItemQuantity(item.product.id, e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} />
                              </td>
                              <td className={`num ${after < 0 ? 'text-red' : ''}`}>
                                <strong>{after}</strong>
                                {after < 0 && <div className="small text-red">Stock insuficiente</div>}
                              </td>
                              <td>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(item.product.id)}>
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>

          <div className="submit-bar">
            <span>
              <strong>{items.length}</strong> producto(s) · <strong>{formatNumber(totalUnits)}</strong> unidades
            </span>
            <button type="submit" className={`btn btn-lg ${isEntry ? 'btn-success' : 'btn-danger'}`}
              disabled={saving || items.length === 0}>
              {saving ? 'Guardando...' : `✔ Guardar ${word}`}
            </button>
          </div>
        </form>
      )}
    </PrivateLayout>
  )
}
