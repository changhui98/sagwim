import { ApiError } from './ApiError'

/**
 * 인증이 필요한 API 요청에 공통으로 사용하는 헤더 생성 유틸리티.
 * postApi, userApi, groupApi, imageApi 등에서 중복 정의되던 함수를 단일 모듈로 통합.
 */
export const createAuthHeaders = (token: string): HeadersInit => {
  if (!token.trim()) {
    throw new ApiError(401, '로그인이 필요합니다.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: token.trim(),
  }
}

/**
 * fetch Response를 파싱하고, 오류 시 ApiError를 throw하는 공통 유틸리티.
 *
 * 에러 메시지 처리 전략:
 * - 500 이상: 서버 내부 오류이므로 사용자 친화적 메시지로 대체
 * - 그 외: 서버 응답 body를 JSON으로 파싱하여 message 필드 추출,
 *          실패 시 일반 fallback 메시지 사용
 */
export const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status >= 500) {
      throw new ApiError(response.status, '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }

    const text = await response.text()
    let message = `요청을 처리할 수 없습니다. (${response.status})`

    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'message' in parsed &&
          typeof (parsed as Record<string, unknown>).message === 'string'
        ) {
          message = (parsed as { message: string }).message
        }
      } catch {
        // JSON 파싱 실패 시 fallback 메시지 유지
      }
    }

    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}
