import api from './api'
import { cleanParams, todayISO } from '../utils/format'

async function downloadPdf(url, params, filename) {
  try {
    const response = await api.get(url, { params: cleanParams(params), responseType: 'blob' })
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000)
  } catch (err) {
    // Con responseType 'blob' el mensaje de error del backend también llega como Blob.
    if (err.response?.data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await err.response.data.text())
      } catch {
        // la respuesta no era JSON
      }
    }
    throw err
  }
}

export const downloadInventoryReport = () =>
  downloadPdf('/reports/inventory', {}, `reporte-inventario-${todayISO()}.pdf`)

export const downloadLowStockReport = () =>
  downloadPdf('/reports/low-stock', {}, `reporte-stock-bajo-${todayISO()}.pdf`)

export const downloadMovementsReport = (filters) =>
  downloadPdf('/reports/movements', filters, `reporte-movimientos-${todayISO()}.pdf`)
