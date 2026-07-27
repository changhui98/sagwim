import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/NavIcons'
import { useLoginForm } from '../hooks/useLoginForm'
import { PasswordInput } from '../components/PasswordInput'
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons'
import { SocialAddressModal } from '../components/auth/SocialAddressModal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { socialSignIn, linkSocialAccount } from '../api/socialAuthApi'
import { ApiError } from '../api/ApiError'
import type { EmailConflictData } from '../types/auth'
import { updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import styles from './HomePage.module.css'

const REDIRECT_URI = `${window.location.origin}/login`

const PROVIDER_LABEL: Record<string, string> = {
  GOOGLE: '구글',
  KAKAO: '카카오',
}

export function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, token } = useAuth()
  const nextPath = (location.state as { from?: string } | null)?.from ?? '/app'
  const { form, setForm, loading, error, handleSubmit } = useLoginForm({
    redirectTo: nextPath,
  })

  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState('')
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [socialNickname, setSocialNickname] = useState('')

  // 계정 연동 확인 다이얼로그 상태
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const pendingLinkRef = useRef<{ provider: string; accessToken: string } | null>(null)
  // 이미 처리한 인가 code를 동기적으로 기록한다.
  // socialLoading state는 비동기 반영이라 StrictMode useEffect 이중 실행을 막지 못하고,
  // 같은 code로 토큰 교환이 2번 일어나 카카오 invalid_grant(KOE320)를 유발한다.
  const processedCodeRef = useRef<string | null>(null)

  // OAuth redirect callback 처리 (?code=...&state=KAKAO|GOOGLE)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const provider = params.get('state') // state 파라미터에 provider 정보를 담는다

    if (!code || !provider) return
    if (processedCodeRef.current === code) return
    processedCodeRef.current = code

    // URL 쿼리 파라미터 제거 (히스토리 교체)
    navigate(location.pathname, { replace: true, state: location.state })

    const processSocialLogin = async () => {
      try {
        setSocialLoading(true)
        setSocialError('')
        const { token: jwtToken, data } = await socialSignIn(provider, code, REDIRECT_URI)
        login(jwtToken)

        if (data.isNewUser) {
          // 최초 가입 사용자 — 추가 정보 등록 모달 표시
          setSocialNickname(data.nickname ?? '')
          setAddressModalOpen(true)
        } else {
          navigate(nextPath, { replace: true })
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // 동일 이메일로 가입된 계정 존재 → 연동 확인 다이얼로그 표시
          // 409 바디의 accessToken을 보관하여 link 단계에서 code 재사용(invalid_grant)을 방지한다.
          const conflict = err.conflictData as EmailConflictData | undefined
          pendingLinkRef.current = {
            provider: conflict?.provider ?? provider,
            accessToken: conflict?.accessToken ?? '',
          }
          setLinkDialogOpen(true)
        } else {
          setSocialError(err instanceof Error ? err.message : '소셜 로그인에 실패했습니다.')
        }
      } finally {
        setSocialLoading(false)
      }
    }

    processSocialLogin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const handleLinkConfirm = async () => {
    const pending = pendingLinkRef.current
    if (!pending) return

    try {
      setLinkLoading(true)
      setSocialError('')
      const { token: jwtToken } = await linkSocialAccount(pending.provider, pending.accessToken)
      login(jwtToken)
      setLinkDialogOpen(false)
      navigate(nextPath, { replace: true })
    } catch (err) {
      setLinkDialogOpen(false)
      setSocialError(err instanceof Error ? err.message : '계정 연동에 실패했습니다.')
    } finally {
      setLinkLoading(false)
      pendingLinkRef.current = null
    }
  }

  const handleLinkCancel = () => {
    setLinkDialogOpen(false)
    pendingLinkRef.current = null
  }

  const handleAddressSubmit = async (data: { nickname: string; address: string }) => {
    try {
      setAddressSaving(true)
      await updateMyProfile(token, {
        nickname: data.nickname,
        address: data.address,
        currentPassword: '',
        newPassword: '',
      })
      setAddressModalOpen(false)
      navigate(nextPath, { replace: true })
    } catch {
      // 실패해도 로그인 상태 유지하고 이동
      setAddressModalOpen(false)
      navigate(nextPath, { replace: true })
    } finally {
      setAddressSaving(false)
    }
  }

  return (
    <>
      <main className={styles.root}>
        <section className={`card animate-scale-in ${styles.card}`}>
          {/* Brand */}
          <div className={styles.brand}>
            <BrandLogo className={styles.brandMark} aria-hidden />
            <h1 className={styles.brandName}>Sagwim</h1>
            <p className={styles.tagline}>함께 모이는 공간</p>
          </div>

          {/* Login form */}
          <form className="form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="home-username">
                아이디
              </label>
              <input
                id="home-username"
                className="input"
                placeholder="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="home-password">
                비밀번호
              </label>
              <PasswordInput
                id="home-password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            {error && <p className="alert alert-error" role="alert">{error}</p>}
            {socialError && <p className="alert alert-error" role="alert">{socialError}</p>}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || socialLoading}>
              {loading ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <div className={styles.divider}>또는</div>

          <SocialLoginButtons redirectUri={REDIRECT_URI} variant="login" />

          <p className={styles.footer}>
            아직 계정이 없으신가요?{' '}
            <Link to="/sign-up">회원가입</Link>
          </p>
        </section>
      </main>

      <SocialAddressModal
        isOpen={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false)
          navigate(nextPath, { replace: true })
        }}
        onSubmit={handleAddressSubmit}
        loading={addressSaving}
        defaultNickname={socialNickname}
      />

      <ConfirmDialog
        isOpen={linkDialogOpen}
        title="이미 가입된 계정이 있어요"
        message={`이미 해당 이메일로 가입된 계정이 있습니다.\n${PROVIDER_LABEL[pendingLinkRef.current?.provider ?? ''] ?? '소셜'} 계정을 기존 계정에 연동하시겠습니까?`}
        confirmLabel="연동하기"
        cancelLabel="취소"
        isLoading={linkLoading}
        onConfirm={handleLinkConfirm}
        onCancel={handleLinkCancel}
      />
    </>
  )
}
