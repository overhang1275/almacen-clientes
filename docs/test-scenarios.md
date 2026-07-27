# Sprint 6 - Escenarios de prueba

## Preparacion

1. Ejecutar `npm run seed`.
2. Iniciar la app con `npm run dev`.
3. Iniciar sesion con un usuario `ADMIN` o con usuarios reales por rol.

## Escenario 1: Flujo completo de bobina

1. En Almacen, registrar una bobina para Banco Central.
2. En Calidad, aprobarla desde `/calidad/pendientes`.
3. En Enlace, crear una OP para Banco Central.
4. Asignar 300 m.l. de la bobina.
5. Validar que el stock baja, aparece `ALLOCATED` y la OP muestra la asignacion.

## Escenario 2: Rechazo de pliego

1. En Almacen, registrar un pliego para Gobierno del Estado Norte.
2. En Calidad, rechazarlo con observacion `Medidas incorrectas`.
3. Validar en Inventario que queda `REJECTED`.
4. Validar en Enlace que no aparece como material asignable.

## Escenario 3: Concurrencia

1. Usar una bobina aprobada con stock disponible.
2. Ejecutar dos asignaciones simultaneas que juntas excedan el stock.
3. Validar que una asignacion falla con `Stock insuficiente`.

## Escenario 4: OP y descuento de stock

1. Crear una OP para Corporacion XYZ Seguridad.
2. Asignar 200 m.l. de una bobina `APPROVED`.
3. Validar que se crea `allocations`, `inventory_movements.ALLOCATED` y baja `materials.current_stock`.

## Escenario 5: Permisos por rol

1. Entrar con usuario `ALMACEN`.
2. Intentar abrir `/calidad/pendientes`.
3. Validar bloqueo por rol.

## UI/UX

- Probar `/almacen/inventario`, `/calidad/pendientes`, `/enlace/ordenes`, `/enlace/clientes` en ancho tablet.
- Probar TAB, Enter y Escape en modales.
- Revisar contraste con Lighthouse o DevTools.
