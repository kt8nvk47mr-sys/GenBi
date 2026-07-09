import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { User } from '../types'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.setToken(token)
      api.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token')
          api.setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(username, password)
      localStorage.setItem('token', response.access_token)
      api.setToken(response.access_token)
      setUser(response.user)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    api.setToken(null)
    setUser(null)
  }, [])

  return { user, isAuthenticated: !!user, isLoading, login, logout }
}
