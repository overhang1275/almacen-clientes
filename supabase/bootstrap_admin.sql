do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role') then
    create type public.app_role as enum ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD');
  end if;
end $$;

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  role public.app_role not null default 'ALMACEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;

create index if not exists profiles_role_idx on public.profiles(role);
create unique index if not exists profiles_email_idx on public.profiles(email) where email <> '';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'ALMACEN'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

revoke execute on function private.current_user_role() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_role()) = 'ADMIN'
);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using ((select private.current_user_role()) = 'ADMIN')
with check ((select private.current_user_role()) = 'ADMIN');

insert into public.profiles (id, email, full_name, role)
values (
  '807f4293-6831-47c6-8005-09bfcc6cf523',
  'anthony.tepach@gmail.com',
  'Anthony Tepach',
  'ADMIN'
)
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = 'ADMIN';
