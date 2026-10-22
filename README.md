# Yang Ming Indonesia — Registration Website

React + Vite + Tailwind v4, Supabase (Auth email OTP, Postgres RLS, private Storage), deployed on Vercel.

## 1. Supabase setup
1. Create a project at supabase.com.
2. SQL Editor → run `001_init.sql`, `002_username_otp.sql`, lalu `003_email_login.sql` (login memakai email + password; fungsi username dihapus).
3. Authentication → Providers → Email: enable, and turn on "Confirm email".
4. Authentication → Email Templates → **Magic Link** (login) dan **Confirm signup** (registrasi): isi HANYA `{{ .Token }}`, jangan `{{ .ConfirmationURL }}`, supaya yang terkirim kode 6 angka, bukan link. Contoh: `<p>Your verification code is <strong>{{ .Token }}</strong></p>`. Set OTP length to 6 (Auth → Providers → Email), matching `otpLength` in `src/config/app.js`.
5. Authentication → URL Configuration: Site URL = your Vercel domain; add `http://localhost:5173` and the Vercel domain to Redirect URLs.
6. Configure custom SMTP (Authentication → Emails → SMTP Settings). Gmail: host `smtp.gmail.com`, port 465, username = full Gmail address, password = 16-character Google App Password, sender email = the same Gmail address.

## 2. Environment variables
Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key only; never put the service-role key in `VITE_` variables).

## 3. Admin account
The migration's `handle_new_user()` trigger assigns `role = 'admin'` inside the database when the account `ahmadarjati10@gmail.com` is created. A session is only issued after that mailbox's OTP is verified. To do it manually instead, remove the CASE in the trigger and run:
`update public.profiles set role = 'admin' where email = 'ahmadarjati10@gmail.com';`
If that account already exists before you run the migration, use the update statement above.

## 4. Run and test
```
npm install
npm run dev
```
- Register with a real mailbox, enter the emailed code, confirm the row in `registrations` and the file in Storage → `registration-documents/<user-id>/`.
- Sign in as admin → `/admin`: search, filter, sort, view document (60 s signed URL), approve/reject, notes.
- Sign in as a second user and confirm they only see their own data.

## 5. Hero image
Put your photo at `public/images/yang-ming-hero.jpg` (path configurable in `src/config/app.js`).

## 6. Deploy to Vercel
Import the repo, framework preset Vite, add the two env vars, deploy. `vercel.json` provides the SPA fallback. Then update Supabase Site URL / Redirect URLs to the final domain.

## Responsive checklist
Test at 320, 375, 414, 768, 1024, 1280 and 1920 px: no horizontal scroll, OTP boxes fit, admin table becomes cards below 768 px, modal becomes a bottom sheet on mobile.

## Limitations
- Upload happens after OTP verification (storage is private and needs an authenticated user); the file is held in memory, so a page reload during verification requires re-selecting it.
- Supabase Storage uploads here show an "uploading…" state, not a percentage.
- Magic-link/OTP codes can be 6–8 digits depending on project settings; keep `otpLength` in sync.
- Terms and privacy policy are text only; add real pages/links.
