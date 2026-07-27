begin;

do $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id
  from public.profiles
  where role = 'ADMIN'
  limit 1;

  if v_admin_id is null then
    raise exception 'No ADMIN profile found for functional validation';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
end $$;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.clients
  where tax_id in ('BCM260101AB1','GEM260101CD2','CXY260101EF3','FDS260101GH4','UNV260101IJ5');
  if v_count <> 5 then raise exception 'Expected 5 seed clients, got %', v_count; end if;

  select count(*) into v_count from public.materials where batch_number like 'CF-SEED-%';
  if v_count <> 20 then raise exception 'Expected 20 seed materials, got %', v_count; end if;

  select count(*) into v_count from public.production_orders where op_number like 'CF-OP-%';
  if v_count <> 10 then raise exception 'Expected 10 seed orders, got %', v_count; end if;

  select count(*) into v_count
  from public.allocations
  where production_order_id in (select id from public.production_orders where op_number like 'CF-OP-%');
  if v_count <> 20 then raise exception 'Expected 20 seed allocations, got %', v_count; end if;

  select count(*) into v_count from public.materials where batch_number like 'CF-SEED-%' and current_stock < 0;
  if v_count <> 0 then raise exception 'Seed has negative stock rows: %', v_count; end if;

  select count(*) into v_count
  from public.allocations a
  join public.materials m on m.id = a.material_id
  where a.production_order_id in (select id from public.production_orders where op_number like 'CF-OP-%')
    and m.quality_status <> 'APPROVED';
  if v_count <> 0 then raise exception 'Seed allocated non-approved material rows: %', v_count; end if;
end $$;

do $$
declare
  v_material_id uuid;
  v_order_id uuid;
  v_before numeric;
  v_failed boolean := false;
begin
  select id, current_stock
  into v_material_id, v_before
  from public.materials
  where batch_number = 'CF-SEED-BOB-011'
  for update;

  select id into v_order_id
  from public.production_orders
  where op_number = 'CF-OP-002';

  perform * from public.assign_material_to_op(v_material_id, v_order_id, 60);

  begin
    perform * from public.assign_material_to_op(v_material_id, v_order_id, v_before);
  exception when others then
    v_failed := sqlerrm like 'Stock insuficiente:%';
  end;

  if not v_failed then
    raise exception 'Expected second allocation to fail with insufficient stock';
  end if;
end $$;

rollback;
