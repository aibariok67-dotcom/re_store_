import { client } from './client'
import type { User, PremiumStatus, PremiumProfileUpdate } from '../types'

export async function buyPremium(): Promise<User> {
  const res = await client.post('/premium/buy')
  return res.data
}

export async function getPremiumStatus(): Promise<PremiumStatus> {
  const res = await client.get('/premium/status')
  return res.data
}

export async function updatePremiumProfile(data: PremiumProfileUpdate): Promise<User> {
  const res = await client.patch('/premium/profile', data)
  return res.data
}

export async function disablePremium(): Promise<User> {
  const res = await client.post('/premium/disable')
  return res.data
}
