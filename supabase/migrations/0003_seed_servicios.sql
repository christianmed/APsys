-- =============================================================================
-- APSys — Migración 0003: semilla del catálogo de servicios (T-007)
-- =============================================================================
-- Carga los 5 servicios iniciales del catálogo (PRD §7): Pendones, Viniles,
-- Backing, Microperforado y Etiquetas, con su orden de presentación.
--
-- Notas:
--   * Idempotente: `on conflict (nombre) do nothing` permite re-ejecutarla sin
--     duplicar filas ni pisar cambios hechos luego desde la interfaz.
--   * Requiere 0001_schema.sql aplicada antes (tabla `servicios` y su unique
--     sobre `nombre`).
--   * Se aplica manualmente en el SQL Editor de Supabase; el alta/edición
--     posteriores viven en la interfaz de catálogo (T-007b).
-- Sin secretos: aquí solo hay datos de catálogo.
-- =============================================================================

insert into public.servicios (nombre, orden, activo) values
  ('Pendones', 1, true),
  ('Viniles', 2, true),
  ('Backing', 3, true),
  ('Microperforado', 4, true),
  ('Etiquetas', 5, true)
on conflict (nombre) do nothing;
