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

## 2. Alcance

### In-Scope (MVP)

- Registro y gestión de pedidos con cobranza inicial (total, abono por moneda, referencia, saldo calculado).
- Comanda/ticket imprimible con código QR/barras; lectura por escáner USB, cámara móvil o búsqueda por número.
- Flujo de estados: Recibido → En Producción → Listo para Retiro → Entregado → Cancelado.
- Aviso de retiro por WhatsApp (enlace directo con plantilla que incluye N° de orden y saldo pendiente en $ y Bs).
- Panel de recordatorios para pedidos listos no retirados tras 48–72 h, con envío a un clic.
- Plantillas de mensajes editables por gerencia.
- Dashboard gerencial: ingresos por moneda, cuentas por cobrar, rotación de servicios e historial por cliente.
- Tasa de cambio referencial configurable.
- Auditoría de anulaciones/ediciones con motivo obligatorio.
- Exportación de reportes (CSV/PDF).
- Despliegue en la nube con respaldos automáticos diarios.

### Out-of-Scope (MVP) — backlog posterior

- Integración con WhatsApp Business Cloud API (el MVP usa enlace directo `wa.me`, sin costos de API ni aprobaciones externas).
- Facturación fiscal e integración contable.
- Aplicación móvil nativa (el MVP es web responsive).
- Modo offline / PWA instalable.
- Multi-sucursal y roles adicionales.
- Pasarelas de pago en línea, inventario de materiales, fidelización automática (puntos/cupones).

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

## 10. Roadmap a MVP y criterios de salida

| Fase                                 | Alcance                                                 | Duración    | Criterio de salida                                                |
| ------------------------------------ | ------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| **Fase 0 — Fundaciones**             | Repo, CI, Supabase, esquema y RLS                       | (previa)    | Migraciones y RLS probadas; pipeline en verde                     |
| **Fase 1 — Registro**                | Clientes, pedidos, cobranza, comanda                    | Semanas 1–2 | Flujo registro→comanda verificado E2E                             |
| **Fase 2 — Taller y notificaciones** | Estados, escaneo, WhatsApp, recordatorios               | Semana 3    | Flujo taller→aviso→recordatorio verificado E2E                    |
| **Fase 3 — Métricas y despliegue**   | Dashboard, CxC, taxa, exportación, deploy, capacitación | Semana 4    | Suite E2E completa en verde en producción; capacitación realizada |

Salida del MVP: todos los RF **Must** implementados y verificados; suite E2E de flujos críticos en verde; desplegado en producción; capacitación en sede realizada.

## 11. Riesgos y supuestos

| Riesgo / Supuesto                   | Impacto | Mitigación                                                                            |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| Conectividad intermitente en taller | Medio   | UI tolerante a reintentos; validar en sitio durante la fase 3                         |
| Políticas de WhatsApp               | Medio   | MVP con enlace directo (sin envíos masivos automatizados); evaluar Cloud API post-MVP |
| Volatilidad de la tasa de cambio    | Medio   | Histórico de tasas; cada pedido congela su tasa                                       |
| Baja adopción del personal          | Alto    | Capacitación en sede + guía rápida; flujos de ≤ 2 toques                              |
| Crecimiento del alcance             | Medio   | Backlog separado en `tasks/todo.md`; decisiones abiertas formalizadas                 |

## 12. Decisiones abiertas

| ID  | Decisión                          | Opciones                                                                       | Recomendación                                                                                                                                                                  |
| --- | --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-1 | ¿Login por perfiles desde el MVP? | (a) siempre acceso unificado · (b) login con roles · (c) configurable por flag | (c) Implementar Auth con roles desde el inicio y un "modo mostrador" que permita acceso directo; la privacidad operativa (RF-19) exige la separación de vistas de todos modos. |
| D-2 | Canal WhatsApp                    | (a) enlace `wa.me` (MVP) · (b) Cloud API (costo + verificación)                | (a) ahora; evaluar (b) post-MVP.                                                                                                                                               |
| D-3 | Moneda base de registro           | (a) USD · (b) Bs · (c) dual                                                    | (a) con vista dual $/Bs y tasa histórica por pedido.                                                                                                                           |
| D-4 | Impresión de comanda              | (a) A4 · (b) térmica 58/80 mm · (c) ambas                                      | Definir con la gerencia; el MVP deja ambas vistas listas.                                                                                                                      |
| D-5 | Modo de envío de avisos           | (a) automático sin confirmación · (b) asistido con un clic                     | (b) según la propuesta ("un solo clic"); evita envíos erróneos.                                                                                                                |

## 13. Glosario y referencias

- **Comanda:** ticket de producción con QR/barras que acompaña al material físico.
- **CxC:** cuentas por cobrar.
- **RLS:** Row Level Security — control de acceso a nivel de fila en PostgreSQL/Supabase.
- **Referencias:** PROP-2026-10-001 (`docs/propuesta/PROP-2026-10-001.md`); `tasks/todo.md`; `AGENTS.md`.
