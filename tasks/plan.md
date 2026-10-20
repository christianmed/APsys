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

### Fase 33: Sistema de Tema Claro/Oscuro Tokyo Night (#16161e/#1a1b26/#1f202c), Armonización de Home y Tarjetas de Taller por Estado

- **Objetivo:** Implementar la paleta de color oscuro Tokyo Night (`#16161e` fondo, `#1a1b26` superficies, `#1f202c` elementos interactivos y hover) con conmutador de tema claro/oscuro en el sidebar y header móvil; resolver las inconsistencias de polaridad y contraste en las tarjetas y botones del Home (`app/page.tsx`); y rediseñar las tarjetas de taller (`/taller`) para que el estado se transmita a través de la superficie de la tarjeta con fondos tonales sutiles y botones de acción neutrales, acompañados de nueva iconografía coherente de taller gráfico (`Play`, `Printer`, `PackageCheck`, `HandCoins`).
- **Acciones Clave:**
  1. **Arquitectura de Tema y Paleta Tokyo Night (`globals.css` y `ThemeProvider`):**
     - Configurar variables CSS para la paleta Tokyo Night: `--background: #16161e`, `--surface: #1a1b26`, `--surface-elevated: #1f202c`, `--border: #24283b` para modo oscuro, preservando la paleta clara en modo claro.
     - Crear proveedor ligero `ThemeProvider` en `components/providers/theme-provider.tsx` con almacenamiento en `localStorage` (`apsys-theme`) y soporte sin parpadeo (FOUC).
     - Configurar la variante `@custom-variant dark (&:where(.dark, .dark *));` en Tailwind CSS v4 para soporte pleno del selector `.dark`.
  2. **Conmutador de Tema Ergonómico (Sidebar y Header Móvil):**
     - En `components/shell/app-shell.tsx`, sustituir la ubicación del badge `v1.0.0` por un conmutador interactivo `Sun`/`Moon` accesible y con micro-animaciones.
     - Reubicar el indicador `v1.0.0` al pie del sidebar junto a la información de perfil y cierre de sesión.
     - Añadir el botón conmutador en el header móvil `< md` junto al menú hamburguesa.
  3. **Corrección de Inconsistencias y Contraste en el Home (`app/page.tsx`):**
     - Convertir la tarjeta *"Activas en Taller"* en enlace interactivo hacia `/taller?tab=activos`, asegurando que las 4 tarjetas KPI conduzcan al taller con su filtro correspondiente.
     - Corregir los estados hover en modo oscuro de "En Producción" y "Listos para Retiro", eliminando el fondo beige/grisáceo lavado mediante estados `dark:hover:bg-[#1f202c]` con bordes iluminados sutiles.
     - Homogeneizar los botones de las tarjetas de acceso directo:
       - Tarjetas con 2 botones ("Gestión de Pedidos" y "Clientes & Recurrencia"): botón principal (izq) con estilo neutro consistente y botón rápido `+` (der) con estilo outline idéntico, eliminando la polaridad invertida.
       - Tarjetas de 1 solo botón ("Taller", "Servicios", "Recordatorios", "Plantillas"): unificar bajo el mismo estilo neutral sobrio, reemplazando el botón naranja chillón del taller por un botón coherente con acento en el icono.
       - Corregir los hovers rotos en modo oscuro para evitar texto negro sobre fondo oscuro o texto blanco sobre fondo blanco.
  4. **Rediseño de Tarjetas de Taller por Estado e Iconografía Coherente (`app/taller/taller-tablero.tsx`):**
     - Las tarjetas adoptan un fondo tonal suave y diferenciado por estado sobre la base Tokyo Night (`#1a1b26`), con micro-bordes elegantes: azul zafiro tenue para *Recibido / Por Iniciar*, ámbar noche para *En Producción*, y esmeralda bosque para *Listo para Retiro*.
     - Los botones de acción de taller pasan a ser **100% neutrales** acorde al tema claro y oscuro, eliminando colores estridentes en la botonera.
     - Actualizar la iconografía a un set profesional de manufactura gráfica: `Play` / `Inbox` para Por Iniciar, `Printer` / `Layers` para En Producción, `PackageCheck` para Listo para Retiro, y `HandCoins` para Cobrar Saldo y Entregar.
  5. **Compuerta de Calidad DoD:** Tests unitarios de tema y componentes, `npm test` (100% verde), `npm run typecheck` (0 errores), `npm run lint` (0 advertencias), `npm run build` y actualización de manuales técnicos y de usuario.

