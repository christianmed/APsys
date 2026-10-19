# ANÁLISIS EJECUTIVO — APSys

**Fecha del análisis:** 19/10/2026  
**Autor:** Christian Medina (Propietario / Lead)  
**Cliente:** Sol_graficas C.J., C.A.  
**Versión del proyecto:** 1.0.0 (producción actual)  
**Estado:** v1.0.0 en curso → v1.1.0 (Comercial) → v1.2.0 (Planta Inteligente)

---

## 1. RESUMEN EJECUTIVO

APSys es una **plataforma web privada para la gestión y notificación de pedidos de una gráfica**, construida con **Next.js 16 (App Router, TypeScript)**, **Tailwind CSS v4**, **Lucide Icons**, **Supabase (PostgreSQL + Auth + RLS)** y **Vitest + Playwright** para pruebas. El proyecto se encuentra en su fase de **estabilidad y gobernanza (v1.0.0)**, con roadmap de evolución hacia **v1.1.0** (potencia comercial) y **v1.2.0** (planta inteligente).

El sistema centraliza todo el ciclo del pedido — registro, cobranza, producción en taller, aviso al cliente y análisis gerencial — accesible desde computadora, tablet o smartphone.

---

## 2. CONTEXTO Y PROBLEMA RESUELTO

### 2.1 Dolor central identificado

El cliente operaba con una **macro de Excel** para la toma de pedidos. Los tres dolores críticos eran:

1. **Búsqueda manual** de orden y teléfono para emitir avisos de retiro por WhatsApp.
2. **Pedidos listos que permanecían días** en recepción sin recordatorio oportuno.
3. **Ausencia de histórico acumulativo** de clientes e indicadores comerciales.

### 2.2 Solución

APSys proporciona una plataforma web que centraliza:

- **Registro y cotización paramétrica** de pedidos con cálculo automático por dimensiones (ancho, alto, cantidad, m², acabados).
- **Motor de tasas BCV** con soporte de **doble vigencia temporal** (tasa de hoy vs. tasa programada del día siguiente) y sincronización desatendida vía Vercel Cron.
- **Tablero Kanban reactivo** en tiempo real con Supabase Realtime.
- **Comanda imprimible** con código QR de trazabilidad.
- **Directorio de clientes** con validación telefónica.
- **Catálogo dinámico de servicios** configurables en USD.
- **Módulo de Cuentas por Cobrar** con registro de abonos y antigüedad.
- **Dashboard gerencial** de ingresos y rotación.

---

## 3. ARQUITECTURA TÉCNICA

### 3.1 Stack

| Capa           | Tecnología                                        | Notas                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------ |
| **Frontend**   | Next.js 16 (App Router) + TypeScript              | `export const instant = false` (en 17 rutas)     |
| **Estilos**    | Tailwind CSS v4 + Lucide Icons                    | `@custom-variant dark (&:where(.dark, .dark *))` |
| **Backend**    | Supabase (PostgreSQL, Auth, RLS, Realtime)        | Claves de servicio en servidor                   |
| **Testing**    | Vitest (unitarias/integración) + Playwright (E2E) | 147–153 tests por fase                           |
| **CI/CD**      | Vercel (producción + preview por rama)            | Cron jobs programados                            |
| **Validación** | Zod en Server Actions                             | Módulo `lib/validaciones/`                       |
| **Paginación** | Cursor-based (LIMIT 25 + 1)                       | Índices B-Tree en PostgreSQL                     |

### 3.2 Arquitectura de Navegación

El proyecto está migrando de una arquitectura **server-components-first** a **client-first (SPA)** con navegación instantánea. El estado de autenticación, tasas y navegación residen en memoria del navegador (`AuthContext` + `"use client"`), logrando transiciones de **0 a 16 milisegundos** (como en 3DCalc).

### 3.3 Modelo de Datos (Tablas clave)

