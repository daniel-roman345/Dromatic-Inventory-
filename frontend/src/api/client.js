import axios from 'axios'

/**
 * Cliente HTTP del backend. Agrega el token de sesión, avisa cuando la sesión
 * vence y cuando el usuario debe cambiar su contraseña temporal.
 */
export const TOKEN_KEY = 'dis_token'
export const USER_KEY = 'dis_user'
export const SESSION_EXPIRED_EVENT = 'dis:session-expired'
export const PASSWORD_CHANGE_EVENT = 'dis:password-change-required'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isLogin = error.config?.url?.includes('/auth/login')
    if (status === 401 && !isLogin) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    if (status === 403 && error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
      window.dispatchEvent(new Event(PASSWORD_CHANGE_EVENT))
    }
    return Promise.reject(error)
  },
)

/** Mensaje entendible para mostrar al usuario a partir de un error de la API. */
export function errorMessage(error, fallback = 'No se pudo completar la acción. Intente de nuevo.') {
  if (!error?.response) {
    return 'No hay conexión con el servidor. Verifique que el sistema esté encendido.'
  }
  const data = error.response.data
  if (data instanceof Blob) return fallback
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0]
    if (first) return first
  }
  return data?.message || fallback
}

/** Descarga un archivo protegido (reportes) y lo guarda con su nombre. */
export async function downloadFile(url, params, fallbackName) {
  const response = await client.get(url, { params, responseType: 'blob' })
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
  const name = match ? decodeURIComponent(match[1] || match[2]) : fallbackName
  const href = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = href
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), 2000)
}

export default client
