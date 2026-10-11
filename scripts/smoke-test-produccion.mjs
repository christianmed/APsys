#!/usr/bin/env node
/**
 * scripts/smoke-test-produccion.mjs — Smoke test automatizado para verificar
 * la salud del despliegue en Vercel o entorno de staging (T-026a).
 *
 * Uso:
 *   node scripts/smoke-test-produccion.mjs [url_base]
 *   Ejemplo: node scripts/smoke-test-produccion.mjs https://apsys-produccion.vercel.app
 */

const baseUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log(`\n======================================================`);
console.log(`🔍 APSys — Smoke Test de Despliegue en Producción`);
console.log(`🎯 URL objetivo: ${baseUrl}`);
console.log(`======================================================\n`);

async function testEndpoint(ruta, nombre, esperadoStatus = [200, 307, 308]) {
  const url = `${baseUrl}${ruta}`;
  try {
    const inicio = Date.now();
    const res = await fetch(url, { redirect: "manual" });
    const duracion = Date.now() - inicio;

    const pasa = esperadoStatus.includes(res.status);
    const icono = pasa ? "✅" : "❌";
    console.log(
      `${icono} ${nombre.padEnd(30)} [HTTP ${res.status}] en ${duracion}ms -> ${ruta}`,
    );

    return pasa;
  } catch (error) {
    console.error(`❌ ${nombre.padEnd(30)} ERROR DE CONEXIÓN: ${error.message}`);
    return false;
  }
}

async function ejecutarSmokeTests() {
  const pruebas = [
    { ruta: "/", nombre: "Página de Inicio / Landing", status: [200, 307] },
    { ruta: "/login", nombre: "Página de Login", status: [200] },
    { ruta: "/api/supabase-health", nombre: "Salud de Supabase API", status: [200, 503] },
    { ruta: "/taller", nombre: "Tablero de Taller", status: [200, 307] },
    { ruta: "/pedidos", nombre: "Listado de Pedidos", status: [200, 307] },
  ];

  let todasAprobadas = true;

  for (const p of pruebas) {
    const ok = await testEndpoint(p.ruta, p.nombre, p.status);
    if (!ok) todasAprobadas = false;
  }

  console.log(`\n------------------------------------------------------`);
  if (todasAprobadas) {
    console.log(`🎉 Todos los chequeos de humo de producción pasaron.`);
    process.exit(0);
  } else {
    console.log(`⚠️ Al menos un chequeo de humo falló.`);
    process.exit(1);
  }
}

ejecutarSmokeTests();