| Tabla          | Campos clave                                                                                       | Notas                                   |
| -------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `clientes`     | id, nombre, teléfono, notas, creado_en                                                             | Teléfono indexado                       |
| `servicios`    | id, nombre, activo, orden                                                                          | Catálogo administrable                  |
| `pedidos`      | id, numero_orden, cliente_id, estado, total_usd, tasa_id, anulado, creado_en/listo_en/entregado_en | Estados según RF-05                     |
| `pedido_items` | id, pedido_id, servicio_id, descripción, dimensiones, acabados, cantidad, precio                   | Detalle del trabajo                     |
| `pagos`        | id, pedido_id, monto, moneda (USD/Bs), referencia, creado_en                                       | Abonos                                  |
| `tasas_cambio` | id, valor_bs_por_usd, vigente_desde                                                                | Histórico; cada pedido conserva su tasa |
| `auditoria`    | id, entidad, entidad_id, acción, motivo, usuario_id, fecha                                         | Append-only                             |
| `perfiles`     | id, usuario_id, rol                                                                                | Solo si se activa login                 |

### 3.4 Principales Decisiones de Arquitectura

| ID      | Decisión                                | Resolución                                                          |
| ------- | --------------------------------------- | ------------------------------------------------------------------- |
| **D-1** | ¿Login por perfiles o acceso unificado? | **Login con roles RLS segregados** (privacidad financiera estricta) |
| **D-2** | Canal WhatsApp (MVP vs Futuro)          | **`wa.me` en v1.0.0 → Cloud API en v1.2.0**                         |
| **D-3** | Moneda base de cálculo                  | **USD base con expresión dual en Bs**                               |
| **D-4** | Impresión de comanda                    | **Ambas (Ticket 80mm y Carta/A4)**                                  |
| **D-5** | Modo de envío de avisos                 | **Asistido a un clic en v1.0.0 → Desatendido en v1.2.0**            |
| **D-6** | Gobernanza de desarrollo                | **Fast Lanes para mantenimiento**                                   |
| **D-7** | Acoplamiento con Supabase               | **Integración nativa con Supabase RLS** (YAGNI)                     |
| **D-8** | Presupuestos y Cobranza Mixta           | **Prioridad comercial para v1.1.0**                                 |

---

## 4. ESTADO DEL PROYECTO POR FASES

### Fase 1 — Diagnóstico y Siembra de Servicios ✅

- **Completado:** Identificación de la causa raíz del selector vacío en `/pedidos/nuevo` (2 servicios inactivos de test). Sembrado exitoso de 5 servicios base oficiales (`Pendones`, `Viniles`, `Backing`, `Microperforado`, `Etiquetas`) con `activo: true` y orden `1..5`.

### Fase 2 — Unificación de Botones y Etiquetas ✅

- **Completado:** Unificación del botón de `/pedidos` y su empty state a `+ Nueva Orden`. Rediseño del botón "Registrar nuevo cliente" con icono `UserPlus`. Corrección del texto `+ + Agregar otro ítem` → botón de adición.

### Fase 3 — Sidebar y Rutas Activas ✅

- **Completado:** Desambiguación de `/pedidos` y `/pedidos/nuevo` con `exactMatch: true`. Renombrado "Nuevo Pedido" a "Nueva Orden".

### Fase 4 — Jerarquía de Navegación Limpia ✅

- **Completado:** Eliminación de botones "← Inicio" y breadcrumbs en páginas Nivel 1. Mantenimiento de "← Volver a [Padre]" solo en Nivel 2. Eliminación duplicado "Ir al Taller" en `app/ayuda/page.tsx`.

### Fase 5 — Integración de Tasa BCV Automática (USD + EUR) ✅

- **Completado:** Creación de `lib/tasas/bcv-service.ts` con consumo de `ve.dolarapi.com` y fallback a `rates.dolarvzla.com`. Server Action `sincronizarTasaBcv()` en `app/tasas/actions.ts`. Actualización de pantalla `/tasas` y badge de tasa en `AppShell`.

### Fase 6 — Pruebas y Compuerta de Salida (DoD) ✅

- **Completado:** Escritura de tests unitarios para `bcv-service.ts`. `npm run typecheck` (0 errores). `npm test` (100% verde — 263 tests). `npm run lint` (0 errores, 0 warnings). `npm run build` (compilación exitosa).

### Fase 7 — Consistencia Visual de Cabeceras ✅

