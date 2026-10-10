-- =============================================================================
-- APSys — Migración 0002: RLS base por rol (T-005)
-- =============================================================================
-- Modelo de permisos (PRD §3, RF-19):
--   * RLS habilitado en las 9 tablas. Sin política aplicable → denegado.
--   * `anon`: sin ninguna política (lectura y escritura nulas).
--   * `authenticated`: permisos según `public.perfiles.rol`, leído con la
--     función `public.rol_actual()` (security definer, search_path fijo;
--     devuelve NULL si el usuario no tiene perfil → fail closed).
--   * Operativo: opera pedidos/pagos/ítems/clientes y consulta catálogos,
--     pero NO escribe tasas_cambio ni plantillas, NO lee auditoría y NO
--     anula pedidos. Gerencial: acceso completo (incluye anulación).
--
-- Notas de implementación:
--   * No se revocan privilegios de tabla a `anon`: RLS ya deniega todo y el
--     chequeo /api/supabase-health consulta `clientes` con la clave anon
--     (recibe conteo 0, no error de permisos 42501).
--   * Re-ejecutable: `drop policy if exists` + `create policy`.
--   * Requiere 0001_schema.sql aplicada antes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- rol_actual(): rol del usuario del request, o NULL si no tiene fila en
-- `perfiles`. Security definer: se ejecuta como el dueño de la tabla (postgres),
-- que no pasa por RLS, y con `search_path = ''` para evitar secuestro de
-- esquemas. Las políticas de `perfiles` no llaman a esta función (evita
-- recursión): solo se permite leer la propia fila.
-- -----------------------------------------------------------------------------
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rol
  from public.perfiles
  where usuario_id = (select auth.uid());
$$;

-- RLS habilitado en todas las tablas de negocio.
alter table public.perfiles     enable row level security;
alter table public.clientes     enable row level security;
alter table public.servicios    enable row level security;
alter table public.tasas_cambio enable row level security;
alter table public.pedidos      enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pagos        enable row level security;
alter table public.plantillas   enable row level security;
alter table public.auditoria    enable row level security;

