import { useState } from 'react'
import styles from './SocialLoginButtons.module.css'

interface SocialLoginButtonsProps {
  redirectUri: string
  variant?: 'start' | 'continue'
}

export function SocialLoginButtons({ redirectUri, variant = 'start' }: SocialLoginButtonsProps) {
  const label = variant === 'continue' ? '계속하기' : '시작하기'
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
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C7.032 3 3 6.336 3 10.5c0 2.676 1.608 5.028 4.032 6.456l-.972 3.636 4.212-2.784A10.8 10.8 0 0012 18c4.968 0 9-3.336 9-7.5S16.968 3 12 3z" fill="#3B1E1E"/>
        </svg>
        <span>카카오로 {label}</span>
      </button>

      <button
        type="button"
        className={`${styles.btn} ${styles.googleBtn}`}
        onClick={handleGoogleLogin}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>구글로 {label}</span>
      </button>
    </div>
  )
}
