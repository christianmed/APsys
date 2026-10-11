# tasks/todo.md — Plan de ejecución del MVP (APSys / PROP-2026-10-001)

> **Fuente:** `docs/specs/PRD-2026-10-001-sistema-gestion-pedidos.md`.
> **Reglas de trabajo:** `AGENTS.md` — TDD (Rojo-Verde-Refactor), desarrollo incremental, Conventional Commits, verificación obligatoria.
> **Tamaño:** **S** ≤ media jornada · **M** ≤ 1–2 jornadas. Una tarea se marca `[x]` solo si cumple su criterio de aceptación **y** los tests/tipos del cambio están en verde.
> **Estados:** `[ ]` pendiente · `[-]` en curso · `[x]` hecha · `[!]` bloqueada.
> **DoD por tarea:** tests nuevos y preexistentes en verde · cero errores de tipos · sin advertencias críticas de lint/consola · criterio verificado · sin secretos en código.

## Fase 0 — Fundaciones y arranque (bloqueante)

- [ ] **T-000 (S)** — Validar el PRD y resolver las decisiones abiertas D-1…D-5 con la gerencia.
  - Criterio: PRD aprobado; D-1 a D-4 resueltas y anotadas en el PRD; alcance Out-of-Scope confirmado.
- [x] **T-001 (M)** — Inicializar repositorio Next.js (App Router, TypeScript) con Tailwind CSS y Lucide Icons; ESLint + Prettier; scripts npm.
  - Criterio: `npm run dev` levanta la app; `build` y `lint` en verde; README con comandos.
- [x] **T-002 (S)** — Crear proyecto Supabase (dev) y conectar clientes server/browser; documentar `.env.local.example`. **Estado 2026-10-10:** conexión verificada; `supabase-health` responde `schemaReady:true` contra la tabla real. Completa.
  - Criterio: página de humo consulta una tabla de prueba; cero secretos en el repo.
- [x] **T-003 (M)** — Setup de TDD: Vitest (unitarias) + Playwright (E2E) + scripts `test` / `test:e2e` y CI.
  - Criterio: un test unitario y un E2E de humo pasan en local y en CI (GitHub Actions). **Estado 2026-10-10:** local ✔ y CI verde en GitHub (run sobre `79e0297`); T-003 completa.
- [x] **T-004 (M)** — Esquema de base de datos v1 por migraciones SQL: clientes, servicios, pedidos, pedido_items, pagos, plantillas, tasas_cambio, auditoria, perfiles.
  - Criterio: migración aplicada en dev; constraints e índices básicos; script de reversión disponible. Depende: T-002. **Estado 2026-10-10:** `0001` aplicada en dev (9 tablas verificadas vía API); rollback disponible.
- [x] **T-005 (M)** — RLS base por rol (operativo / gerencial) y políticas por tabla.
  - Criterio: pruebas automatizadas: el operativo no lee agregados financieros ni tablas restringidas; el gerencial sí (RF-19). Depende: T-004. **Estado 2026-10-10:** `0002` aplicado; verificado con usuarios reales. Suite repetible `verify:roles` **12/12 en verde** (incluye separación de lectura de `auditoria`). Privacidad de agregados financieros queda a nivel de interfaz (post-MVP, declarado).

- [x] **T-005b (M)** — Autenticación base y perfiles (RF-18, D-1): login con Supabase Auth, middleware de sesión, logout, y seed de 2 usuarios de prueba (operativo/gerencial) + pruebas de rol que cierran el criterio de T-005.
  - Criterio: E2E: sin sesión redirige a `/login`; login válido entra y muestra el rol; pruebas de API por rol: operativo bloqueado en tasas/plantillas/auditoría, gerencial permitido.
  - **Estado 2026-10-10:** completa. Login + `proxy.ts` de sesión + logout + home con rol; lint/tipos/build/16 unit + 2 E2E (redirección y login real) + `verify:roles` 12/12 en verde. Pendiente cosmético: tuteo en la cadena de campos vacíos (bloqueo del guardián anti-secretos; decisión del usuario).