- **Completado:** Rediseño de `components/shell/page-header.tsx` como tarjeta unificada. Limpieza de `app/pedidos/nuevo/page.tsx`. Precarga de tasas BCV en `app/tasas/page.tsx`. Eliminación de redundancia del Euro.

### Fase 8 — Estandarización de Retorno, Cabeceras con Badges ✅

- **Completado:** Estandarización del botón de retorno `PageHeader`. Unificación de cabecera de `app/taller/taller-tablero.tsx` con `PageHeader` universal. Reorganización de widget de tasas en Sidebar. Agregado badges temáticos a cabeceras de 6 componentes. Auditoría de código.

### Fase 9 — Eliminación de Botones de Retorno Redundantes ✅

- **Completado:** Remoción de botones de retorno de 5 páginas. Limpieza de `PageHeader` (props muertos). Navegación centralizada en Sidebar persistente.

### Fase 10 — Migración de API de Tasas a DolarVZLA ✅

- **Completado:** Reimplementación de `bcv-service.ts` con consumo unificado de USD + EUR. Fallback automático a `ve.dolarapi.com`. Actualización de suite de pruebas con cobertura completa.

### Fase 11 — Simplificación de Pantalla de Tasas (2 Columnas) ✅

- **Completado:** Eliminación de formulario manual y `app/tasas/tasa-form.tsx`. Limpieza de server actions no usados. Reestructuración del layout con `grid-cols-1 lg:grid-cols-2`. Validación visual en resoluciones Desktop (1536x826) y Móvil (390x844).

### Fase 12 — Unificación de Shell en Página de Inicio ✅

- **Completado:** Migración de `app/page.tsx` para usar `AuthenticatedShell`. Eliminación de consulta manual redundante a `tasas_cambio`. Carga simultánea y homogénea de tasas USD y EUR.

### Fase 13 — Corrección de Taller y Especificaciones de Ítems ✅

- **Completado:** Corrección de la vista vacía del taller (columnas inexistentes `ancho`, `alto`, `notas` en `pedido_items` y `unidad_medida` en `servicios` — error 42703 en Supabase). Actualización de `PedidoTallerItem` y tarjeta de `app/taller/taller-tablero.tsx`.

### Fase 14 — Sincronización en Tiempo Real ✅

- **Completado:** `revalidatePath("/taller")` en `crearPedido`, `cambiarEstadoPedido` y `anularPedidoConAuditoria`. Suscripción Realtime a la tabla `pedidos`. Sincronización reactiva de props. Sondeo de respaldo continuo de 5 segundos. E2E verificada.

### Fase 15 — Optimización de Rendimiento y Caché ✅

- **Completado:** Sistema de caché con TTL e invalidación. Optimización de `AuthenticatedShell` y Server Actions. Pantallas esqueleto (`loading.tsx`) y `ShellSkeleton`.

### Fase 16 — Doble Vigencia de Tasas (Hoy vs. Mañana) ✅

- **Completado:** Funciones de detección de fecha BCV (`date > fechaHoy`) y resolución de vigencia temporal en zona horaria Caracas (UTC-4). Actualización de consultas en `app/pedidos/actions.ts` y `components/shell/authenticated-shell.tsx`.

### Fase 17 — Ergonomía del Sidebar ✅

- **Completado:** Aumento del espaciado vertical entre botones del sidebar a `space-y-1.5`. Eliminación de pantallas esqueleto de ruta. Implementación de `obtenerUsuarioSesion()` con `React.cache()` y paralelización de consultas de tasas.

### Fase 18 — Estabilidad de Prerenderizado ✅

- **Completado:** `performance.now()` en cálculo de TTL. Declaración de renderizado dinámico en `app/page.tsx`. `suppressHydrationWarning` en `<html>` y `<body>`. Validación en vivo.

### Fase 19 — Validación Rápida de JWT en Proxy ✅

- **Completado:** Extracción y validación local de JWT en memoria (< 1ms). Optimización de `proxy.ts` (Opción A + Opción B). Optimización de `lib/supabase/auth-cache.ts`.

### Fase 20 — Transición a Arquitectura Client-First ✅

- **Completado:** Diseño de `auth-context.tsx` y `tasas-context.tsx` (`"use client"`). Migración de `AuthenticatedShell` a componente de cliente. Desbloqueo de rutas operativas.

