/**
 * useOAuth — 카카오 / 구글 소셜 로그인 훅
 *
 * [흐름 — 백엔드 브릿지 방식]
 * 1. ASWebAuthenticationSession(expo-web-browser)으로 provider 인가 페이지를 연다.
 *    이때 redirect_uri 는 앱 스킴이 아니라 백엔드 브릿지 URL(https 또는 localhost)이다.
 * 2. 사용자가 동의하면 provider 가 브릿지(GET /auth/social/callback)를 호출하고,
 *    브릿지는 302 로 sagwim://oauth?code=...&state=... 를 되돌려준다.
 * 3. 세션이 그 커스텀 스킴을 가로채 result.url 로 넘겨주면 code 를 파싱한다.
 * 4. code + 같은 redirectUri 를 백엔드 /auth/social/sign-in 으로 보내 JWT 를 받는다.
 * 5. 409 충돌(이메일 중복)이면 사용자 확인 후 /auth/social/link 를 호출한다.
 *
 * [왜 앱 스킴을 redirect_uri 로 직접 쓰지 않는가]
 * 구글은 web 클라이언트의 redirect URI 에 https 를 요구한다(localhost 만 예외, raw IP 금지).
 * 커스텀 스킴을 쓰려면 iOS 클라이언트를 따로 발급해야 하는데, iOS 클라이언트에는
 * client_secret 이 없고 백엔드 GoogleOAuthClient 는 secret 으로 code 를 교환한다.
 * 브릿지를 두면 웹과 동일한 클라이언트 ID·시크릿을 그대로 재사용할 수 있다.
 *
 * [환경변수]
 * EXPO_PUBLIC_OAUTH_REDIRECT_URI — 브릿지 콜백 URL. provider 콘솔 등록값과 문자 단위로 일치해야 함
 * EXPO_PUBLIC_KAKAO_CLIENT_ID    — 카카오 REST API 키 (웹과 공용)
 * EXPO_PUBLIC_GOOGLE_CLIENT_ID   — 구글 웹 클라이언트 ID (백엔드가 쓰는 것과 동일해야 함)
 */

import { useCallback, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { socialSignIn, linkSocialAccount } from '../api/authApi'
import type { EmailConflictResult } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

type OAuthProvider = 'KAKAO' | 'GOOGLE'

interface UseOAuthResult {
  loading: boolean
  handleKakaoLogin: () => Promise<void>
  handleGoogleLogin: () => Promise<void>
}

const REDIRECT_URI = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI

/** 백엔드 app.mobile.oauth-callback-url 기본값과 반드시 문자열이 일치해야 한다. */
const APP_RETURN_URL = 'sagwim://oauth'

const AUTHORIZE_ENDPOINT: Record<OAuthProvider, string> = {
  KAKAO: 'https://kauth.kakao.com/oauth/authorize',
  GOOGLE: 'https://accounts.google.com/o/oauth2/v2/auth',
}

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  KAKAO: '카카오',
  GOOGLE: '구글',
}

/**
 * 인가 URL을 문자열로 직접 조립한다.
 *
 * RN 의 URL 폴리필(react-native/Libraries/Blob/URL.js)은 쿼리·해시가 없는 URL 끝에
 * 슬래시를 강제로 붙여 `.../oauth/authorize` 를 `.../oauth/authorize/` 로 바꾼다.
 * 그래서 웹(SocialLoginButtons.tsx)의 `new URL(...)` 코드는 여기서 재사용할 수 없다.
 *
 * scope 는 카카오에 붙이지 않는다 — 동작이 검증된 웹 구현과 동일하게 맞춘다.
 */
function buildAuthorizeUrl(provider: OAuthProvider, clientId: string, redirectUri: string): string {
  const params = [
    `client_id=${encodeURIComponent(clientId)}`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    'response_type=code',
    `state=${provider}`,
  ]
  if (provider === 'GOOGLE') {
    params.push(`scope=${encodeURIComponent('openid email profile')}`)
  }
  return `${AUTHORIZE_ENDPOINT[provider]}?${params.join('&')}`
}

