begin;

alter table public.inventory_movements disable trigger inventory_movements_no_delete;

delete from public.inventory_movements
where material_id in (select id from public.materials where batch_number like 'CF-SEED-%')
   or production_order_id in (select id from public.production_orders where op_number like 'CF-OP-%');

delete from public.allocations
where material_id in (select id from public.materials where batch_number like 'CF-SEED-%')
   or production_order_id in (select id from public.production_orders where op_number like 'CF-OP-%');

delete from public.production_orders where op_number like 'CF-OP-%';
delete from public.materials where batch_number like 'CF-SEED-%';
delete from public.clients where tax_id in ('BCM260101AB1', 'GEM260101CD2', 'CXY260101EF3', 'FDS260101GH4', 'UNV260101IJ5');

insert into public.clients (name, tax_id, address, contact_phone, contact_email)
values
  ('Banco Central de Mexico', 'BCM260101AB1', 'Av. Cinco de Mayo 2, Centro Historico, CDMX', '5550101000', 'compras@bancocentral.test'),
  ('Gobierno del Estado Norte', 'GEM260101CD2', 'Palacio de Gobierno s/n, Centro, Monterrey', '8180102000', 'materiales@gobierno-norte.test'),
  ('Corporacion XYZ Seguridad', 'CXY260101EF3', 'Blvd. Industrial 450, Queretaro', '4420103000', 'planeacion@xyz.test'),
  ('Financiera del Sur', 'FDS260101GH4', 'Av. Reforma 1200, Puebla', '2220104000', 'operaciones@financierasur.test'),
  ('Universidad Nacional del Valle', 'UNV260101IJ5', 'Circuito Universitario 77, Toluca', '7220105000', 'almacen@unv.test');

insert into public.material_categories (name, description)
values
  ('Papel Bond', 'Papel bond de seguridad'),
  ('Papel Segma', 'Papel Segma'),
  ('Sustrato Sintetico', 'Sustrato sintetico'),
  ('Holograma', 'Hologramas de seguridad'),
  ('Foil', 'Foil de seguridad'),
  ('Poliester', 'Poliester')
on conflict (name) do update set description = excluded.description;

