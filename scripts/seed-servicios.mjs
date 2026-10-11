import { readFileSync } from "node:fs";

function cargarEnv(ruta = ".env.local") {
  const texto = readFileSync(ruta, "utf8");
  const valores = {};
  for (const linea of texto.split(/\r?\n/)) {
    const coincidencia = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (coincidencia) {
      valores[coincidencia[1]] = coincidencia[2].replace(/^["']|["']$/g, "");
    }
  }
  return valores;
}

const env = cargarEnv();
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const CLAVE_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function login(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: CLAVE_ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login falló (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function main() {
  const tokenGerencial = await login(
    env.TEST_USER_GERENCIAL_EMAIL,
    env.TEST_USER_GERENCIAL_PASSWORD
  );

  // Leer servicios actuales
  const resGet = await fetch(`${URL_BASE}/rest/v1/servicios?select=*`, {
    headers: {
      apikey: CLAVE_ANON,
      Authorization: `Bearer ${tokenGerencial}`,
    },
  });

  const servicios = await resGet.json();
  console.log("Servicios actuales:", servicios);

  const nombresActuales = new Set(servicios.map((s) => s.nombre));
  const semilla = [
    { nombre: "Pendones", orden: 1, activo: true },
    { nombre: "Viniles", orden: 2, activo: true },
    { nombre: "Backing", orden: 3, activo: true },
    { nombre: "Microperforado", orden: 4, activo: true },
    { nombre: "Etiquetas", orden: 5, activo: true },
  ];

  const faltantes = semilla.filter((s) => !nombresActuales.has(s.nombre));

  if (faltantes.length > 0) {
    console.log(`Sembrando ${faltantes.length} servicios oficiales faltantes...`);
    const resPost = await fetch(`${URL_BASE}/rest/v1/servicios`, {
      method: "POST",
      headers: {
        apikey: CLAVE_ANON,
        Authorization: `Bearer ${tokenGerencial}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(faltantes),
    });

    if (resPost.ok) {
      const dataIns = await resPost.json();
      console.log("Servicios sembrados exitosamente:", dataIns);
    } else {
      console.error("Error al sembrar servicios:", await resPost.text());
    }
  } else {
    console.log("Todos los servicios oficiales ya existen.");
  }
}

main().catch(console.error);
