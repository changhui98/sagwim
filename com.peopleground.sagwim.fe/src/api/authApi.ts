import type { SignInRequest, SignUpRequest } from '../types/auth'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'

interface SendVerificationRequest {
  email: string
}

interface VerifyEmailRequest {
  email: string
  code: string
}

const toErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text()
  if (!text) {
    return `Request failed: ${response.status} ${response.statusText}`
  }

  try {
    const parsed = JSON.parse(text) as { message?: string }
    return parsed.message ?? text
  } catch {
    return text
  }
}

export const signIn = async (payload: SignInRequest): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const token = response.headers.get('Authorization') ?? ''
  if (!token) {
    throw new ApiError(response.status, '로그인은 성공했지만 Authorization 토큰이 없습니다.')
  }
  return token
}

export const signUp = async (payload: SignUpRequest) => {
  const response = await fetch(`${API_BASE_URL}/auth/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  return response.json()
}

export const sendEmailVerification = async (payload: SendVerificationRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/email/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }
}

export const verifyEmailCode = async (payload: VerifyEmailRequest): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/email/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }
}

export const checkUsername = async (username: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`)

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const data = await response.json() as { available: boolean }
  return data.available
}

export const signOut = async (token: string): Promise<void> => {
  if (!token.trim()) return

  const response = await fetch(`${API_BASE_URL}/auth/sign-out`, {
    method: 'POST',
    headers: {
      Authorization: token.trim(),
    },
  })

  // 204 No Content 또는 성공 응답이면 정상
  if (!response.ok && response.status !== 204) {
    // 로그아웃 자체는 서버 오류여도 클라이언트에서 토큰 삭제를 막지 않음
    console.warn('[signOut] 서버 로그아웃 실패:', response.status)
  }
}
