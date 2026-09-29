import { useState } from 'react'
import { usersApi } from '../api/services'
import { errorMessage } from '../api/client'
import Icon from '../shared/Icon'
import { fmtAgo, initials } from '../shared/format'
import { Field, Loading, Modal, Notice, useLoad, useToast } from '../shared/ui'

/** Usuarios del sistema (solo administrador). Las contraseñas temporales se muestran una sola vez. */
export default function UsersPage() {
  const toast = useToast()
  const users = useLoad(() => usersApi.list(), [])
  const roles = useLoad(() => usersApi.roles(), [])
  const [editing, setEditing] = useState(null)
  const [temp, setTemp] = useState(null)

  async function act(fn, message) {
    try {
      const r = await fn()
      if (r?.temporaryPassword) setTemp(r)
      else toast(message)
      users.reload()
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  if (users.loading || roles.loading) return <Loading />
  if (users.error) return <Notice type="error">{errorMessage(users.error)}</Notice>

  return (
    <div>
      <div className="page-header">
        <div><h1>Usuarios</h1><p>Todos ven todo; cada rol modifica solo lo de su función.</p></div>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" /> Nuevo usuario</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Persona</th><th>Usuario</th><th>Rol</th><th>Alertas</th><th>Último ingreso</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {users.data.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: '.8rem' }}>{initials(u.fullName)}</div>
                    <div><div className="strong">{u.fullName}</div><div className="tiny muted">{u.jobTitle}</div></div>
                  </div>
                </td>
                <td className="mono small">{u.username}</td>
                <td>{u.roleName}</td>
                <td className="small">{u.receivesStockAlerts ? <span className="badge badge-info"><Icon name="bell" /> Recibe</span> : '—'}
                  {u.receivesStockAlerts && <div className="tiny muted">{[u.email && 'correo', u.phone && 'WhatsApp'].filter(Boolean).join(' y ') || 'sin correo ni WhatsApp'}</div>}</td>
                <td className="small muted">{u.lastLoginAt ? fmtAgo(u.lastLoginAt) : 'Nunca'}</td>
                <td>
                  <div className="row" style={{ gap: 4 }}>
                    {u.active ? <span className="badge badge-ok">Activo</span> : <span className="badge badge-gray">Inactivo</span>}
                    {u.locked && <span className="badge badge-danger"><Icon name="lock" /> Bloqueado</span>}
                    {u.mustChangePassword && <span className="badge badge-warn">Clave temporal</span>}
                  </div>
                </td>
                <td>
                  <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                    <button className="btn btn-sm" onClick={() => setEditing(u)} title="Editar"><Icon name="edit" /></button>
                    {u.locked && <button className="btn btn-sm" onClick={() => act(() => usersApi.unlock(u.id), 'Desbloqueado')} title="Desbloquear"><Icon name="unlock" /></button>}
                    <button className="btn btn-sm" title="Nueva contraseña temporal" onClick={() => window.confirm(`¿Generar una contraseña temporal nueva para ${u.fullName}?`) && act(() => usersApi.resetPassword(u.id))}><Icon name="key" /></button>
                    <button className="btn btn-sm" title={u.active ? 'Desactivar' : 'Activar'} onClick={() => act(() => usersApi.setActive(u.id, !u.active), u.active ? 'Desactivado' : 'Activado')}>
                      <Icon name={u.active ? 'close' : 'check'} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <UserModal user={editing} roles={roles.data} onClose={() => setEditing(null)}
                             onSaved={(r) => { setEditing(null); users.reload(); if (r?.temporaryPassword) setTemp(r); else toast('Usuario guardado') }} />}
      {temp && (
        <Modal title="Contraseña temporal" onClose={() => setTemp(null)} footer={<button className="btn btn-primary" onClick={() => setTemp(null)}>Ya la anoté</button>}>
          <div className="stack">
            <p>Entréguesela a <b>{temp.user.fullName}</b>. Solo se muestra esta vez; al entrar deberá crear la suya.</p>
            <div className="card center" style={{ background: 'var(--brand-soft)' }}>
              <div className="small muted">Usuario: <b className="mono">{temp.user.username}</b></div>
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '.05em', marginTop: 6 }}>{temp.temporaryPassword}</div>
            </div>
            <button className="btn" onClick={() => navigator.clipboard?.writeText(temp.temporaryPassword)}><Icon name="copy" /> Copiar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UserModal({ user, roles, onClose, onSaved }) {
  const isNew = !user.id
  const [form, setForm] = useState({
    username: user.username || '', fullName: user.fullName || '', jobTitle: user.jobTitle || '', email: user.email || '',
    phone: user.phone || '', roleCode: user.roleCode || 'CONSULTA', receivesStockAlerts: Boolean(user.receivesStockAlerts), active: user.active ?? true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function save() {
    setBusy(true)
    setError('')
    try {
      const body = { ...form, email: form.email || null, phone: form.phone.replace(/\D/g, '') || null, jobTitle: form.jobTitle || null }
      onSaved(isNew ? await usersApi.create(body) : await usersApi.update(user.id, body))
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Modal title={isNew ? 'Nuevo usuario' : `Editar a ${user.fullName}`} size="lg" onClose={onClose} busy={busy}
           footer={<><button className="btn" onClick={onClose} disabled={busy}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></>}>
      <div className="stack">
        <div className="form-grid">
          <Field label="Nombre completo" required><input value={form.fullName} onChange={set('fullName')} maxLength={120} autoFocus /></Field>
          <Field label="Usuario" required hint="Con el que entra al sistema"><input value={form.username} onChange={set('username')} maxLength={50} /></Field>
          <Field label="Cargo"><input value={form.jobTitle} onChange={set('jobTitle')} maxLength={80} placeholder="Jefe de compras…" /></Field>
          <Field label="Rol" required>
            <select value={form.roleCode} onChange={set('roleCode')}>
              {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="small muted">{roles.find((r) => r.code === form.roleCode)?.description}</div>
        <div className="form-grid">
          <Field label="Correo" hint="Para las alertas de stock bajo"><input type="email" value={form.email} onChange={set('email')} maxLength={120} /></Field>
          <Field label="WhatsApp" hint="Con indicativo: 573001234567"><input inputMode="tel" value={form.phone} onChange={set('phone')} maxLength={20} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={form.receivesStockAlerts} onChange={set('receivesStockAlerts')} /> Recibe las alertas de stock bajo</label>
        {!isNew && <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Activo (puede entrar)</label>}
        {isNew && <Notice type="info">Al guardar se genera una contraseña temporal para entregarle.</Notice>}
        <Notice type="error">{error}</Notice>
      </div>
    </Modal>
  )
}
