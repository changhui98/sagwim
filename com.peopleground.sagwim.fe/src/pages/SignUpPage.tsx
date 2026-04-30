import { type FormEvent, useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signUp, sendEmailVerification, verifyEmailCode, checkUsername } from '../api/authApi'
import { socialSignIn } from '../api/socialAuthApi'
import { updateMyProfile } from '../api/userApi'
import { PasswordInput } from '../components/PasswordInput'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { KakaoAddressSearch } from '../components/common/KakaoAddressSearch'
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons'
import { SocialAddressModal } from '../components/auth/SocialAddressModal'
import { isPasswordValid, isConfirmPasswordValid } from '../utils/passwordRules'
import { useAuth } from '../context/AuthContext'
import styles from './SignUpPage.module.css'
import { AlertDialog } from '../components/common/AlertDialog'

const REDIRECT_URI = `${window.location.origin}/sign-up`

type SignUpField = 'username' | 'password' | 'nickname' | 'userEmail' | 'address'

const mapMessageToField = (message: string): SignUpField | null => {
  const normalized = message.toLowerCase()
  if (normalized.includes('username') || message.includes('회원이름')) return 'username'
  if (normalized.includes('password') || message.includes('비밀번호')) return 'password'
  if (normalized.includes('nickname') || message.includes('닉네임')) return 'nickname'
  if (normalized.includes('email') || message.includes('이메일')) return 'userEmail'
  if (normalized.includes('address') || message.includes('주소')) return 'address'
  return null
}

const isDuplicateEmailMessage = (message: string): boolean => {
  const normalized = message.toLowerCase()
  return (
    (normalized.includes('email') || message.includes('이메일')) &&
    (normalized.includes('already') ||
      message.includes('이미') ||
      message.includes('중복') ||
      message.includes('사용 중'))
  )
}

