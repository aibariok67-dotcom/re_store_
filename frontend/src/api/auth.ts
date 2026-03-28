import { client } from './client'
import type { User, Token } from '../types'

export async function login(email: string, password: string): Promise<Token> {
  const res = await client.post('/auth/login', { email, password })
  return res.data
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const res = await client.post('/auth/register', { username, email, password })
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await client.get('/auth/me')
  return res.data
}

export async function updateMe(data: {
  username?: string
  password?: string
  avatar_url?: string
}): Promise<User> {
  const res = await client.patch('/auth/me', data)
  return res.data
}

export async function getUserById(id: number): Promise<User> {
  const res = await client.get(`/auth/users/${id}`)
  return res.data
}
