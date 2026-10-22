import { createClient } from '@supabase/supabase-js'
import { APP } from '../config/app'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Klien utama: menyimpan sesi login di browser.
export const supabase = createClient(URL, KEY)

// Klien sementara: HANYA untuk memeriksa password. Tidak menyimpan sesi,
// jadi aplikasi tidak pernah "login" sebelum OTP diverifikasi.
const probeClient = () =>
  createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'ym-probe' } })

// Langkah 1 login: email + password. Pesan gagal sengaja sama untuk email/password salah.
export async function checkPassword(rawEmail, password) {
  const email = rawEmail.trim().toLowerCase()
  const probe = probeClient()
  const { error: e } = await probe.auth.signInWithPassword({ email, password })
  if (e) return { error: /rate|seconds/i.test(e.message) ? 'rate' : /confirm/i.test(e.message) ? 'unconfirmed' : 'invalid' }
  await probe.auth.signOut({ scope: 'local' }) // buang sesi sementara di server
  return { email }
}

// Langkah 2 login: kirim kode 6 digit ke email (template "Magic Link" berisi {{ .Token }}).
export const sendLoginOtp = (email) =>
  supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })

export const maskEmail = (e) => e.replace(/^(.).*(@.*)$/, (_, a, d) => `${a}•••${d}`)

export async function openDocument(path, toast) {
  const { data, error } = await supabase.storage.from(APP.bucket).createSignedUrl(path, 60)
  if (error) return toast('We could not open the document.', 'error')
  window.open(data.signedUrl, '_blank', 'noopener')
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
