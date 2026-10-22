import { forwardRef, useEffect, useRef, useState, createContext, useContext, useCallback } from 'react'
import { STATUS } from '../../config/app'

export const cx = (...a) => a.filter(Boolean).join(' ')

export const Spinner = () => (
  <span aria-hidden="true" className="spin size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
)

/* Tombol: satu aksen hijau, label berawalan kata kerja, target sentuh ≥44px */
const variants = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  outline: 'border border-line-strong bg-surface text-ink hover:bg-accent-soft',
  ghost: 'text-accent hover:bg-accent-soft',
  danger: 'bg-danger text-white hover:bg-[#8f1c12]',
}
export function Button({ variant = 'primary', loading, className, children, ...p }) {
  return (
    <button type="button" {...p} disabled={p.disabled || loading} aria-busy={loading || undefined}
      className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)}>
      {loading && <Spinner />}{children}
    </button>
  )
}

export function Field({ id, label, error, hint, required, optional, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-danger" aria-hidden="true"> *</span>}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && !error && <p id={id + '-hint'} className="text-xs text-muted">{hint}</p>}
      {error && <p id={id + '-err'} role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  )
}

const fieldCls = (error) => cx('min-h-11 w-full rounded-lg border bg-surface px-3 text-base transition-colors duration-150 sm:text-sm', error ? 'border-danger' : 'border-line-strong hover:border-accent')
export const Input = forwardRef(function Input({ id, error, ...p }, ref) {
  return <input ref={ref} id={id} aria-invalid={!!error || undefined} aria-describedby={error ? id + '-err' : undefined} className={fieldCls(error)} {...p} />
})
export function Select({ id, error, children, ...p }) {
  return <select id={id} aria-invalid={!!error || undefined} aria-describedby={error ? id + '-err' : undefined} className={fieldCls(error)} {...p}>{children}</select>
}

/* Input password dengan tombol Show/Hide (satu-satunya adorner yang diizinkan) */
export const PasswordInput = forwardRef(function PasswordInput({ id, error, ...p }, ref) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input ref={ref} id={id} type={show ? 'text' : 'password'} aria-invalid={!!error || undefined} aria-describedby={error ? id + '-err' : undefined} className={cx(fieldCls(error), 'pr-20')} {...p} />
      <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex min-w-16 items-center justify-center rounded-r-lg px-3 text-sm font-medium text-accent hover:bg-accent-soft">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
})

/* L1 surface: border 1px + bayangan lembut (alpha <0.08) */
export const Card = ({ className, ...p }) => <div className={cx('rounded-xl border border-line bg-surface p-6 shadow-(--shadow-soft)', className)} {...p} />

const badge = { pending: 'bg-warn-soft text-warn', approved: 'bg-accent-soft text-accent-strong', rejected: 'bg-danger-soft text-danger' }
export const Badge = ({ status }) => (
  <span className={cx('inline-flex rounded-md px-2 py-1 text-xs font-medium', badge[status])}>{STATUS[status]}</span>
)

export const Skeleton = ({ className }) => <div aria-hidden="true" className={cx('skeleton rounded-lg bg-line', className)} />

/* Empty state: judul + satu kalimat nilai + satu aksi utama. Tanpa ilustrasi kartun. */
export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      {text && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export const ErrorState = ({ text = 'We could not load this page.', onRetry }) => (
  <div role="alert" className="rounded-xl border border-danger/40 bg-danger-soft px-6 py-8 text-center">
    <p className="text-sm text-danger">{text}</p>
    {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}>Reload page</Button>}
  </div>
)

/* Slide-over (panel kanan; penuh layar di mobile): fokus terkunci di dalam, Esc menutup seketika, fokus kembali ke pemicu */
export function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    ref.current?.focus()
    const key = (e) => {
      if (e.key === 'Escape') close.current()
      if (e.key === 'Tab') {
        const f = ref.current.querySelectorAll('button:not(:disabled),[href],input,select,textarea')
        if (!f.length) return
        const a = f[0], z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    document.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev?.focus?.() }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="slide-in h-dvh w-full overflow-y-auto border-l border-line bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:max-w-md">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-2 flex size-11 items-center justify-center rounded-lg text-sm font-medium text-muted hover:bg-accent-soft">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((msg, type = 'info') => {
    const id = Math.random()
    setItems((a) => [...a, { id, msg, type }])
    setTimeout(() => setItems((a) => a.filter((t) => t.id !== id)), 4500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className={cx('rise pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm font-medium', t.type === 'error' ? 'border-danger bg-danger-soft text-danger' : t.type === 'success' ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line bg-surface text-ink')}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
