import { client } from './client'
import type { Game, GameCreate, GamesListParams } from '../types'

export async function getGames(params: GamesListParams = {}): Promise<Game[]> {
  const p: Record<string, unknown> = { ...params }
  if (params.category_ids?.length) {
    p.category_ids = params.category_ids
  } else {
    delete p.category_ids
  }
  if (params.platform_ids?.length) {
    p.platform_ids = params.platform_ids
  } else {
    delete p.platform_ids
  }
  const res = await client.get('/games/', {
    params: p,
    paramsSerializer: { indexes: null },
  })
  return res.data
}

export async function getGame(id: number): Promise<Game> {
  const res = await client.get(`/games/${id}`)
  return res.data
}

export async function createGame(data: GameCreate): Promise<Game> {
  const res = await client.post('/games/', data)
  return res.data
}

export async function updateGame(id: number, data: Partial<GameCreate>): Promise<Game> {
  const res = await client.put(`/games/${id}`, data)
  return res.data
}

export async function deleteGame(id: number): Promise<Game> {
  const res = await client.delete(`/games/${id}`)
  return res.data
}
