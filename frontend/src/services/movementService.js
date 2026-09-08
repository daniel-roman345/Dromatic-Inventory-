import api from './api'

export async function getMovements(params = {}) {
  const { data } = await api.get('/movements', { params })
  return data
}

export async function registerEntry(payload) {
  const { data } = await api.post('/movements/entry', payload)
  return data
}

export async function registerExit(payload) {
  const { data } = await api.post('/movements/exit', payload)
  return data
}
