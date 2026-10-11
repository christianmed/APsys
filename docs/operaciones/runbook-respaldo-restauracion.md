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

Si se cuenta con el backup JSON del Nivel 2:
1. Verificar la integridad del archivo contra su manifiesto:
   ```bash
   node -e "
     const crypto = require('crypto');
     const fs = require('fs');
     const data = fs.readFileSync('backups/apsys-backup-[TIMESTAMP].json');
     const meta = JSON.parse(fs.readFileSync('backups/apsys-backup-[TIMESTAMP].meta.json'));
     const hash = crypto.createHash('sha256').update(data).digest('hex');
     if (hash === meta.sha256) console.log('✅ Integridad verificada OK');
     else console.error('❌ Error: checksum mismatch');
   "
   ```

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
