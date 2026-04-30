import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/ApiError'
import { useAuth } from '../context/AuthContext'

export function useHandleUnauthorized() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
      }
    },
    [logout, navigate],
  )
}
