alter table public.materials
add column if not exists grammage_gsm numeric(8, 2),
add column if not exists thickness_microns numeric(8, 2);

insert into public.material_categories (name, description)
values
  ('Etiqueta Autoadherible', 'Etiqueta autoadherible para producto o identificacion'),
  ('Etiqueta de Seguridad', 'Etiqueta con medidas de seguridad'),
  ('RFID', 'Etiqueta o inlay RFID'),
  ('Tamper Evident', 'Sello de evidencia contra manipulacion'),
  ('Manga Termoencogible', 'Manga termoencogible para envase'),
  ('Empaque', 'Material para empaque'),
  ('Lona', 'Material flexible para gran formato'),
  ('Vinil', 'Vinil para rotulacion o gran formato'),
  ('Canvas', 'Canvas para cuadros o decoracion'),
  ('PVC', 'Sustrato PVC para identificaciones o tarjetas')
on conflict (name) do update
set description = excluded.description;

