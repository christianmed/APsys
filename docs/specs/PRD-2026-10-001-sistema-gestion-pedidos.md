# PRD-2026-10-001 — Sistema Integral de Gestión y Notificación de Pedidos (MVP)

_Product Requirements Document — qué se construye, para quién y con qué criterios de aceptación._

| Campo                   | Valor                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| **Versión**             | 0.1 — Borrador                                                          |
| **Fecha**               | 2026-10-10                                                              |
| **Cliente**             | Sol_graficas C.J., C.A.                                                 |
| **Responsable**         | Christian Medina                                                        |
| **Fuente principal**    | `docs/propuesta/PROP-2026-10-001.md` (propuesta PROP-2026-10-001)       |
| **Documentos hermanos** | `tasks/todo.md` (plan de ejecución), `AGENTS.md` (reglas de ingeniería) |
| **Estado**              | Pendiente de validación con la gerencia                                 |

---

## 1. Contexto y objetivo de negocio

Sol_graficas C.J., C.A. gestiona hoy la toma de pedidos con una macro de Excel. Los tres dolores identificados en la propuesta son:

1. Búsqueda manual de orden y teléfono para emitir los avisos de retiro por WhatsApp.
2. Pedidos listos que permanecen días en recepción sin recordatorio oportuno.
3. Ausencia de histórico acumulativo de clientes e indicadores comerciales.

**Objetivo:** una plataforma web privada que centralice el ciclo completo del pedido — registro, cobranza, producción en taller, aviso al cliente y análisis gerencial — accesible desde computadora, tablet o smartphone, sin instalaciones.

**Flujo tipo (happy path):** recepción registra el pedido con su abono y saldo → se imprime la comanda con QR que acompaña al material → taller actualiza estados → al pasar a "Listo para Retiro" se genera el aviso de WhatsApp con el saldo pendiente → el cliente retira y se cobra el saldo → gerencia consulta ingresos, cuentas por cobrar y rotación.

| Objetivo de negocio         | Métrica                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| Avisos de retiro inmediatos | Emitir el aviso en < 1 minuto desde que el pedido queda "Listo"        |
| Reducir pedidos estancados  | −50 % de pedidos listos con más de 72 h sin retirar (primer trimestre) |
| Visibilidad financiera      | Ingresos y cuentas por cobrar en tiempo real, por moneda (USD/Bs)      |
| Fidelización                | Histórico de recurrencia por cliente disponible en segundos            |

## 2. Alcance y Delimitación Estratégica

### In-Scope (MVP Consolidado — v0.9.2 a v1.0.0)

- Registro y cotización paramétrica de pedidos con cálculo automático por dimensiones (ancho, alto, cantidad, m² y acabados).
- Motor de tasas BCV con soporte de **doble vigencia temporal** (tasa de hoy vs. tasa programada del día siguiente) y sincronización desatendida vía Vercel Cron.
- Inmutabilidad financiera: cada orden congela su tasa oficial (`tasa_id`) y registra justificación obligatoria en `auditoria` ante cambios o anulaciones.
- Tablero Kanban reactivo en tiempo real para operarios de taller con Supabase Realtime y sincronización continua.
- Comanda imprimible con código QR de trazabilidad para seguimiento físico del material en planta.
- Directorio de clientes con validación telefónica y consolidación de saldos deudores.
- Catálogo dinámico de servicios gráficos configurables en USD desde `/servicios`.
- Módulo de Cuentas por Cobrar con registro de abonos y antigüedad de deuda.
- Dashboard gerencial de ingresos y rotación de servicios con exportación CSV.
- Gobernanza ágil con **Fast Lanes** para correcciones menores de UI/estilos en `AGENTS.md`.
- Blindaje técnico de estabilidad (v1.0.0):
  - Índices relacionales compuestos en PostgreSQL (`pedidos_cliente_id_idx`, `pedidos_estado_idx`, `pedidos_fecha_registro_idx`, `clientes_telefono_idx`).
  - Validación tipada en runtime con **Zod** en todas las Server Actions.
  - Paginación por cursor en `/clientes` y `/pedidos`.
  - Alertas proactivas del Cron de tasas vía Webhook (Telegram/Email).

