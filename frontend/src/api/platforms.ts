import { client } from './client'
import type { Platform } from '../types'

export async function getPlatforms(): Promise<Platform[]> {
  const res = await client.get('/platforms/')
  return res.data
}

export async function createPlatform(name: string): Promise<Platform> {
  const res = await client.post('/platforms/', { name })
  return res.data
}

export async function updatePlatform(id: number, name: string): Promise<Platform> {
  const res = await client.put(`/platforms/${id}`, { name })
  return res.data
}

export async function deletePlatform(id: number): Promise<Platform> {
  const res = await client.delete(`/platforms/${id}`)
  return res.data
}
