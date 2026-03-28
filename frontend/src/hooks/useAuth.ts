import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getMe } from '../api/auth'
import type { User } from '../types'

export function useAuth() {
  const { token, user, setUser, logout } = useAuthStore()

  const { data, isLoading, error } = useQuery<User>({
    // Должен совпадать с setQueryData(['me'], …) в Premium / Profile и т.д.
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    if (error) {
      logout()
    }
  }, [error, logout])

  useEffect(() => {
    const handleLogout = () => logout()
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [logout])

  return {
    user: data ?? user,
    token,
    isLoading: !!token && isLoading,
    isAuthenticated: !!token && !error,
    logout,
  }
}