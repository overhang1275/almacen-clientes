alter table public.profiles
add column if not exists email text not null default '';

update public.profiles p
set email = coalesce(u.email, '')
from auth.users u
where p.id = u.id
  and p.email = '';

create unique index if not exists profiles_email_idx on public.profiles(email) where email <> '';