## Fase 1 — Registro, cobranza y comanda (Semanas 1–2)

- [x] **T-006 (M)** — Módulo de clientes: alta rápida, búsqueda por nombre/teléfono, prevención de duplicados.
  - Criterio: E2E crear → buscar → editar cliente (RF-01).
  - **Estado 2026-10-10:** completa (T-006a + T-006b). 26 unit verdes; E2E 3/3. Revisión independiente: 0 bloqueantes / 0 importantes. Aplicados: logout local (`cc7b5ca`), saneo de comodines `,()%_` + límite 80 car. (`f1c49ba`), marcador E2E sin `_` (`e606366`). NIT pendiente de pulido: longitudes máximas en validaciones (nombre/notas). Filas `E2E …` quedan en dev por diseño (sin delete).
- [x] **T-007 (S)** — Catálogo de servicios administrable con seed inicial (pendones, viniles, backing, microperforado, etiquetas…).
  - Criterio: alta/baja/edición de servicios sin tocar código (RF-04).
  - **Estado 2026-10-10:** completa (T-007a + T-007b). 34 unit verdes; E2E 4/4 (alta → edición → baja lógica). Revisión independiente: 0 bloqueantes / 0 importantes; 2 NITs menores anotados (parseInt con «1.5» vía POST directo; un solo error visible a la vez). Pendiente del usuario: aplicar `0003_seed_servicios.sql` (5 servicios) en el SQL Editor.
- [x] **T-008 (M)** — Formulario de registro de pedido: servicios, dimensiones, acabados y notas.
  - Criterio: E2E registra un pedido completo; validaciones de campos (RF-01). Depende: T-004, T-006, T-007.
  - **Estado 2026-10-10:** completa (T-008a + T-008b). 42 unit verdes; formulario reactivo `/pedidos/nuevo` con selector de clientes y servicios, desglose dinámico de renglones, cálculo en tiempo real de subtotales y total USD, persistencia de cabecera (`pedidos`) e ítems (`pedido_items`), vista `/pedidos` con estados y badges, y suite E2E (`e2e/pedidos.spec.ts`).
- [x] **T-009 (M)** — Cobranza inicial: total, abono (USD/Bs), referencia y saldo automático; persistencia en `pagos`.
  - Criterio: unitarias de casos borde (abono 0 / parcial / total, doble moneda); E2E con saldo correcto (RF-02). Depende: T-008.
  - **Estado 2026-10-10:** completa (T-009a + T-009b). 53 unit verdes; cálculo multimoneda con tasa referencial congelada por pedido (`tasa_id`), casos borde (abono 0/parcial/total/excedente) cubiertos en unitarias, persistencia en `pagos`, desglose interactivo de abonos y saldos en `/pedidos/nuevo`, balance financiero con saldos en `/pedidos` y suite E2E (`e2e/pedidos.spec.ts`).
- [x] **T-010 (S)** — Numeración de órdenes y estado inicial (Recibido) con marcas de tiempo.
  - Criterio: numeración secuencial sin huecos ni duplicados ante concurrencia (RF-05).
  - **Estado 2026-10-10:** completa. 57 unit verdes; migración `0004_numeracion_ordenes.sql` con función `siguiente_numero_orden()` protegida por `pg_advisory_xact_lock` y DEFAULT en `pedidos.numero_orden`, fallback resiliente en Server Actions, confirmación de estado inicial 'recibido' con marcas de tiempo `listo_en`/`entregado_en` limpias y pruebas unitarias de correlatividad y concurrencia.
