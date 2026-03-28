import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const client = axios.create({
  baseURL: API_URL,
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
 * URL для отображения загруженного файла.
 * Всегда путь от корня сайта: /uploads/<file> — в dev Vite проксирует на FastAPI,
 * в Docker nginx проксирует (блок ^~ /uploads/, иначе *.jpg regex отдаёт 404).
 * Нормализует дубликаты префикса uploads/ в БД.
 */
export function getUploadUrl(path?: string | null): string {
  if (path == null || path === '') return ''
  const raw = String(path).trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw

  let p = raw.replace(/^\/+/, '')
  while (p.startsWith('uploads/')) {
    p = p.slice('uploads/'.length)
  }

  if (p.startsWith('static/')) {
    return `/${p}`
  }

  return `/uploads/${p}`
}
