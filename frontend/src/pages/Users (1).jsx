import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import { getUsers, createUser, setUserActive } from '../services/userService'

const empty = { username: '', email: '', password: '', role: 'CONSULTA' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function load() {
    getUsers().then(setUsers).catch(() => setError('No se pudieron cargar los usuarios.'))
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
      await createUser(form)
      setSuccess('Usuario registrado correctamente.')
      setForm(empty)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el usuario.')
    }
  }

  async function toggleActive(user) {
    try {
      await setUserActive(user.id, !user.active)
      load()
    } catch {
      setError('No se pudo actualizar el usuario.')
    }
  }

  return (
    <PrivateLayout>
      <h2 style={{ marginBottom: 16 }}>Usuarios</h2>
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20, maxWidth: 480 }}>
        <h3 style={{ marginBottom: 12 }}>Nuevo usuario</h3>
        <div className="form-group">
          <label>Usuario</label>
          <input name="username" value={form.username} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Correo</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Rol</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="OPERADOR">Operador</option>
            <option value="CONSULTA">Consulta</option>
          </select>
        </div>
        <button className="btn-primary" type="submit">Registrar usuario</button>
      </form>

      <div className="card">
        <table>
          <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td className={u.active ? 'badge-ok' : 'badge-low'}>{u.active ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button className="btn-outline" onClick={() => toggleActive(u)}>
                    {u.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrivateLayout>
  )
}
