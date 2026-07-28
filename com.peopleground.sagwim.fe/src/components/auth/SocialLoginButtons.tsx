import { useState } from 'react'
import styles from './SocialLoginButtons.module.css'

interface SocialLoginButtonsProps {
  redirectUri: string
  /** 'login' — 카카오 로그인 / 'signup' — 카카오로 시작하기(카카오싱크 표준). 구글 문구는 양쪽 동일. */
  variant?: 'login' | 'signup'
}

export function SocialLoginButtons({ redirectUri, variant = 'signup' }: SocialLoginButtonsProps) {
  // 카카오는 맥락별 규정 문구가 다르고, 구글은 'Google로 계속하기' 하나로 고정된다.
  const kakaoLabel = variant === 'login' ? '카카오 로그인' : '카카오로 시작하기'
  const googleLabel = 'Google로 계속하기'
  const [envError, setEnvError] = useState('')

  const handleKakaoLogin = () => {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID as string | undefined
    if (!kakaoClientId) {
      setEnvError('카카오 로그인을 사용할 수 없습니다. (CLIENT_ID 미설정)')
      console.error('[SocialLogin] VITE_KAKAO_CLIENT_ID 가 설정되지 않았습니다.')
      return
    }
    setEnvError('')
    const url = new URL('https://kauth.kakao.com/oauth/authorize')
    url.searchParams.set('client_id', kakaoClientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', 'KAKAO')
    window.location.href = url.toString()
  }

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!googleClientId) {
      setEnvError('구글 로그인을 사용할 수 없습니다. (CLIENT_ID 미설정)')
      console.error('[SocialLogin] VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.')
      return
    }
    setEnvError('')
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', googleClientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'openid email profile')
    url.searchParams.set('state', 'GOOGLE')
    window.location.href = url.toString()
  }

  return (
    <div className={styles.container}>
      {envError && (
        <p className="alert alert-error" role="alert">{envError}</p>
      )}

      <button
        type="button"
        className={`${styles.btn} ${styles.kakaoBtn}`}
        onClick={handleKakaoLogin}
      >
        {/* 카카오 공식 말풍선 심볼 — 노란 버튼 위 검정 (developers.kakao.com 디자인 가이드) */}
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.79 1.86 5.24 4.65 6.62-.15.53-.98 3.38-1.01 3.6 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.42 4.28-2.83.55.08 1.12.12 1.75.12 5.52 0 10-3.48 10-7.76S17.52 3 12 3z" fill="#000000"/>
        </svg>
        <span>{kakaoLabel}</span>
      </button>

      <button
        type="button"
        className={`${styles.btn} ${styles.googleBtn}`}
        onClick={handleGoogleLogin}
      >
        {/* 구글 공식 4색 G 로고 — 색·형태 변경 금지 (developers.google.com/identity/branding-guidelines) */}
        <svg className={styles.icon} viewBox="0 0 48 48" aria-hidden="true">
          <path d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" fill="#4285F4"/>
          <path d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" fill="#34A853"/>
          <path d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" fill="#FBBC05"/>
          <path d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" fill="#EA4335"/>
        </svg>
        <span>{googleLabel}</span>
      </button>
    </div>
  )
}
