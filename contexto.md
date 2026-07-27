# 🏗️ PROYECTO: SISTEMA DE INVENTARIO PARA IMPRENTA DE DOCUMENTOS DE SEGURIDAD

**Versión del Contexto:** 2.1  
**Fecha:** 2026-07-27  
**Estado:** Fase de Descubrimiento y Definición (pre-codificación)

---

## 👥 CONSEJO ASESOR TÉCNICO Y DE PRODUCTO (TAUXB)

Actúa como un **Consejo Asesor Técnico y de Producto (TAUXB)** compuesto por 5 roles sénior que VAN A ESCRIBIR CÓDIGO REAL y funcional. Los roles son:

1. **Arquitecto de Software Sénior**: Diseña la estructura hexagonal (carpetas `domain`, `application`, `infrastructure`, `interfaces`) para aislar la lógica de negocio de la infraestructura.
2. **Lead Full-Stack Sénior**: Codifica el backend (Node.js + Express/Fastify o Python + FastAPI) y la capa de servicios.
3. **Product Tech Designer**: Traduce los procesos de almacén, enlace y calidad en endpoints y flujos de UI concretos.
4. **Delivery & SRE Manager**: Genera los archivos de despliegue (Docker, docker-compose, CI/CD básico) y scripting de respaldo.
5. **UI/UX & Frontend Architecture Lead**: Construye el frontend (React con Vite o Next.js) con componentes accesibles, manejo de estados complejos (Zustand/Redux Toolkit) y diseño mobile-first para tablets/PCs de planta.

---

## 📋 1. CONTEXTO DEL NEGOCIO Y PROBLEMA RAÍZ

### 1.1. La Empresa
Impronta especializada en **documentos de alta seguridad**: papel moneda, cheques, certificados, valores, etiquetas fiscales, etc.

### 1.2. El Problema Central
Los **clientes externos** (bancos, gobiernos, grandes corporaciones) envían a la imprenta sus **propios insumos especiales** para que la imprenta los transforme en productos terminados:

- Papeles con marcas de agua y fibras de seguridad.
- Sustratos sintéticos.
- Hologramas y foils de seguridad.
- Bobinas de papel bond, segma, y otros papeles de seguridad.

**La restricción crítica**: Estos materiales **NO son propiedad de la imprenta, son del cliente**. Por lo tanto:

- ❌ **NO pueden ingresar al ERP contable** de la imprenta.
- ✅ **Deben manejarse en un sistema paralelo** que solo controle cantidades físicas, ubicaciones y trazabilidad, sin ningún valor monetario asociado.

### 1.3. La Solución Soñada
Un **Sistema de Control de Inventarios de Materiales en Consignación** que funcione como un "guardamuebles digital" de materiales ajenos, donde solo se gestione:

- Cantidad física (metros lineales, kg, piezas).
- Ubicación dentro de la bodega.
- Trazabilidad completa (quién, cuándo, qué movimiento).
- Asignación a Órdenes de Producción (OP).
- Auditoría por el área de Calidad.

---

## 🏢 2. ÁREAS OPERATIVAS Y ROLES DE USUARIO

| Rol | Responsabilidades | Dolores actuales | Necesidades en el nuevo sistema |
| :--- | :--- | :--- | :--- |
| **ALMACÉN** | Recibir, medir, pesar, almacenar y despachar material físico. | Apuntan en libretas físicas. No hay visibilidad centralizada. | Registrar entradas rápido (con campos según tipo de material), etiquetar ubicación, ejecutar salidas físicas validadas. |
| **ENLACE** (Planeación) | Crear Órdenes de Producción (OP) y asegurar que hay material disponible. | Llaman por teléfono a bodega para preguntar stock. No ven disponibilidad en tiempo real. | Crear OP, consultar stock en vivo por cliente/tipo, y "asignar" material a OP sin ir a bodega. |
| **CALIDAD** | Inspeccionar el material que llega y decidir si es apto. | No tienen visibilidad de lo pendiente. El material rechazado queda olvidado. | Visualizar material "Pendiente", cambiar estado a APROBADO/RECHAZADO, dejar observaciones. El rechazado debe inmovilizarse. |
| **ADMIN** | Gestionar usuarios, catálogos y visibilidad global. | No tienen datos consolidados de material de clientes. | Dashboards, gestión de usuarios y catálogos (clientes, tipos de material). |

---

## 📦 3. TIPOS DE MATERIALES Y UNIDADES DE MEDIDA

El operario de almacén maneja **dos familias principales** de materiales, cada una con atributos y unidades de medida diferentes. El sistema debe **mostrar campos dinámicos** según el tipo seleccionado:

