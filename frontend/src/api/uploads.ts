import { API_BASE } from './config'

function postUploadUrl(): string {
  return `${API_BASE}/uploads/image`
}

export async function uploadImage(blob: Blob, filename = 'image.jpg'): Promise<string> {
  const form = new FormData()
  form.append('file', blob, filename)

  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(postUploadUrl(), {
    method: 'POST',
    headers,
    body: form,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Ошибка загрузки' }))
    throw new Error(err.detail || 'Ошибка загрузки')
  }

  const data = await response.json()
  return data.url as string
}
