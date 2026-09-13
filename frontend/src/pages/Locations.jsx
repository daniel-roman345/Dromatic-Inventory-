import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { createLocation, deleteLocation, getLocations, updateLocation } from '../services/locationService'
import { errorMessage } from '../utils/format'

const empty = { zone: '', aisle: '', shelf: '', level: '' }

export default function Locations() {
  const [locations, setLocations] = useState(null)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function load() {
    getLocations().then(setLocations).catch((err) => setError(errorMessage(err, 'No se pudieron cargar las ubicaciones.')))
  }

  useEffect(load, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(empty)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        await updateLocation(editingId, form)
        setSuccess('Ubicación actualizada correctamente.')
      } else {
        await createLocation(form)
        setSuccess('Ubicación registrada correctamente.')
      }
      cancelEdit()
      load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la ubicación.'))
    }
  }

  async function handleDelete(location) {
    if (!window.confirm(`¿Eliminar la ubicación ${location.zone} / ${location.aisle} / ${location.shelf} / ${location.level}?`)) return
    setError('')
    setSuccess('')
    try {
      await deleteLocation(location.id)
      setSuccess('Ubicación eliminada.')
      load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo eliminar la ubicación.'))
    }
  }

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>📍 Ubicaciones de la bodega</h1>
          <p className="muted">Lugares donde se guardan los productos (zona, pasillo, estante y nivel).</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={error ? () => setError('') : undefined} />
      <Alert type="success" message={success} onClose={success ? () => setSuccess('') : undefined} />

      <div className="two-columns users-layout">
        <form className="card" onSubmit={handleSubmit}>
          <h2 className="card-title">{editingId ? 'Editar ubicación' : 'Nueva ubicación'}</h2>
          <div className="form-group"><label htmlFor="zone">Zona *</label><input id="zone" name="zone" maxLength={30} placeholder="Ej: Zona A" value={form.zone} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="aisle">Pasillo *</label><input id="aisle" name="aisle" maxLength={30} placeholder="Ej: Pasillo 2" value={form.aisle} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="shelf">Estante *</label><input id="shelf" name="shelf" maxLength={30} placeholder="Ej: Estante 03" value={form.shelf} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="level">Nivel *</label><input id="level" name="level" maxLength={30} placeholder="Ej: Nivel 1" value={form.level} onChange={handleChange} required /></div>
          <div className="form-actions">
            {editingId && <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancelar</button>}
            <button className="btn btn-primary" type="submit">{editingId ? 'Guardar cambios' : 'Registrar ubicación'}</button>
          </div>
        </form>

        <section className="card">
          {!locations ? <Loading /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Zona</th><th>Pasillo</th><th>Estante</th><th>Nivel</th><th></th></tr></thead>
                <tbody>
                  {locations.map((l) => (
                    <tr key={l.id}>
                      <td>{l.zone}</td><td>{l.aisle}</td><td>{l.shelf}</td><td>{l.level}</td>
                      <td className="actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingId(l.id); setForm({ zone: l.zone, aisle: l.aisle, shelf: l.shelf, level: l.level }) }}>Editar</button>
                        <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => handleDelete(l)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {locations.length === 0 && <tr><td colSpan="5" className="empty">No hay ubicaciones registradas.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PrivateLayout>
  )
}
