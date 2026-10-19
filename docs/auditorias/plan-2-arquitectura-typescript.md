# Auditoría Exhaustiva: Arquitectura, TypeScript y Costuras de Prueba (TDD Seams)

- **Fecha:** 2026-10-19
- **Rama:** `audit/arquitectura-typescript`
- **Estatus:** Diagnóstico Completado — Cero Cambios a Código Productivo
- **Marcos aplicados:** Matt Pocock (`mattpocock/skills`) — Deep Modules, Ubiquitous Language & Seams

---

## 1. Resumen Ejecutivo de Hallazgos

| #       | Área / Archivo                             | Severidad      | Diagnóstico Matt Pocock      | Hallazgo Clave                                                                                                                            |
| :------ | :----------------------------------------- | :------------- | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **A-1** | Mapeos de Supabase en 8 vistas             | **Media**      | Fuga de Tipos / Casteo Doble | 15 ocurrencias de `as unknown as` para forzar las relaciones de Supabase (`pedidos`, `pagos`, `clientes`, `pedido_items`). Cero `as any`. |
| **A-2** | `app/pedidos/pedido-form.tsx` (768 líneas) | **Media**      | Módulo Superficial / Inflado | Mezcla cálculos de m² y conversión de divisas con eventos de UI y renderizado masivo.                                                     |
| **A-3** | `app/pedidos/actions.ts` (703 líneas)      | **Media**      | Módulo Monolítico            | Agrupa 6 Server Actions distintos con lógica de cálculo, auditoría, paginación y mutaciones.                                              |
| **A-4** | `app/taller/taller-tablero.tsx`            | **Baja-Media** | Tipado Realtime              | Suscripción de WebSockets a `pedidos` recibe payloads sin tipado estricto `RealtimePostgresChangesPayload`.                               |
| **A-5** | Cobertura en Costuras Públicas (`test/`)   | **Excelente**  | Seams TDD                    | 55 archivos de prueba con 300 tests pasando al 100% en Vitest.                                                                            |

---

## 2. Detalle Técnico de los Hallazgos

### A-1: Erradicación de `as unknown as` mediante Tipado de Relaciones Supabase

- **Ubicaciones:**
  - `lib/pedidos/taller-mapper.ts` (L44, L55, L62)
  - `app/tasas/page.tsx` (L73)
  - `app/pedidos/actions.ts` (L368, L508)
  - `app/cuentas-por-cobrar/page.tsx` (L109)
  - `app/clientes/page.tsx` (L98)
  - `app/dashboard/rotacion/page.tsx` (L157)
  - `app/recordatorios/page.tsx` (L60, L64)
- **Causa Raíz:**
  Al consultar tablas unidas mediante PostgREST (`.select('..., pagos(monto, moneda), clientes(nombre)')`), el SDK de Supabase infiere las relaciones anidadas como genéricas o unión abierta. Para evitar errores de compilación, el código recurrió al casteo forzado:
  ```typescript
  const listaPagos =
    (pItem.pagos as unknown as Array<{ monto: number; moneda: string }>) ?? [];
  ```
- **Solución de Arquitectura Recomendada:**
  Generar y consolidar la interfaz canónica de base de datos en `types/database.ts` o `lib/supabase/types.ts` con definiciones de relaciones (`Tables['pedidos']['Row'] & { pagos: Tables['pagos']['Row'][] }`). Esto elimina de raíz todos los `as unknown as` de producción.

---

### A-2: Descomposición de `pedido-form.tsx` en Módulos Profundos

- **Ubicación:** [app/pedidos/pedido-form.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/pedidos/pedido-form.tsx)
- **Problema Arquitectónico:**
  El archivo tiene 768 líneas y gestiona simultáneamente:
  1. Estado del cliente y modal de creación rápida.
  2. Cálculo reactivo de metros cuadrados, acabados y precios de renglones dinámicos.
  3. Cálculo de cobranza inicial en USD y Bs. con detección de tasa de hoy vs. tasa de mañana.
  4. Envío y retroalimentación de Server Actions.
- **Solución Recomendada:**
  1. Extraer la matemática de renglones a `lib/pedidos/calculos-renglones.ts` (función pura 100% testeable sin DOM).
  2. Extraer subcomponentes visuales desacoplados en `app/pedidos/nuevo/`:
     - `pedido-cliente-selector.tsx`
     - `pedido-items-table.tsx`
     - `pedido-cobranza-card.tsx`

---

### A-3: Modularización de Server Actions de Pedidos

- **Ubicación:** [app/pedidos/actions.ts](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/pedidos/actions.ts)
- **Problema:** Un solo archivo alberga `crearPedido`, `cambiarEstadoPedido`, `anularPedidoConAuditoria`, `cobrarYEntregarPedido`, `obtenerTasaVigente` y `obtenerTasaProgramada`.
- **Solución:** Mantener `actions.ts` como punto de entrada de reexportación y aislar la lógica en submódulos especializados dentro de `lib/pedidos/`.

---

## 3. Plan de Acción y Trazabilidad (Tracer Bullets)

1. **Tarea ARQ-01:** Crear `types/database.ts` con las interfaces completas de tablas y relaciones de Supabase.
2. **Tarea ARQ-02:** Reemplazar las 15 ocurrencias de `as unknown as` por tipos inferidos seguros.
3. **Tarea ARQ-03:** Extraer la lógica de cálculo de m² y precios de `pedido-form.tsx` a `lib/pedidos/calculos-renglones.ts` con suite TDD.
4. **Tarea ARQ-04:** Tipar eventos de Supabase Realtime en `app/taller/taller-tablero.tsx` con `RealtimePostgresChangesPayload`.
5. **Tarea ARQ-05:** Ejecutar `npm run typecheck` y `npm test` confirmando cero regresiones.
