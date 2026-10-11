-- =============================================================================
-- APSys — Migración 0004: numeración secuencial de órdenes y estado inicial (T-010)
-- =============================================================================
-- Resuelve RF-05: numeración secuencial correlativa sin huecos ni colisiones
-- por concurrencia al registrar pedidos en recepción.
--
-- Estrategia:
--   1. Se crea la función `public.siguiente_numero_orden()` con `security definer`.
--   2. Adquiere el bloqueo transaccional exclusivo `pg_advisory_xact_lock`
--      sobre el hash del espacio de nombres 'pedidos_numero_orden'.
--   3. Consulta el `coalesce(max(numero_orden), 1000) + 1` de `public.pedidos`.
--   4. Si una transacción falla o revierte, ningún correlativo es consumido (sin huecos).
--   5. Se asigna como DEFAULT para `public.pedidos.numero_orden`.
-- =============================================================================

create or replace function public.siguiente_numero_orden()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  siguiente integer;
begin
  -- Serializar transacciones concurrentes exclusivamente durante la asignación del correlativo
  perform pg_advisory_xact_lock(hashtext('pedidos_numero_orden'));

  select coalesce(max(numero_orden), 1000) + 1
  into siguiente
  from public.pedidos;

  return siguiente;
end;
$$;

-- Permisos de ejecución
grant execute on function public.siguiente_numero_orden() to authenticated;

-- Establecer como valor por defecto en la tabla pedidos
alter table public.pedidos
  alter column numero_orden set default public.siguiente_numero_orden();