### Fase 21 — CustomSelect Universal ✅

- **Completado:** Adaptación de `CustomSelect.jsx` a TypeScript estricto. Migración a paleta Zinc de Tailwind v4. Integración en formularios (selector de clientes, selector de servicios). Validación con 198 tests Vitest.

### Fase 22 — Estilización de Barras de Desplazamiento ✅

- **Completado:** `color-scheme: dark;` en `app/globals.css`. Eliminación de scrollbars dobles anidadas en `components/ui/custom-select.tsx`. Micro-script preventivo en `<head>`.

### Fase 23 — Rediseño de Tarjeta de Tasas ✅

- **Completado:** Corrección de tasa EUR en sidebar. 3 alternativas UI/UX (Pestañas, Acordeón, Apilado). Selector interactivo en vivo.

### Fase 24 — Sincronización Autónoma de Tasas ✅

- **Completado:** Sincronización de tasas autónomas y reactivas. Robustez de login con ciclo `try...finally`. Rediseño Mobile-First en Dashboard y Rotación de Servicios.

### Fase 25 — Habilitación de Tasas de Cambio y Reorganización ✅

- **Completado:** Mover `Tasa de Cambio` a Gestión Comercial. Actualización de `sincronizarTasaBcv()` para roles `gerencial` y `operativo`. Migración RLS.

### Fase 26 — Afinación y Manuales ✅

- **Completado:** Vigencia 00:00 en `app/tasas/actions.ts`. Badges claros en Histórico. Script de restauración. Actualización de manuales.

### Fase 27 — Cron Job Automatizado ✅

- **Completado:** Handler seguro de cron. Programación dual en `vercel.json`.

### Fase 28 — Pulido Responsividad Móvil ✅

- **Completado:** Viewport meta, `min-w-0 max-w-full overflow-x-hidden`. PageHeader Universal. Dashboard Gerencial. Cuentas por Cobrar. Rotación de Servicios.

### Fase 29 — Blindaje Técnico y Gobernanza ✅

- **Completado:** Índices PostgreSQL compuestos. Validación Zod en Server Actions. Paginación por cursor. Alertas de Cron por Telegram.

### Fase 30 — Módulo Autónomo de Tasas BCV ✅

- **Completado:** Blueprint modular para IA. Lógica de calendario desacoplada. Sidebar e historial inteligentes.

### Fase 31 — Blindaje Estricto de Entregas ✅

- **Completado:** Validación de saldo (`saldo > 0` → bloqueo). Acción atómica `cobrarYEntregarPedido`. UX de Taller Kanban. Historial limpio.

### Fase 32 — Arquitectura Centralizada de Fechas ✅

- **Completado:** Módulo `lib/fechas.ts` como única fuente de verdad. Badge reactivo en vivo. Consistencia de estados de producción.

### Fase 33 — Sistema de Tema Tokyo Night ✅

- **Completado:** Paleta Tokyo Night (`#16161e`, `#1a1b26`, `#1f202c`, `#24283b`). ThemeProvider. Conmutador de tema. Rediseño de tarjetas por estado.

---

## 5. MÉTRICAS CLAVE

| Métrica                  | Valor                                                       |
| ------------------------ | ----------------------------------------------------------- |
| **Tests unitarios**      | 263 (Fase 6) → 216 (Fase 7) → 147 (Fase 15) → 153 (Fase 16) |
| **Tests E2E**            | Playwright (12 rutas verificadas en móvil)                  |
| **Typecheck**            | 0 errores (siempre)                                         |
| **ESLint**               | 0 errores, 0 warnings                                       |
| **Build Next.js**        | Exitoso (siempre)                                           |
| **Tests Vitest**         | 144 → 153 → 198 → 203 → 216 (variación por fase)            |
| **Latencia proxy**       | < 5ms (versión optimizada)                                  |
| **Tiempo de navegación** | < 80ms (target client-first)                                |

---

## 6. ESTRUCTURA DEL REPOSITORIO

