# Penjelasan Kode — Yang Ming Registration (Bahasa Indonesia)

## 1. Apa yang berubah

| Permintaan | Hasil |
|---|---|
| Desain lebih bersih + hijau segar | Header putih, latar hijau sangat muda, satu warna aksen hijau `#15803d`. Tidak ada gradasi, blur, atau ilustrasi kartun. Semua warna ada di `src/styles/index.css`. |
| Struktur landing diganti | Dulu: foto penuh + overlay biru. Sekarang: hero 2 kolom (teks + foto berbingkai) → 3 langkah pendaftaran → persyaratan → ajakan daftar. |
| Login username + password → OTP | Layar 1: username & password. Layar 2: kode 6 digit dari email. |
| OTP 6 angka, bukan link | Template email Supabase hanya berisi `{{ .Token }}` (lihat bagian 4). |
| Email dari email sendiri | Bisa, lewat Custom SMTP (bagian 5). |

## 2. Struktur folder dan fungsi tiap file

```
yang-ming-registration/
├─ index.html                 Halaman HTML tunggal; memuat font Inter (400/500/600) dan /src/main.jsx.
├─ vite.config.js             Konfigurasi Vite: plugin React dan Tailwind v4.
├─ vercel.json                Semua URL diarahkan ke index.html agar React Router jalan di Vercel.
├─ package.json               Daftar library dan perintah (npm run dev / build).
├─ .env.local / .env.example  URL + publishable key Supabase. JANGAN pakai service-role key di sini.
├─ .ux-profile.md, CLAUDE.md  Aturan desain proyek (gaya, aksesibilitas, larangan) untuk skill UX. Baru.
├─ public/images/hero-images.jpg   Foto kapal untuk landing (1,4 MB; disarankan dikompres ke <300 KB).
│
├─ supabase/migrations/
│  ├─ 001_init.sql            Tabel profiles, registrations, registration_notes; RLS; bucket privat; trigger admin.
│  └─ 002_username_otp.sql    BARU. Kolom username, trigger yang menyalin username, fungsi login_email() dan username_available().
│
└─ src/
   ├─ main.jsx                Titik masuk: membungkus app dengan Router, Toast, dan AuthProvider.
   ├─ App.jsx                 Daftar rute: /, /register, /login, /dashboard, /admin, 404.
   ├─ config/app.js           Pengaturan terpusat: nama brand, panjang OTP (6), batas file, aturan username, min. password.
   ├─ lib/supabase.js         Klien Supabase + checkPassword (langkah 1 login), sendLoginOtp, usernameAvailable,
   │                          maskEmail, openDocument (link dokumen 60 detik), fmtDate.
   ├─ styles/index.css        Token desain: warna, ukuran teks, durasi animasi, reduced-motion.
   ├─ routes/Guard.jsx        Guard: halaman wajib login / admin. RoleRedirect: /app → admin atau dashboard.
   ├─ features/auth/
   │  ├─ AuthContext.jsx      Menyimpan sesi + profil (role, username); menyediakan useAuth().
   │  └─ OtpVerify.jsx        Enam kotak OTP + tombol kirim ulang (60 dtk). Dipakai Login (type "email") dan Register (type "signup").
   ├─ components/
   │  ├─ layout/Layout.jsx    Header, menu mobile, footer, tautan "Skip to main content".
   │  └─ ui/
   │     ├─ index.jsx         Button, Field, Input, Select, PasswordInput, Card, Badge, Skeleton, EmptyState,
   │     │                    ErrorState, Modal (slide-over kanan), Toast.
   │     └─ FileUpload.jsx    Kotak pilih dokumen PDF/JPG/PNG.
   └─ pages/
      ├─ LandingPage.jsx      Beranda (rute pemasaran).
      ├─ LoginPage.jsx        Form auth: username+password → OTP.
      ├─ RegisterPage.jsx     Form daftar: data + username + password + dokumen → OTP → simpan.
      ├─ UserDashboard.jsx    Detail registrasi milik user + status.
      └─ AdminDashboard.jsx   Daftar semua registrasi: cari, filter status, urut, halaman; slide-over detail (setujui/tolak/catatan).
```

