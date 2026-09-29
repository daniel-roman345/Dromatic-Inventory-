import client from './client'

/**
 * Todas las llamadas al backend agrupadas por funcionalidad.
 * Cada función devuelve directamente los datos de la respuesta.
 */
const data = (promise) => promise.then((r) => r.data)

export const authApi = {
  login: (username, password) => data(client.post('/auth/login', { username, password })),
  me: () => data(client.get('/auth/me')),
  changePassword: (currentPassword, newPassword) =>
    data(client.post('/auth/change-password', { currentPassword, newPassword })),
}

export const modulesApi = {
  list: () => data(client.get('/modules')),
}

export const suggestionsApi = {
  forModule: (moduleId) => data(client.get('/suggestions', { params: { moduleId } })),
  adminList: () => data(client.get('/admin/suggestions')),
  create: (body) => data(client.post('/admin/suggestions', body)),
  remove: (id) => data(client.delete(`/admin/suggestions/${id}`)),
}

export const dashboardApi = {
  get: () => data(client.get('/dashboard')),
}

export const itemsApi = {
  search: (params) => data(client.get('/items', { params })),
  get: (id) => data(client.get(`/items/${id}`)),
  create: (body) => data(client.post('/items', body)),
  update: (id, body) => data(client.put(`/items/${id}`, body)),
  setStatus: (id, value) => data(client.patch(`/items/${id}/status`, null, { params: { value } })),
  remove: (id) => data(client.delete(`/items/${id}`)),
  imageBlob: (id, side) => data(client.get(`/items/${id}/images/${side}`, { responseType: 'blob' })),
  uploadImage: (id, side, file) => {
    const form = new FormData()
    form.append('file', file)
    return data(client.put(`/items/${id}/images/${side}`, form))
  },
  removeImage: (id, side) => data(client.delete(`/items/${id}/images/${side}`)),
  whatsapp: (id, headline, note) => data(client.get(`/items/${id}/whatsapp`, { params: { headline, note } })),
}

export const lotsApi = {
  get: (id) => data(client.get(`/lots/${id}`)),
  update: (id, body) => data(client.put(`/lots/${id}`, body)),
  verify: (id) => data(client.post(`/lots/${id}/verify`)),
  contentAt: (rackId, level) => data(client.get(`/locations/${rackId}/levels/${level}`)),
}

export const movementsApi = {
  search: (params) => data(client.get('/movements', { params })),
  entry: (body) => data(client.post('/movements/entry', body)),
  exit: (body) => data(client.post('/movements/exit', body)),
  transfer: (body) => data(client.post('/movements/transfer', body)),
  adjust: (body) => data(client.post('/movements/adjust', body)),
  voidMovement: (id, reason) => data(client.post(`/movements/${id}/void`, { reason })),
}

export const mapsApi = {
  areas: () => data(client.get('/maps')),
  layout: (code) => data(client.get(`/maps/${code}`)),
}

export const mapAdminApi = {
  createArea: (body) => data(client.post('/admin/maps/areas', body)),
  updateArea: (id, body) => data(client.put(`/admin/maps/areas/${id}`, body)),
  perimeter: (areaId, body) => data(client.post(`/admin/maps/areas/${areaId}/perimeter`, body)),
  createSection: (areaId, body) => data(client.post(`/admin/maps/areas/${areaId}/sections`, body)),
  updateSection: (id, body) => data(client.put(`/admin/maps/sections/${id}`, body)),
  deleteSection: (id) => data(client.delete(`/admin/maps/sections/${id}`)),
  copyRacks: (id, sourceId) => data(client.post(`/admin/maps/sections/${id}/copy-from/${sourceId}`)),
  createRack: (sectionId, body) => data(client.post(`/admin/maps/sections/${sectionId}/racks`, body)),
  updateRack: (id, body) => data(client.put(`/admin/maps/racks/${id}`, body)),
  deleteRack: (id) => data(client.delete(`/admin/maps/racks/${id}`)),
  addLevel: (id, at) => data(client.post(`/admin/maps/racks/${id}/levels`, null, { params: { at } })),
  removeLevel: (id, level) => data(client.delete(`/admin/maps/racks/${id}/levels/${level}`)),
  createLandmark: (areaId, body) => data(client.post(`/admin/maps/areas/${areaId}/landmarks`, body)),
  updateLandmark: (id, body) => data(client.put(`/admin/maps/landmarks/${id}`, body)),
  deleteLandmark: (id) => data(client.delete(`/admin/maps/landmarks/${id}`)),
}

export const locateApi = {
  search: (q, module) => data(client.get('/locate', { params: { q, module } })),
}

export const alertsApi = {
  list: (status) => data(client.get('/alerts', { params: { status } })),
  count: () => data(client.get('/alerts/count')),
  config: () => data(client.get('/alerts/config')),
  whatsapp: (id) => data(client.get(`/alerts/${id}/whatsapp`)),
  ack: (id, note) => data(client.post(`/alerts/${id}/ack`, { note })),
  resend: (id) => data(client.post(`/admin/alerts/${id}/resend`)),
  testEmail: () => data(client.post('/admin/alerts/test-email')),
}

export const usersApi = {
  list: () => data(client.get('/users')),
  roles: () => data(client.get('/users/roles')),
  create: (body) => data(client.post('/users', body)),
  update: (id, body) => data(client.put(`/users/${id}`, body)),
  setActive: (id, value) => data(client.patch(`/users/${id}/active`, null, { params: { value } })),
  unlock: (id) => data(client.post(`/users/${id}/unlock`)),
  resetPassword: (id) => data(client.post(`/users/${id}/reset-password`)),
}