insert into public.materials (
  client_id, category_id, material_type, width_cm, diameter_cm, core_diameter_cm,
  length_mt, length_cm, pieces_qty, batch_number, quality_status, location_rack,
  current_stock, stock_unit, grammage_gsm, thickness_microns, weight_kg, note
)
values
  ((select id from public.clients where tax_id='BCM260101AB1'), (select id from public.material_categories where name='Papel Bond'), 'BOBINA', 90, 120, 7.6, 1000, null, null, 'CF-SEED-BOB-001', 'APPROVED', 'Rack A-1', 1000, 'MT', 90, null, 480, 'Seed bobina Banco Central'),
  ((select id from public.clients where tax_id='BCM260101AB1'), (select id from public.material_categories where name='Papel Segma'), 'BOBINA', 82, 115, 7.6, 850, null, null, 'CF-SEED-BOB-002', 'PENDING', 'Rack A-2', 850, 'MT', 75, null, 390, 'Seed pendiente calidad'),
  ((select id from public.clients where tax_id='GEM260101CD2'), (select id from public.material_categories where name='Sustrato Sintetico'), 'PLIEGO', 70, null, null, null, 100, 500, 'CF-SEED-PLG-003', 'REJECTED', 'Rack B-1', 500, 'PCS', null, 250, null, 'Medidas incorrectas'),
  ((select id from public.clients where tax_id='GEM260101CD2'), (select id from public.material_categories where name='Holograma'), 'BOBINA', 50, 80, 7.6, 300, null, null, 'CF-SEED-BOB-004', 'APPROVED', 'Rack B-3', 300, 'MT', null, 60, 120, 'Holograma aprobado'),
  ((select id from public.clients where tax_id='CXY260101EF3'), (select id from public.material_categories where name='Papel Bond'), 'BOBINA', 100, 130, 7.6, 1200, null, null, 'CF-SEED-BOB-005', 'APPROVED', 'Pasillo 2', 1200, 'MT', 120, null, 620, null),
  ((select id from public.clients where tax_id='CXY260101EF3'), (select id from public.material_categories where name='Foil'), 'BOBINA', 32, 65, 7.6, 400, null, null, 'CF-SEED-BOB-006', 'PENDING', 'Rack C-1', 400, 'MT', null, 35, 70, null),
  ((select id from public.clients where tax_id='FDS260101GH4'), (select id from public.material_categories where name='Poliester'), 'PLIEGO', 60, null, null, null, 90, 1200, 'CF-SEED-PLG-007', 'APPROVED', 'Rack C-4', 1200, 'PCS', null, 180, null, null),
  ((select id from public.clients where tax_id='FDS260101GH4'), (select id from public.material_categories where name='Papel Segma'), 'BOBINA', 76, 110, 7.6, 950, null, null, 'CF-SEED-BOB-008', 'APPROVED', 'Rack D-1', 950, 'MT', 80, null, 410, null),
  ((select id from public.clients where tax_id='UNV260101IJ5'), (select id from public.material_categories where name='Sustrato Sintetico'), 'PLIEGO', 50, null, null, null, 70, 800, 'CF-SEED-PLG-009', 'PENDING', 'Pasillo 3', 800, 'PCS', null, 220, null, null),
  ((select id from public.clients where tax_id='UNV260101IJ5'), (select id from public.material_categories where name='Papel Bond'), 'BOBINA', 91, 118, 7.6, 700, null, null, 'CF-SEED-BOB-010', 'REJECTED', 'Rack A-5', 700, 'MT', 90, null, 330, 'Manchas de humedad'),
  ((select id from public.clients where tax_id='BCM260101AB1'), (select id from public.material_categories where name='Foil'), 'BOBINA', 30, 60, 7.6, 250, null, null, 'CF-SEED-BOB-011', 'APPROVED', 'Rack E-1', 250, 'MT', null, 30, 55, null),
  ((select id from public.clients where tax_id='GEM260101CD2'), (select id from public.material_categories where name='Papel Bond'), 'PLIEGO', 57, null, null, null, 87, 2000, 'CF-SEED-PLG-012', 'APPROVED', 'Rack E-3', 2000, 'PCS', 90, null, null, null),
  ((select id from public.clients where tax_id='CXY260101EF3'), (select id from public.material_categories where name='Poliester'), 'PLIEGO', 64, null, null, null, 92, 1500, 'CF-SEED-PLG-013', 'APPROVED', 'Rack F-1', 1500, 'PCS', null, 200, null, null),
  ((select id from public.clients where tax_id='FDS260101GH4'), (select id from public.material_categories where name='Holograma'), 'BOBINA', 45, 75, 7.6, 500, null, null, 'CF-SEED-BOB-014', 'PENDING', 'Rack F-2', 500, 'MT', null, 50, 100, null),
  ((select id from public.clients where tax_id='UNV260101IJ5'), (select id from public.material_categories where name='Papel Segma'), 'BOBINA', 80, 105, 7.6, 600, null, null, 'CF-SEED-BOB-015', 'APPROVED', 'Rack G-1', 600, 'MT', 75, null, 260, null),
  ((select id from public.clients where tax_id='BCM260101AB1'), (select id from public.material_categories where name='Sustrato Sintetico'), 'PLIEGO', 66, null, null, null, 96, 900, 'CF-SEED-PLG-016', 'PENDING', 'Pasillo 4', 900, 'PCS', null, 240, null, null),
  ((select id from public.clients where tax_id='GEM260101CD2'), (select id from public.material_categories where name='Foil'), 'BOBINA', 28, 55, 7.6, 180, null, null, 'CF-SEED-BOB-017', 'APPROVED', 'Rack H-1', 180, 'MT', null, 25, 40, null),
  ((select id from public.clients where tax_id='CXY260101EF3'), (select id from public.material_categories where name='Holograma'), 'BOBINA', 48, 88, 7.6, 520, null, null, 'CF-SEED-BOB-018', 'REJECTED', 'Rack H-2', 520, 'MT', null, 55, 115, 'Desprendimiento de capa'),
  ((select id from public.clients where tax_id='FDS260101GH4'), (select id from public.material_categories where name='Sustrato Sintetico'), 'PLIEGO', 72, null, null, null, 102, 650, 'CF-SEED-PLG-019', 'APPROVED', 'Rack I-1', 650, 'PCS', null, 260, null, null),
  ((select id from public.clients where tax_id='UNV260101IJ5'), (select id from public.material_categories where name='Poliester'), 'PLIEGO', 58, null, null, null, 88, 1100, 'CF-SEED-PLG-020', 'APPROVED', 'Rack I-3', 1100, 'PCS', null, 190, null, null);