### Out-of-Scope Definitivo (Descartes Formales tras Auditoría Cruzada)

- **Capa de Abstracción Agnóstica para Supabase:** Descartada por sobre-ingeniería (YAGNI). Se preserva la integración directa con Supabase RLS, Realtime y Auth.
- **Sustitución de Manuales por Swagger/OpenAPI:** Descartada. Los manuales operativos para personal de taller y ventas se mantienen en lenguaje de negocio humano.
- **Integración con WhatsApp Cloud API (en MVP):** El MVP utiliza enlaces directos `wa.me` sin costos fijos de API de Meta; se prioriza para la versión v1.2.0.
- **Facturación fiscal e integración contable SENIAT:** Fuera de alcance; el sistema no sustituye la máquina fiscal.
- **Nómina y Gestión de Recursos Humanos:** Fuera de alcance.
- **Telemetría IoT de Maquinaria:** Fuera de alcance; no se conectan sensores físicos a los plotters.
- **Portal de auto-servicio B2C:** El sistema es de uso interno exclusivo para el personal del taller.

### Backlog Estratégico Priorizado (Versiones Posteriores)

- **Versión 1.1.0 (Comercial y Cobranza):** Generador de Presupuestos descargables en PDF vectorial formal, desglose de Pagos Mixtos multimoneda (`pedido_pagos`: efectivo, Zelle, Pago Móvil), suite E2E completa en Playwright.
- **Versión 1.2.0 (Planta Inteligente):** Notificación automática desatendida vía WhatsApp Cloud API al pasar a "Listo para Retiro", módulo de inventario de bobinas de lona/vinil con cálculo de merma por corte y estimación predictiva de tiempos de entrega.

## 3. Usuarios y perfiles

| Perfil                             | Descripción                                                         | Uso principal                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Operativo** (Recepción y Taller) | Interfaz rápida y limpia; sin acceso a cifras globales del negocio. | Registrar pedidos, cobrar abonos, imprimir comandas, actualizar estados, enviar avisos y recordatorios. |
| **Gerencial** (Dirección General)  | Centro de mando del dueño.                                          | Finanzas, cuentas por cobrar, métricas, tasa de cambio, plantillas, auditoría, exportaciones.           |
| **Acceso unificado** (opcional)    | Modo sin inicio de sesión, tal como opera hoy la empresa.           | Configurable por la gerencia (ver decisión D-1).                                                        |

Matriz de permisos:

| Capacidad                                         | Operativo | Gerencial |
| ------------------------------------------------- | :-------: | :-------: |
| Operar pedidos (crear, estados, comandas, avisos) |     ✓     |     ✓     |
| Enviar recordatorios WhatsApp                     |     ✓     |     ✓     |
| Ver totales financieros globales                  |     ✗     |     ✓     |
| Cuentas por cobrar consolidadas                   |     ✗     |     ✓     |
| Anular/editar pedidos con motivo                  |     ✗     |     ✓     |
| Configurar tasa, plantillas y exportar            |     ✗     |     ✓     |

## 4. Stack técnico y arquitectura

- **Frontend/Backend:** Next.js (App Router, TypeScript) + Tailwind CSS + Lucide Icons.
- **Datos y autenticación:** Supabase (PostgreSQL, Auth, Row Level Security).
- **Despliegue:** Vercel (producción + preview por rama).
- **Pruebas:** TDD — Vitest (unitarias/integración) y Playwright (E2E de flujos críticos).
- **Convenciones:** Conventional Commits; cero secretos en código (variables de entorno); reglas de ingeniería según `AGENTS.md`.

Notas de implementación:

- Autorización aplicada **en la base de datos** con RLS por rol; las claves de servicio solo viven en el servidor.
- Comanda imprimible en ruta dedicada (`/comanda/[id]`) con CSS de impresión (A4 y ticket térmico según decisión D-4).
- QR generado en servidor; el escaneo USB se captura como entrada de teclado (lectores plug & play); cámara móvil vía `BarcodeDetector` con fallback.
- Montos normalizados en USD como referencia contable, con expresiones en Bs según tasa vigente e histórica por pedido (decisión D-3).

## 5. Requisitos funcionales