```
APSys-Gemini/
├── app/                    # Rutas y vistas (App Router)
│   ├── layout.tsx          # Layout raíz con AppProviders, FechaEnVivoBadge
│   ├── page.tsx            # Inicio (Home)
│   ├── pedidos/            # Flujo de pedidos
│   │   ├── page.tsx        # Listado de pedidos
│   │   ├── nuevo/          # Formulario de nuevo pedido
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── estado-control.tsx
│   │   ├── boton-aviso-whatsapp.tsx
│   │   └── pedidos-buscador.tsx
│   ├── taller/             # Taller Kanban
│   │   ├── page.tsx        # Vista del taller
│   │   └── taller-tablero.tsx
│   ├── clientes/            # Directorio de clientes
│   ├── servicios/           # Catálogo de servicios
│   ├── tasas/               # Tasas BCV
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   └── bcv-sync-panel.tsx
│   ├── dashboard/           # Dashboard gerencial
│   ├── cuentas-por-cobrar/  # Cuentas por cobrar
│   ├── reportes/            # Reportes
│   ├── plantillas/          # Plantillas WhatsApp
│   ├── recordatorios/       # Recordatorios
│   ├── ayuda/               # Ayuda y tutorial
│   └── login/               # Login
├── lib/                    # Utilidades y lógica compartida
│   ├── tasas/               # Servicio BCV
│   ├── fechas/              # Módulo de fechas Caracas
│   ├── validaciones/        # Zod schemas
│   ├── paginacion/          # Paginación por cursor
│   ├── supabase/            # Cliente Supabase
│   └── pedidos/             # Lógica de pedidos
├── components/              # Componentes UI
│   ├── shell/               # Shell del sidebar, PageHeader, etc.
│   ├── ui/                  # UI componentes (CustomSelect, CursorPagination, etc.)
│   └── providers/           # Providers (Theme, Auth, etc.)
├── e2e/                     # Pruebas E2E (Playwright)
├── tasks/                   # Plan de ejecución
├── docs/                    # Documentación
│   ├── specs/               # PRD y especificaciones
│   ├── capacitacion/        # Guía rápida de usuarios
│   ├── operaciones/         # Runbooks y manuales
│   └── arquitectura/        # Manual técnico
├── supabase/                # Migraciones y rollback
├── .agents/                  # Pack de skills del proyecto
└── .env.local               # Variables de entorno (no commitarse)
```

---

## 7. PRUEBAS Y CI/CD

### Estructura de Pruebas

- **Unitarias** (Vitest + Testing Library, entorno jsdom): en `test/`, archivos `*.test.ts(x)`.
- **E2E** (Playwright, Chromium): en `e2e/`, archivos `*.spec.ts`. El servidor se levanta automáticamente.
- **CI** (`.github/workflows/ci.yml`): ejecuta lint, typecheck, unitarias, build y E2E en cada push a `main` y en cada PR.

### Métricas de Calidad

- `npm test` (100% verde — 263 tests en la fase más reciente)
- `npm run typecheck` (0 errores)
- `npm run lint` (0 errores, 0 warnings)
- `npm run build` (compilación exitosa)

---

## 8. RIESGOS Y MITIGACIONES

| Riesgo                              | Impacto | Mitigación                                                                      |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------- |
| Conectividad intermitente en taller | Medio   | UI reactiva client-first con tolerancia a reintentos; cache local de tasas      |
| Caída de APIs del BCV               | Medio   | Arquitectura dual DolarVZLA + fallback a DolarApi; última tasa persistida en BD |
| Volatilidad de tasa de cambio       | Alto    | Inmutabilidad financiera; tasa de mañana                                        |
| Fricción metodológica en hotfixes   | Medio   | Fast Lanes en AGENTS.md                                                         |
| Crecimiento acelerado de registros  | Medio   | Índices relacionales compuestos y paginación por cursor                         |

---

## 9. VERSIÓNES Y ROADMAP

