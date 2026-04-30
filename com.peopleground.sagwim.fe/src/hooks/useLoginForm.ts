import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

interface UseLoginFormOptions {
  redirectTo: string
}

export function useLoginForm({ redirectTo }: UseLoginFormOptions) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setLoading(true)
      setError('')
      const token = await signIn(form)
      login(token)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return { form, setForm, loading, error, handleSubmit } as const
}
