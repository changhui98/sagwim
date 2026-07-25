/**
 * 회원가입 화면 — FE SignUpPage 디자인 이식
 *
 * [위치/주소 처리 결정]
 * FE SignUpPage에는 주소 필드가 없음 (Geocoding은 별도 프로필 수정 화면에서 처리).
 * SignUpRequest 타입에도 address 필드가 없음.
 * → 모바일에서도 위치 입력 단계를 회원가입에서 제외하고, 프로필 설정 단계로 분리.
 * → GPS/위치 권한 요청은 별도 단계에서 처리 (이번 범위 아님).
 *
 * [이메일 인증]
 * FE와 동일하게 코드 전송 → 코드 입력 → 인증 완료 흐름 구현.
 * isEmailVerified가 true여야 회원가입 버튼 활성화.
 *
 * OAuth: UI 자리만 잡고 비활성.
 *
 * [실기기 빌드 주의]
 * 실기기 테스트 시 반드시 npx expo run:ios --device 사용.
 * Xcode Cmd+R 단독 실행은 Metro 없이 임베디드 JS 번들을 사용하므로
 * 코드 변경사항이 반영되지 않을 수 있음.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  signUp,
  sendEmailVerification,
  verifyEmailCode,
  checkUsername,
  checkNickname,
} from '../../src/api/authApi'
import { useOAuth } from '../../src/hooks/useOAuth'
import { TextField } from '../../src/components/TextField'
import { PasswordChecklist } from '../../src/components/PasswordChecklist'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { SecondaryButton } from '../../src/components/SecondaryButton'
import { KakaoSymbol, GoogleGLogo } from '../../src/components/SocialIcons'
import { LandingBottomBar } from '../../src/components/landing/LandingBottomBar'
import { isPasswordValid, isConfirmPasswordValid } from '../../src/utils/passwordRules'
import { spacing, radius, fontSize } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

type SignUpField = 'username' | 'password' | 'nickname' | 'userEmail'

const mapMessageToField = (message: string): SignUpField | null => {
  const normalized = message.toLowerCase()
  if (normalized.includes('username') || message.includes('회원이름')) return 'username'
  if (normalized.includes('password') || message.includes('비밀번호')) return 'password'
  if (normalized.includes('nickname') || message.includes('닉네임')) return 'nickname'
  if (normalized.includes('email') || message.includes('이메일')) return 'userEmail'
  return null
}

export default function SignUpScreen() {
  const { loading: oauthLoading, handleKakaoLogin, handleGoogleLogin } = useOAuth()
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignUpField, string>>>({})

  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    userEmail: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')

  // 아이디 중복확인
  const [isUsernameChecked, setIsUsernameChecked] = useState(false)
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameCheckMsg, setUsernameCheckMsg] = useState('')
  const [usernameCheckOk, setUsernameCheckOk] = useState(false)

  // 닉네임 중복확인
  const [isNicknameChecked, setIsNicknameChecked] = useState(false)
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [nicknameCheckMsg, setNicknameCheckMsg] = useState('')
  const [nicknameCheckOk, setNicknameCheckOk] = useState(false)

  // 이메일 인증
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [emailVerifyError, setEmailVerifyError] = useState('')
  const previousEmailRef = useRef(form.userEmail)

  // 각 필드별 핸들러를 useCallback으로 고정.
  // setField('username') 패턴은 렌더마다 새 클로저를 생성하므로
  // 필드별로 명시적으로 분리해 참조 안정성을 확보.
  const handleChangeUsername = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, username: value }))
    setFieldErrors((prev) => ({ ...prev, username: undefined }))
    setIsUsernameChecked(false)
    setIsUsernameAvailable(false)
    setUsernameCheckMsg('')
  }, [])

  const handleChangePassword = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, password: value }))
    setFieldErrors((prev) => ({ ...prev, password: undefined }))
  }, [])

  const handleChangeNickname = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, nickname: value }))
    setFieldErrors((prev) => ({ ...prev, nickname: undefined }))
    setIsNicknameChecked(false)
    setIsNicknameAvailable(false)
    setNicknameCheckMsg('')
  }, [])

  const handleChangeUserEmail = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, userEmail: value }))
    setFieldErrors((prev) => ({ ...prev, userEmail: undefined }))
    if (value !== previousEmailRef.current) {
      previousEmailRef.current = value
      setIsCodeSent(false)
      setIsEmailVerified(false)
      setVerificationCode('')
      setEmailVerifyError('')
    }
  }, [])

  const handleCheckUsername = async () => {
    if (!form.username.trim()) {
      setFieldErrors((prev) => ({ ...prev, username: '아이디를 입력해주세요.' }))
      return
    }
    try {
      setIsCheckingUsername(true)
      const available = await checkUsername(form.username.trim())
      setIsUsernameChecked(true)
      setIsUsernameAvailable(available)
      setUsernameCheckOk(available)
      setUsernameCheckMsg(available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.')
    } catch (err) {
      setUsernameCheckOk(false)
      setUsernameCheckMsg(err instanceof Error ? err.message : '중복 확인에 실패했습니다.')
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleCheckNickname = async () => {
    if (!form.nickname.trim()) {
      setFieldErrors((prev) => ({ ...prev, nickname: '닉네임을 입력해주세요.' }))
      return
    }
    try {
      setIsCheckingNickname(true)
      const available = await checkNickname(form.nickname.trim())
      setIsNicknameChecked(true)
      setIsNicknameAvailable(available)
      setNicknameCheckOk(available)
      setNicknameCheckMsg(available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.')
    } catch (err) {
      setNicknameCheckOk(false)
      setNicknameCheckMsg(err instanceof Error ? err.message : '중복 확인에 실패했습니다.')
    } finally {
      setIsCheckingNickname(false)
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
      // UX: 클릭 즉시 인증코드 입력 UI 노출 (FE 패턴 동일)
      setIsCodeSent(true)
      await sendEmailVerification(form.userEmail.trim())
    } catch (err) {
      const message = err instanceof Error ? err.message : '인증코드 전송에 실패했습니다.'
      setIsCodeSent(false)
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
      await verifyEmailCode(form.userEmail.trim(), verificationCode.trim())
      setIsEmailVerified(true)
    } catch (err) {
      setEmailVerifyError(err instanceof Error ? err.message : '인증코드 확인에 실패했습니다.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const validateRequiredFields = (): boolean => {
    const errors: Partial<Record<SignUpField, string>> = {}
    if (!form.username.trim()) errors.username = '아이디를 입력해주세요.'
    if (form.nickname.trim().length > 0 && form.nickname.trim().length < 2)
      errors.nickname = '닉네임은 최소 2글자 이상이어야 합니다.'
    if (!form.userEmail.trim()) errors.userEmail = '이메일을 입력해주세요.'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateRequiredFields()) return
    try {
      setLoading(true)
      setError('')
      setFieldErrors({})
      await signUp(form)
      // 회원가입 성공 → 로그인 화면으로 (FE 패턴 동일)
      router.replace('/(auth)/login')
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

  const pwValid = useMemo(() => isPasswordValid(form.password), [form.password])
  const confirmValid = useMemo(
    () => isConfirmPasswordValid(form.password, confirmPassword),
    [form.password, confirmPassword],
  )

  const nicknameCheckPassed = useMemo(
    () => form.nickname.trim().length === 0 || (isNicknameChecked && isNicknameAvailable),
    [form.nickname, isNicknameChecked, isNicknameAvailable],
  )

  const canSubmit = useMemo(
    () =>
      form.password.length > 0 &&
      pwValid &&
      confirmValid &&
      isUsernameChecked &&
      isUsernameAvailable &&
      nicknameCheckPassed &&
      isEmailVerified,
    [
      form.password,
      pwValid,
      confirmValid,
      isUsernameChecked,
      isUsernameAvailable,
      nicknameCheckPassed,
      isEmailVerified,
    ],
  )

  // 비밀번호 필드에는 validationState를 쓰지 않음.
  // iOS Fabric에서 secureTextEntry 필드의 validationState 변경(undefined↔success↔error)이
  // 포커스를 빼앗는 버그가 있음. PasswordChecklist가 모든 규칙 피드백을 대신 제공.

  const confirmValidationState = useMemo(
    () => (confirmPassword.length === 0 ? undefined : confirmValid ? 'success' : 'error'),
    [confirmPassword.length, confirmValid],
  ) as 'success' | 'error' | undefined

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sp8,
      paddingVertical: spacing.sp8,
    },
    card: { width: '100%', maxWidth: 480 },
    heading: {
      fontSize: fontSize.xl4,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sp1,
    },
    subheading: { fontSize: fontSize.base, color: colors.textMuted, marginBottom: spacing.sp8 },
    mb4: { marginBottom: spacing.sp4 },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: spacing.sp2,
    },
    fieldLabelOptional: { fontSize: fontSize.xs, fontWeight: '400', color: colors.textMuted },
    inlineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sp2 },
    inlineInput: { flex: 1, marginBottom: 0 },
    inlineBtn: { flexShrink: 0, alignSelf: 'flex-start', marginTop: 0 },
    checkMsg: { fontSize: fontSize.xs, marginTop: spacing.sp1 },
    checkMsgOk: { color: colors.success },
    checkMsgErr: { color: colors.error },
    hintText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sp1 },
    verifiedAlert: {
      backgroundColor: colors.successSoft,
      borderRadius: radius.md,
      padding: spacing.sp3,
      marginBottom: spacing.sp4,
    },
    verifiedText: { color: colors.success, fontSize: fontSize.sm, fontWeight: '500' },
    alertError: {
      backgroundColor: colors.errorSoft,
      borderRadius: radius.md,
      padding: spacing.sp3,
      marginBottom: spacing.sp4,
    },
    alertErrorText: { color: colors.error, fontSize: fontSize.sm },
    submitBtn: { marginTop: spacing.sp2 },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.sp5,
      gap: spacing.sp3,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: fontSize.sm, color: colors.textMuted },
    oauthSection: { gap: spacing.sp3 },
    oauthBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sp3,
    },
    oauthBtnDisabled: { opacity: 0.5 },
    kakaoBtn: { backgroundColor: '#FEE500', borderColor: '#FEE500' },
    googleBtn: { backgroundColor: colors.surface },
    oauthBtnText: { fontSize: fontSize.base, fontWeight: '500', color: colors.text },
    kakaoBtnText: { color: 'rgba(0,0,0,0.85)' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sp5 },
    footerText: { fontSize: fontSize.sm, color: colors.textMuted },
    footerLink: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },
  }), [colors])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>계정 만들기</Text>
            <Text style={styles.subheading}>Sagwim에 합류하세요</Text>

            {/* ── 아이디 + 중복확인 ── */}
            <View style={styles.mb4}>
              <Text style={styles.fieldLabel}>아이디</Text>
              <View style={styles.inlineRow}>
                <TextField
                  containerStyle={styles.inlineInput}
                  placeholder="영문, 숫자 입력 가능"
                  value={form.username}
                  onChangeText={handleChangeUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  editable={!(isUsernameChecked && isUsernameAvailable)}
                  error={fieldErrors.username}
                />
                <SecondaryButton
                  label={isCheckingUsername ? '확인 중...' : '중복확인'}
                  loading={isCheckingUsername}
                  disabled={isCheckingUsername || (isUsernameChecked && isUsernameAvailable) || !form.username.trim()}
                  onPress={handleCheckUsername}
                  style={styles.inlineBtn}
                />
              </View>
              {usernameCheckMsg ? (
                <Text style={[styles.checkMsg, usernameCheckOk ? styles.checkMsgOk : styles.checkMsgErr]}>
                  {usernameCheckMsg}
                </Text>
              ) : null}
            </View>

            {/* ── 비밀번호 ── */}
            <TextField
              label="비밀번호"
              placeholder="••••••••"
              value={form.password}
              onChangeText={handleChangePassword}
              isPassword
              autoCapitalize="none"
              autoComplete="off"
              textContentType="oneTimeCode"
              error={fieldErrors.password}
            />

            {/* 비밀번호 확인 — 항상 렌더링 (display:none 레이아웃 변경으로 인한 포커스 소실 방지) */}
            <TextField
              label="비밀번호 확인"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
              autoComplete="off"
              textContentType="oneTimeCode"
            />

            {/* 비밀번호 체크리스트 — 항상 렌더링 */}
            <PasswordChecklist password={form.password} confirmPassword={confirmPassword} />

            {/* ── 닉네임 + 중복확인 ── */}
            <View style={styles.mb4}>
              <Text style={styles.fieldLabel}>
                닉네임{' '}
                <Text style={styles.fieldLabelOptional}>(선택 — 미입력 시 랜덤 생성)</Text>
              </Text>
              <View style={styles.inlineRow}>
                <TextField
                  containerStyle={styles.inlineInput}
                  placeholder="2~10자 (선택)"
                  value={form.nickname}
                  onChangeText={handleChangeNickname}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="nickname"
                  editable={!(isNicknameChecked && isNicknameAvailable)}
                  error={fieldErrors.nickname}
                />
                <SecondaryButton
                  label={isCheckingNickname ? '확인 중...' : '중복확인'}
                  loading={isCheckingNickname}
                  disabled={
                    isCheckingNickname ||
                    form.nickname.trim().length === 0 ||
                    (isNicknameChecked && isNicknameAvailable)
                  }
                  onPress={handleCheckNickname}
                  style={styles.inlineBtn}
                />
              </View>
              {form.nickname.trim().length === 0 && (
                <Text style={styles.hintText}>닉네임을 입력하지 않으면 자동으로 랜덤 닉네임이 부여됩니다.</Text>
              )}
              {nicknameCheckMsg ? (
                <Text style={[styles.checkMsg, nicknameCheckOk ? styles.checkMsgOk : styles.checkMsgErr]}>
                  {nicknameCheckMsg}
                </Text>
              ) : null}
            </View>

            {/* ── 이메일 + 인증코드 전송 ── */}
            <View style={styles.mb4}>
              <Text style={styles.fieldLabel}>이메일</Text>
              <View style={styles.inlineRow}>
                <TextField
                  containerStyle={styles.inlineInput}
                  placeholder="name@example.com"
                  value={form.userEmail}
                  onChangeText={handleChangeUserEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!isEmailVerified}
                  error={fieldErrors.userEmail}
                />
                <SecondaryButton
                  label={isSendingCode ? '전송 중...' : isCodeSent ? '재전송' : '인증코드 전송'}
                  loading={isSendingCode}
                  disabled={isSendingCode || isEmailVerified || !form.userEmail.trim()}
                  onPress={handleSendCode}
                  style={styles.inlineBtn}
                />
              </View>
            </View>

            {/* 인증코드 입력 */}
            {isCodeSent && !isEmailVerified && (
              <View style={styles.mb4}>
                <Text style={styles.fieldLabel}>인증코드</Text>
                <View style={styles.inlineRow}>
                  <TextField
                    containerStyle={styles.inlineInput}
                    placeholder="인증코드를 입력하세요"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                  />
                  <SecondaryButton
                    label={isVerifyingCode ? '확인 중...' : '인증코드 확인'}
                    loading={isVerifyingCode}
                    disabled={isVerifyingCode || !verificationCode.trim()}
                    onPress={handleVerifyCode}
                    style={styles.inlineBtn}
                  />
                </View>
              </View>
            )}

            {emailVerifyError ? (
              <Text style={[styles.checkMsg, styles.checkMsgErr]}>{emailVerifyError}</Text>
            ) : null}

            {isEmailVerified && (
              <View style={styles.verifiedAlert}>
                <Text style={styles.verifiedText}>이메일 인증이 완료되었습니다.</Text>
              </View>
            )}

            {/* 글로벌 에러 */}
            {error ? (
              <View style={styles.alertError}>
                <Text style={styles.alertErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* 회원가입 버튼 */}
            <PrimaryButton
              label={loading ? '가입 처리 중…' : '회원가입'}
              loading={loading}
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={styles.submitBtn}
            />

            {/* 구분선 */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth 버튼 */}
            <View style={styles.oauthSection}>
              <TouchableOpacity
                style={[styles.oauthBtn, styles.kakaoBtn, oauthLoading && styles.oauthBtnDisabled]}
                disabled={oauthLoading || loading}
                onPress={handleKakaoLogin}
              >
                <KakaoSymbol size={18} />
                <Text style={[styles.oauthBtnText, styles.kakaoBtnText]}>
                  {oauthLoading ? '처리 중…' : '카카오로 시작하기'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.oauthBtn, styles.googleBtn, oauthLoading && styles.oauthBtnDisabled]}
                disabled={oauthLoading || loading}
                onPress={handleGoogleLogin}
              >
                <GoogleGLogo size={18} />
                <Text style={styles.oauthBtnText}>
                  {oauthLoading ? '처리 중…' : 'Google로 계속하기'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 로그인 링크 */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>로그인</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LandingBottomBar
        isHome={false}
        onHome={() => router.navigate('/(auth)/landing')}
        onSignUp={() => {}}
        onLogin={() => router.push('/(auth)/login')}
      />
    </SafeAreaView>
  )
}