Prioridad MoSCoW. Referencias: RF-xx ↔ tareas del `tasks/todo.md`.

### Módulo A — Recepción y registro

| ID    | Requisito                                                                                         | Prioridad |
| ----- | ------------------------------------------------------------------------------------------------- | --------- |
| RF-01 | Registrar pedido: cliente, teléfono, servicio(s), dimensiones, acabados y notas.                  | Must      |
| RF-02 | Registrar cobranza inicial: total, abono (USD/Bs), referencia; saldo calculado automáticamente.   | Must      |
| RF-03 | Emitir comanda/ticket imprimible con código QR/barras y numeración de orden.                      | Must      |
| RF-04 | Catálogo de servicios configurable (pendones, viniles, backing, microperforado, etiquetas, etc.). | Should    |

### Módulo B — Taller y producción

| ID    | Requisito                                                                        | Prioridad |
| ----- | -------------------------------------------------------------------------------- | --------- |
| RF-05 | Flujo de estados con marcas de tiempo y reglas de transición.                    | Must      |
| RF-06 | Lectura de comanda por escáner USB, cámara móvil o búsqueda por número de orden. | Must      |
| RF-07 | Cambio de estado en ≤ 2 toques desde móvil/tablet.                               | Must      |

### Módulo C — Notificaciones WhatsApp

| ID    | Requisito                                                                                                              | Prioridad |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| RF-08 | Al pasar a "Listo para Retiro", generar aviso con plantilla que incluye N° de orden, cliente y saldo pendiente ($/Bs). | Must      |
| RF-09 | Panel de recordatorios: pedidos listos con 48–72 h sin retirar; envío con un clic.                                     | Must      |
| RF-10 | Gestión de plantillas de mensajes (edición de texto y variables disponibles).                                          | Should    |

### Módulo D — Gerencial

| ID    | Requisito                                                                                | Prioridad |
| ----- | ---------------------------------------------------------------------------------------- | --------- |
| RF-11 | Dashboard: ingresos consolidados por moneda y rango de fechas.                           | Must      |
| RF-12 | Cuentas por cobrar: saldos pendientes consolidados y antigüedad.                         | Must      |
| RF-13 | Métricas de rotación por servicio (mayor/menor demanda, período seleccionable).          | Should    |
| RF-14 | Historial por cliente: compras, montos y recurrencia.                                    | Should    |
| RF-15 | Tasa de cambio referencial configurable; recálculo en Bs sin alterar pedidos históricos. | Must      |
| RF-16 | Anulación/modificación de pedidos con motivo obligatorio + registro de auditoría.        | Should    |
| RF-17 | Exportación de reportes (CSV/PDF) del período seleccionado.                              | Should    |

### Módulo E — Acceso y seguridad

| ID    | Requisito                                                                                  | Prioridad |
| ----- | ------------------------------------------------------------------------------------------ | --------- |
| RF-18 | Acceso por perfiles con login (Supabase Auth), opcional/configurable (ver D-1).            | Should    |
| RF-19 | Privacidad operativa: el perfil operativo nunca ve totales globales (garantizado por RLS). | Must      |

## 6. Requisitos no funcionales

- **Seguridad:** RLS por rol; claves de servicio solo en servidor; secretos en variables de entorno, nunca en el repositorio.
- **Privacidad de datos:** acceso mínimo necesario a datos de clientes; auditoría de operaciones sensibles.
- **Disponibilidad:** servicio en la nube con respaldos automáticos diarios y restauración verificada y documentada.
- **Rendimiento:** registro de pedido < 2 min; búsqueda/escaneo < 2 s; dashboard < 3 s.
- **Usabilidad:** operable en tablet/móvil en mostrador y taller; flujo rápido con una mano.
- **Accesibilidad:** WCAG 2.1 AA (contraste, foco, navegación por teclado).
- **Compatibilidad:** últimas versiones de Chrome/Edge/Safari (escritorio y móvil); impresión A4 y ticket térmico 58/80 mm.

## 7. Modelo de datos (conceptual)

