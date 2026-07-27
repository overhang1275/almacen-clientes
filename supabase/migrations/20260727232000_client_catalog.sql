alter table public.clients
add column if not exists contact_email text;

alter table public.clients
drop constraint if exists clients_tax_id_required;

alter table public.clients
add constraint clients_tax_id_required
check (tax_id is not null and btrim(tax_id) <> '')
not valid;

create index if not exists clients_name_tax_id_idx
on public.clients(name, tax_id);

revoke update on public.clients from authenticated;
revoke delete on public.clients from authenticated;
grant update (address, contact_phone, contact_email) on public.clients to authenticated;
grant delete on public.clients to authenticated;

drop policy if exists "clients_write_admin_almacen" on public.clients;
drop policy if exists "clients_insert_admin_almacen" on public.clients;
drop policy if exists "clients_update_admin_almacen" on public.clients;
drop policy if exists "clients_insert_admin_enlace" on public.clients;
drop policy if exists "clients_update_admin_enlace" on public.clients;
drop policy if exists "clients_delete_admin" on public.clients;

create policy "clients_insert_admin_enlace" on public.clients
for insert to authenticated
with check ((select private.current_user_role()) in ('ADMIN', 'ENLACE'));

create policy "clients_update_admin_enlace" on public.clients
for update to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'ENLACE'))
with check ((select private.current_user_role()) in ('ADMIN', 'ENLACE'));

create policy "clients_delete_admin" on public.clients
for delete to authenticated
using ((select private.current_user_role()) = 'ADMIN');
