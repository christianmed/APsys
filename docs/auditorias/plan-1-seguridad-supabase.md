# Auditoría Exhaustiva: Seguridad, RLS y Persistencia en Supabase

* **Fecha:** 2026-10-19
* **Rama:** `audit/seguridad-supabase`
* **Estatus:** Diagnóstico Completado — Cero Cambios a Código Productivo
* **Marcos aplicados:** Matt Pocock (Deep Modules & Seams) + Security Auditor Subagent

---

## 1. Resumen Ejecutivo de Hallazgos

| # | Componente / Flujo | Severidad | Tipo | Hallazgo Clave |
| :--- | :--- | :--- | :--- | :--- |
| **H-1** | `crearPedido` (`app/pedidos/actions.ts`) | **Alta** | Integridad Transaccional | El rollback manual `supabase.from("pedidos").delete()` es bloqueado por las políticas RLS (no existe política `DELETE` en `pedidos`), dejando órdenes huérfanas si fallan los ítems o el abono. |
| **H-2** | `cobrarYEntregarPedido` (`app/pedidos/actions.ts`) | **Media-Alta** | Concurrencia / Race Condition | Lectura de saldo, inserción de pago y actualización a `entregado` no son atómicas. Falta bloqueo `FOR UPDATE` en PostgreSQL para prevenir cobros dobles simultáneos. |
| **H-3** | Route Handler `/api/cron/sincronizar-tasas` | **Media** | Falla Abierta (Fail-Open) | Si `CRON_SECRET` no está configurado en `.env`, el endpoint permite ejecución anónima no autorizada con `SUPABASE_SERVICE_ROLE_KEY`. |
| **H-4** | Route Handler `/api/tasas/auto-sync` | **Media** | Control de Acceso | Acepta peticiones `POST` sin verificar sesión de usuario (`getUser()`), ejecutando inserciones con `service_role`. |
| **H-5** | `0002_rls.sql` (Auditoría) | **Baja-Media** | No Repudio | La tabla `auditoria` permite inserciones directas por cliente gerencial. Debe restringirse exclusivamente a funciones `security definer` para evitar falsificación de `usuario_id` o `fecha`. |

---

## 2. Detalle Técnico de los Hallazgos

### H-1: Falla Silenciosa de Rollback en Creación de Pedidos por Políticas RLS

* **Ubicación:** [app/pedidos/actions.ts](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/pedidos/actions.ts#L254-L290)
* **Mecanismo del Fallo:**
  1. Se inserta exitosamente la cabecera en `pedidos` con estado `recibido`.
  2. Si la inserción posterior en `pedido_items` o `pagos` lanza un error (ej. desconexión de red, violación de clave foránea o datos corruptos), el Server Action ejecuta:
     ```typescript
     await supabase.from("pedidos").delete().eq("id", pedidoCreado.id);
     ```
  3. En [supabase/migrations/0002_rls.sql](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/supabase/migrations/0002_rls.sql#L113-L121), la tabla `pedidos` **no tiene definida ninguna política de `DELETE`** para ningún rol bajo la premisa de negocio de que los pedidos solo se anulan, nunca se borran.
  4. Por ende, la llamada `.delete()` es rechazada por PostgreSQL (afecta 0 filas), el error no se captura y el pedido queda registrado en la base de datos como un pedido huérfano sin renglones ni cobranza.
* **Solución de Arquitectura Recomendada:**
  Migrar la creación compuesta de pedidos a una función RPC transaccional en PostgreSQL (`crear_pedido_transaccional`), donde la cabecera, los ítems y el abono se ejecutan dentro de una sola transacción ACID nativa con rollback automático del motor.

---

### H-2: Condición de Carrera en Cobro y Despacho de Pedidos

* **Ubicación:** [app/pedidos/actions.ts](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/pedidos/actions.ts#L458-L572)
* **Mecanismo del Fallo:**
  1. Se consulta el pedido y la suma histórica de sus pagos en `pagos`.
  2. Se calcula el saldo restante en memoria en JavaScript.
  3. Se inserta el nuevo abono en `pagos`.
  4. Se actualiza el estado del pedido a `entregado` en `pedidos`.
  Si dos operadores o cajeros pulsan "Cobrar y Entregar" al mismo tiempo en dos dispositivos (o el usuario hace doble clic rápido en una conexión lenta), ambas operaciones leen el saldo original antes de que la otra inserte el pago, resultando en un doble cobro registrado en caja.
* **Solución de Arquitectura Recomendada:**
  Implementar la función RPC `cobrar_y_entregar_transaccional(p_pedido_id, p_monto, p_moneda, p_referencia)` con bloqueo explícito de fila (`SELECT total_usd FROM pedidos WHERE id = p_pedido_id FOR UPDATE`).

---

### H-3: Falla Abierta en Endpoint Cron de Vercel

* **Ubicación:** [app/api/cron/sincronizar-tasas/route.ts](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/api/cron/sincronizar-tasas/route.ts#L24-L41)
* **Mecanismo del Fallo:**
  El código actual contiene:
  ```typescript
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    // verifica header
  }
  // si cronSecret es undefined, continúa la ejecución libremente
  ```
  Si por error humano o en un entorno de staging/preview `CRON_SECRET` no se declara, el endpoint queda completamente público y cualquier bot puede invocarlo repetidamente.
* **Solución Recomendada:**
  Adoptar el principio de **Fail-Closed**:
  ```typescript
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  ```

---

### H-4: Invocación No Autenticada en Auto-Sync Post-Medianoche

* **Ubicación:** [app/api/tasas/auto-sync/route.ts](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/api/tasas/auto-sync/route.ts#L17-L36)
* **Mecanismo del Fallo:**
  El endpoint `POST` no requiere cabecera de sesión ni token JWT. Aunque valida la fecha y la tasa contra la API del BCV de manera idempotente, permite que clientes no autenticados fuercen peticiones y consumo de cuota contra la API externa.
* **Solución Recomendada:**
  Exigir sesión de usuario activa mediante `const { data: { user } } = await supabase.auth.getUser();` antes de ejecutar la auto-sincronización.

---

## 3. Plan de Acción y Trazabilidad (Tracer Bullets)

Para la Fase 3 (Implementación), estas mejoras se desglosan en las siguientes tareas:

1. **Tarea SEC-01:** Crear migración `0007_funciones_transaccionales.sql` con funciones RPC `crear_pedido_transaccional` y `cobrar_y_entregar_transaccional` con manejo de excepciones y bloqueos `FOR UPDATE`.
2. **Tarea SEC-02:** Actualizar `app/pedidos/actions.ts` para consumir las funciones RPC, eliminando los rollbacks manuales bloqueados por RLS.
3. **Tarea SEC-03:** Blindar `/api/cron/sincronizar-tasas` con fail-closed estricto para `CRON_SECRET`.
4. **Tarea SEC-04:** Proteger `/api/tasas/auto-sync` con verificación de sesión de usuario autenticado.
5. **Tarea SEC-05:** Pruebas unitarias y de integración (TDD) para validar los casos de error, concurrencia y rechazo de accesos no autorizados.
