import { client } from './client'
import type { Review, ReviewCreate } from '../types'

export async function getGameReviews(gameId: number): Promise<Review[]> {
  const res = await client.get(`/reviews/game/${gameId}`)
  return res.data
}

export async function getMyReviews(): Promise<Review[]> {
  const res = await client.get('/reviews/my')
  return res.data
}

export async function getUserReviews(userId: number): Promise<Review[]> {
  const res = await client.get(`/reviews/user/${userId}`)
  return res.data
}

export async function createReview(data: ReviewCreate): Promise<Review> {
  const res = await client.post('/reviews/', data)
  return res.data
}

export async function deleteReview(id: number): Promise<Review> {
  const res = await client.delete(`/reviews/${id}`)
  return res.data
}