export function useOAuth(): UseOAuthResult {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  // 더블 탭 방어. 버튼의 disabled={oauthLoading} 은 리렌더가 커밋된 뒤에야 적용되므로
  // 그 전에 들어온 두 번째 탭이 인증 세션을 중복으로 열 수 있다. state 로는 막지 못한다.
  const inFlightRef = useRef(false)

  const goHome = useCallback(async (jwtToken: string) => {
    await login(jwtToken)
    router.replace('/(app)/(tabs)')
  }, [login])

  // 이메일 충돌 — 사용자에게 기존 계정 연동 여부를 묻는다.
  const promptAccountLink = useCallback((conflict: EmailConflictResult) => {
    const label = conflict.provider === 'KAKAO' ? '카카오' : '구글'
    Alert.alert(
      '이미 가입된 이메일',
      `동일한 이메일로 이미 가입된 계정이 있습니다.\n${label} 계정을 기존 계정에 연동하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '연동하기',
          onPress: async () => {
            if (inFlightRef.current) return
            inFlightRef.current = true
            try {
              setLoading(true)
              const linked = await linkSocialAccount(conflict.provider, conflict.accessToken)
              await goHome(linked.jwtToken)
            } catch (err) {
              Alert.alert('연동 실패', err instanceof Error ? err.message : '계정 연동에 실패했습니다.')
            } finally {
              setLoading(false)
              inFlightRef.current = false
            }
          },
        },
      ],
    )
  }, [goHome])

  const handleOAuthLogin = useCallback(
    async (provider: OAuthProvider) => {
      if (inFlightRef.current) return
      inFlightRef.current = true

      try {
        const clientId =
          provider === 'KAKAO'
            ? process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID
            : process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID

        if (!clientId) {
          Alert.alert(
            '설정 오류',
            `${PROVIDER_LABEL[provider]} 클라이언트 ID가 설정되지 않았습니다.\n.env 파일을 확인해주세요.`,
          )
          return
        }
        if (!REDIRECT_URI) {
          Alert.alert(
            '설정 오류',
            'EXPO_PUBLIC_OAUTH_REDIRECT_URI가 설정되지 않았습니다.\n.env 파일을 확인해주세요.',
          )
          return
        }

        setLoading(true)

        const result = await WebBrowser.openAuthSessionAsync(
          buildAuthorizeUrl(provider, clientId, REDIRECT_URI),
          APP_RETURN_URL,
          { preferEphemeralSession: true },
        )

        // 사용자가 세션을 닫음(cancel/dismiss) — 조용히 종료
        if (result.type !== 'success') {
          return
        }

        const params = new URLSearchParams(result.url.split('?')[1] ?? '')

        // 동의 거부 시 provider 는 code 대신 error 를 실어 브릿지를 호출하고,
        // 브릿지가 그대로 앱까지 전달한다.
        const error = params.get('error')
        if (error) {
          Alert.alert('로그인 실패', params.get('error_description') ?? error)
          return
        }

        const code = params.get('code')
        if (!code) {
          Alert.alert('로그인 실패', 'Authorization code를 받지 못했습니다.')
          return
        }

        // state 는 요청한 provider 를 되돌려받는 값이다. 불일치는 응답 위조를 의미한다.
        if (params.get('state') !== provider) {
          Alert.alert('로그인 실패', '인증 응답이 요청과 일치하지 않습니다.')
          return
        }

        const outcome = await socialSignIn(provider, code, REDIRECT_URI)

        if (outcome.type === 'success') {
          await goHome(outcome.jwtToken)
        } else {
          promptAccountLink(outcome)
        }
      } catch (err) {
        Alert.alert(
          '로그인 실패',
          err instanceof Error ? err.message : '소셜 로그인 중 오류가 발생했습니다.',
        )
      } finally {
        setLoading(false)
        inFlightRef.current = false
      }
    },
    [goHome, promptAccountLink],
  )

  const handleKakaoLogin = useCallback(() => handleOAuthLogin('KAKAO'), [handleOAuthLogin])
  const handleGoogleLogin = useCallback(() => handleOAuthLogin('GOOGLE'), [handleOAuthLogin])

  return { loading, handleKakaoLogin, handleGoogleLogin }
}
