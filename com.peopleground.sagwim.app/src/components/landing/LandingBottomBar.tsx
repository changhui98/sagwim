/**
 * LandingBottomBar — FE Navbar의 모바일(≤640px) 하단 고정 바에서
 * 게스트가 보는 3탭(홈 / 게시글 / 만들기)을 랜딩 전용으로 재현.
 * 스타일은 앱 (tabs) 탭바(surface 배경, 무보더, 24px 아이콘)와 통일하고,
 * 만들기(+)는 웹처럼 44px accent 그라데이션 원형(비돌출)으로 강조한다.
 * 게시글·만들기 탭 시 AuthRequiredModal로 가입/로그인 유도(웹 AuthGate 대응).
 */

import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { AuthRequiredModal } from '../common/AuthRequiredModal'
import { GradientBox } from './GradientBox'

const ICON_SIZE = 24
const BAR_CONTENT_HEIGHT = 56

interface LandingBottomBarProps {
  onSignUp: () => void
  onLogin: () => void
  /** 현재 화면이 홈(랜딩)인지. true면 홈 탭 활성·no-op, false면 onHome으로 랜딩 복귀 */
  isHome?: boolean
  /** isHome=false일 때 홈 탭 탭 시 호출 (랜딩으로 복귀) */
  onHome?: () => void
}

export function LandingBottomBar({ onSignUp, onLogin, isHome = true, onHome }: LandingBottomBarProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [gateOpen, setGateOpen] = useState(false)

  const styles = React.useMemo(() => StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: BAR_CONTENT_HEIGHT + insets.bottom,
      paddingBottom: insets.bottom,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    createCircleShadow: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
      borderRadius: radius.full,
    },
    createCircle: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
  }), [colors, insets.bottom])

  const openGate = () => setGateOpen(true)

  return (
    <>
      <View style={styles.bar}>
        {/* 홈 — 랜딩에서는 활성·no-op, 로그인/회원가입에서는 랜딩으로 복귀 */}
        <Pressable
          style={({ pressed }) => [styles.tab, !isHome && pressed && styles.pressed]}
          onPress={isHome ? undefined : onHome}
          disabled={isHome}
          accessibilityRole="button"
          accessibilityLabel="홈"
          accessibilityState={{ selected: isHome }}
        >
          <Ionicons name="home-outline" size={ICON_SIZE} color={isHome ? colors.accent : colors.textMuted} />
        </Pressable>

        {/* 게시글 — 회원 전용, 게스트는 가입/로그인 유도 */}
        <Pressable
          style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          onPress={openGate}
          accessibilityRole="button"
          accessibilityLabel="게시글"
        >
          <Ionicons name="reader-outline" size={ICON_SIZE} color={colors.textMuted} />
        </Pressable>

        {/* 만들기(+) — accent 그라데이션 원형 (웹 createIconCircle 대응) */}
        <Pressable
          style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          onPress={openGate}
          accessibilityRole="button"
          accessibilityLabel="만들기"
        >
          <View style={styles.createCircleShadow}>
            <GradientBox stops={colors.accentGradient} borderRadius={radius.full}>
              <View style={styles.createCircle}>
                <Ionicons name="add-outline" size={22} color={colors.onAccent} />
              </View>
            </GradientBox>
          </View>
        </Pressable>
      </View>

      <AuthRequiredModal
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        onSignUp={() => {
          setGateOpen(false)
          onSignUp()
        }}
        onLogin={() => {
          setGateOpen(false)
          onLogin()
        }}
      />
    </>
  )
}
