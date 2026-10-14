# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

---

## [Unreleased]

### Added
- **Componente Universal `CustomSelect` (Fase 21)**: Selector accesible en TypeScript (`components/ui/custom-select.tsx`) estilizado con la paleta oficial Zinc de APSys.
  - Soporte para búsqueda reactiva en tiempo real sobre etiquetas y subtítulos.
  - Botón de acción rápida inferior (ej. `+ Registrar Nuevo Cliente`).
  - Navegación por teclado completa (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) y roles WAI-ARIA (`listbox`, `option`).
  - Variante `header` (píldora compacta para filtros) y variante `form` (para formularios y modales con input hidden para Server Actions).
  - Integración en formulario de nueva orden (`/pedidos/nuevo`) para clientes y servicios, y en filtros de `/dashboard/rotacion` y `/cuentas-por-cobrar`.
  - Cobertura de 12 pruebas unitarias en `test/custom-select.test.tsx` (198 pruebas totales en verde).

### Planned
- Preparación y auditoría final para el lanzamiento de la versión mayor `v1.0.0`.

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
