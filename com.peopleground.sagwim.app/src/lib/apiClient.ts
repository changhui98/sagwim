import axios from 'axios'
import { deleteToken, getToken } from './secureStore'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

if (!BASE_URL) {
  console.warn('[apiClient] EXPO_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.')
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request 인터셉터 — SecureStore에서 토큰을 읽어 Authorization 헤더 자동 부착
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// HTTP 상태코드에 따른 한국어 기본 에러 메시지
function getDefaultMessage(status: number): string {
  if (status === 400) return '입력 정보를 확인해주세요.'
  if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
  if (status === 409) return '이미 사용 중입니다.'
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  return '요청 처리 중 오류가 발생했습니다.'
}

// Response 인터셉터 — 401 시 토큰 삭제 (리프레시는 별도 구현 예정)
// 화면 전환(로그인으로 리다이렉트)은 AuthContext에서 토큰 소실을 감지해 처리
// 서버 응답 body의 message가 있으면 그 값으로, 없으면 상태코드 기반 한국어 메시지로 reject
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status

        if (status === 401) {
          await deleteToken()
          console.warn('[apiClient] 401 — 토큰 삭제 완료')
        }

        const serverMessage = error.response.data?.message
        const message = typeof serverMessage === 'string' && serverMessage.trim()
          ? serverMessage.trim()
          : getDefaultMessage(status)

        const serverCode = error.response.data?.code
        const apiError = new Error(message) as Error & {
          status?: number
          code?: string
          data?: unknown
        }
        apiError.status = status
        if (typeof serverCode === 'string') apiError.code = serverCode
        // 응답 바디를 함께 싣는다. 409 소셜 이메일 충돌처럼 message/code 외의 필드
        // (accessToken, provider)를 호출부가 읽어야 하는 경우가 있다.
        apiError.data = error.response.data
        return Promise.reject(apiError)
      }

      // 네트워크 에러 (응답 자체가 없는 경우)
      return Promise.reject(new Error('서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.'))
    }

    return Promise.reject(error)
  },
)

export default apiClient
