import api from './api'

export async function getUsers() {
  const { data } = await api.get('/users')
  return data
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload)
  return data
}

export async function setUserActive(id, active) {
  const { data } = await api.put(`/users/${id}/active`, null, { params: { active } })
  return data
}

export async function unlockUser(id) {
  const { data } = await api.put(`/users/${id}/unlock`)
  return data
}
