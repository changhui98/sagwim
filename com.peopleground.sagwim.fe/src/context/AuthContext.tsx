import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { signOut as signOutApi } from '../api/authApi'
import { getMyProfile } from '../api/userApi'
import type { UserDetailResponse } from '../types/user'
import { authStorage } from '../lib/authStorage'

interface AuthContextValue {
  token: string
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
  meUsername: string | null
  meNickname: string | null
  meRole: string | null
  meProfileImageUrl: string | null
  setMeProfile: (profile: UserDetailResponse | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState(authStorage.getToken())
  const [meUsername, setMeUsername] = useState<string | null>(null)
  const [meNickname, setMeNickname] = useState<string | null>(null)
  const [meRole, setMeRole] = useState<string | null>(null)
  const [meProfileImageUrl, setMeProfileImageUrl] = useState<string | null>(null)

  const setMeProfile = useCallback((profile: UserDetailResponse | null) => {
    if (!profile) {
      setMeUsername(null)
      setMeNickname(null)
      setMeRole(null)
      setMeProfileImageUrl(null)
      return
    }

    setMeUsername(profile.username)
    setMeNickname(profile.nickname)
    setMeRole(profile.role)
    setMeProfileImageUrl(profile.profileImageUrl?.trim() ? profile.profileImageUrl.trim() : null)
  }, [])

  useEffect(() => {
    if (!token.trim()) {
      setMeProfile(null)
      return
    }

    let cancelled = false
    getMyProfile(token)
      .then((profile) => {
        if (cancelled) return
        setMeProfile(profile)
      })
      .catch(() => {
        if (cancelled) return
        setMeProfile(null)
      })

    return () => {
      cancelled = true
    }
  }, [token, setMeProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: token.length > 0,
      login: (nextToken: string) => {
        authStorage.setToken(nextToken)
        setToken(nextToken)
      },
      logout: () => {
        const currentToken = authStorage.getToken()
        authStorage.clearToken()
        setToken('')
        setMeProfile(null)
        if (currentToken.trim()) {
          signOutApi(currentToken).catch(() => {
            // 서버 로그아웃 실패 시에도 클라이언트 토큰은 이미 삭제됨
          })
        }
      },
      meUsername,
      meNickname,
      meRole,
      meProfileImageUrl,
      setMeProfile,
    }),
    [token, meUsername, meNickname, meRole, meProfileImageUrl, setMeProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
