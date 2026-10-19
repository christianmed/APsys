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

---

## Fases Consolidadas de Evolución (Post-Auditoría Cruzada PI vs. Gemma)

### Fase 28: Pulido Crítico de Responsividad y Consistencia Visual Móvil (Mobile-First Polish) [Prioridad Inmediata]

- **Objetivo:** Eliminar el desbordamiento horizontal en pantallas móviles (360px - 390px) en las vistas de `/dashboard`, `/cuentas-por-cobrar` y `/dashboard/rotacion`, unificando su comportamiento con la excelencia visual de `/taller`, `/pedidos` e `/inicio` antes de la presentación oficial con el cliente.
- **Acciones Clave:**
  1. **Blindaje de Shell y Viewport:** Declarar `export const viewport: Viewport` con `width: 'device-width', initialScale: 1` en `app/layout.tsx` y aplicar `min-w-0 max-w-full overflow-x-hidden` en `app-shell.tsx`.
  2. **PageHeader Universal Adaptable:** Reestructurar `components/shell/page-header.tsx` para evitar que `actions` con `shrink-0` estire la tarjeta, permitiendo que los títulos largos fluyan en 2 líneas limpias sin truncarse.
  3. **Dashboard Gerencial (`/dashboard`):** Botonera de acciones en cuadrícula compacta 2x2 para móvil, inputs de fecha apilados verticalmente a ancho completo (`flex-col`) y exportación CSV fluida.
  4. **Cuentas por Cobrar (`/cuentas-por-cobrar`):** Buscador de clientes y `CustomSelect` apilados en columna a ancho completo (`w-full`), eliminando la colisión horizontal.
  5. **Rotación de Servicios (`/dashboard/rotacion`):** Ordenamiento y filtros de fecha en columna vertical móvil.
  6. **Validación Visual E2E en Navegador:** Inspección automatizada en 390x844 con browser subagent constatando `scrollWidth === clientWidth` y cero desbordamiento horizontal en las 12 rutas.
  7. **Compuerta DoD:** `npm test` (100% verde), `npm run typecheck` (0 errores) y `npm run lint`.

### Fase 29: Blindaje Técnico, Rendimiento y Gobernanza Ágil (Versión 1.0.0 Oficial)

- **Objetivo:** Asegurar la estabilidad a largo plazo del sistema, optimizar las consultas de base de datos a `O(log n)` y desburocratizar el desarrollo diario.
- **Acciones Clave:**
  1. **Gobernanza Ágil (Fast Lanes):** Actualizar `AGENTS.md` para formalizar la ruta rápida de correcciones menores (TDD directo Rojo-Verde sin reunión de especificación obligatoria).
  2. **Índices en PostgreSQL:** Crear `supabase/migrations/0006_indices_rendimiento.sql` con índices B-Tree en `pedidos(cliente_id)`, `pedidos(estado)`, `pedidos(fecha_registro DESC)` y `clientes(telefono)`.
  3. **Validación Zod en Server Actions:** Implementar esquemas Zod en `lib/validaciones/` para sanitizar `crearPedido`, `crearCliente` y `registrarAbono`.
  4. **Paginación por Cursor:** Implementar paginación en servidor (`limit 25` + `created_at < cursor`) para `/clientes` y `/pedidos`.
  5. **Alertas de Cron por Telegram:** Micro-webhook que emita alerta si la sincronización del BCV falla repetidamente.

### Fase 30: Módulo Autónomo de Tasas BCV y Dinámica de Calendario Fin de Semana

