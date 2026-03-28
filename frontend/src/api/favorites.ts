import { client } from './client'
import type { Game } from '../types'

export async function getFavorites(): Promise<Game[]> {
  const res = await client.get('/favorites/')
  return res.data
}

/** Избранное другого пользователя (публично) */
export async function getUserFavorites(userId: number): Promise<Game[]> {
  const res = await client.get(`/favorites/user/${userId}`)
  return res.data
}

export async function addFavorite(gameId: number): Promise<void> {
  await client.post(`/favorites/${gameId}`)
}

export async function removeFavorite(gameId: number): Promise<void> {
  await client.delete(`/favorites/${gameId}`)
}
