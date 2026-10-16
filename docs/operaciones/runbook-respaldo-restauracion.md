# Runbook de Operaciones: Respaldo y Restauración de Base de Datos

**Sistema:** APSys — Taller de Gráfica & Impresión  
**Entorno:** Producción / Staging  
**Motor:** PostgreSQL administrado por Supabase  
**Versión:** 1.0.0  
**Fecha de vigencia:** Octubre 2026  

---

## 1. Objetivos del Servicio y Continuidad del Negocio

Para asegurar la operatividad ininterrumpida del taller de gráfica y el resguardo de todas las órdenes, pagos y saldos de clientes, se establecen los siguientes Acuerdos de Nivel de Servicio (SLA):

- **RPO (_Recovery Point Objective_):** Menor a 24 horas (máxima pérdida de datos admisible en caso de catástrofe total).
- **RTO (_Recovery Time Objective_):** Menor a 30 minutos (tiempo máximo para restaurar el servicio y volver a operar).
- **Inmutabilidad:** Los registros de auditoría y tasas históricas deben preservarse íntegros tras cualquier restauración.

---

## 2. Estrategia de Respaldo Multinivel

### Nivel 1: Respaldos Nativos de Supabase (Diarios Automáticos)
- Supabase ejecuta snapshots automáticos diarios de la base de datos PostgreSQL.
- Se retienen durante 7 días en el plan estándar.
- Disponibles en: **Dashboard Supabase → Project Settings → Database → Backups**.

### Nivel 2: Respaldo Lógico Automatizado (`scripts/backup-supabase.mjs`)
- Script Node.js que extrae las tablas críticas en JSON estructurado.
- Genera manifiesto con conteo de registros y firma criptográfica SHA-256.
- Tablas cubiertas: `perfiles`, `clientes`, `servicios`, `tasas_cambio`, `pedidos`, `pedido_items`, `pagos`, `plantillas`, `auditoria`.

Ejecución manual o en cron:
```bash
node scripts/backup-supabase.mjs ./backups
```

### Nivel 3: Respaldo Estándar PostgreSQL con `pg_dump`
Para respaldos completos binarios o SQL directo:
```bash
pg_dump --clean --if-exists --no-owner --no-privileges \
  -h db.[TU-PROYECTO].supabase.co -U postgres -d postgres > apsys_backup_$(date +%F).sql
```

---

## 3. Procedimiento de Restauración Paso a Paso

### Escenario A: Restauración Inmediata desde el Dashboard de Supabase
1. Ingresar a **Supabase Dashboard → Database → Backups**.
2. Identificar el punto de restauración más cercano anterior al incidente.
3. Hacer clic en **Restore** y confirmar la operación.
4. Esperar de 5 a 10 minutos mientras el motor reinicia y monta el snapshot.
5. Ejecutar el smoke test para validar el funcionamiento:
   ```bash
   node scripts/smoke-test-produccion.mjs https://apsys.tu-dominio.com
   ```

---

### Escenario B: Restauración en una Nueva Instancia de Supabase (Disaster Recovery)

Si la instancia original quedó inaccesible o corrompida:

