import api from './api'
import { cleanParams } from '../utils/format'

export async function getMovements(params = {}) {
  const { data } = await api.get('/movements', { params: cleanParams(params) })
  return data
}

export async function getMovementReasons() {
  const { data } = await api.get('/movements/reasons')
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

export async function voidMovement(id, reason) {
  const { data } = await api.post(`/movements/${id}/void`, { reason })
  return data
}
