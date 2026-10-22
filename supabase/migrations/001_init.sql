create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  company_name text,
  phone_number text,
  registration_category text,
  document_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One active (pending/approved) registration per user; rejected users may re-apply.
create unique index one_active_registration on public.registrations (user_id) where status in ('pending','approved');
create index registrations_status_idx on public.registrations (status, submitted_at desc);

-- Admin-only notes live in their own table so users can never read them.
create table public.registration_notes (
  registration_id uuid primary key references public.registrations(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger registrations_touch before update on public.registrations for each row execute function public.touch_updated_at();

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Trusted admin provisioning: runs inside the database, never from client input.
-- A session is only issued after the OTP sent to this address is verified.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''),
          case when lower(new.email) = 'ahmadarjati10@gmail.com' then 'admin' else 'user' end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_notes enable row level security;

-- profiles: read own (or all if admin). No insert/update/delete policies → role cannot be edited by users.
create policy "profiles read own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- registrations
create policy "registrations read own or admin" on public.registrations for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "registrations insert own pending" on public.registrations for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and lower(email) = lower(auth.jwt() ->> 'email')
              and document_path like auth.uid()::text || '/%');
create policy "registrations update admin only" on public.registrations for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- notes: admin only
create policy "notes admin all" on public.registration_notes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Private storage bucket (server-side size + MIME enforcement)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('registration-documents','registration-documents', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;

create policy "docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'registration-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'registration-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "docs delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'registration-documents' and (storage.foldername(name))[1] = auth.uid()::text);
