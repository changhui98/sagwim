const TOKEN_KEY = 'sagwim_access_token'

export const authStorage = {
  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
}