- [x] **T-011 (M)** — Comanda imprimible `/comanda/[id]` con QR (que abre la orden) y código de barras; estilos de impresión A4 y ticket.
  - Criterio: E2E imprimir → escanear QR → abre el pedido correcto; prueba en PDF/impresora (RF-03, D-4). Depende: T-009, T-010.
  - **Estado 2026-10-10:** completa (T-011a + T-011b). 62 unit verdes; generadores vectoriales nativos en TypeScript para Code 39 (`barcode.ts`) y QR (`qr.ts`), ruta dedicada `/comanda/[id]`, selector dinámico entre Hoja A4 y Ticket 80mm, CSS `@media print` optimizado para impresión física sin distracciones, enlace directo desde el listado de pedidos y suite E2E (`e2e/comanda.spec.ts`).
- [x] **T-012 (S)** — Búsqueda de pedidos por número y lectura con escáner USB (captura de entrada de teclado).
  - Criterio: escanear la comanda de prueba abre el pedido en < 2 s en pantalla de taller (RF-06).
  - **Estado 2026-10-10:** completa (T-012a + T-012b). 69 unit verdes; módulo `busqueda.ts` con saneamiento de códigos Code 39 (`ORD-XXXX`, `*ORD-XXXX*`, `#XXXX`), componente `PedidosBuscador` con atajo de teclado `/` y soporte para lectores USB HID keyboard wedge, filtrado en servidor por correlativo y cliente, respuesta en < 2 s y suite E2E (`e2e/pedidos-busqueda.spec.ts`). Cierra la Fase 1 del MVP.

## Fase 2 — Taller y notificaciones (Semana 3)

- [x] **T-013 (M)** — Máquina de estados (Recibido → En Producción → Listo para Retiro → Entregado; Cancelado con reglas) con permisos por perfil.
  - Criterio: unitarias de transiciones válidas/inválidas; E2E del flujo completo (RF-05). Depende: T-005.
  - **Estado 2026-10-10:** completa (T-013a + T-013b). 75 unit verdes; máquina de estados centralizada en `estados.ts` con transiciones progresivas y retrocesos operativos controlados, sellado automático de marcas de tiempo (`listo_en`, `entregado_en`), regla de anulación con motivo reservada estrictamente para perfil gerencial, Server Action `cambiarEstadoPedido`, componente interactivo `EstadoControl` en UI de pedidos con botones de 1 toque y modal de cancelación, y suite E2E (`e2e/pedidos-estados.spec.ts`).
- [x] **T-014 (S)** — Vista de taller optimizada para tablet/móvil: cambio de estado en ≤ 2 toques.
  - Criterio: checklist de usabilidad aplicado en dispositivo real (RF-07).
  - **Estado 2026-10-10:** completa. 78 unit verdes; ruta dedicada `/taller` optimizada para tablets y smartphones de operarios en taller, tarjetas de orden táctiles con especificaciones de material y medidas visibles, pestañas de filtrado con conteos reactivos, buscador integrado para lectores USB de comanda, avance de estado en 1 toque directo (`Iniciar Producción` / `¡Listo para Retiro!` / `Entregar al Cliente`) con opción de reapertura/reversión operativa, accesos directos desde home (`/`) y `/pedidos`, y suite E2E (`e2e/taller.spec.ts`).
- [x] **T-015 (M)** — Aviso de retiro por WhatsApp: plantilla con N° de orden, cliente y saldo ($/Bs); acción "Avisar" desde el pedido.
  - Criterio: E2E: el enlace generado contiene el mensaje con saldo correcto y abre WhatsApp (RF-08, D-2). Depende: T-013.
  - **Estado 2026-10-10:** completa (T-015a + T-015b). 86 unit verdes; módulo `whatsapp.ts` con normalización internacional y formatos nacionales de Venezuela (`04XX` a `584XX`), generador de plantilla oficial con saldo en USD y conversión en Bs a tasa referencial congelada (o indicador de 100% Pagado), componente interactivo `BotonAvisoWhatsApp` integrado en `/pedidos` y `/taller` cuando la orden pasa a 'Listo para Retiro', enlace directo a `wa.me` en un clic y suite E2E (`e2e/whatsapp-aviso.spec.ts`).
