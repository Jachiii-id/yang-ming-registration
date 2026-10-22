-- Login sekarang memakai EMAIL + password (bukan username).
-- Fungsi lookup username dihapus karena membuka email orang untuk username yang ditebak.
drop function if exists public.login_email(text);
drop function if exists public.username_available(text);

-- Pastikan akun admin punya baris profil dan role admin.
insert into public.profiles (id, email, role)
select id, email, 'admin' from auth.users
where lower(email) = 'ahmadarjati10@gmail.com'
on conflict (id) do update set role = 'admin';
