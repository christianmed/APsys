# Plan de Trabajo: Coherencia UX/UI, Catálogo de Servicios y Tasas BCV Automáticas

Este plan aborda de forma exhaustiva los 8 puntos solicitados por el usuario, asegurando coherencia visual, ergonomía y estabilidad del sistema.

---

## Fases de Ejecución

### Fase 1: Diagnóstico y Validación del Catálogo de Servicios
- **Problema:** En `/pedidos/nuevo`, el selector de servicios solo mostraba `-- Seleccionar --` debido a que en la base de datos únicamente existían 2 registros de test inactivos (`activo: false`).
- **Acción:**
  - Se sembraron con éxito los 5 servicios base oficiales en Supabase (`Pendones`, `Viniles`, `Backing`, `Microperforado`, `Etiquetas`) con `activo: true` y orden `1..5`.
  - Crear e integrar un mecanismo de fallback/aviso en `app/pedidos/nuevo/page.tsx` y `app/pedidos/pedido-form.tsx` para que, en caso de catálogo vacío, muestre un aviso con enlace directo a `/servicios/nuevo` para administradores.

### Fase 2: Unificación de Nomenclatura y Botones Coherentes
- **Punto 2 (Inconsistencia de botones):**
  - Unificar en `app/pedidos/page.tsx` el botón de cabecera y el botón del empty state a la misma etiqueta y estilo: **"+ Nueva Orden"**.
- **Punto 4 (Botón Registrar Nuevo Cliente):**
  - Rediseñar en `app/pedidos/pedido-form.tsx` el enlace de cliente para que sea un botón secundario estilizado y visible con icono `UserPlus` y etiqueta **"Nuevo Cliente"**.
- **Punto 5 (Botón Agregar Ítem):**
  - Corregir el texto doble `+ + Agregar otro ítem` en `app/pedidos/pedido-form.tsx`.
  - Transformarlo en un botón dashed/secundario con estilo de tarjeta o botón de adición (`<Plus /> Agregar ítem`), consistente con el sistema.

### Fase 3: Corrección de Navegación del Sidebar y Rutas Activas
- **Punto 3 (Doble botón activo en sidebar):**
  - En `components/shell/app-nav-items.ts`, configurar `exactMatch: true` para `/pedidos` y `/pedidos/nuevo` (renombrado a "Nueva Orden" para consistencia con el header).
  - En `components/shell/app-shell.tsx`, refinar la función `estaRutaActiva` para evitar que `/pedidos` se active cuando el usuario está en `/pedidos/nuevo`.

### Fase 4: Jerarquía Limpia y Eliminación de Navegación Redundante
- **Punto 6 (Links redundantes e inconsistentes de navegación):**
  - **Páginas de Nivel 1 (Secciones directas del Sidebar/Bottom Nav):**
    - `/pedidos`, `/taller`, `/clientes`, `/servicios`, `/dashboard`, `/cuentas-por-cobrar`, `/tasas`, `/plantillas`, `/recordatorios`, `/ayuda`.
    - Eliminar botones redundantes "← Inicio" y breadcrumbs artificiales "Inicio > ...".
    - El `PageHeader` contendrá: Título claro, descripción concisa y botones de acción contextuales a la derecha.
  - **Páginas de Nivel 2 (Subflujos y Detalle):**
    - `/pedidos/nuevo` → `← Volver a Pedidos`
    - `/clientes/nuevo` → `← Volver a Clientes`
    - `/clientes/[id]` → `← Volver a Clientes`
    - `/servicios/nuevo` → `← Volver a Servicios`
    - `/servicios/[id]` → `← Volver a Servicios`
    - `/dashboard/rotacion` → `← Volver al Dashboard`
- **Punto 7 (Botón duplicado en Ayuda):**
  - En `app/ayuda/page.tsx`, retirar el botón "Ir al Taller" de la cabecera `PageHeader`, conservando el del banner de bienvenida operativo.

### Fase 5: Módulo de Tasa BCV Automática vía API (USD Principal + EUR Informativo)
- **Punto 8:**
  - Crear `lib/tasas/bcv-service.ts`:
    - Consumo de `ve.dolarapi.com/v1/dolares/oficial` y `ve.dolarapi.com/v1/euros/oficial` (con fallback a `rates.dolarvzla.com`).
    - Extracción de valor oficial en bolívares, fecha de vigencia y divisa.
  - Crear Server Action `sincronizarTasaBcv()` en `app/tasas/actions.ts`:
    - Permite al rol gerencial actualizar la tasa del día con un solo clic o configurar la tasa manualmente para un período específico.
  - Actualizar `app/tasas/page.tsx` y `app/tasas/tasa-form.tsx`:
    - Mostrar la tasa USD (predeterminada para cálculos en el sistema) y la tasa EUR (informativa).
    - Botón "Sincronizar con BCV en vivo".
    - Mantener el historial inmutable de vigencias con soporte para fechas específicas.
  - Actualizar el badge de tasa en el `AppShell` para mostrar USD principal y tooltip/indicador con EUR informativo.

### Fase 6: Pruebas y Validación Integral
- Pruebas unitarias para `bcv-service.ts`.
- Ejecución de `npm run typecheck`, `npm test`, `npm run lint` y `npm run build`.
- Verificación visual.
- Commit final y reporte al usuario.

---

### Fase 19: Validación Rápida de JWT en Proxy (Opción A) + Propagación de Sesión vía Headers (Opción B)
- **Objetivo:** Eliminar el cuello de botella de 2.1s - 3.3s en `proxy.ts` y la doble llamada remota a Supabase Auth en Server Components.
- **Acción:**
  1. **Opción A (Validación local de JWT en `proxy.ts`):** Extraer el access token de las cookies de Supabase (`sb-*-auth-token`) y validar claims (`sub`, `email`, `exp`) en memoria en < 1ms, evitando llamadas HTTPS a EE.UU. en cada clic.
  2. **Opción B (Propagación de usuario vía headers):** Inyectar `x-user-id` y `x-user-email` en las cabeceras de la petición hacia Next.js Server Components.
  3. **Optimización en `auth-cache.ts` y páginas:** `obtenerUsuarioSesion` lee las cabeceras del proxy, evitando una segunda llamada a `supabase.auth.getUser()`.
  4. **TDD y Benchmarking:** Pruebas unitarias dedicadas en `test/jwt-session.test.ts` y verificación de latencia en vivo.
