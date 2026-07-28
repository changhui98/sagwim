import apiClient from '../lib/apiClient'
import type { SignInRequest, SignUpRequest } from '../types/auth'

// ── 소셜 로그인 타입 ──────────────────────────────────────────────────────────

export interface SocialSignInResult {
  jwtToken: string
  isNewUser: boolean
  nickname: string
}

export interface EmailConflictResult {
  type: 'email_conflict'
  accessToken: string
  provider: string
}

export type SocialSignInOutcome =
  | ({ type: 'success' } & SocialSignInResult)
  | EmailConflictResult

/**
 * 로그인 요청.
 * 서버는 토큰을 응답 본문이 아닌 Authorization 헤더로 반환합니다.
 * axios는 응답 헤더 키를 소문자로 정규화하므로 'authorization'으로 접근합니다.
 *
 * @returns Bearer 토큰 문자열 (예: "Bearer eyJ...")
 * @throws 로그인 실패 또는 토큰 누락 시 Error
 */
export const signIn = async (payload: SignInRequest): Promise<string> => {
  const response = await apiClient.post('/auth/sign-in', payload)

  const token: string | undefined = response.headers['authorization']
  if (!token) {
    throw new Error('로그인은 성공했지만 Authorization 토큰이 없습니다.')
  }
  return token
}

/**
 * 회원가입 요청.
 */
export const signUp = async (payload: SignUpRequest): Promise<unknown> => {
  const response = await apiClient.post('/auth/sign-up', payload)
  return response.data
}

/**
 * 로그아웃 요청.
 * 서버 실패 시에도 클라이언트 토큰 삭제를 막지 않으므로 에러를 삼킵니다.
 */
export const signOut = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/sign-out')
  } catch (e) {
    console.warn('[authApi] signOut 서버 요청 실패 (무시):', e)
  }
}

/**
 * 이메일 인증 코드 전송.
 */
export const sendEmailVerification = async (email: string): Promise<void> => {
  await apiClient.post('/auth/email/send-verification', { email })
}

/**
 * 이메일 인증 코드 확인.
 */
export const verifyEmailCode = async (email: string, code: string): Promise<void> => {
  await apiClient.post('/auth/email/verify', { email, code })
}

/**
 * 아이디 중복 확인.
 */
export const checkUsername = async (username: string): Promise<boolean> => {
  const response = await apiClient.get<{ available: boolean }>(
    `/auth/check-username?username=${encodeURIComponent(username)}`,
  )
  return response.data.available
}

/**
 * 닉네임 중복 확인.
 */
export const checkNickname = async (nickname: string): Promise<boolean> => {
  const response = await apiClient.get<{ available: boolean }>(
    `/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  )
  return response.data.available
}

/**
 * 소셜 로그인 (카카오 / 구글).
 *
 * 백엔드는 authorization code를 받아 직접 OAuth 토큰 교환을 수행하고 JWT를 발급합니다.
 * 동일 이메일로 다른 provider가 이미 가입돼 있으면 409를 반환하며,
 * 바디에 accessToken과 provider를 포함합니다.
 *
 * @returns SocialSignInOutcome — 성공 시 { type: 'success', ... }, 이메일 충돌 시 { type: 'email_conflict', ... }
 */
export const socialSignIn = async (
  provider: 'KAKAO' | 'GOOGLE',
  code: string,
  redirectUri: string,
): Promise<SocialSignInOutcome> => {
  try {
    const response = await apiClient.post('/auth/social/sign-in', {
      provider,
      code,
      redirectUri,
    })
    const token: string | undefined = response.headers['authorization']
    if (!token) {
      throw new Error('소셜 로그인 성공 후 Authorization 토큰이 없습니다.')
    }
    return {
      type: 'success',
      jwtToken: token,
      isNewUser: response.data.isNewUser ?? false,
      nickname: response.data.nickname ?? '',
    }
  } catch (err: unknown) {
    // apiClient의 response 인터셉터가 AxiosError를 status/code/data가 붙은 Error로
    // 변환해 reject하므로, err.response가 아니라 err.status/err.data를 읽는다.
    const apiError = err as {
      status?: number
      data?: { accessToken?: string; provider?: string }
    }
    if (apiError?.status === 409) {
      const body = apiError.data
      if (body?.accessToken && body?.provider) {
        return {
          type: 'email_conflict',
          accessToken: body.accessToken,
          provider: body.provider,
        }
      }
    }
    throw err
  }
}

/**
 * 소셜 계정 연동.
 *
 * 409 응답 후 사용자 동의를 받아 기존 계정에 소셜 provider를 연결합니다.
 * code 대신 409 바디의 accessToken을 그대로 전달합니다.
 */
export const linkSocialAccount = async (
  provider: string,
  accessToken: string,
): Promise<SocialSignInResult> => {
  const response = await apiClient.post('/auth/social/link', {
    provider,
    accessToken,
  })
  const token: string | undefined = response.headers['authorization']
  if (!token) {
    throw new Error('소셜 연동 후 Authorization 토큰이 없습니다.')
  }
  return {
    jwtToken: token,
    isNewUser: response.data.isNewUser ?? false,
    nickname: response.data.nickname ?? '',
  }
}
