import { client } from './client'
import type { GameReviewsAISummary } from '../types'

export async function postGameReviewsAISummary(gameId: number): Promise<GameReviewsAISummary> {
  const res = await client.post(`/ai/games/${gameId}/reviews-summary`)
  return res.data
}
