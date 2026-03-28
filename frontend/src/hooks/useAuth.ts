import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getMe } from '../api/auth'

export function useAuth() {
  const { token, user, setUser, logout } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
    retry: false,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    const handleLogout = () => logout()
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [logout])

  return {
    user: data ?? user,
    token,
    isLoading: !!token && isLoading,
    isAuthenticated: !!token,
    logout,
  }
}
