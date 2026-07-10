import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  forgotPasswordChange,
  forgotPasswordSend,
  forgotPasswordVerify,
  resendOtp,
  signin,
  verifyUser,
} from '../api/auth'
import { FalconMark } from '../components/FalconMark'
import { useAuthStore } from '../store/authStore'
import './LoginPage.css'

type View = 'signin' | 'verify-otp' | 'forgot-send' | 'forgot-verify' | 'forgot-change'

export default function LoginPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()

  const [view, setView] = useState<View>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userId, setUserId] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendCooldown])

  if (accessToken) {
    return <Navigate to="/" replace />
  }

  function resetMessages() {
    setError('')
    setInfo('')
  }

  function goTo(next: View) {
    resetMessages()
    setView(next)
  }

  async function handleSignin(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)

    const result = await signin(email.trim(), password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    if (result.status === 201 && 'userId' in result.data) {
      setUserId(result.data.userId)
      setOtp('')
      setInfo('We sent a verification code to your email.')
      setResendCooldown(30)
      setView('verify-otp')
      return
    }

    if ('tokens' in result.data && 'user' in result.data) {
      setSession(result.data.tokens, result.data.user)
      navigate('/', { replace: true })
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    resetMessages()

    const code = Number(otp)
    if (!Number.isInteger(code) || otp.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setLoading(true)
    const result = await verifyUser(userId, code)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setSession(result.data.tokens, result.data.user)
    navigate('/', { replace: true })
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || !userId) return
    resetMessages()
    setLoading(true)
    const result = await resendOtp(userId)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setInfo('A new code has been sent.')
    setResendCooldown(30)
  }

  async function handleForgotSend(e: FormEvent) {
    e.preventDefault()
    resetMessages()
    setLoading(true)

    const result = await forgotPasswordSend(email.trim())
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setOtp('')
    setInfo(result.data.message)
    setResendCooldown(30)
    setView('forgot-verify')
  }

  async function handleForgotVerify(e: FormEvent) {
    e.preventDefault()
    resetMessages()

    const code = Number(otp)
    if (!Number.isInteger(code) || otp.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setLoading(true)
    const result = await forgotPasswordVerify(email.trim(), code)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setResetToken(result.data.resetToken)
    setNewPassword('')
    setConfirmPassword('')
    setView('forgot-change')
  }

  async function handleForgotChange(e: FormEvent) {
    e.preventDefault()
    resetMessages()

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await forgotPasswordChange(resetToken, newPassword)
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setInfo('Password updated. You can sign in now.')
    setView('signin')
  }

  const titles: Record<View, { heading: string; sub: string }> = {
    signin: {
      heading: 'Welcome back',
      sub: 'Sign in to continue your path to homeownership.',
    },
    'verify-otp': {
      heading: 'Check your email',
      sub: 'Enter the 6-digit code we sent to verify your account.',
    },
    'forgot-send': {
      heading: 'Reset password',
      sub: 'Enter your email and we’ll send a reset code.',
    },
    'forgot-verify': {
      heading: 'Enter reset code',
      sub: 'Use the 6-digit code from your email to continue.',
    },
    'forgot-change': {
      heading: 'Choose a new password',
      sub: 'Pick something secure — at least 6 characters.',
    },
  }

  const { heading, sub } = titles[view]

  return (
    <div className="login-screen">
      <div className="login-atmosphere" aria-hidden="true">
        <div className="login-sky" />
        <div className="login-horizon" />
        <div className="login-house" />
        <div className="login-grain" />
      </div>

      <main className="login-main">
        <header className="login-brand">
          <div className="login-brand-mark">
            <FalconMark className="falcon-mark" />
          </div>
          <p className="login-brand-name">FalconAI</p>
          <p className="login-brand-tagline">Your pathway to owning a home</p>
        </header>

        <section className="login-panel" key={view}>
          <div className="login-panel-copy">
            <h1>{heading}</h1>
            <p>{sub}</p>
          </div>

          {error ? <p className="login-alert login-alert--error" role="alert">{error}</p> : null}
          {info ? <p className="login-alert login-alert--info">{info}</p> : null}

          {view === 'signin' && (
            <form className="login-form" onSubmit={handleSignin} noValidate>
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <div className="login-row">
                <button type="button" className="login-link" onClick={() => goTo('forgot-send')}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {view === 'verify-otp' && (
            <form className="login-form" onSubmit={handleVerifyOtp} noValidate>
              <label className="login-field">
                <span>Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="login-otp"
                  required
                />
              </label>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>

              <div className="login-footer-actions">
                <button
                  type="button"
                  className="login-link"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button type="button" className="login-link" onClick={() => goTo('signin')}>
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {view === 'forgot-send' && (
            <form className="login-form" onSubmit={handleForgotSend} noValidate>
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset code'}
              </button>

              <div className="login-footer-actions">
                <button type="button" className="login-link" onClick={() => goTo('signin')}>
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {view === 'forgot-verify' && (
            <form className="login-form" onSubmit={handleForgotVerify} noValidate>
              <label className="login-field">
                <span>Reset code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="login-otp"
                  required
                />
              </label>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Checking…' : 'Continue'}
              </button>

              <div className="login-footer-actions">
                <button
                  type="button"
                  className="login-link"
                  disabled={loading || resendCooldown > 0}
                  onClick={async () => {
                    resetMessages()
                    setLoading(true)
                    const result = await forgotPasswordSend(email.trim())
                    setLoading(false)
                    if (!result.ok) {
                      setError(result.error.message)
                      return
                    }
                    setInfo('A new code has been sent.')
                    setResendCooldown(30)
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button type="button" className="login-link" onClick={() => goTo('signin')}>
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {view === 'forgot-change' && (
            <form className="login-form" onSubmit={handleForgotChange} noValidate>
              <label className="login-field">
                <span>New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </label>

              <label className="login-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  minLength={6}
                  required
                />
              </label>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
