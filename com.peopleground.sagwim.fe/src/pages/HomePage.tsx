import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/NavIcons'
import { useLoginForm } from '../hooks/useLoginForm'
import { PasswordInput } from '../components/PasswordInput'
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons'
import styles from './HomePage.module.css'

const REDIRECT_URI = `${window.location.origin}/login`

export function HomePage() {
  const { form, setForm, loading, error, handleSubmit } = useLoginForm({
    redirectTo: '/app',
  })

  return (
    <main className={styles.root}>
      <section className={`card animate-scale-in ${styles.card}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <BrandLogo className={styles.brandMark} aria-hidden />
          <h1 className={styles.brandName}>Sagwim</h1>
          <p className={styles.tagline}>함께 모이는 공간</p>
        </div>

        {/* Login form */}
        <form className="form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="home-username">
              아이디
            </label>
            <input
              id="home-username"
              className="input"
              placeholder="username"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="home-password">
              비밀번호
            </label>
            <PasswordInput
              id="home-password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          {error && <p className="alert alert-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className={styles.divider}>또는</div>

        <SocialLoginButtons redirectUri={REDIRECT_URI} variant="continue" />

        <p className={styles.footer}>
          아직 계정이 없으신가요?{' '}
          <Link to="/sign-up">회원가입</Link>
        </p>
      </section>
    </main>
  )
}
