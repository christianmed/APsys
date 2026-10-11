#!/usr/bin/env node
/**
 * scripts/backup-supabase.mjs — Respaldo lógico y exportación de datos de Supabase (T-026b).
 *
 * Exporta todas las entidades clave en formato JSON estructurado con cálculo
 * de checksum SHA-256 y metadata del respaldo para garantizar recuperación
 * verificable ante incidentes (RPO < 24h, RTO < 30 min).
 *
 * Uso:
 *   node scripts/backup-supabase.mjs [directorio_destino]
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const tablasCriticas = [
  "perfiles",
  "clientes",
  "servicios",
  "tasas_cambio",
  "pedidos",
  "pedido_items",
  "pagos",
  "plantillas",
  "auditoria",
];

export async function generarBackupLogico(opciones = {}) {
  const supabaseUrl = opciones.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    opciones.serviceKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Se requieren las variables NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para ejecutar el respaldo.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const datosRespaldo = {};
  const resumenTablas = {};

  for (const tabla of tablasCriticas) {
    const { data, error } = await supabase.from(tabla).select("*");
    if (error) {
      console.warn(`⚠️ Advertencia al respaldar tabla ${tabla}: ${error.message}`);
      datosRespaldo[tabla] = [];
      resumenTablas[tabla] = { registros: 0, error: error.message };
    } else {
      datosRespaldo[tabla] = data || [];
      resumenTablas[tabla] = { registros: (data || []).length };
    }
  }

  const jsonString = JSON.stringify(datosRespaldo, null, 2);
  const sha256 = createHash("sha256").update(jsonString).digest("hex");

  const manifiesto = {
    sistema: "APSys — Gráfica & Impresión",
    version: "1.0.0",
    fechaRespaldo: new Date().toISOString(),
    tablas: resumenTablas,
    sha256,
  };

  return {
    timestamp,
    manifiesto,
    datos: datosRespaldo,
    jsonString,
    sha256,
  };
}

// Ejecución directa por CLI
if (process.argv[1]?.endsWith("backup-supabase.mjs")) {
  const dirDestino = resolve(process.argv[2] || "./backups");
  if (!existsSync(dirDestino)) {
    mkdirSync(dirDestino, { recursive: true });
  }

  console.log(`📦 Iniciando respaldo de base de datos APSys en: ${dirDestino}`);
  generarBackupLogico()
    .then((resultado) => {
      const archivoDatos = resolve(
        dirDestino,
        `apsys-backup-${resultado.timestamp}.json`,
      );
      const archivoManifiesto = resolve(
        dirDestino,
        `apsys-backup-${resultado.timestamp}.meta.json`,
      );

      writeFileSync(archivoDatos, resultado.jsonString, "utf-8");
      writeFileSync(
        archivoManifiesto,
        JSON.stringify(resultado.manifiesto, null, 2),
        "utf-8",
      );

      console.log(`✅ Respaldo completado exitosamente:`);
      console.log(`   - Datos: ${archivoDatos}`);
      console.log(`   - Manifiesto: ${archivoManifiesto}`);
      console.log(`   - SHA-256: ${resultado.sha256}`);
      console.table(resultado.manifiesto.tablas);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`❌ Error fatal durante el respaldo:`, err.message);
      process.exit(1);
    });
}
