# Arquitectura

## Base de Datos

El sistema administra materiales en consignacion: stock fisico, ubicacion, calidad y trazabilidad. No hay campos de precio, costo, valor unitario ni valor total.

Tablas principales:

- `clients`: clientes externos duenos del material.
- `material_categories`: catalogo de categorias de seguridad.
- `materials`: stock fisico por cliente, categoria, ubicacion y estado de calidad.
- `production_orders`: ordenes de produccion de Enlace.
- `allocations`: asignaciones de stock a OP.
- `inventory_movements`: bitacora append-only de entradas, asignaciones, ajustes, devoluciones y cambios de calidad.

Reglas importantes:

- `materials.material_type` define `BOBINA` o `PLIEGO`.
- `materials.stock_unit` define `MT` o `PCS` internamente; la UI muestra `m.l.` para metros lineales y `pza.` para piezas.
- Bobina calcula metros lineales automaticamente desde peso+gramaje+ancho o desde diametros+espesor; pliego exige piezas y largo/ancho.
- `grammage_gsm` y `thickness_microns` guardan ficha tecnica opcional para papel, sinteticos, etiquetas, mangas y gran formato.
- `inventory_movements` bloquea `UPDATE` y `DELETE` con trigger.
- RLS usa `private.current_user_role()` y la tabla `profiles`.

Permisos por rol:

- `ADMIN`: acceso operativo total.
- `ALMACEN`: clientes, materiales y movimientos.
- `ENLACE`: OP y asignaciones.
- `CALIDAD`: lectura operativa y cambios de calidad en materiales.