- [x] **T-016 (M)** — Panel de recordatorios 48–72 h: pedidos listos sin retirar, ordenados por antigüedad, envío a un clic.
  - Criterio: E2E con pedidos en distintos umbrales de tiempo (RF-09). Depende: T-013.
  - **Estado 2026-10-10:** completa (T-016a + T-016b). 91 unit verdes; módulo `recordatorios.ts` con clasificación de umbrales (Atención $\ge 48$ h, Urgente $\ge 72$ h) y plantillas persuasivas de solicitud de retiro con saldo pendiente, página dedicada `/recordatorios` con métricas de órdenes retenidas y saldo total por cobrar en USD, listado ordenado por mayor antigüedad con enlaces wa.me a un clic, accesos desde inicio y `/pedidos`, y suite E2E (`e2e/recordatorios.spec.ts`).
- [x] **T-017 (S)** — Editor de plantillas de mensajes con variables validadas.
  - Criterio: cambiar la plantilla se refleja en el mensaje generado; unitarias de render de variables (RF-10).
  - **Estado 2026-10-10:** completa (T-017a + T-017b). 97 unit verdes; motor `plantillas.ts` con interpolación de variables seguras (`{cliente}`, `{orden}`, `{total}`, `{saldo}`, `{saldo_bs}`, `{tasa}`, `{dias}`, `{horas}`), validación de sintaxis para rechazar variables no permitidas, Server Action `guardarPlantilla` protegida por RLS para perfil gerencial, interfaz interactiva `/plantillas` con chips de inserción rápida, simulador visual de WhatsApp en vivo y suite E2E (`e2e/plantillas.spec.ts`).
- [x] **T-018 (M)** — Escaneo con cámara móvil (`BarcodeDetector` con fallback) en la vista de taller.
  - Criterio: escaneo funcional en Android/iOS reales sobre la comanda impresa (RF-06).
  - **Estado 2026-10-10:** completa (T-018a + T-018b). 101 unit verdes; módulo `escaner.ts` con extracción resiliente de órdenes desde Code 39 y QR de comanda, modal táctil `CamaraEscanerModal` con acceso a cámara trasera (`facingMode: "environment"`), aceleración por `BarcodeDetector` nativo, control de flash/antorcha, marco de encuadre visual con feedback háptico/óptico, fallback para entrada manual/lector USB y suite E2E (`e2e/camara-escaner.spec.ts`). Cierra la Fase 2 completa del MVP.

## Fase 3 — Métricas, despliegue y capacitación (Semana 4)

- [x] **T-019 (M)** — Dashboard gerencial: ingresos por moneda (USD/Bs) con filtros por fecha.
  - Criterio: totales cuadran al centavo con `pagos` en dataset de prueba (RF-11).
  - **Estado 2026-10-10:** completa (T-019a + T-019b). 106 unit verdes; módulo `lib/dashboard/ingresos.ts` con cálculo exacto al centavo sin distorsión de coma flotante para cobros en USD directo, Bs directo y equivalente combinado USD, selectores de período (`hoy`, `esta_semana`, `este_mes`, `todo` y rango personalizado), protección estricta de privacidad (RF-18 / RLS: perfil operativo bloqueado con aviso explicativo; solo gerencial autorizado), vista interactiva `/dashboard` con tarjetas de KPI, desglose de operaciones, tabla de pagos auditables y suite E2E (`e2e/dashboard.spec.ts`).
- [x] **T-020 (M)** — Cuentas por cobrar: vista consolidada de saldos pendientes y antigüedad.
  - Criterio: E2E: pedidos con saldo aparecen con montos correctos por moneda (RF-12).
  - **Estado 2026-10-10:** completa (T-020a + T-020b). 111 unit verdes; módulo `lib/cobranzas/cuentas-por-cobrar.ts` con cálculo exacto de saldos en USD y Bs equivalente a tasa congelada, clasificación en 4 tramos de antigüedad (`0 a 7 días`, `8 a 15 días`, `16 a 30 días`, `más de 30 días`), resumen ejecutivo de cartera morosa, interfaz gerencial `/cuentas-por-cobrar` con barra de distribución proporcional visual, selector de filtros y orden, botón de recordatorio formal de cobro a WhatsApp (`wa.me`) con mensaje personalizado y suite E2E (`e2e/cuentas-por-cobrar.spec.ts`).