| Versión                               | Alcance                                                                                               | Estado            | Criterio de Salida                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------- |
| **v0.9.2** (Producción actual)        | Navegación Client-First, motor doble vigencia BCV, sincronización Vercel Cron, Taller Kanban reactivo | ✅ **Completada** | 216 tests en verde, 0 errores TypeScript, desplegado en Vercel  |
| **v1.0.0** (Estabilidad & Gobernanza) | Índices PostgreSQL, validación Zod, paginación por cursor, alertas Telegram, Fast Lanes               | 🔄 **En Curso**   | Migración aplicada, suites Zod y paginación 100% verde          |
| **v1.1.0** (Potencia Comercial)       | Presupuestos en PDF vectorial, pagos mixtos multimoneda, suite E2E Playwright completa                | 📅 **Sprint 1**   | Generación de PDF validada, conciliación de pagos sin descuadre |
| **v1.2.0** (Planta Inteligente)       | WhatsApp Cloud API desatendido, módulo de inventario de bobinas, estimación predictiva                | 📅 **Sprint 2**   | Disparo automático de avisos en taller                          |

---

## 10. PRÓXIMOS PASOS

### Fase 1 — Gobernanza y Estabilización

1. **Ajustar frecuencia de Crons** en `vercel.json` (documentación UTC/Caracas y límites de planes Vercel).
2. **Adopción de Fast Lanes** en `AGENTS.md` para bugfixes cosméticos.
3. **Migración de Índices** en PostgreSQL (`0006_indices_rendimiento.sql`).
4. **Validación y Sanitización** en Server Actions (módulo `lib/validaciones/`).
5. **Manual Técnico y Arquitectura** (`docs/arquitectura/manual-tecnico-sistema.md`).
6. **Paginación por Cursor** en `/clientes` y `/pedidos`.
7. **Alertas de Cron** por Telegram (micro-webhook nativo).

### Fase 2 — Potencia Comercial

- Generación de PDF vectorial descargable.
- Desglose de Pagos Mixtos y Multimoneda (`pedido_pagos`).
- Suite E2E Playwright completa.

### Fase 3 — Planta Inteligente

- WhatsApp Cloud API desatendido.
- Módulo de inventario de bobinas y merma.
- Estimación predictiva de tiempos de entrega.

---

## 11. ANÁLISIS DE RIESGO Y COMPLEJIDAD

### 11.1 Nivel de Complejidad del Proyecto

**Nivel: Alto.** El proyecto presenta una **complejidad moderada-alta** debido a:

- **Múltiples módulos funcionales** interconectados (pedidos, taller, clientes, tasas, dashboard, etc.)
- **Arquitectura en evolución** (transición de server-components a client-first)
- **Integraciones externas** (Supabase, DolarVZLA, DolarApi, WhatsApp Cloud API)
- **Múltiples fuentes de verdad** (datos en BD, tasas en memoria, estados en estado del cliente)
- **Sistema de validaciones** (Zod, RLS, validaciones en Server Actions)
- **Sistema de caché** (TTL, memoria, localStorage, cache reactivo)

### 11.2 Puntos Críticos Identificados

1. **Sincronización de tasas BCV en tiempo real** — La implementación de `bcv-service.ts` con fallback dual (DolarVZLA + DolarApi) es un componente crítico. La tasa de hoy vs. mañana requiere manejo de fecha preciso en zona horaria Caracas (UTC-4).

2. **Navegación instantánea (Client-First)** — La migración de `export const instant = false; await connection()` a componentes reactivos en cliente es el eje central de la arquitectura. Cualquier regresión en este punto afectaría la latencia de navegación.

3. **Inmutabilidad financiera** — Cada orden congela su tasa oficial (`tasa_id`) y registra en `auditoria`. Esto es esencial para la integridad contable pero requiere cuidado en las transacciones de escritura.

4. **Sistema de Realtime (Supabase Realtime)** — La suscripción a la tabla `pedidos` en `app/taller/taller-tablero.tsx` con refresco automático instantáneo es un área de alto riesgo (re-escritura de `revalidatePath`).

5. **Validación de tipos** — Aunque `tsc --noEmit` siempre pasa, la complejidad del sistema requiere revisión constante de los tipos en `lib/tasas/bcv-service.ts` y `context/tasas-context.tsx`.

6. **Acceso a datos sensibles** — La validación RLS en PostgreSQL es crítica. El perfil operativo no debe ver totales financieros globales (RF-19).

---

## 12. RECOMENDACIONES EJECUTIVAS

### 12.1 Prioridades Inmediatas (Próximo Sprint)