### Fase 34: Sistema de Diseño Integral APSys Tokyo Night y Armonización Universal de Pantallas

- **Objetivo:** Erradicar definitivamente la fragmentación visual y las clases de color hardcodeadas (`zinc-800`, `zinc-900`, `zinc-950`) en toda la aplicación. Establecer el **Sistema de Diseño Oficial APSys Tokyo Night** basado en tokens semánticos globales, unificar la paleta de acentos cromáticos (eliminando la discrepancia entre `sky`, `blue` e `indigo` en favor de un único Azul Zafiro Tokyo Night `#7aa2f7`), rediseñar `CustomSelect`, `PageHeader`, `SidebarTasasCard` y el perfil del Sidebar, y propagar las superficies Tokyo Night (`#16161e` canvas, `#1a1b26` tarjetas/paneles, `#1f202c` interactivo/inputs/hover, `#24283b` bordes) a cada una de las pantallas del sistema, verificado visualmente mediante el Browser Subagent.
- **Etapas de Ejecución Estricta (Secuencial y Verificada):**
  1. **Etapa 1: Fundación y Tokens Semánticos Globales (`app/globals.css`, `lib/design-system.ts`):**
     - Declarar en `app/globals.css` las variables del sistema y remapear a nivel de tema oscuro para que las utilidades `dark:bg-zinc-900`, `dark:bg-zinc-950`, `dark:border-zinc-800`, `dark:border-zinc-700` resuelvan limpiamente en la paleta Tokyo Night (`#1a1b26`, `#16161e`, `#24283b`), protegiendo de raíz cualquier componente o página no intervenida manualmente.
     - Crear el módulo rector `lib/design-system.ts` con constantes de clases estándar (`CARD`, `INPUT`, `BUTTON_PRIMARY`, `BUTTON_SECONDARY`, `BUTTON_NEUTRAL`, `SELECT`, `BADGE`, `TABLE`).
  2. **Etapa 2: Unificación Estricta del Color Azul y Estados Semánticos (`lib/pedidos/estados.ts`, `app/page.tsx`):**
     - Unificar el Azul Primario del sistema: "Por Iniciar", "Gestión de Pedidos", Euro y badges de recepción adoptan de manera 100% coherente el tono Azul Zafiro Tokyo Night (`#7aa2f7` / Tailwind `sky-400` / `blue-400` calibrado), erradicando mezclas arbitrarias de `sky`, `blue` e `indigo`.
     - Sincronizar `ESTADOS_METADATA` en `lib/pedidos/estados.ts` para que `recibido` refleje Azul Zafiro, `en_produccion` refleje Ámbar y `listo` refleje Esmeralda en todo el software.
  3. **Etapa 3: Rediseño del Cascarón, Widget de Tasas BCV y Pie de Sidebar (`components/shell/`):**
     - `components/shell/sidebar-tasas-card.tsx`: Transicionar el contenedor de tasas a fondo `#1a1b26` con borde `#24283b`, acordeones internos `#1f202c`, y hovers `#252b42`.
     - `components/shell/app-shell.tsx`:
       - Corregir el hover de todos los enlaces de navegación del Sidebar a `#1f202c` con texto nítido `#f8fafc`.
       - Rediseñar el perfil de usuario al pie a superficie `#1f202c` con micro-borde `#24283b`, icono en `#252b42` y botón de cierre de sesión en `#252b42`.
       - Sincronizar el cajón móvil (`menuMovilAbierto`) con las mismas superficies Tokyo Night.
     - `components/shell/page-header.tsx`: Actualizar la tarjeta unificada a superficie `#1a1b26` y bordes `#24283b`.
  4. **Etapa 4: Rediseño Integral de `CustomSelect` (`components/ui/custom-select.tsx`):**
     - Botón selector: Fondo `#16161e` en variantes de formulario, bordes `#24283b`, hover `#252b42` y anillo de enfoque azul `#7aa2f7` (reemplazando el verde desentonado).
     - Menú desplegable (`listbox`): Fondo `#1a1b26` con sombra Tokyo Night, separadores `#24283b`, items hover `#1f202c` y activo con check `#7aa2f7`.
     - Campo de búsqueda interactiva: Fondo `#16161e` y borde `#24283b`.
  5. **Etapa 5: Armonización de Pantallas de Pedidos y Formularios (`/pedidos`, `/pedidos/nuevo`):**
     - `app/pedidos/pedido-form.tsx`:
       - Actualizar `CLASES_INPUT` a fondo `#16161e`, borde `#24283b`, texto `#f8fafc`, focus ring `#7aa2f7`.
       - Secciones de formulario (Cliente, Renglones de Trabajo, Cobranza Inicial) a `#1a1b26` con bordes `#24283b`.
       - Filas de renglones dinámicos a `#1f202c` con bordes `#24283b`.
       - Botón "+ Agregar ítem" con estilo neutral elevado `#1f202c` / `#252b42`.
     - `app/pedidos/page.tsx`:
       - Buscador de órdenes, barra de filtros, tarjetas de pedidos y tabla con superficies `#1a1b26` y bordes `#24283b`.
       - Paginación `CursorPagination` adaptada a `#1f202c`.
  6. **Etapa 6: Armonización de Pantallas de Tasas y Finanzas (`/tasas`, `/cuentas-por-cobrar`, `/dashboard`):**
     - `app/tasas/page.tsx` y `app/tasas/bcv-sync-panel.tsx`:
       - Tarjeta hero de tasa vigente a `#1a1b26`, panel de sincronización a `#1a1b26` y tabla histórica con thead `#1f202c` y filas `#1a1b26`.
     - `/cuentas-por-cobrar` y `/dashboard`:
       - Tarjetas métricas, barras de filtros temporales y modales a `#1a1b26` y `#1f202c`.
  7. **Etapa 7: Armonización del Resto del Ecosistema de Pantallas:**
     - `/clientes`, `/clientes/[id]`, `/clientes/nuevo`
     - `/servicios`, `/servicios/[id]`, `/servicios/nuevo`
     - `/plantillas`, `/recordatorios`, `/ayuda`, `/comanda/[id]`, `/login`
  8. **Etapa 8: Inspección Visual con Browser Subagent:**
     - Ejecutar navegación automatizada en navegador con capturas en Home, Nuevo Pedido, Tablero de Taller, Tasas y Clientes para certificar 100% de uniformidad cromática, contraste y ausencia de parpadeos.
  9. **Etapa 9: Compuerta de Calidad DoD y Documentación:**
     - Vitest 100% verde (294+ tests), Typecheck 0 errores, ESLint 0 advertencias, Next.js build exitoso.
     - Actualizar `docs/arquitectura/manual-tecnico-sistema.md` (Sección 14: Sistema de Diseño APSys) y `docs/capacitacion/guia-rapida-usuarios.md`.