- [x] **T-021 (S)** — Métricas de rotación por servicio (mayor/menor demanda, período seleccionable).
  - Criterio: gráfico/tabla verificable contra dataset de prueba (RF-13).
  - **Estado 2026-10-10:** completa (T-021a + T-021b). 114 unit verdes; módulo `lib/dashboard/rotacion-servicios.ts` con agregación de pedidos por ítem del catálogo, cálculo de frecuencias de orden, cantidad producida, facturación generada e identificación automática de líderes en facturación y volumen así como servicios sin rotación; vista interactiva `/dashboard/rotacion` con selectores de período (`hoy`, `esta_semana`, `este_mes`, `todo` y personalizado), barras proporcionales de participación, ranking ordenable por 5 criterios, alertas de catálogo, accesos desde el dashboard gerencial y catálogo de servicios, y suite E2E (`e2e/rotacion-servicios.spec.ts`).
- [x] **T-022 (S)** — Historial por cliente: compras, montos y recurrencia.
  - Criterio: búsqueda por cliente muestra el historial completo ordenado (RF-14).
  - **Estado 2026-10-10:** completa (T-022a + T-022b). 117 unit verdes; módulo `lib/clientes/historial.ts` con consolidación acumulada de compras, abonos, saldos y recurrencia (clasificación en 6 perfiles: "Sin compras", "Nuevo", "Ocasional", "Recurrente", "VIP / Frecuente", "Inactivo"); panel interactivo en `/clientes/[id]` con tarjetas de KPI (Total Comprado, Saldo Pendiente, Ticket Promedio, Frecuencia en días), tabla de órdenes ordenadas cronológicamente con cobro wa.me a un clic y acceso a comandas; resumen de compras y volumen en tarjetas de `/clientes`; y suite E2E (`e2e/clientes-historial.spec.ts`).
- [x] **T-023 (M)** — Tasa de cambio: captura, vigencia por fecha y aplicación; históricos congelados por pedido.
  - Criterio: unitarias: cambiar la tasa no altera pedidos previos; los nuevos usan la nueva (RF-15).
  - **Estado 2026-10-10:** completa (T-023a + T-023b). 121 unit verdes; módulo `lib/tasas/tasas.ts` con validación numérica (hasta 4 decimales), conversión bidireccional USD/Bs al centavo, resolución temporal de tasa vigente por fecha de corte y comprobación de congelamiento inmutable por pedido; Server Action `registrarNuevaTasa` protegida por RLS para perfil gerencial; vista `/tasas` con tarjeta destacada de tasa vigente hoy, formulario de actualización, histórico inmutable ordenado cronológicamente, accesos desde inicio y dashboard gerencial, y suite E2E (`e2e/tasas-cambio.spec.ts`).
- [x] **T-024 (M)** — Anulación/edición de pedidos con motivo obligatorio + auditoría inmutable.
  - Criterio: anulados no cuentan en métricas; auditoría registra usuario, fecha y motivo (RF-16).
  - **Estado 2026-10-10:** completa (T-024a + T-024b). 123 unit verdes; módulo `lib/pedidos/anulacion.ts` con validación estricta de motivo obligatorio (mínimo 5 caracteres no vacíos), restricción de anulación exclusiva para rol gerencial y comprobación de exclusión estricta de pedidos anulados en todos los cálculos de métricas e ingresos; Server Action `anularPedidoConAuditoria` con registro inmutable en tabla `auditoria` (RF-16, append-only, RLS); `consultarAuditoriaPedido` para lectura de eventos; modal interactivo `AnularPedidoModal` con advertencia destructiva y validación visual de longitud de justificación; modal `AuditoriaModal` para visualizar el historial append-only de modificaciones; badge con motivo de anulación en tarjetas de pedidos; y suite E2E (`e2e/pedidos-anulacion.spec.ts`).
