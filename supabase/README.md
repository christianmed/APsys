# Supabase — esquema v1 y RLS (APSys)

Estructura de la base de datos de APSys para Supabase (PostgreSQL). Este
directorio **no contiene secretos**: la URL y la clave anon viven en `.env.local`
(no versionado; plantilla en `.env.local.example`).

## Contenido y orden de aplicación

| Orden | Archivo | Contenido |
| --- | --- | --- |
| 1 | `migrations/0001_schema.sql` | Las 9 tablas (clientes, servicios, pedidos, pedido_items, pagos, plantillas, tasas_cambio, auditoria, perfiles), constraints, índices básicos y comentarios de decisión. |
| 2 | `migrations/0002_rls.sql` | RLS habilitado en las 9 tablas: `anon` sin acceso; permisos por rol (`operativo`/`gerencial`) leídos desde `perfiles`. |
| — | `rollback/v1.down.sql` | Reversión completa de v1 (elimina tablas, políticas y función auxiliar). Destructivo. |

Estado (2026-10-10): **pendiente de aplicar** en el proyecto dev. Hasta
entonces `GET /api/supabase-health` responde `{"reachable":true,"schemaReady":false}`
(la instancia responde, pero la tabla `clientes` aún no existe).

Los scripts son re-ejecutables donde aplica (`if not exists`,
`drop policy if exists`), pero el flujo canónico es aplicarlos **una sola vez
y en orden**.

## Vía A — SQL Editor del dashboard (disponible hoy)

1. Abrir el proyecto en https://supabase.com/dashboard → **SQL Editor** →
   *New query*.
2. Pegar el contenido de `migrations/0001_schema.sql` y pulsar **Run**.
   Debe terminar con "Success".
3. Repetir con `migrations/0002_rls.sql`.
4. Verificar: `npm run dev` y abrir `http://localhost:3000/api/supabase-health`
   → debe devolver `{"reachable":true,"schemaReady":true,"count":0}`.
   (`count: 0` es lo esperado: con RLS, `anon` no ve filas.)
5. Primer usuario gerencial (cuando se active el login, D-1): crear el usuario
   en **Authentication → Users** y luego, en el SQL Editor:
   `insert into public.perfiles (usuario_id, rol) values ('<uuid de auth.users>', 'gerencial');`

## Vía B — Supabase CLI / psql (cuando esté disponible en el entorno)

El CLI aún no está instalado en este proyecto. Cuando lo esté (o con `psql`):

```bash
supabase db push --db-url "postgresql://..."        # aplica migrations/ en orden
# o directamente:
psql "postgresql://..." -f supabase/migrations/0001_schema.sql
psql "postgresql://..." -f supabase/migrations/0002_rls.sql
```

La `--db-url` es un secreto: no commitearla (usar variable de entorno).

## Reversión

```bash
psql "postgresql://..." -f supabase/rollback/v1.down.sql
```

También puede pegarse en el SQL Editor. Elimina las tablas (y con ellas las
políticas RLS) y la función `public.rol_actual()`. **Destruye los datos**: usar
solo en dev.

## Notas de diseño (v1)

- Montos base en USD (`*_usd`); los pagos registran su moneda (`USD`/`Bs`) y la
  tasa usada, congelando históricos (RF-15, D-3).
- Los pedidos no se borran: se **anulan** con motivo (constraint) y la traza
  vive en `auditoria` (append-only, RF-16). Sin triggers en v1.
- RLS: `anon` no tiene políticas (acceso nulo); `authenticated` opera según su
  rol en `perfiles`. Sin fila en `perfiles` no hay permisos (fail closed).
- Endurecimientos post-MVP declarados en los comentarios de `0002_rls.sql`
  (privacidad de agregados a nivel de interfaz en v1, administración de
  usuarios, auditoría vía RPC).
