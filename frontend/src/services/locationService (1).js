import api from './api'

export async function getLocations() {
  const { data } = await api.get('/locations')
  return data
}

export async function createLocation(payload) {
  const { data } = await api.post('/locations', payload)
  return data
}

export async function updateLocation(id, payload) {
  const { data } = await api.put(`/locations/${id}`, payload)
  return data
}

export async function deleteLocation(id) {
  const { data } = await api.delete(`/locations/${id}`)
  return data
}
