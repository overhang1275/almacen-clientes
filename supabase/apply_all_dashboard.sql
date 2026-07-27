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
do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'material_type') then
    create type public.material_type as enum ('BOBINA', 'PLIEGO');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'stock_unit') then
    create type public.stock_unit as enum ('MT', 'PCS');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'quality_status') then
    create type public.quality_status as enum ('PENDING', 'APPROVED', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'order_status') then
    create type public.order_status as enum ('PENDING', 'ALLOCATED', 'CLOSED', 'CANCELLED');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'movement_type') then
    create type public.movement_type as enum ('INBOUND', 'ALLOCATED', 'ADJUSTMENT', 'RETURNED_FROM_OP', 'QUALITY_APPROVED', 'QUALITY_REJECTED');
  end if;
end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text unique,
  address text,
  contact_phone text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  category_id uuid not null references public.material_categories(id) on delete restrict,
  material_type public.material_type not null,
  width_cm numeric(12, 3),
  diameter_cm numeric(12, 3),
  core_diameter_cm numeric(12, 3),
  length_mt numeric(14, 3),
  length_cm numeric(12, 3),
  pieces_qty integer,
  batch_number text,
  quality_status public.quality_status not null default 'PENDING',
  location_rack text not null,
  current_stock numeric(14, 3) not null default 0 check (current_stock >= 0),
  stock_unit public.stock_unit not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint materials_bobina_fields check (
    material_type <> 'BOBINA'
    or (
      stock_unit = 'MT'
      and width_cm is not null
      and diameter_cm is not null
      and core_diameter_cm is not null
      and length_mt is not null
      and pieces_qty is null
    )
  ),
  constraint materials_pliego_fields check (
    material_type <> 'PLIEGO'
    or (
      stock_unit = 'PCS'
      and width_cm is not null
      and length_cm is not null
      and pieces_qty is not null
      and diameter_cm is null
      and core_diameter_cm is null
      and length_mt is null
    )
  )
);

create table if not exists public.production_orders (
  id uuid primary key default gen_random_uuid(),
  op_number text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  description text not null,
  due_date date,
  status public.order_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete restrict,
  production_order_id uuid not null references public.production_orders(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  stock_unit public.stock_unit not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete restrict,
  production_order_id uuid references public.production_orders(id) on delete restrict,
  allocation_id uuid references public.allocations(id) on delete restrict,
  movement_type public.movement_type not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  stock_unit public.stock_unit not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create or replace function private.block_inventory_movement_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'inventory_movements is append-only';
end;
$$;

drop trigger if exists inventory_movements_no_update on public.inventory_movements;
create trigger inventory_movements_no_update
before update on public.inventory_movements
for each row execute function private.block_inventory_movement_changes();

drop trigger if exists inventory_movements_no_delete on public.inventory_movements;
create trigger inventory_movements_no_delete
before delete on public.inventory_movements
for each row execute function private.block_inventory_movement_changes();

insert into public.material_categories (name, description)
values
  ('Papel Bond', 'Papel bond de seguridad'),
  ('Papel Segma', 'Papel Segma'),
  ('Sustrato Sintetico', 'Sustrato sintetico'),
  ('Holograma', 'Hologramas de seguridad'),
  ('Foil', 'Foil de seguridad'),
  ('Poliester', 'Poliester'),
  ('Otros', 'Categoria abierta')
on conflict (name) do nothing;

alter table public.clients enable row level security;
alter table public.material_categories enable row level security;
alter table public.materials enable row level security;
alter table public.production_orders enable row level security;
alter table public.allocations enable row level security;
alter table public.inventory_movements enable row level security;

grant select, insert, update on public.clients to authenticated;
grant select, insert, update on public.material_categories to authenticated;
grant select, insert, update on public.materials to authenticated;
grant select, insert, update on public.production_orders to authenticated;
grant select, insert on public.allocations to authenticated;
grant select, insert on public.inventory_movements to authenticated;

create index if not exists clients_name_idx on public.clients(name);
create index if not exists materials_client_status_idx on public.materials(client_id, quality_status);
create index if not exists materials_available_idx on public.materials(client_id, category_id)
where quality_status = 'APPROVED' and current_stock > 0;
create index if not exists production_orders_client_status_idx on public.production_orders(client_id, status);
create index if not exists allocations_material_idx on public.allocations(material_id);
create index if not exists allocations_order_idx on public.allocations(production_order_id);
create index if not exists inventory_movements_material_created_idx on public.inventory_movements(material_id, created_at desc);
create index if not exists inventory_movements_order_idx on public.inventory_movements(production_order_id)
where production_order_id is not null;

drop policy if exists "clients_select_operational" on public.clients;
create policy "clients_select_operational" on public.clients
for select to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

drop policy if exists "clients_write_admin_almacen" on public.clients;
create policy "clients_write_admin_almacen" on public.clients
for all to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN'))
with check ((select private.current_user_role()) in ('ADMIN', 'ALMACEN'));

drop policy if exists "categories_select_operational" on public.material_categories;
create policy "categories_select_operational" on public.material_categories
for select to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

drop policy if exists "categories_write_admin" on public.material_categories;
create policy "categories_write_admin" on public.material_categories
for all to authenticated
using ((select private.current_user_role()) = 'ADMIN')
with check ((select private.current_user_role()) = 'ADMIN');

drop policy if exists "materials_select_operational" on public.materials;
create policy "materials_select_operational" on public.materials
for select to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

drop policy if exists "materials_insert_almacen" on public.materials;
create policy "materials_insert_almacen" on public.materials
for insert to authenticated
with check ((select private.current_user_role()) in ('ADMIN', 'ALMACEN'));

drop policy if exists "materials_update_almacen_calidad" on public.materials;
create policy "materials_update_almacen_calidad" on public.materials
for update to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'CALIDAD'))
with check ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'CALIDAD'));

drop policy if exists "orders_select_operational" on public.production_orders;
create policy "orders_select_operational" on public.production_orders
for select to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

drop policy if exists "orders_write_enlace" on public.production_orders;
create policy "orders_write_enlace" on public.production_orders
for all to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ENLACE'))
with check ((select private.current_user_role()) in ('ADMIN', 'ENLACE'));

drop policy if exists "allocations_select_operational" on public.allocations;
create policy "allocations_select_operational" on public.allocations
for select to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

drop policy if exists "allocations_insert_enlace" on public.allocations;
create policy "allocations_insert_enlace" on public.allocations
for insert to authenticated
with check ((select private.current_user_role()) in ('ADMIN', 'ENLACE'));

drop policy if exists "movements_select_operational" on public.inventory_movements;
create policy "movements_select_operational" on public.inventory_movements
for select to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

drop policy if exists "movements_insert_operational" on public.inventory_movements;
create policy "movements_insert_operational" on public.inventory_movements
for insert to authenticated
with check ((select private.current_user_role()) in ('ADMIN', 'ALMACEN', 'ENLACE', 'CALIDAD'));

