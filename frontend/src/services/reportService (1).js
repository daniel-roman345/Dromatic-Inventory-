import api from './api'

async function downloadPdf(url, params, filename) {
  const response = await api.get(url, { params, responseType: 'blob' })
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const downloadInventoryReport = () => downloadPdf('/reports/inventory', {}, 'reporte-inventario.pdf')
export const downloadLowStockReport = () => downloadPdf('/reports/low-stock', {}, 'reporte-stock-bajo.pdf')
export const downloadMovementsReport = (params) => downloadPdf('/reports/movements', params, 'reporte-movimientos.pdf')
