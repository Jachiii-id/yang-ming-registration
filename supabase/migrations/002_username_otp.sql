alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{4,20}$');
create unique index if not exists profiles_username_key on public.profiles (lower(username));

-- Trigger: salin username dari metadata signUp ke tabel profiles.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, username, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''),
          nullif(lower(new.raw_user_meta_data->>'username'), ''),
          case when lower(new.email) = 'ahmadarjati10@gmail.com' then 'admin' else 'user' end);
  return new;
end $$;

-- Dipanggil browser (anon) saat login: ubah username -> email. Kembalikan NULL jika tidak ada.
create or replace function public.login_email(p_username text) returns text
language sql security definer set search_path = public stable as $$
  select email from public.profiles where lower(username) = lower(p_username) limit 1;
$$;

create or replace function public.username_available(p_username text) returns boolean
language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

revoke all on function public.login_email(text), public.username_available(text) from public;
grant execute on function public.login_email(text), public.username_available(text) to anon, authenticated;

-- Akun yang sudah ada (misal admin) perlu username agar bisa login:
-- update public.profiles set username = 'admin_ym' where email = 'ahmadarjati10@gmail.com';
