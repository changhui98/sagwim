import type { SocialSignInResponse } from '../types/auth'
import { ApiError } from './ApiError'
import { API_BASE_URL } from './config'

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

/**
 * 소셜 로그인 (카카오 / 구글)
 * 서버는 Authorization 헤더로 JWT 토큰을 반환하고, 바디에 SocialSignInResponse를 반환한다.
 */
export const socialSignIn = async (
  provider: string,
  code: string,
  redirectUri: string,
): Promise<{ token: string; data: SocialSignInResponse }> => {
  const response = await fetch(`${API_BASE_URL}/auth/social/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, code, redirectUri }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await toErrorMessage(response))
  }

  const token = response.headers.get('Authorization') ?? ''
  if (!token) {
    throw new ApiError(response.status, '소셜 로그인은 성공했지만 Authorization 토큰이 없습니다.')
  }

  const data = (await response.json()) as SocialSignInResponse
  return { token, data }
}
