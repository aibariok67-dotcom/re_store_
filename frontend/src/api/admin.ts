import { client } from './client'
import type { User } from '../types'

export async function getAdminUsers(search?: string): Promise<User[]> {
  const res = await client.get('/admin/users', {
    params: search ? { search } : undefined,
  })
  return res.data
}

export async function banUser(userId: number): Promise<void> {
  await client.post(`/admin/users/${userId}/ban`)
}

export async function banUserTemp(userId: number, bannedUntil: string): Promise<void> {
  await client.post(`/admin/users/${userId}/ban-temp`, null, {
    params: { banned_until: bannedUntil },
  })
}

export async function unbanUser(userId: number): Promise<void> {
  await client.post(`/admin/users/${userId}/unban`)
}

export async function deleteUser(userId: number): Promise<void> {
  await client.delete(`/admin/users/${userId}`)
}