### 3.1. BOBINAS (Rollos)
- **Unidad principal**: Metros lineales (MT).
- **Atributos físicos**:
  - Ancho (cm).
  - Diámetro externo (cm).
  - Diámetro del núcleo (cm).
  - Metros lineales totales estimados.
  - Peso (kg) - opcional, solo referencia.

### 3.2. PLIEGOS (Hojas sueltas)
- **Unidad principal**: Piezas (PCS) o Unidades.
- **Atributos físicos**:
  - Largo (cm) x Ancho (cm).
  - Gramaje (g/m²).
  - Cantidad de piezas.

### 3.3. Categorías de Seguridad (Catálogo dinámico)
- Papel Bond.
- Papel Segma.
- Sustrato Sintético.
- Holograma.
- Foil.
- Poliéster.
- Otros (campo abierto para futuras categorías).

### 3.4. Regla de Oro de Asignación
Un mismo material (ej. Bobina #123 de 1000 MT) puede asignarse **parcialmente** a varias OP:

- 300 MT → OP-001.
- 400 MT → OP-002.
- Quedan 300 MT disponibles.

El sistema debe **validar** que no se asigne más de lo que hay en `current_stock`.

---

## 🔄 4. FLUJO DE TRABAJO COMPLETO (EL "CORE")

### 4.1. Entrada de Material (ALMACÉN)
1. Seleccionar **Cliente** (dueño del material).
2. Seleccionar **Categoría** (Bond, Segma, etc.).
3. Elegir **Tipo** (Bobina / Pliego) → El formulario muestra los campos específicos de esa familia.
4. Rellenar medidas y cantidad.
5. Asignar **Ubicación** física (ej. "Rack A-3, Estante 2").
6. Estado inicial: `PENDIENTE` (esperando auditoría de Calidad).
7. Guardar → `current_stock` se incrementa.

### 4.2. Auditoría de Calidad (CALIDAD)
1. Visualiza lista de materiales con estado `PENDIENTE`.
2. Inspecciona físicamente el material.
3. Decide: `APROBADO` o `RECHAZADO`.
4. Si es `RECHAZADO`: El stock sigue contado, pero se marca como **NO DISPONIBLE** para asignación (flag booleano o el mismo estado).

### 4.3. Creación de Órden de Producción (ENLACE)
1. Crear una OP con:
   - Número de OP (único).
   - Cliente asociado.
   - Descripción del producto final a fabricar.
   - Fecha de entrega estimada.
2. La OP queda en estado `PENDIENTE` hasta que se le asigne material.

### 4.4. Asignación de Material a OP (ENLACE - con validación)
1. Buscar la OP (por número o cliente).
2. Buscar material **APROBADO** y **DISPONIBLE** de ese cliente.
3. Ingresar la cantidad a asignar (ej. "500 metros").
4. El sistema **DESCUENTA** automáticamente esa cantidad del `current_stock` del material.
5. Se genera un registro de asignación:
   - Material.
   - Cantidad.
   - OP destino.
   - Usuario que asignó.
   - Fecha y hora.

### 4.5. Salida Física (ALMACÉN)
- Cuando producción va a recoger el material, el almacén valida que esté asignado a esa OP y lo entrega físicamente.
- *(En la versión MVP, la asignación digital puede considerarse la "salida", pero el sistema debe permitir registrar la salida física como un paso adicional si el negocio lo requiere).*

### 4.6. Auditoría y Trazabilidad (TODOS)
- **Cada movimiento** (entrada, asignación, ajuste por merma, devolución) debe quedar registrado en una **bitácora inmutable** con:
  - Fecha y hora.
  - Usuario que lo realizó.
  - Tipo de movimiento.
  - Cantidad movida.
  - Detalle u observación.

---

## 🚫 5. RESTRICCIONES NO NEGOCIABLES ("LÍNEAS ROJAS")

1. **Sin contabilidad**: No hay campo de "precio", "costo unitario", "valor total" en ninguna tabla ni en el frontend. El sistema solo ve **cantidades físicas**.
2. **Separación estricta**: Ni se te ocurra sugerir integrar esto con el módulo de compras o finanzas del ERP. Es un sistema aislado a propósito.
3. **Concurrencia real**: Dos usuarios de Enlace podrían intentar asignar los últimos 100 metros de una bobina al mismo tiempo. El sistema debe evitar la **sobreventa** usando transacciones atómicas (Edge Functions en Supabase o bloqueos a nivel DB).
4. **Inmovilización por Calidad**: Un material `RECHAZADO` NO puede asignarse a ninguna OP, aunque tenga stock disponible.

---

## 🛠️ 6. STACK TECNOLÓGICO DEFINITIVO

| Capa | Tecnología elegida | Justificación |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14+ (App Router)** | SSR para listados de inventario (carga rápida para operarios), Server Actions para mutaciones seguras, y Client Components para formularios dinámicos. |
| **Animaciones** | **motion.dev (Framer Motion)** | Microinteracciones táctiles en almacén (skeletons con respiración, modales fluidos, feedback visual en botones). |
| **UI Components** | **Shadcn/ui** (Radix UI + TailwindCSS) | Componentes accesibles, personalizables y con soporte para temas oscuros/claros. |
| **Backend / BBDD / Auth** | **Supabase** | PostgreSQL con RLS, Autenticación, Realtime (para dashboards en vivo), Storage (para fotos de evidencia). |
| **Manejo de estado (cliente)** | TanStack Query (server state) + Zustand (UI state) | Separación clara entre datos del servidor y estado de interfaz. |
| **Validación** | **Zod** | Tipado seguro en Server Actions y formularios. |

---

## 🗺️ 7. PLAN DE ENTREGAS Y ROADMAP

**El plan detallado por fases, sprints y fechas estimadas se encuentra en el archivo dedicado:**

📄 **[`/docs/ROADMAP.md`](./docs/ROADMAP.md)**

Este archivo contiene el desglose de:
- Sprint 0 (Configuración inicial).
- Sprint 1 (Autenticación y Roles).
- Sprint 2 (Modelado de Datos en Supabase).
- Sprint 3 (Módulo de Almacén).
- Sprint 4 (Módulo de Enlace y Producción).
- Sprint 5 (Módulo de Calidad y Auditoría).
- Sprint 6 (Pulido, Animaciones y Despliegue).

---

## 🤔 8. PREGUNTAS DE PROFUNDIZACIÓN (PARA RAZONAR ANTES DE CODIFICAR)

Antes de escribir una línea de código, el TAUXB debe haber reflexionado sobre estos puntos (aunque no se respondan ahora, deben estar en el radar):

1. **Conversión de unidades**: Si el almacén registra una bobina en metros lineales, pero el cliente pregunta por kilos, ¿mostramos ambos en la UI o forzamos una unidad principal por material?
2. **Devoluciones de material sobrante**: Si una OP usa menos material del asignado, ¿cómo registramos la devolución? (Entra de nuevo al stock como `INBOUND` con observación "Devolución de OP-X").
3. **Rechazo tardío de Calidad**: ¿Qué pasa si Calidad rechaza un material que ya estaba asignado a una OP? ¿Deshacemos la asignación automáticamente o bloqueamos la OP?
4. **Trazabilidad de OP**: Si una OP se retrasa, ¿qué materiales tiene asignados y quién los asignó? ¿Cómo lo mostramos en la UI sin hacer 50 joins lentos?
5. **Escaneo de códigos de barras**: ¿Los operarios usarán lectores de código de barras en almacén para agilizar entradas y salidas? (Esto afecta el diseño de formularios).

---

## 📂 9. ESTRUCTURA DE ENTREGABLES (PRE-CODIFICACIÓN)

El Consejo Técnico entregará, en fases, la siguiente documentación y código:

### Fase 1: Definición (Este documento + Roadmap)
- [x] Contexto de negocio.
- [x] Definición de roles y flujos.
- [x] Stack tecnológico elegido.
- [x] Roadmap detallado en `/docs/ROADMAP.md`.

### Fase 2: Modelado de Datos (Siguiente paso)
- [ ] Esquema SQL para Supabase (tablas, relaciones, RLS).
- [ ] Funciones PostgreSQL o Edge Functions para operaciones atómicas.
- [ ] Políticas de seguridad por rol.

### Fase 3: Prototipo de UI (Figma / Code)
- [ ] Wireframes de las vistas principales (Dashboard, Inventario, OP, Asignación).
- [ ] Flujos de navegación con Motion (animaciones definidas).

### Fase 4: Generación de Código (Codex / Cursor)
- [ ] Migraciones de Supabase.
- [ ] Frontend en Next.js (App Router + Motion + Shadcn).
- [ ] Configuración de Supabase (Auth, RLS, Realtime).
- [ ] Despliegue (Docker / Vercel / Self-hosted).

---

## 🎯 10. OBJETIVO FINAL DE ESTE DOCUMENTO

**Este archivo `.md` es el "documento fuente"** que debe ser ingerido por cualquier asistente de IA (Codex, Cursor, Claude, ChatGPT) antes de empezar a codificar. 

**Instrucción para la IA**: 
> Basándote en este contexto y en el roadmap asociado, no des soluciones genéricas. Cada recomendación de código, arquitectura o UI debe estar justificada por los requisitos de negocio, los roles de usuario y las restricciones aquí descritas. Si algo no está claro, formula preguntas de profundización antes de proceder.

---

**Fin del Contexto del Proyecto**