| Tabla          | Campos clave                                                                                                                    | Notas                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `clientes`     | id, nombre, teléfono, notas, creado_en                                                                                          | Teléfono indexado para búsqueda rápida.          |
| `servicios`    | id, nombre, activo, orden                                                                                                       | Catálogo administrable (RF-04).                  |
| `pedidos`      | id, numero_orden, cliente_id, estado, total_usd, tasa_id, creado_en / listo_en / entregado_en, anulado (bool), motivo_anulacion | Estados según RF-05.                             |
| `pedido_items` | id, pedido_id, servicio_id, descripción, dimensiones, acabados, cantidad, precio                                                | Detalle del trabajo.                             |
| `pagos`        | id, pedido_id, monto, moneda (USD/Bs), referencia, creado_en                                                                    | Abonos; el saldo se deriva.                      |
| `plantillas`   | id, tipo, contenido                                                                                                             | Plantillas WhatsApp (RF-10).                     |
| `tasas_cambio` | id, valor_bs_por_usd, vigente_desde                                                                                             | Histórico; cada pedido conserva su tasa (RF-15). |
| `auditoria`    | id, entidad, entidad_id, acción, motivo, usuario_id, fecha                                                                      | Append-only (RF-16).                             |
| `perfiles`     | id, usuario_id, rol                                                                                                             | Solo si se activa login (RF-18/D-1).             |

Consideraciones: políticas RLS por rol desde la fase de fundaciones (T-005); agregados financieros expuestos solo a gerencial; la auditoría no admite edición ni borrado.

## 8. Casos de aceptación (BDD)

- **CA-01 Saldo automático.** Dado que recepción registra un pedido de $100 con abono de $40, cuando guarda, entonces el saldo es $60 y el pedido aparece en cuentas por cobrar.
- **CA-02 Comanda y QR.** Dado un pedido registrado, cuando se imprime la comanda, entonces el QR impreso abre la orden correcta al escanearlo.
- **CA-03 Aviso de retiro.** Dado un pedido con saldo pendiente, cuando pasa a "Listo para Retiro" y se pulsa _Avisar_, entonces se genera el mensaje con N° de orden y saldo en $ y Bs, y se abre WhatsApp con el texto listo para enviar.
- **CA-04 Recordatorio 48–72 h.** Dado un pedido "Listo" hace 50 h sin entregar, cuando se abre el panel de recordatorios, entonces aparece listado con acción de un clic para recordar.
- **CA-05 Privacidad operativa.** Dado el perfil operativo, cuando intenta acceder al dashboard financiero (UI o API), entonces el sistema lo bloquea.
- **CA-06 Tasa de cambio.** Dada una actualización de tasa, cuando se registra un pedido nuevo, entonces el saldo usa la tasa vigente; los pedidos anteriores conservan su tasa original.
- **CA-07 Anulación auditada.** Dado un pedido, cuando gerencia lo anula con motivo, entonces queda registro inmutable (usuario, fecha, motivo) y el pedido deja de contar en métricas.
- **CA-08 Exportación.** Dado un rango de fechas, cuando gerencia exporta, entonces obtiene CSV/PDF con ingresos por moneda y cuentas por cobrar del rango, cuadrando con el dashboard.

## 9. Métricas de éxito del MVP

| Métrica                                                | Meta                                         |
| ------------------------------------------------------ | -------------------------------------------- |
| Tiempo medio de emisión del aviso de retiro            | < 1 minuto                                   |
| % de pedidos avisados el mismo día que pasan a "Listo" | ≥ 95 %                                       |
| Pedidos con > 72 h sin retirar                         | −50 % vs. línea base                         |
| Descuadres de saldos                                   | 0                                            |
| Adopción del equipo                                    | Uso semanal sostenido por todos los perfiles |

## 10. Roadmap de Evolución y Criterios de Salida

