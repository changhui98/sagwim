/**
 * 공개 랜딩 — FE ServiceHomePage의 모바일 뷰 이식. 비로그인 첫 화면.
 * 히어로(한반도 연결 비주얼) → 가치 → 핵심 기능(모임·게시판·채팅) → 사용 흐름 → 가입 CTA.
 * "지금 시작하기/무료로 시작하기" → 회원가입, "로그인/이미 회원이에요" → 로그인 (push라 스와이프 백 복귀).
 */

import React from 'react'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CtaSection } from '../../src/components/landing/CtaSection'
import { FeaturesSection } from '../../src/components/landing/FeaturesSection'
import { HeroSection } from '../../src/components/landing/HeroSection'
import { HowItWorksSection } from '../../src/components/landing/HowItWorksSection'
import { LandingBottomBar } from '../../src/components/landing/LandingBottomBar'
import { LandingHeader } from '../../src/components/landing/LandingHeader'
import { ValueSection } from '../../src/components/landing/ValueSection'
import { RevealScrollContext, useRevealScrollController } from '../../src/hooks/useRevealOnScroll'
import { useTheme } from '../../src/context/ThemeContext'

export default function LandingScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const revealController = useRevealScrollController()

  const goSignUp = () => router.push('/(auth)/sign-up')
  const goLogin = () => router.push('/(auth)/login')

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
  }), [colors])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LandingHeader onPressLogin={goLogin} />
      <RevealScrollContext.Provider value={revealController}>
        <ScrollView
          style={styles.scroll}
          onScroll={revealController.notify}
          scrollEventThrottle={100}
          showsVerticalScrollIndicator={false}
        >
          <HeroSection onPressPrimary={goSignUp} onPressSecondary={goLogin} />
          <ValueSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CtaSection onPressPrimary={goSignUp} onPressSecondary={goLogin} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </RevealScrollContext.Provider>
      <LandingBottomBar onSignUp={goSignUp} onLogin={goLogin} />
    </SafeAreaView>
  )
}