insert into public.production_orders (client_id, op_number, description, due_date, status)
values
  ((select id from public.clients where tax_id='BCM260101AB1'), 'CF-OP-001', 'Credenciales bancarias serie A', current_date + 7, 'ALLOCATED'),
  ((select id from public.clients where tax_id='BCM260101AB1'), 'CF-OP-002', 'Formas valor lote 2026', current_date + 14, 'PENDING'),
  ((select id from public.clients where tax_id='GEM260101CD2'), 'CF-OP-003', 'Tarjetones oficiales norte', current_date + 10, 'ALLOCATED'),
  ((select id from public.clients where tax_id='GEM260101CD2'), 'CF-OP-004', 'Hologramas para permisos', current_date + 20, 'PENDING'),
  ((select id from public.clients where tax_id='CXY260101EF3'), 'CF-OP-005', 'Etiquetas de seguridad XYZ', current_date + 8, 'ALLOCATED'),
  ((select id from public.clients where tax_id='CXY260101EF3'), 'CF-OP-006', 'Tarjetas plastificadas XYZ', current_date + 18, 'PENDING'),
  ((select id from public.clients where tax_id='FDS260101GH4'), 'CF-OP-007', 'Contratos foliados sur', current_date + 11, 'ALLOCATED'),
  ((select id from public.clients where tax_id='FDS260101GH4'), 'CF-OP-008', 'Sellos holograficos sur', current_date + 21, 'PENDING'),
  ((select id from public.clients where tax_id='UNV260101IJ5'), 'CF-OP-009', 'Credenciales universitarias', current_date + 9, 'ALLOCATED'),
  ((select id from public.clients where tax_id='UNV260101IJ5'), 'CF-OP-010', 'Constancias con seguridad', current_date + 25, 'PENDING');

insert into public.inventory_movements (material_id, movement_type, quantity, stock_unit, note)
select id,
  case quality_status
    when 'APPROVED' then 'QUALITY_APPROVED'::public.movement_type
    when 'REJECTED' then 'QUALITY_REJECTED'::public.movement_type
  end,
  current_stock,
  stock_unit,
  case quality_status when 'APPROVED' then 'OK' else coalesce(note, 'Rechazado por Calidad') end
from public.materials
where batch_number like 'CF-SEED-%'
  and quality_status in ('APPROVED', 'REJECTED');

insert into public.allocations (material_id, production_order_id, quantity, stock_unit)
values
  ((select id from public.materials where batch_number='CF-SEED-BOB-001'), (select id from public.production_orders where op_number='CF-OP-001'), 300, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-001'), (select id from public.production_orders where op_number='CF-OP-002'), 120, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-004'), (select id from public.production_orders where op_number='CF-OP-003'), 80, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-005'), (select id from public.production_orders where op_number='CF-OP-005'), 200, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-007'), (select id from public.production_orders where op_number='CF-OP-007'), 250, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-008'), (select id from public.production_orders where op_number='CF-OP-007'), 180, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-012'), (select id from public.production_orders where op_number='CF-OP-003'), 400, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-013'), (select id from public.production_orders where op_number='CF-OP-005'), 300, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-015'), (select id from public.production_orders where op_number='CF-OP-009'), 160, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-020'), (select id from public.production_orders where op_number='CF-OP-009'), 220, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-011'), (select id from public.production_orders where op_number='CF-OP-001'), 30, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-017'), (select id from public.production_orders where op_number='CF-OP-004'), 20, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-019'), (select id from public.production_orders where op_number='CF-OP-008'), 70, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-004'), (select id from public.production_orders where op_number='CF-OP-004'), 50, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-005'), (select id from public.production_orders where op_number='CF-OP-006'), 200, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-007'), (select id from public.production_orders where op_number='CF-OP-008'), 100, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-008'), (select id from public.production_orders where op_number='CF-OP-008'), 70, 'MT'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-012'), (select id from public.production_orders where op_number='CF-OP-004'), 200, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-PLG-013'), (select id from public.production_orders where op_number='CF-OP-006'), 150, 'PCS'),
  ((select id from public.materials where batch_number='CF-SEED-BOB-015'), (select id from public.production_orders where op_number='CF-OP-010'), 60, 'MT');

insert into public.inventory_movements (material_id, production_order_id, allocation_id, movement_type, quantity, stock_unit, note)
select material_id, production_order_id, id, 'ALLOCATED', quantity, stock_unit, 'Seed asignacion a OP'
from public.allocations
where production_order_id in (select id from public.production_orders where op_number like 'CF-OP-%');

update public.materials m
set current_stock = current_stock - used.quantity
from (
  select material_id, sum(quantity) as quantity
  from public.allocations
  where material_id in (select id from public.materials where batch_number like 'CF-SEED-%')
  group by material_id
) used
where m.id = used.material_id;

update public.production_orders o
set status = 'ALLOCATED'
where exists (
  select 1
  from public.allocations a
  where a.production_order_id = o.id
);

alter table public.inventory_movements enable trigger inventory_movements_no_delete;

commit;
