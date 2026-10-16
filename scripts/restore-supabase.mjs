#!/usr/bin/env node
/**
 * scripts/restore-supabase.mjs — Restauración de datos y Disaster Recovery para APSys (T-026c).
 *
 * Lee un archivo de respaldo generado por backup-supabase.mjs, verifica su
 * integridad criptográfica SHA-256 (contra el archivo .meta.json acompañante)
 * y restaura las entidades en orden de dependencias relacionales en Supabase.
 *
 * También permite exportar los datos JSON a un script SQL con la opción --to-sql.
 *
 * Uso:
 *   node scripts/restore-supabase.mjs <archivo-backup.json>
 *   node scripts/restore-supabase.mjs <archivo-backup.json> --to-sql
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Orden estricto respetando claves foráneas (Foreign Keys)
const ordenTablasRestauracion = [
  "perfiles",
  "clientes",
  "servicios",
  "tasas_cambio",
  "plantillas",
  "pedidos",
  "pedido_items",
  "pagos",
  "auditoria",
];

/**
 * Convierte un objeto de respaldo JSON a sentencias SQL compatibles con PostgreSQL.
 */
export function convertirBackupASql(datosRespaldo) {
  const lineasSql = [
    "-- ===========================================================================",
    "-- APSys — Script SQL de Restauración de Base de Datos",
    `-- Generado: ${new Date().toISOString()}`,
    "-- ===========================================================================",
    "",
    "begin;",
    "",
  ];

  for (const tabla of ordenTablasRestauracion) {
    const filas = datosRespaldo[tabla] || [];
    if (filas.length === 0) continue;

    lineasSql.push(`-- Tabla: ${tabla} (${filas.length} registros)`);
    for (const fila of filas) {
      const columnas = Object.keys(fila);
      const valoresFormateados = columnas.map((col) => {
        const val = fila[col];
        if (val === null || val === undefined) return "null";
        if (typeof val === "boolean" || typeof val === "number") return val;
        if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });

      lineasSql.push(
        `insert into public.${tabla} (${columnas.join(", ")}) values (${valoresFormateados.join(", ")}) on conflict (id) do nothing;`,
      );
    }
    lineasSql.push("");
  }

  lineasSql.push("commit;");
  return lineasSql.join("\n");
}

/**
 * Ejecuta la restauración lógica en la base de datos Supabase mediante upserts en lotes.
 */
export async function restaurarBackupLogico(rutaArchivoJson, opciones = {}) {
  const archivoAbsoluto = resolve(rutaArchivoJson);
  if (!existsSync(archivoAbsoluto)) {
    throw new Error(`El archivo de respaldo no existe: ${archivoAbsoluto}`);
  }

  const contenidoRaw = readFileSync(archivoAbsoluto, "utf8");
  const datosRespaldo = JSON.parse(contenidoRaw);

  // 1. Verificación de integridad SHA-256 si existe .meta.json
  const rutaMeta = archivoAbsoluto.replace(/\.json$/, ".meta.json");
  if (existsSync(rutaMeta)) {
    const meta = JSON.parse(readFileSync(rutaMeta, "utf8"));
    const hashCalculado = createHash("sha256").update(contenidoRaw).digest("hex");
    if (meta.sha256 && meta.sha256 !== hashCalculado) {
      throw new Error(
        `Error de integridad: el checksum SHA-256 no coincide.\nEsperado: ${meta.sha256}\nCalculado: ${hashCalculado}`,
      );
    }
    console.log(`✅ Integridad criptográfica verificada (SHA-256: ${hashCalculado.slice(0, 16)}...)`);
  } else {
    console.warn("⚠️ Aviso: No se encontró archivo .meta.json; procediendo sin verificación de firma.");
  }

  // Si solo se solicitó conversión a SQL
  if (opciones.soloSql) {
    const sql = convertirBackupASql(datosRespaldo);
    const rutaSql = archivoAbsoluto.replace(/\.json$/, ".sql");
    writeFileSync(rutaSql, sql, "utf8");
    console.log(`📄 Script SQL generado con éxito en: ${rutaSql}`);
    return { exito: true, rutaSql };
  }

  // 2. Conectar a Supabase con Service Role Key
  const supabaseUrl = opciones.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    opciones.serviceKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Se requieren las variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para restaurar los datos.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const resumenRestauracion = {};

  // 3. Restaurar tabla por tabla en orden estricto
  for (const tabla of ordenTablasRestauracion) {
    const filas = datosRespaldo[tabla] || [];
    if (filas.length === 0) {
      resumenRestauracion[tabla] = { procesados: 0, insertados: 0 };
      continue;
    }

    console.log(`🔄 Restaurando tabla '${tabla}' (${filas.length} registros)...`);

    // Procesar en lotes de 50 para evitar exceder límites de payload HTTP
    const tamanoLote = 50;
    let insertados = 0;

    for (let i = 0; i < filas.length; i += tamanoLote) {
      const lote = filas.slice(i, i + tamanoLote);
      const { error } = await supabase.from(tabla).upsert(lote, { onConflict: "id" });

      if (error) {
        console.error(`❌ Error al restaurar lote en tabla '${tabla}': ${error.message}`);
        resumenRestauracion[tabla] = {
          procesados: filas.length,
          insertados,
          error: error.message,
        };
        break;
      }
      insertados += lote.length;
    }

    if (!resumenRestauracion[tabla]?.error) {
      resumenRestauracion[tabla] = { procesados: filas.length, insertados };
      console.log(`   ✅ ${insertados}/${filas.length} registros en '${tabla}'`);
    }
  }

  return {
    exito: true,
    resumen: resumenRestauracion,
  };
}

// Ejecución CLI directa
if (process.argv[1]?.endsWith("restore-supabase.mjs")) {
  const rutaArchivo = process.argv[2];
  const flagSql = process.argv.includes("--to-sql");

  if (!rutaArchivo || rutaArchivo.startsWith("--")) {
    console.error("Uso: node scripts/restore-supabase.mjs <archivo-backup.json> [--to-sql]");
    process.exit(1);
  }

  console.log(`🚀 Iniciando proceso de restauración para: ${basename(rutaArchivo)}`);
  restaurarBackupLogico(rutaArchivo, { soloSql: flagSql })
    .then((resultado) => {
      console.log("\n🎉 Proceso finalizado con éxito.");
      if (resultado.resumen) {
        console.table(resultado.resumen);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Fallo en la restauración:", error.message);
      process.exit(1);
    });
}