-- -----------------------------------------------------------------------------
-- perfiles: cada usuario lee su propia fila (la interfaz la usa para saber su
-- rol). Sin escrituras de cliente: se aprovisiona por SQL/servicio en v1.
-- TODO post-MVP: gerencial podrá listar todos los perfiles cuando exista la
-- pantalla de administración de usuarios (mantener sin recursión).
-- -----------------------------------------------------------------------------
drop policy if exists perfiles_lectura_propia on public.perfiles;
create policy perfiles_lectura_propia on public.perfiles
  for select to authenticated
  using (usuario_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- clientes: ambos roles leen, crean y editan; nadie borra (los pedidos los
-- referencian y la baja de datos no forma parte de v1).
-- -----------------------------------------------------------------------------
drop policy if exists clientes_lectura on public.clientes;
create policy clientes_lectura on public.clientes
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists clientes_alta on public.clientes;
create policy clientes_alta on public.clientes
  for insert to authenticated
  with check (public.rol_actual() is not null);

drop policy if exists clientes_edicion on public.clientes;
create policy clientes_edicion on public.clientes
  for update to authenticated
  using (public.rol_actual() is not null)
  with check (public.rol_actual() is not null);

-- -----------------------------------------------------------------------------
-- servicios: catálogo de lectura para ambos; alta/edición/baja solo gerencial.
-- -----------------------------------------------------------------------------
drop policy if exists servicios_lectura on public.servicios;
create policy servicios_lectura on public.servicios
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists servicios_escritura_gerencial on public.servicios;
create policy servicios_escritura_gerencial on public.servicios
  for all to authenticated
  using (public.rol_actual() = 'gerencial')
  with check (public.rol_actual() = 'gerencial');

-- -----------------------------------------------------------------------------
-- tasas_cambio: lectura para ambos (cobranza y comandas usan la tasa);
-- alta/corrección solo gerencial. El histórico no se edita: cada vigencia
-- es una fila nueva.
-- -----------------------------------------------------------------------------
drop policy if exists tasas_cambio_lectura on public.tasas_cambio;
create policy tasas_cambio_lectura on public.tasas_cambio
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists tasas_cambio_escritura_gerencial on public.tasas_cambio;
create policy tasas_cambio_escritura_gerencial on public.tasas_cambio
  for all to authenticated
  using (public.rol_actual() = 'gerencial')
  with check (public.rol_actual() = 'gerencial');

-- -----------------------------------------------------------------------------
-- pedidos: lectura para ambos; alta para ambos (el operativo no puede crear
-- pedidos ya anulados); edición para ambos, pero el operativo no puede anular
-- (`with check (not anulado)`) ni tocar un pedido anulado (el `using` lo
-- excluye: el UPDATE afecta 0 filas; la interfaz debe informarlo). Gerencial
-- sí anula/reactiva (T-024 audita). Sin DELETE: anular es la única vía (RF-16).
-- TODO post-MVP: restringir a nivel de BD la edición de total_usd/tasa_id por
-- operativo; en v1 lo delimita la interfaz y lo traza la auditoría.
-- -----------------------------------------------------------------------------
drop policy if exists pedidos_lectura on public.pedidos;
create policy pedidos_lectura on public.pedidos
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists pedidos_alta_operativo on public.pedidos;
create policy pedidos_alta_operativo on public.pedidos
  for insert to authenticated
  with check (public.rol_actual() = 'operativo' and not anulado);

drop policy if exists pedidos_alta_gerencial on public.pedidos;
create policy pedidos_alta_gerencial on public.pedidos
  for insert to authenticated
  with check (public.rol_actual() = 'gerencial');

drop policy if exists pedidos_edicion_operativo on public.pedidos;
create policy pedidos_edicion_operativo on public.pedidos
  for update to authenticated
  using (public.rol_actual() = 'operativo' and not anulado)
  with check (public.rol_actual() = 'operativo' and not anulado);

drop policy if exists pedidos_edicion_gerencial on public.pedidos;
create policy pedidos_edicion_gerencial on public.pedidos
  for update to authenticated
  using (public.rol_actual() = 'gerencial')
  with check (public.rol_actual() = 'gerencial');

-- -----------------------------------------------------------------------------
-- pedido_items: CRUD para ambos roles (la comanda se arma en recepción y se
-- corrige en taller). El borrado físico de ítems queda permitido por simplicidad
-- de v1; TODO post-MVP: valorar baja lógica + traza en auditoría.
-- -----------------------------------------------------------------------------
drop policy if exists pedido_items_lectura on public.pedido_items;
create policy pedido_items_lectura on public.pedido_items
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists pedido_items_escritura on public.pedido_items;
create policy pedido_items_escritura on public.pedido_items
  for all to authenticated
  using (public.rol_actual() is not null)
  with check (public.rol_actual() is not null);

-- -----------------------------------------------------------------------------
-- pagos: ambos leen y registran pagos (cobranza en recepción); correcciones y
-- anulaciones de pagos, solo gerencial. Sin DELETE para operativo.
-- TODO post-MVP (RF-19): la "privacidad de agregados" queda a nivel de interfaz
-- en v1 (el operativo no ve tableros/totales globales, pero sí los pagos de un
-- pedido para cobrar); cuando haya métricas, exponerlas vía vistas/RPC con
-- control de rol.
-- -----------------------------------------------------------------------------
drop policy if exists pagos_lectura on public.pagos;
create policy pagos_lectura on public.pagos
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists pagos_alta on public.pagos;
create policy pagos_alta on public.pagos
  for insert to authenticated
  with check (public.rol_actual() is not null);

drop policy if exists pagos_ajuste_gerencial on public.pagos;
create policy pagos_ajuste_gerencial on public.pagos
  for all to authenticated
  using (public.rol_actual() = 'gerencial')
  with check (public.rol_actual() = 'gerencial');

-- -----------------------------------------------------------------------------
-- plantillas: lectura para ambos (los avisos usan la plantilla vigente);
-- edición solo gerencial (RF-10/T-017).
-- -----------------------------------------------------------------------------
drop policy if exists plantillas_lectura on public.plantillas;
create policy plantillas_lectura on public.plantillas
  for select to authenticated
  using (public.rol_actual() is not null);

drop policy if exists plantillas_escritura_gerencial on public.plantillas;
create policy plantillas_escritura_gerencial on public.plantillas
  for all to authenticated
  using (public.rol_actual() = 'gerencial')
  with check (public.rol_actual() = 'gerencial');

-- -----------------------------------------------------------------------------
-- auditoria: solo gerencial lee e inserta; nadie actualiza ni borra
-- (append-only, RF-16). El operativo no tiene políticas: acceso nulo.
-- TODO post-MVP: insertar auditoría vía función security definer/RPC para que
-- el cliente no pueda falsificar usuario_id/fecha (T-024).
-- -----------------------------------------------------------------------------
drop policy if exists auditoria_lectura_gerencial on public.auditoria;
create policy auditoria_lectura_gerencial on public.auditoria
  for select to authenticated
  using (public.rol_actual() = 'gerencial');

drop policy if exists auditoria_insercion_gerencial on public.auditoria;
create policy auditoria_insercion_gerencial on public.auditoria
  for insert to authenticated
  with check (public.rol_actual() = 'gerencial');

-- =============================================================================
-- Pendientes declarados (post-MVP), resumen:
--   1. Pruebas automatizadas de RLS por rol (criterio T-005): requieren el
--      esquema aplicado y usuarios de prueba operativo/gerencial.
--   2. Privacidad de agregados a nivel de interfaz en v1 (RF-19) → vista/RPC.
--   3. Administración de usuarios (aprovisionar perfiles) y lectura de todos
--      los perfiles por gerencial.
--   4. Auditoría vía RPC (no falsificable) y restricción de campos financieros
--      por rol a nivel de BD.
-- =============================================================================
