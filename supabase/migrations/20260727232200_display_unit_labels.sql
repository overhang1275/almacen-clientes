create or replace function public.assign_material_to_op(
  p_material_id uuid,
  p_production_order_id uuid,
  p_quantity numeric
)
returns table(allocation_id uuid, remaining_stock numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
  v_user_id uuid := auth.uid();
  v_order_client_id uuid;
  v_material_client_id uuid;
  v_quality_status public.quality_status;
  v_stock numeric(14, 3);
  v_stock_unit public.stock_unit;
  v_stock_unit_label text;
  v_allocation_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select role into v_role
  from public.profiles
  where id = v_user_id;

  if v_role not in ('ADMIN', 'ENLACE') then
    raise exception 'forbidden';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be positive';
  end if;

  select client_id
  into v_order_client_id
  from public.production_orders
  where id = p_production_order_id
  for update;

  if v_order_client_id is null then
    raise exception 'production order not found';
  end if;

  select client_id, quality_status, current_stock, stock_unit
  into v_material_client_id, v_quality_status, v_stock, v_stock_unit
  from public.materials
  where id = p_material_id
  for update;

  if v_material_client_id is null then
    raise exception 'material not found';
  end if;

  if v_material_client_id <> v_order_client_id then
    raise exception 'material belongs to another client';
  end if;

  if v_quality_status <> 'APPROVED' then
    raise exception 'material must be APPROVED before allocation';
  end if;

  v_stock_unit_label := case v_stock_unit when 'MT' then 'm.l.' when 'PCS' then 'pza.' else v_stock_unit::text end;

  if v_stock < p_quantity then
    raise exception 'Stock insuficiente: solo quedan % %', v_stock, v_stock_unit_label;
  end if;

  update public.materials
  set current_stock = current_stock - p_quantity
  where id = p_material_id;

  insert into public.allocations (material_id, production_order_id, quantity, stock_unit, created_by)
  values (p_material_id, p_production_order_id, p_quantity, v_stock_unit, v_user_id)
  returning id into v_allocation_id;

  insert into public.inventory_movements (
    material_id,
    production_order_id,
    allocation_id,
    movement_type,
    quantity,
    stock_unit,
    note,
    created_by
  )
  values (
    p_material_id,
    p_production_order_id,
    v_allocation_id,
    'ALLOCATED',
    p_quantity,
    v_stock_unit,
    'Asignado a OP',
    v_user_id
  );

  update public.production_orders
  set status = 'ALLOCATED'
  where id = p_production_order_id and status = 'PENDING';

  return query select v_allocation_id, v_stock - p_quantity;
end;
$$;

revoke execute on function public.assign_material_to_op(uuid, uuid, numeric) from public, anon;
grant execute on function public.assign_material_to_op(uuid, uuid, numeric) to authenticated;