- **Objetivo:** Resolver el desacople entre el calendario bancario venezolano (viernes a lunes / feriados) y las etiquetas estáticas ("Hoy", "Mañana"), e independizar el módulo de tasas para su fácil replicabilidad en otros proyectos empresariales vía IA.
- **Acciones Clave:**
  1. **Blueprint Modular para IA (`docs/arquitectura/modulo-tasas-bcv-blueprint.md`):** Redactar la especificación integral del módulo (SQL, API, Cron, UI, Hooks, Conversores y el Prompt exacto para cualquier IA).
  2. **Lógica de Calendario Bancario Desacoplada (TDD Rojo-Verde):** Crear `describirEstadoVigencia` y `describirEtiquetaFecha` en `lib/tasas/tasas.ts` con cobertura de fin de semana, lunes bancario y feriados.
  3. **Sidebar y Tarjeta de Histórico Inteligentes:** Actualizar `components/shell/sidebar-tasas-card.tsx` y `app/tasas/page.tsx` para mostrar etiquetas dinámicas como `"Vigente (Fin de semana)"`, `"Vigente (16 oct)"` o `"Programada (Lunes)"`.
  4. **Panel de Sincronización:** Textos contextuales en `app/tasas/bcv-sync-panel.tsx` que indiquen con exactitud cuándo entra en vigencia la tasa.
  5. **Compuerta DoD:** `npm test` (100% verde), `npm run typecheck` (0 errores) y sincronización mandatoria de manuales técnicos y de usuario.

### Fase 31: Blindaje Estricto de Entregas (Saldo $0 Obligatorio) y UX de Catálogo de Servicios

- **Objetivo:** Garantizar que ninguna orden pueda ser marcada como entregada en el taller o en la comanda si posee saldo pendiente, facilitando el cobro instantáneo en mostrador (`Cobrar Saldo y Entregar`), y mejorar la claridad del catálogo de servicios con borrado seguro de servicios sin pedidos.
- **Acciones Clave:**
  1. **Regla de Servidor Estricta:** Validar que `saldo === 0` antes de autorizar el paso a `entregado` en `lib/pedidos/estados.ts` y `app/pedidos/actions.ts`.
  2. **Acción Atómica `cobrarYEntregarPedido`:** Permitir registrar el saldo restante y entregar en una sola transacción sin abandonar la pantalla.
  3. **UX de Taller Kanban:** En `app/taller/taller-tablero.tsx`, mostrar botón `Cobrar Saldo y Entregar` con modal ágil para órdenes con saldo en "Listo para Retiro".
  4. **Historial de Clientes Limpio:** En `app/clientes/[id]/historial-cliente-view.tsx`, suprimir el botón de cobrar en órdenes entregadas.
  5. **Catálogo de Servicios:** En `app/servicios/servicio-form.tsx`, renombrar `Orden` a `Prioridad en Catálogo (Posición)` con texto de ayuda, explicar `Activo` e incorporar `eliminarServicio` seguro para servicios huérfanos.
  6. **Compuerta DoD:** Tests unitarios (TDD), `npm test`, `npm run typecheck`, compilación y actualización de manuales.

### Fase 32: Arquitectura Centralizada de Fechas Caracas, Consistencia Total de Métricas y Conmutador de Estilos de Taller

