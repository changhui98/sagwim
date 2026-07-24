/**
 * 로그인 화면 — FE HomePage 디자인 이식 (BrandLogo 헤더)
 *
 * 모바일 표준 인터랙션:
 * - SafeAreaView: 노치/홈 인디케이터 고려
 * - KeyboardAvoidingView: 키보드 가림 방지
 * - TextInput: autoCapitalize, keyboardType, textContentType, autoComplete 설정
 *
 * OAuth(Kakao/Google): UI 자리만 잡고 비활성 처리 (이번 범위 아님)
 */

import React, { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { signIn } from '../../src/api/authApi'
import { useOAuth } from '../../src/hooks/useOAuth'
import { TextField } from '../../src/components/TextField'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { BrandLogo } from '../../src/components/BrandLogo'
import { KakaoSymbol, GoogleGLogo } from '../../src/components/SocialIcons'
import { LandingBottomBar } from '../../src/components/landing/LandingBottomBar'
import { spacing, radius, fontSize } from '../../src/constants/theme'
import { useTheme } from '../../src/context/ThemeContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const { loading: oauthLoading, handleKakaoLogin, handleGoogleLogin } = useOAuth()
  const { colors } = useTheme()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    try {
      setLoading(true)
      setError('')
      const token = await signIn({ username: username.trim(), password })
      await login(token)
      router.replace('/(app)/(tabs)')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

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
    card: { width: '100%', maxWidth: 420 },
    brand: { alignItems: 'center', marginBottom: spacing.sp8 },
    brandName: {
      fontSize: 36,
      fontWeight: '300',
      color: colors.accent,
      letterSpacing: 0.5,
      marginTop: 0,
      marginBottom: 0,
      lineHeight: 56,
    },
    tagline: { fontSize: fontSize.sm, color: colors.textMuted },
    submitBtn: { marginTop: spacing.sp2 },
    alertError: {
      backgroundColor: colors.errorSoft,
      borderRadius: radius.md,
      padding: spacing.sp3,
      marginBottom: spacing.sp4,
    },
    alertErrorText: { color: colors.error, fontSize: fontSize.sm },
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 카드 */}
          <View style={styles.card}>
            {/* Brand 헤더 — FE HomePage 디자인 */}
            <View style={styles.brand}>
              <BrandLogo size={72} />
              <Text style={styles.brandName}>Sagwim</Text>
              <Text style={styles.tagline}>함께 모이는 공간</Text>
            </View>

            {/* 아이디 */}
            <TextField
              label="아이디"
              placeholder="username"
              value={username}
              onChangeText={(v) => {
                setUsername(v)
                setError('')
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              keyboardType="default"
              returnKeyType="next"
            />

            {/* 비밀번호 */}
            <TextField
              label="비밀번호"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => {
                setPassword(v)
                setError('')
              }}
              isPassword
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* 에러 메시지 */}
            {error ? (
              <View style={styles.alertError}>
                <Text style={styles.alertErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* 로그인 버튼 */}
            <PrimaryButton
              label={loading ? '로그인 중…' : '로그인'}
              loading={loading}
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
                  {oauthLoading ? '로그인 중…' : '카카오 로그인'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.oauthBtn, styles.googleBtn, oauthLoading && styles.oauthBtnDisabled]}
                disabled={oauthLoading || loading}
                onPress={handleGoogleLogin}
              >
                <GoogleGLogo size={18} />
                <Text style={styles.oauthBtnText}>
                  {oauthLoading ? '로그인 중…' : 'Google로 계속하기'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 회원가입 링크 */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.footerLink}>회원가입</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LandingBottomBar
        isHome={false}
        onHome={() => router.navigate('/(auth)/landing')}
        onSignUp={() => router.push('/(auth)/sign-up')}
        onLogin={() => {}}
      />
    </SafeAreaView>
  )
}

