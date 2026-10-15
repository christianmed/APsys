# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

---

## [Unreleased]

### Planned
- Preparación y auditoría final para el lanzamiento de la versión mayor `v1.0.0`.

---

## [0.9.1] - 2026-10-14

### Added
- **Widget de Tasas Referenciales BCV en Sidebar con Acordeones Duales (Fase 23)**:
  - Componente `SidebarTasasCard` (`components/shell/sidebar-tasas-card.tsx`) con diseño de acordeones independientes para **Hoy** y **Mañana**.
  - Acordeón de Hoy con borde verde (`border-emerald-500/40`), fondo neutro y circulito verde encendido, abierto por defecto para consulta inmediata al cobrar.
  - Acordeón de Mañana con borde ámbar (`border-amber-500/50`), fondo neutro y circulito ámbar encendido cuando hay tasa oficial nueva emitida por el BCV.
  - Persistencia total del estado de apertura/cierre entre todas las vistas del sistema mediante `localStorage` y `useSyncExternalStore`.
  - Nuevo endpoint `/api/tasas/en-vivo` con cabecera `Cache-Control: no-store` para servir tasas oficiales de USD y EUR en <2ms.
  - Cobertura de pruebas unitarias en `test/sidebar-tasas-card.test.tsx` (202 pruebas totales en verde).
- **Componente Universal `CustomSelect` (Fase 21)**: Selector accesible en TypeScript (`components/ui/custom-select.tsx`) estilizado con la paleta oficial Zinc de APSys.
  - Búsqueda reactiva en tiempo real sobre nombres y subtítulos de clientes y servicios.
  - Botón de acción rápida inferior integrado (ej. `+ Registrar Nuevo Cliente`).
  - Navegación por teclado completa (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) y roles WAI-ARIA (`listbox`, `option`).
  - Variante `header` (píldora compacta para filtros) y variante `form` (para formularios y modales con input hidden).
  - Cobertura de 12 pruebas unitarias en `test/custom-select.test.tsx`.

### Fixed
- **Resolución de Tasa Euro (EUR) en Sidebar**: Conexión de `TasasContext` con el proveedor oficial BCV / DolarVZLA, extrayendo las tasas oficiales de USD y EUR tanto para el día de hoy como para el día de mañana, eliminando el guión (`—`) y mostrando valores precisos en bolívares.
- **Espaciado Superior en Acordeones**: Corrección del padding superior (`pt-2.5`) dentro del área desplegable de los acordeones, garantizando una separación limpia entre la línea divisoria y la primera pastilla de divisa.
- **Estilización de Barras de Desplazamiento en Modo Oscuro (Fase 22)**: Incorporación de `color-scheme: dark;` y reglas universales para scrollbars minimalistas (6px, canal transparente y pulgar gris grafito) en `app/globals.css`, eliminando las barras blancas nativas de Windows en el sidebar y tablas horizontales.
- **Eliminación de Scrollbars Anidadas en CustomSelect**: Supresión del `overflow-y-auto` en el contenedor exterior de `components/ui/custom-select.tsx`, eliminando la doble barra vertical paralela en formularios.
- **Desinfección de Atributos de Extensiones en DOM**: Integración de micro-script en `<head>` de `app/layout.tsx` con `MutationObserver` para remover atributos inyectados por extensiones de seguridad (`bis_skin_checked="1"`) antes de la hidratación de React 19, suprimiendo errores en consola y limpiando `suppressHydrationWarning` innecesario en páginas.
- **Sincronización de Versión en AppShell**: Actualización del badge visual de versión en el sidebar a `v0.9.1`.

---

## [0.9.0] - 2026-10-14

### Added

