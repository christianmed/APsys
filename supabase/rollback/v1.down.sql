-- =============================================================================
-- APSys — Reversión completa de v1 (T-004/T-005): 0001_schema + 0002_rls
-- =============================================================================
-- Ejecutar en el SQL Editor del dashboard o con psql. DESTRUYE las tablas y
-- por tanto TODOS LOS DATOS de la v1, además de políticas, y la función
-- auxiliar de RLS. El orden respeta las claves foráneas (hijos antes que
-- padres). Uso previsto: desarrollo/pruebas; no ejecutar en producción con
-- datos reales.
-- =============================================================================

-- Función auxiliar de RLS (0002).
drop function if exists public.rol_actual();

-- Tablas (0001), en orden inverso a su creación. Las políticas RLS de 0002
-- desaparecen con cada tabla.
drop table if exists public.auditoria;
drop table if exists public.pagos;
drop table if exists public.pedido_items;
drop table if exists public.pedidos;
drop table if exists public.plantillas;
drop table if exists public.tasas_cambio;
drop table if exists public.clientes;
drop table if exists public.servicios;
drop table if exists public.perfiles;
