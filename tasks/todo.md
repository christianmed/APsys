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
- [ ] **T-002 (S)** — Crear proyecto Supabase (dev) y conectar clientes server/browser; documentar `.env.local.example`. **⏳ Acción del usuario:** crear el proyecto Supabase (dev) y pegar URL + anon key en `.env.local`.
  - Criterio: página de humo consulta una tabla de prueba; cero secretos en el repo.
- [-] **T-003 (M)** — Setup de TDD: Vitest (unitarias) + Playwright (E2E) + scripts `test` / `test:e2e` y CI.
  - Criterio: un test unitario y un E2E de humo pasan en local y en CI (GitHub Actions). **Estado 2026-10-10:** local ✔ (lint/typecheck/build/unit/E2E en verde, revisión independiente); pendiente: push a GitHub para evidenciar CI.
- [ ] **T-004 (M)** — Esquema de base de datos v1 por migraciones SQL: clientes, servicios, pedidos, pedido_items, pagos, plantillas, tasas_cambio, auditoria, perfiles.
  - Criterio: migración aplicada en dev; constraints e índices básicos; script de reversión disponible. Depende: T-002.
- [ ] **T-005 (M)** — RLS base por rol (operativo / gerencial) y políticas por tabla.
  - Criterio: pruebas automatizadas: el operativo no lee agregados financieros ni tablas restringidas; el gerencial sí (RF-19). Depende: T-004.

## Fase 1 — Registro, cobranza y comanda (Semanas 1–2)

- [ ] **T-006 (M)** — Módulo de clientes: alta rápida, búsqueda por nombre/teléfono, prevención de duplicados.
  - Criterio: E2E crear → buscar → editar cliente (RF-01).
- [ ] **T-007 (S)** — Catálogo de servicios administrable con seed inicial (pendones, viniles, backing, microperforado, etiquetas…).
  - Criterio: alta/baja/edición de servicios sin tocar código (RF-04).
- [ ] **T-008 (M)** — Formulario de registro de pedido: servicios, dimensiones, acabados y notas.
  - Criterio: E2E registra un pedido completo; validaciones de campos (RF-01). Depende: T-004, T-006, T-007.
- [ ] **T-009 (M)** — Cobranza inicial: total, abono (USD/Bs), referencia y saldo automático; persistencia en `pagos`.
  - Criterio: unitarias de casos borde (abono 0 / parcial / total, doble moneda); E2E con saldo correcto (RF-02). Depende: T-008.
- [ ] **T-010 (S)** — Numeración de órdenes y estado inicial (Recibido) con marcas de tiempo.
  - Criterio: numeración secuencial sin huecos ni duplicados ante concurrencia (RF-05).
- [ ] **T-011 (M)** — Comanda imprimible `/comanda/[id]` con QR (que abre la orden) y código de barras; estilos de impresión A4 y ticket.
  - Criterio: E2E imprimir → escanear QR → abre el pedido correcto; prueba en PDF/impresora (RF-03, D-4). Depende: T-009, T-010.
- [ ] **T-012 (S)** — Búsqueda de pedidos por número y lectura con escáner USB (captura de entrada de teclado).
  - Criterio: escanear la comanda de prueba abre el pedido en < 2 s en pantalla de taller (RF-06).

## Fase 2 — Taller y notificaciones (Semana 3)

- [ ] **T-013 (M)** — Máquina de estados (Recibido → En Producción → Listo para Retiro → Entregado; Cancelado con reglas) con permisos por perfil.
  - Criterio: unitarias de transiciones válidas/inválidas; E2E del flujo completo (RF-05). Depende: T-005.
- [ ] **T-014 (S)** — Vista de taller optimizada para tablet/móvil: cambio de estado en ≤ 2 toques.
  - Criterio: checklist de usabilidad aplicado en dispositivo real (RF-07).
- [ ] **T-015 (M)** — Aviso de retiro por WhatsApp: plantilla con N° de orden, cliente y saldo ($/Bs); acción "Avisar" desde el pedido.
  - Criterio: E2E: el enlace generado contiene el mensaje con saldo correcto y abre WhatsApp (RF-08, D-2). Depende: T-013.
- [ ] **T-016 (M)** — Panel de recordatorios 48–72 h: pedidos listos sin retirar, ordenados por antigüedad, envío a un clic.
  - Criterio: E2E con pedidos en distintos umbrales de tiempo (RF-09). Depende: T-013.
- [ ] **T-017 (S)** — Editor de plantillas de mensajes con variables validadas.
  - Criterio: cambiar la plantilla se refleja en el mensaje generado; unitarias de render de variables (RF-10).
- [ ] **T-018 (M)** — Escaneo con cámara móvil (`BarcodeDetector` con fallback) en la vista de taller.
  - Criterio: escaneo funcional en Android/iOS reales sobre la comanda impresa (RF-06).

## Fase 3 — Métricas, despliegue y capacitación (Semana 4)

- [ ] **T-019 (M)** — Dashboard gerencial: ingresos por moneda (USD/Bs) con filtros por fecha.
  - Criterio: totales cuadran al centavo con `pagos` en dataset de prueba (RF-11).
- [ ] **T-020 (M)** — Cuentas por cobrar: vista consolidada de saldos pendientes y antigüedad.
  - Criterio: E2E: pedidos con saldo aparecen con montos correctos por moneda (RF-12).
- [ ] **T-021 (S)** — Métricas de rotación por servicio (mayor/menor demanda, período seleccionable).
  - Criterio: gráfico/tabla verificable contra dataset de prueba (RF-13).
- [ ] **T-022 (S)** — Historial por cliente: compras, montos y recurrencia.
  - Criterio: búsqueda por cliente muestra el historial completo ordenado (RF-14).
- [ ] **T-023 (M)** — Tasa de cambio: captura, vigencia por fecha y aplicación; históricos congelados por pedido.
  - Criterio: unitarias: cambiar la tasa no altera pedidos previos; los nuevos usan la nueva (RF-15).
- [ ] **T-024 (M)** — Anulación/edición de pedidos con motivo obligatorio + auditoría inmutable.
  - Criterio: anulados no cuentan en métricas; auditoría registra usuario, fecha y motivo (RF-16).
- [ ] **T-025 (S)** — Exportación de reportes (CSV/PDF) del período seleccionado.
  - Criterio: E2E de descarga; contenido cuadra con el dashboard (RF-17).
- [ ] **T-026 (M)** — Despliegue en Vercel (producción + previews) con dominio; respaldos de Supabase verificados y runbook de restauración.
  - Criterio: smoke E2E en producción; runbook de respaldo/restauración entregado.
- [ ] **T-027 (M)** — Suite E2E completa de flujos críticos en verde (registro → comanda → taller → aviso → retiro → métricas).
  - Criterio: suite pasa en CI contra el deployment de preview.
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

*Actualizar este archivo al cerrar cada tarea. Ejecución en el orden listado; las dependencias no obvias están indicadas en cada tarea.*
