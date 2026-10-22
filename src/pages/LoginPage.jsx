// Pola halaman: Form (auth) — kartu di tengah, satu tugas per layar.
// Layar 1: email + password. Layar 2: kode OTP 6 digit yang dikirim Supabase ke email.
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { checkPassword, sendLoginOtp } from '../lib/supabase'
import { Button, Card, Field, Input, PasswordInput } from '../components/ui'
import { OtpVerify } from '../features/auth/OtpVerify'
import { useAuth } from '../features/auth/AuthContext'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const nav = useNavigate()
  const [email, setEmailInput] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState('password')
  const [otpEmail, setOtpEmail] = useState('') // email yang menerima kode OTP

  if (!loading && session && step === 'password') return <Navigate to="/app" replace />

  const blur = (k, v, msg) => setErrors((e) => ({ ...e, [k]: v.trim() ? undefined : msg }))

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    const r = await checkPassword(email, password)
    if (r.error) {
      setBusy(false)
      return setErrors({ form: r.error === 'rate' ? 'Too many attempts. Wait a minute and try again.' : r.error === 'unconfirmed' ? 'Your email is not verified yet. Register again to receive a new code.' : 'The email or password is incorrect.' })
    }
    const { error } = await sendLoginOtp(r.email)
    setBusy(false)
    if (error) return setErrors({ form: /rate|seconds/i.test(error.message) ? 'Too many requests. Wait a minute and try again.' : 'We could not send the code. Try again.' })
    setOtpEmail(r.email); setPassword(''); setStep('verify')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <Card className="rise">
        <h1 className="text-[1.44rem] font-semibold">{step === 'password' ? 'Sign in' : 'Enter your code'}</h1>
        {step === 'password' ? (
          <form onSubmit={submit} noValidate className="mt-6 space-y-6">
            {errors.form && <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">{errors.form}</p>}
            <Field id="login-email" label="Email address" error={errors.email}>
              <Input id="login-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} error={errors.email}
                onChange={(e) => { setEmailInput(e.target.value); setErrors((x) => ({ ...x, email: undefined, form: undefined })) }} onBlur={(e) => blur('email', e.target.value, 'Enter your email address.')} />
            </Field>
            <Field id="login-password" label="Password" error={errors.password}>
              <PasswordInput id="login-password" autoComplete="current-password" value={password} error={errors.password}
                onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined, form: undefined })) }} onBlur={(e) => blur('password', e.target.value, 'Enter your password.')} />
            </Field>
            <Button type="submit" loading={busy} className="w-full">Send verification code</Button>
            <p className="text-center text-sm text-muted">New here? <Link to="/register" className="font-medium text-accent underline">Create an account</Link></p>
          </form>
        ) : (
          <div className="mt-4">
            <OtpVerify email={otpEmail} type="email" onResend={() => sendLoginOtp(otpEmail)} onVerified={() => nav('/app', { replace: true })} onBack={() => { setStep('password'); setErrors({}) }} backLabel="Back to sign in" />
          </div>
        )}
      </Card>
    </div>
  )
}