1. **Finalizar v1.0.0**: Completar los índices PostgreSQL, validación Zod en Server Actions, paginación por cursor y alertas Telegram.
2. **Documentación técnica**: Actualizar `docs/arquitectura/manual-tecnico-sistema.md` y `docs/capacitacion/guia-rapida-usuarios.md`.
3. **Fast Lanes**: Formalizar la vía rápida TDD en `AGENTS.md` para evitar cuellos de botella.

### 12.2 Riesgos de Seguridad

- **Claves de servicio**: Verificar que no existan credenciales en el repositorio (`.env.local` no está en `.gitignore` — confirmar si esto es un error).
- **Supabase RLS**: Asegurar que las políticas de acceso sean estrictas y no permitan acceso no autorizado a datos sensibles.

### 12.3 Optimizaciones Recomendadas

- **Lazy loading de componentes**: Los componentes que no se usan en la pantalla inicial deben ser lazy-loaded.
- **Caching agresivo**: Implementar `React.cache()` para las consultas de usuario y tasas.
- **Streaming de datos**: Considerar el uso de Server Components para las vistas de datos pesados.

### 12.4 Recomendación de Mantenimiento

- **Sistema de CI/CD robusto**: Asegurar que las pruebas E2E se ejecuten con Chromium en cada push.
- **Monitoreo de métricas**: Implementar un dashboard de monitoreo para el sistema de tasas BCV.
- **Documentación de cambios**: Cada cambio en `lib/tasas/bcv-service.ts` debe actualizar `docs/arquitectura/manual-tecnico-sistema.md`.

---

## 13. RESUMEN EJECUTIVO FINAL

**APSys** es una plataforma web de gestión de pedidos para una gráfica, construida sobre una arquitectura moderna (Next.js + Tailwind + Supabase) con un fuerte enfoque en:

- **Velocidad de navegación** (client-first, navegación < 80ms)
- **Precisión financiera** (doble vigencia BCV, inmutabilidad, tasa de mañana)
- **Rendimiento** (caché, paginación por cursor, índices B-Tree)
- **Seguridad** (RLS, validación Zod, claves de servicio en servidor)
- **Accesibilidad** (WCAG 2.1 AA, contraste, navegación por teclado)

El proyecto está en su fase de **estabilidad y gobernanza** con un roadmap claro hacia **v1.1.0** (comercial) y **v1.2.0** (planta inteligente). Las métricas de calidad (tests, typecheck, lint, build) están consistentemente por encima del estándar.

---

_Este análisis fue generado el 19/10/2026 a partir de la revisión exhaustiva de los archivos del repositorio: `AGENTS.md`, `package.json`, `README.md`, `docs/specs/PRD-2026-10-001-sistema-gestion-pedidos.md`, `tasks/todo.md`, `tasks/plan.md`, `app/layout.tsx`, `app/page.tsx`, `app/pedidos/page.tsx`, `app/taller/page.tsx`, `app/taller/taller-tablero.tsx`, `app/tasas/page.tsx`, `app/tasas/actions.ts`, `app/validaciones.ts`, `app/pedidos/actions.ts`, `lib/tasas/bcv-service.ts`, `lib/fechas.ts`, `lib/validaciones/`, `lib/supabase/auth-cache.ts`, `lib/pedidos/estados.ts`, `lib/paginacion/cursor.ts`, `context/auth-context.tsx`, `context/tasas-context.tsx`, `components/shell/authenticated-shell.tsx`, `components/shell/page-header.tsx`, `components/providers/theme-provider.tsx`, `app/globals.css`, `app/layout.tsx`, y la estructura completa de `app/`, `lib/`, `components/`, `e2e/`, `tasks/`, `docs/`, `supabase/`, `scripts/`, `context/`, `public/`, `scratch/`, `certificates/`, `skills-lock.json`, `.agents/skills/`, `.env.local`, `.env.local.example`, `.gitignore`, `.prettierrc.json`, `eslint.config.mjs`, `next-env.d.ts`, `next.config.ts`, `tsconfig.json`, `vitest.config.mts`, `vitest.setup.ts`, `vercel.json`, `playwright.config.ts`, `proxy.ts`, `APSys-Gemini.code-workspace`, `CHANGELOG.md`, `.github/workflows/ci.yml`._