#### Paso 1: Provisionar el nuevo proyecto
1. Crear un nuevo proyecto en [Supabase](https://supabase.com).
2. Obtener la nueva URL, `anon key` y `service_role key`.

#### Paso 2: Aplicar migraciones y políticas RLS
Ejecutar las migraciones en orden estricto desde el repositorio:
```bash
npx supabase db push
# O aplicar manualmente vía SQL Editor:
# 1. supabase/migrations/0001_schema.sql
# 2. supabase/migrations/0002_rls.sql
# 3. supabase/migrations/0003_plantillas_whatsapp.sql
```

#### Paso 3: Restaurar los datos
Si se cuenta con el dump SQL:
```bash
psql -h db.[NUEVO-PROYECTO].supabase.co -U postgres -d postgres -f apsys_backup_YYYY-MM-DD.sql
```

Si se cuenta con el backup JSON del Nivel 2 (`scripts/backup-supabase.mjs`):

El sistema cuenta con la herramienta automatizada `scripts/restore-supabase.mjs`, que verifica automáticamente la firma criptográfica SHA-256 e inserta las filas respetando el orden de claves foráneas:

**Opción A — Restauración directa contra Supabase:**
```bash
node scripts/restore-supabase.mjs backups/apsys-backup-[TIMESTAMP].json
```

**Opción B — Convertir el JSON a un script SQL (`.sql`):**
Si prefieres inspeccionar o ejecutar las sentencias SQL en el SQL Editor de Supabase:
```bash
node scripts/restore-supabase.mjs backups/apsys-backup-[TIMESTAMP].json --to-sql
```
Esto generará el archivo `backups/apsys-backup-[TIMESTAMP].sql` con transacciones atómicas `begin; ... commit;` y cláusulas `on conflict (id) do nothing;`.

#### Paso 4: Actualizar Variables de Entorno en Vercel
1. Ir a **Vercel Dashboard → APSys → Settings → Environment Variables**.
2. Actualizar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Disparar un **Redeploy** de producción.

---

## 4. Verificación Post-Restauración (Checklist de Aceptación)

Tras completar la restauración, el ingeniero o administrador debe validar:

- [ ] `GET /api/supabase-health` responde `{ reachable: true, schemaReady: true }`.
- [ ] Login operativo: inicio de sesión correcto con usuario gerencial y operativo.
- [ ] Integridad de pedidos: el listado `/pedidos` muestra las órdenes con totales y saldos correctos.
- [ ] Cartera morosa: `/cuentas-por-cobrar` cuadra con los saldos históricos.
- [ ] Auditoría: los registros en `auditoria` no fueron truncados ni alterados.
- [ ] Tasa de cambio: `/tasas` muestra la tasa vigente correcta sin alterar pedidos previos.

---

## 5. Simulacro de Restauración Periódico

Para garantizar que el runbook no quede obsoleto:
- Realizar una prueba de restauración en un entorno local o de preview **una vez por trimestre**.
- Documentar fecha, tiempo total de recuperación cronometrado y cualquier ajuste requerido al runbook.

---

## 6. Automatización de Sincronización de Tasas BCV (Vercel Cron & Service Role Key)

Para garantizar que la tasa oficial del BCV se guarde de forma automática y persistente en la base de datos sin depender de que un usuario esté logueado, se utiliza un Vercel Cron Job y la clave maestra de Supabase.

### 6.1 Variables de Entorno Requeridas

1. **`SUPABASE_SERVICE_ROLE_KEY`**:
   - **Dónde se obtiene:** En el dashboard de [Supabase](https://supabase.com) → **Project Settings** → **API** → sección **Project API keys** → copiar la clave **`service_role` (secret)**.
   - **Propósito:** Permite al endpoint del Cron escribir en `tasas_cambio` y `auditoria` saltando las restricciones de sesión de usuario de RLS.
   - **Precaución:** Nunca exponer esta clave en el cliente (`NEXT_PUBLIC_`), debe mantenerse estrictamente en el backend.

2. **`CRON_SECRET`**:
   - **Dónde se obtiene:** **La genera el propio desarrollador/administrador.**
   - **Cómo generarla:** Puedes generar una cadena aleatoria segura de 32 o 64 caracteres.
     - En PowerShell: `[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")`
     - O en bash/openssl: `openssl rand -hex 32`
   - **Propósito:** Vercel envía automáticamente la cabecera `Authorization: Bearer <CRON_SECRET>` al invocar el cron. El endpoint rechaza con 401 cualquier petición que no incluya esta firma.

### 6.2 Horarios y Monitoreo del Cron Job

El archivo `vercel.json` tiene configurados dos disparadores automáticos:
- **`30 22 * * 1-5` (6:30 p. m. Venezuela / Lunes a Viernes):** Ejecución principal tras el cierre de mesas de cambio bancarias para registrar la tasa programada de mañana.
- **`5 4 * * *` (12:05 a. m. Venezuela / Diario):** Red de seguridad nocturna para garantizar que la jornada arranque con la tasa registrada.

Para monitorear las ejecuciones:
- En Vercel: **Project Dashboard → Logs / Crons**.
- En Supabase: Consultar la tabla `auditoria` filtrando por `origen = 'cron_automatico_bcv'`.
