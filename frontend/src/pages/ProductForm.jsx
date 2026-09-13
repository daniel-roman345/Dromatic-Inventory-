import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createProduct, getProduct, updateProduct } from '../services/productService'
import { getLocations } from '../services/locationService'
import { errorMessage, todayISO } from '../utils/format'

const CODE_PATTERN = /^[A-Za-z0-9._-]+$/

const emptyForm = () => ({
  code: '', name: '', description: '', quantity: '0', minimumStock: '0',
  locationId: '', entryDate: todayISO(), status: 'ACTIVO',
})

function validate(form, isEdit) {
  if (!form.code.trim()) return 'El código es obligatorio.'
  if (!CODE_PATTERN.test(form.code.trim())) return 'El código solo puede tener letras, números, punto, guion y guion bajo (sin espacios).'
  if (!form.name.trim()) return 'El nombre es obligatorio.'
  const numbers = isEdit ? [['minimumStock', 'El stock mínimo']] : [['quantity', 'La cantidad'], ['minimumStock', 'El stock mínimo']]
  for (const [field, label] of numbers) {
    const value = Number(form[field])
    if (form[field] === '' || !Number.isInteger(value) || value < 0) return `${label} debe ser un número entero igual o mayor a 0.`
  }
  if (!form.locationId) return 'Seleccione la ubicación en la bodega.'
  if (form.entryDate && form.entryDate > todayISO()) return 'La fecha de ingreso no puede ser futura.'
  return ''
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const [form, setForm] = useState(emptyForm)
  const [currentQuantity, setCurrentQuantity] = useState(0)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  useEffect(() => {
    const requests = [getLocations()]
    if (isEdit) requests.push(getProduct(id))
    Promise.all(requests)
      .then(([locationList, product]) => {
        setLocations(locationList)
        if (product) {
          setCurrentQuantity(product.quantity)
          setForm({
            code: product.code, name: product.name, description: product.description || '',
            quantity: String(product.quantity), minimumStock: String(product.minimumStock),
            locationId: String(product.locationId), entryDate: product.entryDate, status: product.status,
          })
        }
      })
      .catch((err) => setError(errorMessage(err, 'No se pudo cargar la información.')))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'code' ? value.toUpperCase() : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCreated(null)
    const validationError = validate(form, isEdit)
    if (validationError) return setError(validationError)

    setSaving(true)
    try {
      const payload = {
        ...form,
        code: form.code.trim(),
        name: form.name.trim(),
        quantity: Number(form.quantity),
        minimumStock: Number(form.minimumStock),
        locationId: Number(form.locationId),
      }
      if (isEdit) {
        await updateProduct(id, payload)
        navigate(`/inventory/${id}`, { replace: true, state: { message: 'Producto actualizado correctamente.' } })
      } else {
        const product = await createProduct(payload)
        setCreated(product)
        setForm(emptyForm())
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar el producto.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>{isEdit ? '✏️ Editar producto' : '➕ Registrar producto'}</h1>
          <p className="muted">Los campos con * son obligatorios.</p>
        </div>
        <Link to="/inventory" className="btn btn-ghost">← Volver al inventario</Link>
      </div>

      {created && (
        <Alert type="success" onClose={() => setCreated(null)}>
          <strong>Producto registrado correctamente:</strong> {created.code} — {created.name} ({created.quantity} unidades).{' '}
          <Link to={`/inventory/${created.id}`}>Ver producto</Link> o registre otro abajo.
        </Alert>
      )}
      <Alert type="error" message={error} onClose={error ? () => setError('') : undefined} />

      {loading ? <Loading /> : (
        <form className="card form-card" onSubmit={handleSubmit} noValidate>
          {locations.length === 0 && (
            <Alert type="warning">
              Primero debe crear al menos una ubicación de la bodega. <Link to="/locations">Ir a Ubicaciones</Link>
            </Alert>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="code">Código *</label>
              <input id="code" name="code" maxLength={50} placeholder="Ej: SH-001" autoFocus={!isEdit}
                value={form.code} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="name">Nombre *</label>
              <input id="name" name="name" maxLength={150} placeholder="Ej: Shampoo Repair 250ml"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group span-all">
              <label htmlFor="description">Descripción</label>
              <textarea id="description" name="description" rows="2" maxLength={500}
                value={form.description} onChange={handleChange} />
            </div>

            {isEdit ? (
              <div className="form-group">
                <label>Cantidad actual</label>
                <div className="readonly-value">{currentQuantity} unidades</div>
                <small className="hint">Para cambiar la cantidad registre una entrada o salida.</small>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="quantity">Cantidad inicial *</label>
                <input id="quantity" name="quantity" type="number" min="0" step="1" inputMode="numeric"
                  value={form.quantity} onChange={handleChange} required />
                <small className="hint">Queda registrada en el historial como “Inventario inicial”.</small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="minimumStock">Stock mínimo *</label>
              <input id="minimumStock" name="minimumStock" type="number" min="0" step="1" inputMode="numeric"
                value={form.minimumStock} onChange={handleChange} required />
              <small className="hint">Se generará una alerta cuando la cantidad llegue a este número.</small>
            </div>

            <div className="form-group">
              <label htmlFor="locationId">Ubicación en la bodega *</label>
              <select id="locationId" name="locationId" value={form.locationId} onChange={handleChange} required>
                <option value="">Seleccione...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.zone} / {l.aisle} / {l.shelf} / {l.level}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="entryDate">Fecha de ingreso</label>
              <input id="entryDate" name="entryDate" type="date" max={todayISO()}
                value={form.entryDate} onChange={handleChange} />
            </div>

            {isEdit && hasRole('ADMINISTRADOR') && (
              <div className="form-group">
                <label htmlFor="status">Estado</label>
                <select id="status" name="status" value={form.status} onChange={handleChange}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo (ya no se maneja)</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/inventory" className="btn btn-ghost">Cancelar</Link>
            <button className="btn btn-primary btn-lg" type="submit" disabled={saving || locations.length === 0}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar producto'}
            </button>
          </div>
        </form>
      )}
    </PrivateLayout>
  )
}