- **Objetivo:** Establecer una única fuente de verdad para la lógica temporal de la aplicación anclada a la hora oficial de Venezuela (`America/Caracas`), resolviendo el desfase del banner de bienvenida y los filtros de dashboards (`hoy`, `esta_semana`); corregir la discrepancia de métricas en "Estado de producción en vivo" en `app/page.tsx` para sincronizarlas 1:1 con el taller; e implementar un conmutador visual interactivo en `/taller` para evaluar en vivo las 3 propuestas estéticas sobrias de botones antes de consolidar la decisión final.
- **Acciones Clave:**
  1. **Módulo Centralizado de Fechas (`lib/fechas.ts`):** Crear la única fuente de verdad para formateo (`formatearFechaCaracas`, `formatearFechaHoraCaracas`), obtención de límites temporales (`obtenerInicioFinDiaCaracas`, `obtenerInicioFinSemanaCaracas`, `obtenerInicioFinMesCaracas`) y rangos para dashboards. Refactorizar `lib/dashboard/ingresos.ts` para consumir directamente estas utilidades, garantizando consistencia absoluta en todo el sistema.
  2. **Badge de Fecha Reactiva en Vivo (`components/shell/fecha-en-vivo-badge.tsx`):** Componente cliente desacoplado que renderiza la fecha calendario en curso en Caracas (`America/Caracas`, `locale: "es-VE"`), con sincronización automática a medianoche sin recargas ni desfase por servidores UTC.
  3. **Consistencia de Estados de Producción en Vivo (`app/page.tsx`):** Corregir los filtros de pedidos para utilizar los estados canónicos del modelo relacional (`recibido`, `en_produccion`, `listo`) en vez de estados obsoletos (`registrado`, `imprimiendo`), unificando las etiquetas y conteos exactamente con `/taller`.
  4. **Estandarización de Fechas en Vistas del Sistema:** Reemplazar llamadas desalineadas a `toLocaleDateString` en `app/pedidos/page.tsx`, `app/comanda/[id]/comanda-vista.tsx`, `app/clientes/[id]/historial-cliente-view.tsx` y `app/dashboard/dashboard-view.tsx` por el helper oficial de Caracas.
  5. **Conmutador Visual Interactivo de 3 Estilos en Taller (`app/taller/taller-tablero.tsx` y `app/pedidos/boton-aviso-whatsapp.tsx`):** Implementar una barra de herramientas de vista previa que permita alternar en tiempo real entre:
     - **Estilo A (Minimalista Monocromático - Linear/Vercel):** Botón principal negro/zinc oscuro con micro-icono identificador, WhatsApp en outline menta sobrio y cobro con badge ámbar integrado.
     - **Estilo B (Tonales Pastel Suaves - Apple HIG):** Fondos translúcidos tenues (`bg-sky-50`, `bg-amber-50`, `bg-emerald-50`), bordes nítidos y alto contraste tipográfico sin saturación chillona.
     - **Estilo C (Jerarquía Progresiva - Stripe):** Botón neutro/outline en etapas iniciales que adquiere peso visual y color sólido de certeza únicamente en cobro y entrega.
  6. **Compuerta de Calidad DoD:** Pruebas unitarias TDD para `lib/fechas.ts` y componentes de fecha, pruebas de consistencia de contadores, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` y actualización obligatoria de manuales técnicos y de usuario.

### Fase 33: Potencia Comercial y Finanzas (Versión 1.1.0)

- **Objetivo:** Elevar la imagen corporativa del taller ante clientes corporativos y eliminar descuadres de caja en pagos combinados.
- **Acciones Clave:**
  1. **Presupuestos Formales en PDF Vectorial:** Endpoint de generación y descarga en PDF con membrete, especificaciones de m², acabados y montos en USD y Bs para compartir por WhatsApp o imprimir.
  2. **Desglose de Pagos Mixtos y Multimoneda:** Crear tabla `pedido_pagos` para registrar abonos combinados (Efectivo USD + Zelle + Pago Móvil con tasa congelada y referencia bancaria).
  3. **Suite E2E Playwright Completa:** Pruebas E2E del flujo completo: Login → Cotización con tasa de mañana → Kanban de Taller → Comanda.

### Fase 34: Planta Inteligente y Manufactura (Versión 1.2.0)

- **Objetivo:** Automatizar la comunicación con clientes y controlar el consumo de insumos de impresión.
- **Acciones Clave:**
  1. **WhatsApp Cloud API Desatendido:** Disparo automático de mensaje al cliente cuando la orden se marca como "Listo para Retiro", sin interacción manual.
  2. **Módulo de Inventario de Bobinas y Merma:** Control de metros lineales disponibles de lona y vinil con descuento automático por orden procesada y cálculo de merma por corte.
  3. **Estimación Predictiva en Taller Kanban:** Cálculo automático del tiempo estimado de entrega basado en la carga histórica de m² en producción.

