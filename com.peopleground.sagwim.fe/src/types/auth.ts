export interface SignInRequest {
  username: string
  password: string
}

export interface SignUpRequest {
  username: string
  password: string
  nickname: string
  userEmail: string
  address: string
}

export interface SocialSignInResponse {
  jwtToken: string
  isNewUser: boolean
  nickname: string
}