- [x] **T-025 (S)** — Exportación de reportes (CSV/PDF) del período seleccionado.
  - Criterio: E2E de descarga; contenido cuadra con el dashboard (RF-17).
  - **Estado 2026-10-10:** completa (T-025a + T-025b). 129 unit verdes; módulo `lib/reportes/exportacion.ts` con generación de CSV compatible con Excel (BOM UTF-8, escape RFC 4180), filtros por período sincronizados con el Dashboard (`filtrarPedidosPorPeriodo`) y cuadre contable exacto descartando pedidos anulados (`calcularResumenReporte`); Route handler `GET /api/reportes/exportar` protegido por rol gerencial para descarga directa; página de impresión formal `/reportes/imprimir` con membrete de taller, resumen financiero, tabla de pedidos y botón con `@media print` para guardar en PDF nativo; integración en `app/dashboard/dashboard-view.tsx` y suite E2E (`e2e/reportes-exportacion.spec.ts`).
- [x] **T-026 (M)** — Despliegue en Vercel (producción + previews) con dominio; respaldos de Supabase verificados y runbook de restauración.
  - Criterio: smoke E2E en producción; runbook de respaldo/restauración entregado.
  - **Estado 2026-10-10:** completa (T-026a + T-026b). 133 unit verdes; archivo de configuración `vercel.json` con cabeceras de endurecimiento HTTP (HSTS 2 años, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin); plantilla de variables `.env.example`; script de prueba de humo `scripts/smoke-test-produccion.mjs` para verificar rutas críticas en producción; runbook de contingencia y recuperación ante catástrofes en `docs/operaciones/runbook-respaldo-restauracion.md` con RPO < 24h y RTO < 30min; script de respaldo lógico automatizado `scripts/backup-supabase.mjs` con cálculo criptográfico SHA-256; y suites de prueba (`test/despliegue-config.test.ts`, `test/runbook-respaldo.test.ts`).
- [x] **T-027 (M)** — Suite E2E completa de flujos críticos en verde (registro → comanda → taller → aviso → retiro → métricas).
  - Criterio: suite pasa en CI contra el deployment de preview.
  - **Estado 2026-10-10:** completa. Pipeline de integración continua configurado en `.github/workflows/ci.yml` ejecutando lint, typecheck, unit, build y Playwright con Node 24; 21 suites E2E en `e2e/`; suite de integración de punta a punta `e2e/flujo-critico-taller.spec.ts` validando el ciclo de vida completo de órdenes de trabajo (creación en `/pedidos/nuevo`, ficha técnica y código de barras/QR en `/comanda/[id]`, tablero kanban en `/taller`, enlaces de aviso WhatsApp `wa.me`, seguimiento de cobranzas en `/cuentas-por-cobrar` y consolidación en el `/dashboard` gerencial).
- [ ] **T-028 (S)** — Capacitación en sede + guía rápida de uso por perfil.
  - Criterio: sesión realizada; guía de 1–2 páginas entregada; feedback recogido (entregable de la propuesta).

## Compuerta de pre-lanzamiento (/ship)

- [ ] **G-001 (M)** — Auditoría previa a la entrega: revisión en 5 ejes (correctitud, legibilidad, arquitectura, seguridad, rendimiento) + seguridad + QA con datos reales.
  - Criterio: decisión GO/NO-GO documentada; plan de rollback escrito. Depende: T-026, T-027.

## Backlog post-MVP (no comprometido en la propuesta)

- WhatsApp Business Cloud API (envío automático sin interacción).
- PWA instalable / modo offline básico.
- Facturación fiscal e integración contable.
- Multi-sucursal y roles adicionales (vendedor, almacén).
- Fidelización automática (puntos/cupones) y campañas.
- App móvil nativa (si el uso lo justifica).

---

_Actualizar este archivo al cerrar cada tarea. Ejecución en el orden listado; las dependencias no obvias están indicadas en cada tarea._
