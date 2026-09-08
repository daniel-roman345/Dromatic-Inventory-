import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { getLocations, createLocation, deleteLocation } from '../services/locationService'

const empty = { zone: '', aisle: '', shelf: '', level: '' }

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function load() {
    getLocations().then(setLocations).catch(() => setError('No se pudieron cargar las ubicaciones.'))
  }

  useEffect(load, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await createLocation(form)
      setSuccess('Ubicación registrada correctamente.')
      setForm(empty)
      load()
    } catch {
      setError('No se pudo registrar la ubicación.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta ubicación?')) return
    try {
      await deleteLocation(id)
      load()
    } catch {
      setError('No se pudo eliminar la ubicación.')
    }
  }

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>Ubicaciones</h2>
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20, maxWidth: 480 }}>
        <h3 style={{ marginBottom: 12 }}>Nueva ubicación</h3>
        <div className="form-group"><label>Zona</label><input name="zone" value={form.zone} onChange={handleChange} required /></div>
        <div className="form-group"><label>Pasillo</label><input name="aisle" value={form.aisle} onChange={handleChange} required /></div>
        <div className="form-group"><label>Estante</label><input name="shelf" value={form.shelf} onChange={handleChange} required /></div>
        <div className="form-group"><label>Nivel</label><input name="level" value={form.level} onChange={handleChange} required /></div>
        <button className="btn-primary" type="submit">Registrar ubicación</button>
      </form>

      <div className="card">
        <table>
          <thead><tr><th>Zona</th><th>Pasillo</th><th>Estante</th><th>Nivel</th><th>Acciones</th></tr></thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id}>
                <td>{l.zone}</td><td>{l.aisle}</td><td>{l.shelf}</td><td>{l.level}</td>
                <td><button className="btn-danger" onClick={() => handleDelete(l.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrivateLayout>
  )
}