- **Centro de Mando y Dashboard Operativo**: Panel principal con métricas de órdenes activas, ingresos multimoneda y accesos rápidos por perfil.
- **Módulo de Recepción y Registro de Pedidos**: Registro ágil de servicios, cobro multimoneda (USD / Bs.), cálculo de saldos y numeración secuencial protegida contra concurrencia.
- **Comandas Imprimibles y Lectura Vectorial**: Impresión en formato A4 y ticket térmico en `/comanda/[id]`, con generación SVG de códigos de barras (Code128) y códigos QR.
- **Buscador Reactivo y Soporte para Lector USB**: Localización instantánea de pedidos por número y saneamiento automático de prefijos mediante escáner físico.
- **Tablero de Taller Táctil**: Vista optimizada para tablets y pantallas táctiles con máquina de estados estricta y transiciones a 1 clic.
- **Escaneo con Cámara Móvil**: Decodificación óptica de comandas en taller utilizando `BarcodeDetector` nativo del navegador.
- **Notificaciones y Recordatorios por WhatsApp**:
  - Enlace directo a `wa.me` con avisos personalizados de retiro.
  - Panel de pedidos listos sin retirar con alertas visuales por umbrales de 48 h (atención) y 72 h (urgente).
  - Editor de plantillas de mensajes con interpolación reactiva de variables y vista previa en tiempo real.
- **Gestión de Cuentas por Cobrar**: Cartera consolidada por tramos de vencimiento, alertas de morosidad y avisos formales por WhatsApp.
- **Historial y Recurrencia de Clientes**: Métricas de consumo acumulado, frecuencia de visitas y ficha unificada por cliente.
- **Rotación y Demanda de Servicios**: Ranking de facturación y análisis de servicios más solicitados.
- **Gestión Oficial de Tasas BCV**:
  - Consulta automática contra API de tasas oficiales del Banco Central de Venezuela (USD y EUR).
  - Doble vigencia horaria programada (tasa de hoy vs. tasa proyectada para mañana).
  - Congelamiento inmutable de la tasa al momento de emitir la orden para proteger presupuestos históricos.
  - Sincronización en tiempo real vía WebSockets de Supabase (`postgres_changes`) para que el sidebar y convertidores se actualicen sin refrescar la página.
- **Reportes Contables y Auditoría**:
  - Exportación de libros contables en CSV y vista de impresión para PDF.
  - Protocolo de anulación con motivo obligatorio y registro inmutable en base de datos.
- **Guía Rápida Interactiva**: Módulo `/ayuda` con manual operativo paso a paso según el rol del usuario.
- **Suite de Pruebas Automatizadas**: 186 pruebas unitarias y de integración con Vitest y pruebas E2E con Playwright.

### Changed

- **Arquitectura SPA Client-First (Fase 20)**:
  - Migración desde Server-First a Client-First con proveedores centrales `AuthProvider` y `TasasProvider`.
  - Navegación instantánea entre módulos sin recargas de página completas ni parpadeos (0 ms visual perceptible).
  - Centralización del handshake dinámico `connection()` dentro de la capa de datos (`obtenerUsuarioSesion()` y `createClient()`), eliminando código repetido en las 18 páginas del sistema.
- **Rediseño UX/UI del App Shell**: Cabeceras unificadas, barra lateral persistente con widget vertical de tasas BCV y modo oscuro de alta fidelidad.
- **Tablero de Taller en Memoria**: El estado del tablero se actualiza de forma inmediata e interactiva, con fallback a persistencia asíncrona en Supabase.

### Fixed

- **Next.js 16 Prerender Turbopack**: Resolución del error `blocking-prerender-current-time` provocado por la lectura síncrona de `Date.now()` en el SDK de autenticación.
- **Mapeo de Pedidos en Taller**: Desacoplamiento de la lógica de transformación a un módulo puro en `lib/pedidos/taller-mapper.ts` evitando violaciones de Server Components.
- **Sincronización en Vivo del Sidebar**: Integración de `refrescarTasas()` y revalidación reactiva tras presionar el botón de sincronización de tasas BCV.
- **Alineación Visual en Tasas**: Centrado vertical equilibrado de la tarjeta "Inmutabilidad Histórica".

### Performance

- **Caché en Memoria para Tasas**: Almacenamiento volátil para evitar llamadas redundantes a la API externa de tasas durante picos de tráfico.
- **Validación Rápida de Sesión en Proxy**: Verificación local de JWT para reducir latencias en transiciones de ruta protegidas.

### Security

- **Row Level Security (RLS)**: Políticas estrictas a nivel de PostgreSQL protegiendo lectura y escritura según el rol (`admin`, `gerencial`, `operativo`).
- **Pistas de Auditoría Inmutables**: Registros de anulación y congelamiento de tasas históricas sin posibilidad de alteración manual.
- **Variables de Entorno y Headers de Seguridad**: Cabeceras HTTP endurecidas en despliegue de Vercel y cero credenciales expuestas en frontend.