export function SignUpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 소셜 로그인 상태
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState('')
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [socialNickname, setSocialNickname] = useState('')

  // OAuth redirect callback 처리 (?code=...&state=KAKAO|GOOGLE)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const provider = params.get('state')

    if (!code || !provider) return
    if (socialLoading) return

    navigate('/sign-up', { replace: true })

    const processSocialLogin = async () => {
      try {
        setSocialLoading(true)
        setSocialError('')
        const { token: jwtToken, data } = await socialSignIn(provider, code, REDIRECT_URI)
        login(jwtToken)

        if (data.isNewUser) {
          setSocialNickname(data.nickname ?? '')
          setAddressModalOpen(true)
        } else {
          navigate('/app', { replace: true })
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
      navigate('/app', { replace: true })
    } catch {
      setAddressModalOpen(false)
      navigate('/app', { replace: true })
    } finally {
      setAddressSaving(false)
    }
  }
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignUpField, string>>>({})
  const [confirmPassword, setConfirmPassword] = useState('')
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    userEmail: '',
    address: '',
  })

  // 아이디 중복확인 상태
  const [isUsernameChecked, setIsUsernameChecked] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAlertOpen, setUsernameAlertOpen] = useState(false)
  const [usernameAlertVariant, setUsernameAlertVariant] = useState<'success' | 'error'>('success')
  const [usernameAlertMessage, setUsernameAlertMessage] = useState('')

  // 이메일 인증 상태
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [emailVerifyError, setEmailVerifyError] = useState('')
  const previousEmailRef = useRef(form.userEmail)

  const setField =
    (key: SignUpField) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setForm((prev) => ({ ...prev, [key]: value }))
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }))

      // 아이디 변경 시 중복확인 상태 초기화
      if (key === 'username') {
        setIsUsernameChecked(false)
        setIsUsernameAvailable(false)
      }

      // 이메일 변경 시 인증 상태 초기화
      if (key === 'userEmail' && value !== previousEmailRef.current) {
        previousEmailRef.current = value
        setIsCodeSent(false)
        setIsEmailVerified(false)
        setVerificationCode('')
        setEmailVerifyError('')
      }
    }

  const handleCheckUsername = async () => {
    if (!form.username.trim()) {
      setFieldErrors((prev) => ({ ...prev, username: '아이디를 입력해주세요.' }))
      return
    }
    try {
      setIsCheckingUsername(true)
      const available = await checkUsername(form.username)
      setIsUsernameChecked(true)
      setIsUsernameAvailable(available)
      if (available) {
        setUsernameAlertVariant('success')
        setUsernameAlertMessage('사용 가능한 아이디입니다.')
      } else {
        setUsernameAlertVariant('error')
        setUsernameAlertMessage('이미 사용 중인 아이디입니다.')
      }
      setUsernameAlertOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '중복 확인에 실패했습니다.'
      setUsernameAlertVariant('error')
      setUsernameAlertMessage(message)
      setUsernameAlertOpen(true)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleSendCode = async () => {
    if (!form.userEmail.trim()) {
      setFieldErrors((prev) => ({ ...prev, userEmail: '이메일을 입력해주세요.' }))
      return
    }
    if (isSendingCode) return
    try {
      setIsSendingCode(true)
      setEmailVerifyError('')
      // UX: 클릭 즉시 인증코드 입력 UI와 재전송 버튼을 노출한다.
      setIsCodeSent(true)
      await sendEmailVerification({ email: form.userEmail })
    } catch (err) {
      const message = err instanceof Error ? err.message : '인증코드 전송에 실패했습니다.'
      setIsCodeSent(false)
      if (isDuplicateEmailMessage(message)) {
        setUsernameAlertVariant('error')
        setUsernameAlertMessage('이미 사용 중인 이메일입니다.')
        setUsernameAlertOpen(true)
        setEmailVerifyError('')
        return
      }
      setEmailVerifyError(message)
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setEmailVerifyError('인증코드를 입력해주세요.')
      return
    }
    try {
      setIsVerifyingCode(true)
      setEmailVerifyError('')
      await verifyEmailCode({ email: form.userEmail, code: verificationCode })
      setIsEmailVerified(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : '인증코드 확인에 실패했습니다.'
      setEmailVerifyError(message)
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const validateRequiredFields = (): boolean => {
    const errors: Partial<Record<SignUpField, string>> = {}
    if (!form.username.trim()) errors.username = '아이디를 입력해주세요.'
    if (form.nickname.trim().length < 2) errors.nickname = '닉네임은 최소 2글자 이상이어야 합니다.'
    if (!form.userEmail.trim()) errors.userEmail = '이메일을 입력해주세요.'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return false
    }
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateRequiredFields()) return
    try {
      setLoading(true)
      setError('')
      setFieldErrors({})
      await signUp(form)
      navigate('/login', { state: { signedUp: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입 실패'
      const field = mapMessageToField(message)
      if (field) {
        setFieldErrors({ [field]: message })
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const pwValid = isPasswordValid(form.password)
  const confirmValid = isConfirmPasswordValid(form.password, confirmPassword)

  // 비밀번호 복잡도 + 확인 일치 + 아이디 중복확인 + 이메일 인증 모두 충족해야 제출 가능
  const canSubmit =
    form.password.length > 0 &&
    pwValid &&
    confirmValid &&
    isUsernameChecked &&
    isUsernameAvailable &&
    isEmailVerified

  // 비밀번호 확인 입력창 테두리 색상
  const confirmBorderClass =
    confirmPassword.length === 0
      ? ''
      : confirmValid
        ? styles.pwValid
        : styles.pwInvalid

  return (
    <>
    <main className={styles.root}>
      <section className={`card animate-scale-in ${styles.card}`}>
        <Link to="/" className={styles.backLink}>
          ← 홈으로
        </Link>

        <h1 className={styles.heading}>계정 만들기</h1>
        <p className={styles.subheading}>Sagwim에 합류하세요</p>

        <form className="form" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="input-group">
            <label className="input-label" htmlFor="su-username">
              아이디
            </label>
            <div className={styles.emailRow}>
              <input
                id="su-username"
                className="input"
                placeholder="영문, 숫자 입력 가능"
                autoComplete="username"
                value={form.username}
                onChange={setField('username')}
                disabled={isUsernameChecked && isUsernameAvailable}
              />
              <button
                type="button"
                className={`btn btn-secondary ${styles.verifyBtn}`}
                disabled={isCheckingUsername || (isUsernameChecked && isUsernameAvailable) || !form.username.trim()}
                onClick={handleCheckUsername}
              >
                {isCheckingUsername ? '확인 중...' : '중복확인'}
              </button>
            </div>
            {fieldErrors.username && (
              <p className="field-error" role="alert">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label" htmlFor="su-password">
              비밀번호
            </label>
            <PasswordInput
              id="su-password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.password}
              onChange={setField('password')}
              className={
                form.password.length > 0
                  ? pwValid
                    ? styles.pwValid
                    : styles.pwInvalid
                  : ''
              }
            />
            {fieldErrors.password && (
              <p className="field-error" role="alert">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password — 비밀번호 입력 시에만 노출 */}
          {form.password.length > 0 && (
            <div className="input-group">
              <label className="input-label" htmlFor="su-confirm-password">
                비밀번호 확인
              </label>
              <PasswordInput
                id="su-confirm-password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmBorderClass}
              />
            </div>
          )}

          {/* Checklist — 비밀번호 입력 시에만 노출 */}
          <PasswordChecklist password={form.password} confirmPassword={confirmPassword} />

          {/* Nickname */}
          <div className="input-group">
            <label className="input-label" htmlFor="su-nickname">
              닉네임
            </label>
            <input
              id="su-nickname"
              className="input"
              placeholder="2~10자, 한글·영문·숫자"
              value={form.nickname}
              onChange={setField('nickname')}
            />
            {fieldErrors.nickname && (
              <p className="field-error" role="alert">{fieldErrors.nickname}</p>
            )}
          </div>

          {/* Email + Verification */}
          <div className="input-group">
            <label className="input-label" htmlFor="su-email">
              이메일
            </label>
            <div className={styles.emailRow}>
              <input
                id="su-email"
                className="input"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={form.userEmail}
                onChange={setField('userEmail')}
                disabled={isEmailVerified}
              />
              <button
                type="button"
                className={`btn btn-secondary ${styles.verifyBtn}`}
                disabled={isSendingCode || isEmailVerified || !form.userEmail.trim()}
                onClick={handleSendCode}
              >
                {isCodeSent ? '이메일 재전송' : '인증코드 전송'}
              </button>
            </div>
            {fieldErrors.userEmail && (
              <p className="field-error" role="alert">{fieldErrors.userEmail}</p>
            )}
          </div>

          {/* Verification Code Input */}
          {isCodeSent && !isEmailVerified && (
            <div className="input-group">
              <label className="input-label" htmlFor="su-verify-code">
                인증코드
              </label>
              <div className={styles.emailRow}>
                <input
                  id="su-verify-code"
                  className="input"
                  type="text"
                  placeholder="인증코드를 입력하세요"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className={`btn btn-primary ${styles.verifyBtn}`}
                  disabled={isVerifyingCode || !verificationCode.trim()}
                  onClick={handleVerifyCode}
                >
                  {isVerifyingCode ? '확인 중...' : '인증코드 확인'}
                </button>
              </div>
            </div>
          )}

          {/* Email Verification Status */}
          {emailVerifyError && (
            <p className="field-error" role="alert">{emailVerifyError}</p>
          )}
          {isEmailVerified && (
            <p className={`alert alert-success ${styles.verifiedMessage}`} role="status">
              이메일 인증이 완료되었습니다.
            </p>
          )}

          {/* Address */}
          <div className="input-group">
            <label className="input-label" htmlFor="su-address">
              주소
            </label>
            <KakaoAddressSearch
              id="su-address"
              address={form.address}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, address: value }))
                setFieldErrors((prev) => ({ ...prev, address: undefined }))
              }}
              disabled={loading}
            />
            {fieldErrors.address && (
              <p className="field-error" role="alert">{fieldErrors.address}</p>
            )}
          </div>

          {error && <p className="alert alert-error" role="alert">{error}</p>}
          {socialError && <p className="alert alert-error" role="alert">{socialError}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading || socialLoading || !canSubmit}
          >
            {loading ? '가입 처리 중…' : '회원가입'}
          </button>
        </form>

        <div className={styles.divider}>또는</div>

        <SocialLoginButtons redirectUri={REDIRECT_URI} />

        <p className={styles.footer}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login">로그인</Link>
        </p>
      </section>
    </main>

    <AlertDialog
      isOpen={usernameAlertOpen}
      variant={usernameAlertVariant}
      message={usernameAlertMessage}
      onClose={() => setUsernameAlertOpen(false)}
    />

    <SocialAddressModal
      isOpen={addressModalOpen}
      onClose={() => {
        setAddressModalOpen(false)
        navigate('/app', { replace: true })
      }}
      onSubmit={handleAddressSubmit}
      loading={addressSaving}
      defaultNickname={socialNickname}
    />
    </>
  )
}
