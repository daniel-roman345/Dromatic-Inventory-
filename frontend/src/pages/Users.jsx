import { useEffect, useState } from 'react'
import PrivateLayout from '../components/PrivateLayout.jsx'
import Alert from '../components/Alert.jsx'
import Loading from '../components/Loading.jsx'
import { ROLE_LABELS, useAuth } from '../context/AuthContext.jsx'
import { createUser, getUsers, setUserActive, unlockUser, updateUser } from '../services/userService'
import { errorMessage, formatTime } from '../utils/format'

const emptyForm = { username: '', email: '', password: '', role: 'OPERADOR', active: true }

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function load() {
    getUsers().then(setUsers).catch((err) => setError(errorMessage(err, 'No se pudieron cargar los usuarios.')))
  }

  useEffect(load, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function startEdit(u) {
    setEditingId(u.id)
    setForm({ username: u.username, email: u.email || '', password: '', role: u.role, active: u.active })
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!editingId && form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (editingId && form.password && form.password.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.')

    setSaving(true)
    try {
      if (editingId) {
        await updateUser(editingId, form)
        setSuccess(`Usuario ${form.username} actualizado correctamente.`)
      } else {
        await createUser(form)
        setSuccess(`Usuario ${form.username} registrado correctamente.`)
      }
      cancelEdit()
      load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar el usuario.'))
    } finally {
      setSaving(false)
    }
  }

  async function runAction(action, message) {
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess(message)
      load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo actualizar el usuario.'))
    }
  }

  return (
    <PrivateLayout>
      <div className="page-header">
        <div>
          <h1>👥 Usuarios</h1>
          <p className="muted">Cree las cuentas del personal y asigne qué puede hacer cada uno.</p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={error ? () => setError('') : undefined} />
      <Alert type="success" message={success} onClose={success ? () => setSuccess('') : undefined} />

      <div className="two-columns users-layout">
        <form className="card" onSubmit={handleSubmit}>
          <h2 className="card-title">{editingId ? `Editar usuario: ${form.username}` : 'Nuevo usuario'}</h2>
          <div className="form-group">
            <label htmlFor="username">Usuario *</label>
            <input id="username" name="username" maxLength={50} value={form.username} onChange={handleChange}
              disabled={Boolean(editingId)} required placeholder="Ej: jperez" />
          </div>
          <div className="form-group">
            <label htmlFor="password">{editingId ? 'Nueva contraseña' : 'Contraseña *'}</label>
            <input id="password" type="password" name="password" maxLength={100} autoComplete="new-password"
              value={form.password} onChange={handleChange} required={!editingId}
              placeholder={editingId ? 'Dejar vacío para no cambiarla' : 'Mínimo 8 caracteres'} />
          </div>
          <div className="form-group">
            <label htmlFor="role">Rol *</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="OPERADOR">Operador de inventario — entradas, salidas y productos</option>
              <option value="CONSULTA">Usuario de consulta — solo ver inventario</option>
              <option value="ADMINISTRADOR">Administrador — acceso total</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="email">Correo (opcional)</label>
            <input id="email" type="email" name="email" maxLength={100} value={form.email} onChange={handleChange} />
          </div>
          <div className="form-actions">
            {editingId && <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancelar</button>}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar usuario'}
            </button>
          </div>
        </form>

        <section className="card">
          {!users ? <Loading /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.username === currentUser?.username
                    return (
                      <tr key={u.id}>
                        <td><strong>{u.username}</strong>{isSelf && <span className="muted small"> (usted)</span>}{u.email && <div className="muted small">{u.email}</div>}</td>
                        <td>{ROLE_LABELS[u.role]}</td>
                        <td>
                          {u.active ? <span className="badge badge-green">Activo</span> : <span className="badge badge-gray">Inactivo</span>}
                          {u.locked && <div><span className="badge badge-red">🔒 Bloqueado hasta {formatTime(u.lockedUntil)}</span></div>}
                        </td>
                        <td className="actions">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}>Editar</button>
                          {u.locked && (
                            <button type="button" className="btn btn-ghost btn-sm"
                              onClick={() => runAction(() => unlockUser(u.id), `Usuario ${u.username} desbloqueado.`)}>Desbloquear</button>
                          )}
                          {!isSelf && (
                            <button type="button" className={`btn btn-sm ${u.active ? 'btn-ghost-danger' : 'btn-ghost'}`}
                              onClick={() => runAction(() => setUserActive(u.id, !u.active),
                                `Usuario ${u.username} ${u.active ? 'desactivado' : 'activado'}.`)}>
                              {u.active ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PrivateLayout>
  )
}
