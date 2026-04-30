const RULES = [
  { label: '8자 이상',    test: (pw: string) => pw.length >= 8 },
  { label: '소문자 포함', test: (pw: string) => /[a-z]/.test(pw) },
  { label: '대문자 포함', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: '특수문자 포함', test: (pw: string) => /[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/]/.test(pw) },
]

export { RULES }

export function isPasswordValid(password: string): boolean {
  return RULES.every(({ test }) => test(password))
}

export function isConfirmPasswordValid(password: string, confirm: string): boolean {
  return confirm.length > 0 && password === confirm
}
