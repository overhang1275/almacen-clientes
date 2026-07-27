# Roadmap

Sistema de inventario en consignacion para materiales de clientes externos.
No maneja precios, costos ni valor contable.

## Sprint 0 - Base del Proyecto

**Objetivo:** dejar una base ejecutable sin sobredisenar.

- Crear app Next.js con App Router, TypeScript y Tailwind.
- Conectar Supabase con variables de entorno.
- Definir layout base por roles: `ALMACEN`, `ENLACE`, `CALIDAD`, `ADMIN`.
- Crear README con comandos locales.

**Listo cuando:** la app arranca, lee sesion de Supabase y muestra navegacion por rol.

## Sprint 1 - Auth y Roles

**Objetivo:** que cada area vea solo lo que necesita.

- Usar Supabase Auth.
- Crear tabla `profiles` con `role`.
- Aplicar RLS basica por rol.
- Bloquear vistas no autorizadas desde Server Components o Server Actions.

**Justificacion:** almacen, enlace y calidad tienen responsabilidades distintas; mezclar permisos permite asignaciones o rechazos indebidos.

**Listo cuando:** un usuario sin rol correcto no puede entrar ni consultar datos restringidos.

## Sprint 2 - Modelo de Datos

**Objetivo:** representar stock fisico, ubicacion y trazabilidad sin contabilidad.

- Crear tablas: `clients`, `material_categories`, `materials`, `production_orders`, `allocations`, `inventory_movements`.
- Guardar familia de material: `BOBINA` o `PLIEGO`.
- Guardar unidad principal interna: `MT` o `PCS`; mostrar `m.l.` o `pza.` en la UI.
- Guardar atributos fisicos en columnas simples suficientes para MVP.
- Prohibir campos monetarios.
- Crear bitacora `inventory_movements` como append-only.

**Justificacion:** el negocio controla materiales ajenos; solo importan cantidades, ubicacion, estado de calidad y movimientos.

**Listo cuando:** la base permite registrar entrada, aprobar/rechazar, crear OP y consultar movimientos.

## Sprint 3 - Almacen

**Objetivo:** registrar entradas rapido desde piso.

- Formulario de entrada por cliente, categoria, familia y ubicacion.
- Campos dinamicos para bobinas y pliegos.
- Estado inicial `PENDIENTE`.
- Crear movimiento `INBOUND`.
- Vista de inventario filtrable por cliente, categoria, estado y ubicacion.

**Justificacion:** almacen hoy captura en libreta; el primer ahorro real es entrada y visibilidad central.

**Listo cuando:** almacen registra material y calidad lo ve como pendiente.

## Sprint 4 - Calidad

**Objetivo:** inmovilizar material no apto.

- Vista de materiales `PENDIENTE`.
- Accion aprobar/rechazar con observacion.
- Rechazado queda no asignable.
- Crear movimiento `QUALITY_APPROVED` o `QUALITY_REJECTED`.

**Justificacion:** una linea roja dice que material rechazado no puede asignarse aunque tenga stock.

**Listo cuando:** enlace solo ve material aprobado y disponible.

## Sprint 5 - Enlace y OP

**Objetivo:** crear OP y asignar stock sin sobreventa.

- CRUD minimo de ordenes de produccion.
- Busqueda de material aprobado por cliente.
- Funcion PostgreSQL transaccional `assign_material_to_op`.
- Validar `current_stock >= quantity`.
- Descontar stock, crear `allocation` y crear movimiento `ALLOCATED` en la misma transaccion.

**Justificacion:** dos usuarios pueden intentar asignar el mismo saldo; la validacion debe vivir en la base, no solo en la UI.

**Listo cuando:** dos asignaciones simultaneas no pueden dejar stock negativo.

## Sprint 6 - Auditoria y Operacion

**Objetivo:** hacer rastreable cada decision importante.

- Vista de bitacora por material, cliente y OP.
- Vista de asignaciones por OP.
- Ajuste manual controlado por admin o almacen autorizado.
- Export CSV de inventario fisico.

**Justificacion:** documentos de seguridad requieren saber quien movio que, cuando y por que.

**Listo cuando:** se puede reconstruir la historia de un material desde entrada hasta asignacion.

## Sprint 7 - Pulido y Despliegue

**Objetivo:** dejarlo usable en tablets/PCs de planta.

- Mejorar estados vacios, carga y errores.
- Agregar microinteracciones solo donde confirmen acciones criticas.
- Dockerfile o despliegue Vercel.
- Checklist de respaldo de Supabase.

**Justificacion:** operarios necesitan velocidad y claridad; animacion decorativa queda fuera del MVP.

**Listo cuando:** hay build reproducible y flujo completo probado.

## Decisiones Pendientes

- Unidad secundaria: mostrar kg solo como referencia, no convertir automaticamente.
- Devoluciones: registrar como movimiento `RETURNED_FROM_OP` que incrementa stock.
- Rechazo tardio: bloquear si ya tiene asignaciones activas; resolver manualmente con admin.
- Codigo de barras: posponer hasta confirmar lectores fisicos.
