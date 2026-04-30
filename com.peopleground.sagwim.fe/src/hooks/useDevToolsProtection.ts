import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * DevTools 보호 훅
 *
 * 프로덕션 환경에서 ADMIN 역할이 아닌 사용자에게만 적용됩니다.
 * 두 가지 감지 전략을 조합합니다:
 *   1. debugger 트랩 — DevTools가 열린 상태에서 setInterval의 debugger 구문이 실행을 중단시킵니다.
 *   2. 뷰포트 크기 감지 — DevTools가 도킹되면 outerWidth/outerHeight와 innerWidth/innerHeight 간의
 *      차이가 임계값을 넘습니다.
 *
 * 한계:
 *   - 클라이언트 사이드 보호이므로 완전한 차단이 아닙니다. "casual attacker 억제" 수준입니다.
 *   - undocked(팝아웃) 상태의 DevTools는 크기 감지로는 탐지되지 않습니다.
 *   - 소스맵 비활성화, API 인증, CORS 등 서버 사이드 보안이 더 중요합니다.
 */
export function useDevToolsProtection() {
  const { meRole, isAuthenticated, token } = useAuth()

  // 인증된 사용자인데 아직 프로필이 로드되지 않은 상태를 추적합니다
  const isProfileLoading = isAuthenticated && token.length > 0 && meRole === null

  // 현재 interval ID를 ref로 관리합니다 (cleanup 용도)
  const debuggerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sizeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // 개발 환경에서는 보호를 활성화하지 않습니다
    if (!import.meta.env.PROD) return

    // ADMIN 역할은 제한 없이 DevTools를 사용할 수 있습니다
    if (meRole === 'ADMIN') return

    // 인증된 사용자의 프로필이 아직 로드 중이라면 대기합니다
    // (role이 확인되기 전에 ADMIN 사용자에게 보호가 걸리는 것을 방지)
    if (isProfileLoading) return

    // === 전략 1: debugger 트랩 ===
    // DevTools가 열린 상태에서는 debugger 구문에서 실행이 멈춥니다.
    // DevTools가 닫혀 있으면 debugger는 즉시 통과합니다.
    debuggerIntervalRef.current = setInterval(() => {
      // eslint-disable-next-line no-debugger
      debugger
    }, 100)

    // === 전략 2: 뷰포트 크기 감지 ===
    // DevTools가 우측 또는 하단에 도킹되면 inner 값이 줄어들어 차이가 발생합니다.
    const DEVTOOLS_THRESHOLD = 160

    const checkViewportSize = () => {
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight

      if (widthDiff > DEVTOOLS_THRESHOLD || heightDiff > DEVTOOLS_THRESHOLD) {
        handleDevToolsDetected()
      }
    }

    sizeIntervalRef.current = setInterval(checkViewportSize, 1000)

    return () => {
      if (debuggerIntervalRef.current !== null) {
        clearInterval(debuggerIntervalRef.current)
        debuggerIntervalRef.current = null
      }
      if (sizeIntervalRef.current !== null) {
        clearInterval(sizeIntervalRef.current)
        sizeIntervalRef.current = null
      }
    }
  }, [meRole, isProfileLoading])
}

/**
 * DevTools가 감지되었을 때의 처리 로직
 * 콘솔에 경고를 출력합니다.
 * 필요 시 이 함수에 페이지 blur, 리다이렉트 등 추가 조치를 구현할 수 있습니다.
 */
function handleDevToolsDetected() {
  // 브라우저 콘솔에 경고를 출력합니다 (개발자 도구를 열면 보이는 메시지)
  console.clear()
  console.log(
    '%c접근 금지',
    'color: red; font-size: 48px; font-weight: bold;',
  )
  console.log(
    '%c이 페이지의 콘텐츠를 무단으로 분석하거나 복제하는 행위는 금지되어 있습니다.',
    'color: #ff4444; font-size: 14px;',
  )
}