### Fase 37: Sistema de Diseño Atómico Impeccable, Manifiesto Replicable DESIGN.md y Migración Analítica (Completada)

- **Objetivo:** Establecer la infraestructura de diseño canónica del sistema basada en tokens CSS centralizados en `app/globals.css`, el manifiesto exportable `DESIGN.md` y componentes atómicos en `@/components/ui/` (`Card`, `KpiCard`, `Badge`, `Button`, `ProgressBar`), migrando Home, Dashboard, Cuentas por Cobrar y Rotación.
- **Resultados:** 313 tests aprobados en Vitest, 0 errores de TypeScript, micro-interacciones `:active:scale-[0.97]` y cromo 100% neutro.

### Fase 38: Fusión Controlada de la Rama de Diseño hacia `dev`

- **Objetivo:** Integrar todo el trabajo atómico de diseño (`feat/sistema-diseno-impeccable-tokens`) en la rama de desarrollo `dev` mediante un merge limpio sin tocar `main`.
- **Verificación:** Ejecutar la compuerta de calidad DoD (`npm test`, `npm run typecheck`) directamente sobre la rama `dev`.

### Fase 39: Ampliación del Catálogo de Componentes Canónicos Atómicos (@/components/ui/)

- **Objetivo:** Desarrollar los componentes canónicos identificados por la "Regla de Tres" y la auditoría de Impeccable, documentándolos en `DESIGN.md` y respaldándolos con pruebas TDD en `test/`:
  1. `<Input />` / `<TextField />`: Entradas de texto y números con tipografía tabular, soporte táctil móvil, anillo de foco Tokyo Night (`#7aa2f7`), estados de error y variantes con icono (búsqueda).
  2. `<Alert />` / `<Banner />`: Notificaciones contextuales para alertas operativas (servicios sin demanda, morosidad crítica, avisos de sistema).
  3. `<Tabs />`: Selector de pestañas accesible para filtros de tramos de cobro y columnas Kanban.
  4. `<Modal />` / `<Dialog />`: Ventanas emergentes accesibles con backdrop sutil, micro-animación de entrada consciente del origen y supresión de `scale(0)`.

