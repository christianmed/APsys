-- =============================================================================
-- APSys — Migración 0001: esquema v1 (T-004)
-- =============================================================================
-- Crea las 9 tablas del modelo v1 (PRD §7). Orden por dependencias:
--   perfiles → clientes → servicios → tasas_cambio → pedidos →
--   pedido_items → pagos → plantillas → auditoria
--
-- Convenciones y decisiones:
--   * Montos base en USD (columnas *_usd). Los pagos se registran en su
--     moneda ('USD' | 'Bs') y referencian la tasa usada: cada pedido/pago
--     congela su tasa (RF-15/D-3) y cambiar la tasa vigente no altera
--     documentos previos.
--   * Los pedidos NO se borran: se anulan con motivo obligatorio (RF-16);
--     la traza inmutable vive en `auditoria` (append-only).
--   * Sin triggers ni seeds en v1: la lógica de negocio (numeración de
--     órdenes, auditoría, plantillas por defecto) llega con T-007/T-010/T-017/T-024.
--   * Re-ejecutable donde aplica (if not exists); en un entorno nuevo aplicar
--     una sola vez, en orden, y luego 0002_rls.sql.
-- Sin secretos: aquí solo hay estructura.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- perfiles: rol de cada usuario de Supabase Auth: 'operativo' | 'gerencial'.
-- Gobierna las políticas RLS (0002, RF-19). En v1 se aprovisiona por SQL o
-- servicio (no hay pantalla de usuarios) y sin fila no hay permisos (fail
-- closed). TODO post-MVP: pantalla de administración de usuarios.
-- -----------------------------------------------------------------------------
create table if not exists public.perfiles (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references auth.users (id) on delete cascade,
  rol text not null check (rol in ('operativo', 'gerencial')),
  creado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- clientes: alta rápida y búsqueda por nombre/teléfono (T-006, RF-01).
-- El teléfono va indexado para la búsqueda de recepción. La prevención de
-- duplicados es responsabilidad de la interfaz (T-006), no un unique: en la
-- operación real un mismo teléfono puede compartirse (familiar/empresa).
-- -----------------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) > 0),
  telefono text,
  notas text,
  creado_en timestamptz not null default now()
);

create index if not exists clientes_telefono_idx on public.clientes (telefono);
-- TODO(T-006): evaluar pg_trgm si la búsqueda por sufijo de nombre/teléfono lo exige.

-- -----------------------------------------------------------------------------
-- servicios: catálogo administrable (RF-04/T-007). Baja lógica vía `activo`
-- para no romper pedidos históricos (los ítems referencian el servicio).
-- Las filas semilla del catálogo llegan con T-007.
-- -----------------------------------------------------------------------------
create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique check (length(btrim(nombre)) > 0),
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- tasas_cambio: histórico de la tasa referencial Bs/USD (RF-15).
-- Las filas no se editan: cada vigencia es una fila nueva; la vigente es la
-- de mayor `vigente_desde`. `numeric(16,4)` da margen al bolívar.
-- -----------------------------------------------------------------------------
create table if not exists public.tasas_cambio (
  id uuid primary key default gen_random_uuid(),
  valor_bs_por_usd numeric(16, 4) not null check (valor_bs_por_usd > 0),
  vigente_desde timestamptz not null default now(),
  creado_en timestamptz not null default now()
);

create index if not exists tasas_cambio_vigente_desde_idx
  on public.tasas_cambio (vigente_desde desc);

