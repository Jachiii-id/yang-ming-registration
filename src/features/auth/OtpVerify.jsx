import { useEffect, useRef, useState } from 'react'
import { APP } from '../../config/app'
import { supabase, maskEmail } from '../../lib/supabase'
import { Button, cx, useToast } from '../../components/ui'

// Enam kotak angka. Mendukung paste, backspace, dan panah kiri/kanan.
function OtpInput({ length, value, onChange, disabled, error }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')
  return (
    <div role="group" aria-label="Verification code" className="flex justify-between gap-2 sm:justify-center sm:gap-3">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} value={d} disabled={disabled} maxLength={1}
          inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1}`}
          aria-invalid={!!error || undefined}
          className={cx('h-12 min-w-0 max-w-12 flex-1 rounded-lg border bg-surface text-center text-lg font-semibold transition-colors duration-150 sm:h-14', error ? 'border-danger' : 'border-line-strong focus:border-accent')}
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, '').slice(-1)
            const a = digits.slice(); a[i] = c
            onChange(a.join(''))
            if (c && i < length - 1) refs.current[i + 1].focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1].focus()
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1].focus()
            if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1].focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
            if (t) { onChange(t); refs.current[Math.min(t.length, length - 1)].focus() }
          }} />
      ))}
    </div>
  )
}

// Layar verifikasi OTP yang dipakai Login dan Register.
//  type     : 'email' (login) | 'signup' (registrasi) — sesuai jenis email yang dikirim Supabase
//  onResend : fungsi yang mengirim ulang kode (beda untuk login & register)
export function OtpVerify({ email, type, onResend, onVerified, onBack, backLabel = 'Change email' }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [cool, setCool] = useState(APP.resendSeconds)

  useEffect(() => {
    if (cool <= 0) return
    const t = setTimeout(() => setCool((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cool])

  const verify = async (c) => {
    if (busy) return
    if (c.length !== APP.otpLength) return setErr(`Enter the ${APP.otpLength}-digit code.`)
    setBusy(true); setErr('')
    const { data, error } = await supabase.auth.verifyOtp({ email, token: c, type })
    if (error) {
      setBusy(false); setCode('')
      return setErr(/expired/i.test(error.message) ? 'This code has expired. Request a new one.' : 'That code is incorrect. Check it and try again.')
    }
    await onVerified(data.user)
    setBusy(false)
  }
  useEffect(() => { if (code.length === APP.otpLength) verify(code) }, [code])

  const resend = async () => {
    const { error } = await onResend()
    if (error) return toast('We could not send a new code. Try again shortly.', 'error')
    toast('A new code is on its way.', 'success'); setCool(APP.resendSeconds); setCode(''); setErr('')
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">We sent a {APP.otpLength}-digit code to <strong className="font-medium text-ink">{maskEmail(email)}</strong>. It can take a minute to arrive.</p>
      <OtpInput length={APP.otpLength} value={code} onChange={(v) => { setCode(v); setErr('') }} disabled={busy} error={err} />
      <p role="alert" className="min-h-5 text-center text-sm text-danger">{err}</p>
      <Button className="w-full" loading={busy} onClick={() => verify(code)}>Verify code</Button>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <Button variant="ghost" disabled={cool > 0} onClick={resend}>{cool > 0 ? `Resend code in ${cool}s` : 'Resend code'}</Button>
        <Button variant="ghost" onClick={onBack}>{backLabel}</Button>
      </div>
    </div>
  )
}