| Versión / Fase | Alcance Principal | Estado | Criterio de Salida |
| :--- | :--- | :---: | :--- |
| **v0.9.2 — Producción Actual** | Navegación Client-First, motor doble vigencia BCV, sincronización Vercel Cron, Taller Kanban reactivo. | **Completada** | 216 tests en verde, 0 errores TypeScript, desplegado en Vercel. |
| **v1.0.0 — Estabilidad & Gobernanza** | Índices PostgreSQL (`0006_indices.sql`), validación Zod en Server Actions, paginación por cursor, alertas Telegram, Fast Lanes en `AGENTS.md`. | **En Curso** | Migración aplicada en Supabase, suites Zod y paginación 100% verde. |
| **v1.1.0 — Potencia Comercial** | Presupuestos en PDF vectorial descargable, pagos mixtos multimoneda (`pedido_pagos`), suite E2E Playwright de flujo completo. | **Sprint 1** | Generación de PDF validada en pruebas; conciliación de pagos mixtos sin descuadre. |
| **v1.2.0 — Planta Inteligente** | WhatsApp Cloud API desatendido, módulo de inventario de bobinas (lona/vinil) con merma por corte y estimación de tiempos de entrega. | **Sprint 2** | Disparo automático de avisos en taller y reporte de m² aprovechados vs. desperdicio. |

Salida oficial de v1.0.0: Todos los índices activos en producción; validación Zod en actions; consultas con paginación; y manuales sincronizados.

## 11. Riesgos y Supuestos

| Riesgo / Supuesto | Impacto | Mitigación |
| :--- | :--- | :--- |
| Conectividad intermitente en taller | Medio | UI reactiva client-first con tolerancia a reintentos; cache local de tasas en memoria. |
| Caída de APIs del BCV | Medio | Arquitectura dual DolarVZLA + fallback a DolarApi + última tasa persistida en base de datos. |
| Volatilidad de la tasa de cambio | Alto | Inmutabilidad financiera: cada orden congela su tasa oficial (`tasa_id`); soporte de tasa de mañana. |
| Fricción metodológica en hotfixes | Medio | Incorporación de **Fast Lanes** en `AGENTS.md` para parches menores y cambios cosméticos. |
| Crecimiento acelerado de registros | Medio | Índices relacionales compuestos en PostgreSQL y paginación por cursor en servidor. |

## 12. Decisiones Estratégicas y de Arquitectura

| ID | Decisión | Resolución Definitiva | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **D-1** | ¿Login por perfiles o acceso unificado? | **Login con roles RLS segregados** | Privacidad financiera estricta (RF-19): operarios no ven totales globales ni márgenes. |
| **D-2** | Canal WhatsApp (MVP vs Futuro) | **`wa.me` en v1.0.0 → Cloud API en v1.2.0** | MVP ágil sin costos de Meta; Cloud API para automatización total en taller post-lanzamiento. |
| **D-3** | Moneda base de cálculo | **USD base con expresión dual en Bs** | Cada pedido congela su `tasa_id`; la inflación no descuadra órdenes previas. |
| **D-4** | Impresión de comanda | **Ambas (Ticket 80mm y Carta/A4)** | Vistas CSS responsivas listas con QR de trazabilidad. |
| **D-5** | Modo de envío de avisos | **Asistido a un clic en v1.0.0 → Desatendido en v1.2.0** | Evita envíos accidentales hoy; automatización total cuando la Cloud API esté activa. |
| **D-6** | Gobernanza de desarrollo | **Fast Lanes para mantenimiento** | Exime a bugfixes menores del ciclo de 5 fases para evitar cuellos de botella de sobrediseño. |
| **D-7** | Acoplamiento con Supabase | **Integración nativa con Supabase RLS** | Descarte de abstracciones agnósticas (YAGNI); se aprovecha el motor PostgreSQL al 100%. |
| **D-8** | Presupuestos y Cobranza Mixta | **Prioridad comercial para v1.1.0** | Permite generar PDFs formales y desglosar pagos combinados (Efectivo + Zelle + Pago Móvil). |

## 13. Glosario y Referencias

- **Comanda:** Ticket de producción con QR/barras que acompaña al material físico en planta.
- **CxC:** Cuentas por cobrar.
- **RLS:** Row Level Security — control de acceso a nivel de fila en PostgreSQL/Supabase.
- **Fast Lane:** Vía rápida de desarrollo TDD (Rojo-Verde) para correcciones cosméticas y bugfixes sin burocracia de especificación.
- **Referencias:** PROP-2026-10-001 (`docs/propuesta/PROP-2026-10-001.md`); `tasks/todo.md`; `tasks/plan.md`; `AGENTS.md`; `docs/analisis/2026-10-16/`.
