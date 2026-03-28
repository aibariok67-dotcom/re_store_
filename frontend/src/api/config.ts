function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '')
}

const raw = import.meta.env.VITE_API_URL

/**
 * Базовый URL FastAPI без завершающего слэша.
 * Задаётся через `VITE_API_URL`: полный URL (Vercel + Render) или `/api` при прокси в dev/Docker.
 */
export const API_BASE: string =
  typeof raw === 'string' && raw.trim() !== ''
    ? trimTrailingSlashes(raw.trim())
    : 'http://localhost:8000'
