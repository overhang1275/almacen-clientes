# Sprint 6 - Resultados

## Datos de prueba

- Seed ejecutable: `npm run seed`.
- Clientes: 5.
- Materiales: 20.
- OP: 10.
- Movimientos esperados: INBOUND por trigger, QUALITY_APPROVED/QUALITY_REJECTED y ALLOCATED.

## Validaciones automatizadas ejecutadas

- `npm run seed`: OK, ejecutado dos veces para confirmar idempotencia.
- `npm run validate:functional`: valida conteos, stock no negativo, no asignacion de rechazados y bloqueo por stock insuficiente.

```sql
clients: 5
materials: 20
orders: 10
allocations: 20
negative_stock: 0
allocated_non_approved: 0
INBOUND: 20
ALLOCATED: 20
QUALITY_APPROVED: 12
QUALITY_REJECTED: 3
```

## Observaciones

- `validate:functional` simula el caso critico de stock insuficiente dentro de una transaccion con `ROLLBACK`.
- El warning de Supabase Advisors sobre `assign_material_to_op` es esperado: la funcion es `SECURITY DEFINER`, valida `auth.uid()` y rol internamente, y existe para evitar sobreventa.
