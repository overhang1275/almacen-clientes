# Sprint 7 - UI/UX audit

## Ajustes aplicados

- Area tactil minima de 44 px para botones, inputs, selects y textareas.
- Foco visible consistente para teclado.
- Zebra rows global para tablas.
- Paginacion server-side en Inventario, OP, Clientes y Pendientes de Calidad.
- Toast cerrable y con autocierre.
- Modales de OP, Cliente y Rechazo con boton X; dialogos nativos cierran con Escape.
- Navegacion por rol colapsable en pantallas pequenas y persistida en `localStorage`.

## Decisiones

- No se agrego sidebar paralelo: la app ya usa navegacion superior por rol. Se hizo colapsable para tablet/movil.
- No se agrego debounce cliente: los filtros actuales usan query params y submit explicito, sin llamadas por tecla.
- No se convirtieron tablas a cards moviles: el scroll horizontal queda como fallback simple para planta/tablet.

## Pendiente manual

- Lighthouse/axe en desktop, tablet y movil.
- Validacion visual con usuarios de planta.
