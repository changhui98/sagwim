/**
 * AuthRequiredModal — FE common/AuthRequiredModal.tsx 이식.
 * 게스트가 회원 전용 기능을 탭했을 때 가입/로그인을 유도하는 모달.
 * 구조는 ConfirmDialog 패턴(backdrop + 카드 + 버튼 행)을 따른다.
 */

import React, { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSignUp: () => void
  onLogin: () => void
}

export function AuthRequiredModal({ isOpen, onClose, onSignUp, onLogin }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.sp6,
    },
    card: {
      width: '100%',
      backgroundColor: colors.bg,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sp6,
      paddingTop: spacing.sp6,
      paddingBottom: spacing.sp5,
      gap: spacing.sp2,
    },
    title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sp1 },
    message: { fontSize: fontSize.base, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sp3 },
    buttonRow: { flexDirection: 'row', gap: spacing.sp2, marginTop: spacing.sp1 },
    btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
    signUpBtn: { backgroundColor: colors.surface3 },
    signUpBtnText: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    loginBtn: { backgroundColor: colors.accent },
    loginBtnText: { fontSize: fontSize.base, fontWeight: '700', color: colors.onAccent },
    pressed: { opacity: 0.8 },
  }), [colors])

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>회원만 이용할 수 있어요</Text>
          <Text style={styles.message}>지금 가입하고 마음 맞는 사람들과 모임에 참여해보세요.</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.signUpBtn, pressed && styles.pressed]}
              onPress={onSignUp}
              accessibilityRole="button"
            >
              <Text style={styles.signUpBtnText}>회원가입</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.loginBtn, pressed && styles.pressed]}
              onPress={onLogin}
              accessibilityRole="button"
            >
              <Text style={styles.loginBtnText}>로그인</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