### Fase 40: Migración de Pantallas Operativas a Componentes Canónicos

- **Objetivo:** Reemplazar las clases manuales y contenedores dispersos en las pantallas operativas de captura y manufactura por los componentes atómicos canónicos:
  1. **Tablero de Taller (`/taller`):** Columnas Kanban, tarjetas táctiles de estado y modales de cobro/entrega.
  2. **Gestión de Pedidos (`/pedidos` y `/pedidos/nuevo`):** Secciones de formulario de nueva orden (`PedidoForm`), filtros rápidos y buscador.
  3. **Directorio de Clientes (`/clientes`, `/clientes/[id]`, `/clientes/nuevo`):** Fichas de cliente, formulario de alta e historial.
  4. **Catálogo de Servicios (`/servicios`, `/servicios/nuevo`):** Tabla de catálogo y formulario de tarifas.
  5. **Módulo de Tasas (`/tasas`):** Panel BCV e histórico inmutable.

### Fase 41: Pruebas de Estrés `break-ui` (Emil Kowalski) y Auditoría Quirúrgica Impeccable (/polish y /audit) [Completada]

- **Objetivo:** Blindar la resiliencia y el refinamiento de la interfaz:
  1. **Pruebas de Estrés `break-ui`:** Inyectar nombres de clientes de 100+ caracteres, números de factura millonarios y pantallas ultra-estrechas (320px) para garantizar que nada se desborde (`truncate`, `min-w-0`, `break-words`). Verificado con `test/break-ui-stress.test.tsx` (8/8 tests).
  2. **Auditoría Impeccable:** Verificado con los 61 detectores deterministas mecánicos (`impeccable detect`) reportando cero violaciones (`[]`). Cromo 100% neutro preservado y 330 tests Vitest en verde.

### Fase 42: Pruebas E2E de Flujo Crítico con Playwright

- **Objetivo:** Automatizar la validación de punta a punta del ciclo operativo central:
  - Crear orden en mostrador → Transición en Taller (Recibido → Producción → Listo) → Cobro de saldo multimoneda → Consolidado en Dashboard.

