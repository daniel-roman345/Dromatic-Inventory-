import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { createProduct, getProduct, updateProduct } from '../services/productService'
import { getLocations } from '../services/locationService'

const emptyForm = { code: '', name: '', description: '', quantity: 0, minimumStock: 0, locationId: '', entryDate: '', status: 'ACTIVO' }

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(emptyForm)
  const [locations, setLocations] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {})
    if (isEdit) {
      getProduct(id).then((p) => setForm({
        code: p.code, name: p.name, description: p.description || '',
        quantity: p.quantity, minimumStock: p.minimumStock,
        locationId: p.locationId, entryDate: p.entryDate, status: p.status,
      })).catch(() => setError('No se encontraron productos.'))
    }
  }, [id])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, quantity: Number(form.quantity), minimumStock: Number(form.minimumStock), locationId: Number(form.locationId) }
      if (isEdit) {
        await updateProduct(id, payload)
        setSuccess('Producto actualizado correctamente.')
      } else {
        await createProduct(payload)
        setSuccess('Producto registrado correctamente.')
      }
      setTimeout(() => navigate('/inventory'), 800)
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object' && !err.response.data.message) {
        setError(Object.values(err.response.data).join(' | '))
      } else {
        setError(err.response?.data?.message || 'Ocurrió un error al guardar el producto.')
      }
    }
  }

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>{isEdit ? 'Editar producto' : 'Registrar producto'}</h2>
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
        <div className="form-group">
          <label>Código</label>
          <input name="code" value={form.code} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Nombre</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
        </div>
        <div className="form-group">
          <label>Cantidad</label>
          <input type="number" min="0" name="quantity" value={form.quantity} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Stock mínimo</label>
          <input type="number" min="0" name="minimumStock" value={form.minimumStock} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Ubicación</label>
          <select name="locationId" value={form.locationId} onChange={handleChange} required>
            <option value="">Seleccione...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.aisle} - {l.shelf} - {l.level}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Fecha de ingreso</label>
          <input type="date" name="entryDate" value={form.entryDate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Estado</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
        <button className="btn-primary" type="submit">Guardar</button>
      </form>
    </PrivateLayout>
  )
}
