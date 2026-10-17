-- =============================================================================
-- APSys — Migración 0006: Índices de Rendimiento y Optimización de Consultas
-- =============================================================================
-- Esta migración implementa los índices de base de datos para garantizar
-- tiempos de respuesta < 15ms en Dashboard, Reportes, Cuentas por Cobrar y Catálogo:
--
-- 1. pedidos: ordenamiento temporal y filtro de órdenes activas (no anuladas).
-- 2. pagos: agregación cronológica de ingresos en Dashboard (RF-11).
-- 3. pedido_items: agregaciones de rotación y demanda por servicio (RF-13).
-- 4. clientes: búsqueda rápida por nombre insensible a mayúsculas/minúsculas.
-- =============================================================================

-- 1. Pedidos: acelerar ordenamiento cronológico en /pedidos y /dashboard
create index if not exists pedidos_creado_en_desc_idx
  on public.pedidos (creado_en desc);

create index if not exists pedidos_anulado_creado_en_idx
  on public.pedidos (anulado, creado_en desc);

-- 2. Pagos: agregación cronológica de ingresos en Dashboard (RF-11)
create index if not exists pagos_creado_en_desc_idx
  on public.pagos (creado_en desc);

-- 3. Pedido Items: métricas de rotación y demanda por servicio (RF-13)
create index if not exists pedido_items_servicio_id_idx
  on public.pedido_items (servicio_id);

-- 4. Clientes: búsqueda rápida por nombre (case-insensitive)
create index if not exists clientes_nombre_lower_idx
  on public.clientes (lower(nombre));