-- -----------------------------------------------------------------------------
-- pedidos: cabecera del trabajo (RF-01/RF-05/RF-16).
--   * `numero_orden`: único; la estrategia de numeración sin huecos es T-010.
--   * `total_usd`: total del contrato en moneda base.
--   * `tasa_id`: tasa congelada del pedido (referencia al histórico).
--   * `anulado` + `motivo_anulacion`: anulación con motivo obligatorio;
--     la traza inmutable vive en `auditoria` (T-024).
--   * `listo_en`/`entregado_en`: marcas para avisos y recordatorios (T-015/T-016).
-- -----------------------------------------------------------------------------
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_orden integer not null unique,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  estado text not null default 'recibido'
    check (estado in ('recibido', 'en_produccion', 'listo', 'entregado', 'cancelado')),
  total_usd numeric(12, 2) not null default 0 check (total_usd >= 0),
  tasa_id uuid references public.tasas_cambio (id) on delete restrict,
  notas text,
  anulado boolean not null default false,
  motivo_anulacion text,
  creado_en timestamptz not null default now(),
  listo_en timestamptz,
  entregado_en timestamptz,
  constraint pedidos_anulacion_con_motivo
    check (not anulado or length(btrim(coalesce(motivo_anulacion, ''))) > 0)
);

create index if not exists pedidos_cliente_id_idx on public.pedidos (cliente_id);
create index if not exists pedidos_estado_idx
  on public.pedidos (estado) where not anulado;
create index if not exists pedidos_listo_en_idx
  on public.pedidos (listo_en) where estado = 'listo' and not anulado;

-- -----------------------------------------------------------------------------
-- pedido_items: detalle del trabajo (RF-01/T-008). `precio_usd` es el precio
-- unitario del ítem en moneda base; la línea de la comanda se compone en la
-- interfaz con descripción/dimensiones/acabados (T-011).
-- -----------------------------------------------------------------------------
create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  servicio_id uuid not null references public.servicios (id) on delete restrict,
  descripcion text,
  dimensiones text,
  acabados text,
  cantidad integer not null default 1 check (cantidad > 0),
  precio_usd numeric(12, 2) not null default 0 check (precio_usd >= 0)
);

create index if not exists pedido_items_pedido_id_idx
  on public.pedido_items (pedido_id);

-- -----------------------------------------------------------------------------
-- pagos: abonos y pagos (RF-02). `monto` va expresado en `moneda`
-- ('USD' | 'Bs'); `tasa_id` guarda la tasa usada para expresarlo en moneda
-- base (saldos y métricas en USD, RF-11). No hay pagos no positivos en v1.
-- -----------------------------------------------------------------------------
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete restrict,
  monto numeric(12, 2) not null check (monto > 0),
  moneda text not null check (moneda in ('USD', 'Bs')),
  referencia text,
  tasa_id uuid references public.tasas_cambio (id) on delete restrict,
  creado_en timestamptz not null default now()
);

create index if not exists pagos_pedido_id_idx on public.pagos (pedido_id);

-- -----------------------------------------------------------------------------
-- plantillas: textos de los mensajes de WhatsApp (RF-10/T-017). `tipo` único;
-- valores previstos en v1: 'aviso_retiro' (T-015) y 'recordatorio' (T-016).
-- Sin check cerrado de tipos para no exigir migración al agregar uno nuevo.
-- -----------------------------------------------------------------------------
create table if not exists public.plantillas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null unique check (length(btrim(tipo)) > 0),
  contenido text not null check (length(btrim(contenido)) > 0),
  creado_en timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- auditoria: traza append-only de operaciones sensibles (RF-16/T-024).
-- La aplicación solo inserta y consulta; sin update/delete (garantizado
-- también por RLS en 0002). `entidad`/`entidad_id` apuntan al registro
-- afectado (p. ej. 'pedido'); `accion` es texto libre (p. ej. 'anulacion',
-- 'cambio_tasa'). `usuario_id` referencia el perfil que ejecutó la acción;
-- si el usuario se elimina, la fila permanece (set null) conservando
-- fecha/acción/motivo.
-- -----------------------------------------------------------------------------
create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  entidad text not null check (length(btrim(entidad)) > 0),
  entidad_id uuid not null,
  accion text not null check (length(btrim(accion)) > 0),
  motivo text,
  usuario_id uuid references public.perfiles (id) on delete set null,
  fecha timestamptz not null default now()
);

create index if not exists auditoria_entidad_idx
  on public.auditoria (entidad, entidad_id);
create index if not exists auditoria_fecha_idx on public.auditoria (fecha desc);
