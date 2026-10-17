-- =============================================================================
-- APSys — Migración 0006: Índices de Rendimiento y Optimización de Consultas
-- =============================================================================
-- Esta migración implementa los índices de base de datos recomendados en la
-- auditoría estratégica (Fase 29) para garantizar tiempos de respuesta < 15ms
-- en Dashboard, Reportes, Cuentas por Cobrar, Catálogo y Kanban de Taller:
--
-- 1. pedidos: ordenamiento temporal y búsquedas de número de orden.
-- 2. pagos: agregación de pagos por período e historial de abonos por pedido.
-- 3. pedido_items: métricas de rotación de servicios (RF-13) y relaciones.
-- 4. clientes: optimización de búsqueda rápida de recepción por nombre.
-- 5. auditoria: traza rápida de eventos por entidad y fecha.
-- =============================================================================

-- 1. Pedidos: ordenamiento temporal y consulta por número de orden
create index if not exists pedidos_creado_en_desc_idx
  on public.pedidos (creado_en desc);

create index if not exists pedidos_anulado_creado_en_idx
  on public.pedidos (anulado, creado_en desc);

-- 2. Pagos: agregación de ingresos en Dashboard (RF-11) y cobranzas (RF-12)
create index if not exists pagos_pedido_id_idx
  on public.pagos (pedido_id);

create index if not exists pagos_creado_en_desc_idx
  on public.pagos (creado_en desc);

-- 3. Pedido Items: agregaciones de rotación y demanda por servicio (RF-13)
create index if not exists pedido_items_servicio_id_idx
  on public.pedido_items (servicio_id);

-- 4. Clientes: búsqueda rápida por nombre (case-insensitive)
create index if not exists clientes_nombre_idx
  on public.clientes (lower(nombre));

-- 5. Auditoría: consulta cronológica de trazas e historial por entidad
create index if not exists auditoria_entidad_entidad_id_idx
  on public.auditoria (entidad, entidad_id);

create index if not exists auditoria_creado_en_desc_idx
  on public.auditoria (creado_en desc);