## 3. Alur kerja

**Daftar:** isi form → `supabase.auth.signUp` (email, password, username di metadata) → Supabase kirim kode 6 angka
→ `verifyOtp(type: 'signup')` → sesi aktif → file diunggah ke bucket privat → baris masuk tabel `registrations`.
Trigger database menyalin username ke `profiles`. Password tidak pernah disimpan di draft browser.

**Login:** username → fungsi `login_email()` mencari email → password dicek lewat klien sementara (tanpa sesi)
→ `signInWithOtp` mengirim kode 6 angka → `verifyOtp(type: 'email')` → baru sesi dibuat.
Pesan error sengaja sama untuk username salah dan password salah.

### Batasan keamanan yang perlu Anda tahu
1. **OTP ini diterapkan di sisi aplikasi, belum dipaksa server.** Orang yang tahu username+password bisa memanggil API Supabase langsung dan melewati OTP. Untuk 2FA yang benar-benar wajib, gunakan Supabase MFA (TOTP) atau Auth Hook. Untuk portal pendaftaran ini keamanannya setara password + verifikasi email saat daftar.
2. **`login_email()` membuka email untuk username yang ditebak.** Ini konsekuensi login dengan username. Aktifkan CAPTCHA/rate-limit di Supabase untuk menekan penyalahgunaan.
3. Akun lama (mis. admin `ahmadarjati10@gmail.com`) belum punya username. Jalankan baris `update public.profiles set username = ...` di akhir `002_username_otp.sql`.

## 4. Pengaturan Supabase (wajib agar OTP 6 angka muncul)
1. Authentication → Sign In / Providers → Email: aktifkan **Confirm email**, **Email OTP Length = 6**, kedaluwarsa disarankan 600 detik.
2. Authentication → Email Templates → **Magic Link** dan **Confirm signup**: isi dengan `<p>Kode verifikasi Anda: <strong>{{ .Token }}</strong></p>`. Jangan pakai `{{ .ConfirmationURL }}`.
3. Jalankan `001_init.sql` lalu `002_username_otp.sql` di SQL Editor.

## 5. Kirim email dari email sendiri (SMTP)
Maksud "DHCP" kemungkinan **SMTP**. Jawabannya: **bisa**. Supabase tetap yang memicu pengiriman, tetapi email dikirim lewat server SMTP milik Anda.
Dashboard → Authentication → SMTP Settings → **Enable custom SMTP**, isi: Sender email, Sender name, Host, Port (465/587), Username, Password.

| Pilihan | Catatan |
|---|---|
| Email domain perusahaan (mis. `no-reply@perusahaan.co.id`) | Terbaik. Pakai SMTP hosting/Google Workspace/Zoho. Setel SPF, DKIM, DMARC agar tidak masuk spam. |
| Gmail pribadi | Bisa dengan *App Password* (akun Google harus aktif 2-langkah), host `smtp.gmail.com`. Ada batas harian dan lebih rawan masuk spam. Cocok hanya untuk uji coba. |
| Resend, Brevo, SendGrid, Mailgun | Layanan khusus; pengirim = alamat domain Anda yang sudah diverifikasi. Cocok untuk produksi. |

Tanpa SMTP sendiri, pengirim bawaan Supabase sangat dibatasi (sekitar 2 email/jam) dan template tidak bisa diubah, jadi OTP praktis tidak berjalan lancar.

## 6. Status audit UX (skill `ux-audit`)
Tidak ada akses jaringan untuk `npm install`, jadi proyek **belum dijalankan dan belum diberi screenshot**. Dicek lewat kode: tanpa gradasi/blur/kartun, bobot font 400/500/600, ukuran teks 12/14/16, durasi 100–300 ms hanya transform/opacity, `prefers-reduced-motion`, tombol berawalan kata kerja, target sentuh 44px, tabel dalam frame berborder, empty state dengan aksi, fokus terlihat, slide-over menjebak fokus. **Belum terbukti:** overflow horizontal di 375/1280 px, proporsi warna 60-30-10 pada screenshot, fokus trap di browser. Jalankan `npm install && npm run dev` lalu cek.
