/**
 * SocialIcons — 소셜 로그인 버튼용 공식 브랜드 심볼 (react-native-svg 인라인)
 *
 * BrandLogo.tsx 관례를 따라 커스텀 브랜드 그래픽을 인라인 SVG 컴포넌트로 작성.
 *
 * 브랜드 가이드라인 준수 (색·형태 변경 금지):
 * - KakaoSymbol: 카카오 공식 말풍선 심볼. 노란(#FEE500) 버튼 위 검정(#000000) 심볼.
 *   https://developers.kakao.com/docs/latest/ko/kakaologin/design-guide
 * - GoogleGLogo: 구글 공식 4색 "G" 로고. 색·크기 변경 및 단색화 금지.
 *   https://developers.google.com/identity/branding-guidelines
 */

import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface IconProps {
  size?: number
}

/** 카카오 말풍선 심볼 (검정) — viewBox 0 0 24 24 */
export function KakaoSymbol({ size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#000000"
        d="M12 3C6.48 3 2 6.48 2 10.8c0 2.79 1.86 5.24 4.65 6.62-.15.53-.98 3.38-1.01 3.6 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.42 4.28-2.83.55.08 1.12.12 1.75.12 5.52 0 10-3.48 10-7.76S17.52 3 12 3z"
      />
    </Svg>
  )
}

/** 구글 공식 4색 G 로고 — viewBox 0 0 48 48 */
export function GoogleGLogo({ size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  )
}
