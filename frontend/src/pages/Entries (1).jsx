import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { getProducts } from '../services/productService'
import { registerEntry } from '../services/movementService'

const empty = { productId: '', quantity: '', movementDate: '', observation: '' }

export default function Entries() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { getProducts().then(setProducts).catch(() => {}) }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await registerEntry({ ...form, productId: Number(form.productId), quantity: Number(form.quantity) })
      setSuccess('Entrada registrada correctamente.')
      setForm(empty)
      getProducts().then(setProducts)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar la entrada.')
    }
  }

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>Registrar entrada</h2>
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label>Producto</label>
          <select name="productId" value={form.productId} onChange={handleChange} required>
            <option value="">Seleccione...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name} (stock: {p.quantity})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Cantidad</label>
          <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Fecha</label>
          <input type="date" name="movementDate" value={form.movementDate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Observación</label>
          <textarea name="observation" value={form.observation} onChange={handleChange} rows="3" />
        </div>
        <button className="btn-secondary" type="submit">Registrar entrada</button>
      </form>
    </PrivateLayout>
  )
}
