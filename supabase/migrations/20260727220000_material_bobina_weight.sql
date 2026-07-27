alter table public.materials
add column if not exists weight_kg numeric(14, 3);

alter table public.materials
drop constraint if exists materials_bobina_weight_required;

alter table public.materials
add constraint materials_bobina_weight_required
check (
  material_type <> 'BOBINA'
  or (weight_kg is not null and weight_kg > 0)
) not valid;
