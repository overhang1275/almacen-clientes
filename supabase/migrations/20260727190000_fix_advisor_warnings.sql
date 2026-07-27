create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.block_inventory_movement_changes()
returns trigger
language plpgsql
set search_path = private
as $$
begin
  raise exception 'inventory_movements is append-only';
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and p.pronargs = 0
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

drop policy if exists "clients_write_admin_almacen" on public.clients;
create policy "clients_insert_admin_almacen" on public.clients
for insert to authenticated
with check ((select private.current_user_role()) in ('ADMIN', 'ALMACEN'));
create policy "clients_update_admin_almacen" on public.clients
for update to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ALMACEN'))
with check ((select private.current_user_role()) in ('ADMIN', 'ALMACEN'));

drop policy if exists "categories_write_admin" on public.material_categories;
create policy "categories_insert_admin" on public.material_categories
for insert to authenticated
with check ((select private.current_user_role()) = 'ADMIN');
create policy "categories_update_admin" on public.material_categories
for update to authenticated
using ((select private.current_user_role()) = 'ADMIN')
with check ((select private.current_user_role()) = 'ADMIN');

drop policy if exists "orders_write_enlace" on public.production_orders;
create policy "orders_insert_enlace" on public.production_orders
for insert to authenticated
with check ((select private.current_user_role()) in ('ADMIN', 'ENLACE'));
create policy "orders_update_enlace" on public.production_orders
for update to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ENLACE'))
with check ((select private.current_user_role()) in ('ADMIN', 'ENLACE'));

