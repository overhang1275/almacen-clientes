create index if not exists materials_pending_quality_idx
on public.materials(created_at)
where quality_status = 'PENDING';

create index if not exists inventory_movements_quality_audit_idx
on public.inventory_movements(created_at desc)
where movement_type in ('QUALITY_APPROVED', 'QUALITY_REJECTED');

revoke update on public.materials from authenticated;
grant update (quality_status) on public.materials to authenticated;

drop policy if exists "materials_update_almacen_calidad" on public.materials;
create policy "materials_update_calidad" on public.materials
for update to authenticated
using ((select private.current_user_role()) in ('ADMIN', 'CALIDAD'))
with check ((select private.current_user_role()) in ('ADMIN', 'CALIDAD'));

drop view if exists public.approved_materials_for_allocation;
create view public.approved_materials_for_allocation
with (security_invoker = true)
as
select *
from public.materials
where quality_status = 'APPROVED'
  and current_stock > 0;

grant select on public.approved_materials_for_allocation to authenticated;

create or replace function private.block_non_approved_allocations()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  material_status public.quality_status;
begin
  select quality_status
  into material_status
  from public.materials
  where id = new.material_id;

  if material_status is distinct from 'APPROVED' then
    raise exception 'material must be APPROVED before allocation';
  end if;

  return new;
end;
$$;

revoke execute on function private.block_non_approved_allocations() from public, anon, authenticated;

drop trigger if exists allocations_require_approved_material on public.allocations;
create trigger allocations_require_approved_material
before insert or update of material_id on public.allocations
for each row execute function private.block_non_approved_allocations();
