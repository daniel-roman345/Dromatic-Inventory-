import api from './api'
import { cleanParams } from '../utils/format'

export async function getProducts(params = {}) {
  const { data } = await api.get('/products', { params: cleanParams(params) })
  return data
}

export async function getLowStockProducts() {
  const { data } = await api.get('/products/low-stock')
  return data
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`)
  return data
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload)
  return data
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload)
  return data
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/products/${id}`)
  return data
}
