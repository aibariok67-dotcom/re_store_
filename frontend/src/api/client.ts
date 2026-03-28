import axios from 'axios'
import { API_BASE } from './config'

export const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  }
)

/**
 * URL для картинок и статики бэкенда.
 * При абсолютном `API_BASE` (отдельный хост) — полный URL на бэкенд; иначе путь от корня SPA (прокси /uploads, /static).
 */
export function getUploadUrl(path?: string | null): string {
  if (path == null || path === '') return ''
  const s = String(path).trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s

  const useBackendHost = /^https?:\/\//i.test(API_BASE)

  let p = s.replace(/^\/+/, '')
  while (p.startsWith('uploads/')) {
    p = p.slice('uploads/'.length)
  }

  const pathFromSiteRoot = p.startsWith('static/') ? p : `uploads/${p}`

  if (useBackendHost) {
    return `${API_BASE.replace(/\/+$/, '')}/${pathFromSiteRoot}`
  }
  return `/${pathFromSiteRoot}`
}
