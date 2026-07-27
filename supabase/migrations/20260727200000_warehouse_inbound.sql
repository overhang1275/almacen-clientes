alter table public.materials
add column if not exists note text;

create index if not exists materials_location_idx on public.materials(location_rack);
create index if not exists materials_category_status_idx on public.materials(category_id, quality_status);

create or replace function private.materials_set_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by = auth.uid();
  end if;
  return new;
end;
$$;

revoke execute on function private.materials_set_created_by() from public, anon, authenticated;

drop trigger if exists materials_set_created_by on public.materials;
create trigger materials_set_created_by
before insert on public.materials
for each row execute function private.materials_set_created_by();

create or replace function private.materials_create_inbound_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory_movements (
    material_id,
    movement_type,
    quantity,
    stock_unit,
    note,
    created_by
  )
  values (
    new.id,
    'INBOUND',
    new.current_stock,
    new.stock_unit,
    new.note,
    coalesce(new.created_by, auth.uid())
  );
  return new;
end;
$$;

revoke execute on function private.materials_create_inbound_movement() from public, anon, authenticated;

drop trigger if exists materials_create_inbound_movement on public.materials;
create trigger materials_create_inbound_movement
after insert on public.materials
for each row execute function private.materials_create_inbound_movement();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'materials'
  ) then
    alter publication supabase_realtime add table public.materials;
  end if;
end $$;

