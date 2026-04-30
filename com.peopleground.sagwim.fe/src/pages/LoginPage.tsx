import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLoginForm } from '../hooks/useLoginForm'
import { PasswordInput } from '../components/PasswordInput'
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons'
import { SocialAddressModal } from '../components/auth/SocialAddressModal'
import { socialSignIn } from '../api/socialAuthApi'
import { updateMyProfile } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

const REDIRECT_URI = `${window.location.origin}/login`

export function LoginPage() {
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

  // OAuth redirect callback 처리 (?code=...&state=KAKAO|GOOGLE)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const provider = params.get('state') // state 파라미터에 provider 정보를 담는다

    if (!code || !provider) return
    if (socialLoading) return

    // URL 쿼리 파라미터 제거 (히스토리 교체)
    navigate('/login', { replace: true, state: location.state })

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
        setSocialError(err instanceof Error ? err.message : '소셜 로그인에 실패했습니다.')
      } finally {
        setSocialLoading(false)
      }
    }

    processSocialLogin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const handleAddressSubmit = async (data: { nickname: string; address: string }) => {
    try {
      setAddressSaving(true)
      await updateMyProfile(token, {
        nickname: data.nickname,
        userEmail: '',
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
          <Link to="/" className={styles.backLink}>
            ← 홈으로
          </Link>

          <h1 className={styles.heading}>다시 오셨군요</h1>
          <p className={styles.subheading}>계정에 로그인하세요</p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-username">
                아이디
              </label>
              <input
                id="login-username"
                className="input"
                placeholder="username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">
                비밀번호
              </label>
              <PasswordInput
                id="login-password"
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

          <SocialLoginButtons redirectUri={REDIRECT_URI} variant="continue" />

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
    </>
  )
}
