import { client } from './client'
import type { Category } from '../types'

export async function getCategories(): Promise<Category[]> {
  const res = await client.get('/categories/')
  return res.data
}

export async function createCategory(name: string): Promise<Category> {
  const res = await client.post('/categories/', { name })
  return res.data
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const res = await client.put(`/categories/${id}`, { name })
  return res.data
}

export async function deleteCategory(id: number): Promise<Category> {
  const res = await client.delete(`/categories/${id}`)
  return res.data
}
