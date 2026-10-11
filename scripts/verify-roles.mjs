// Verificación repetible de las políticas RLS por rol (T-005 / T-005b).
// Uso: `npm run verify:roles` — requiere las variables TEST_USER_* en .env.local.
//
// Comprueba contra el proyecto Supabase REAL, vía API REST:
//   1. Login (password grant) de operativo y gerencial.
//   2. Cada usuario lee su propia fila de `perfiles` (rol correcto).
//   3. Operativo BLOQUEADO al escribir en tasas_cambio y servicios (código 42501).
//   4. Gerencial: ciclo completo insertar → leer (también como operativo) → borrar
//      en `servicios`, con limpieza garantizada.
//   5. Separación de lectura en `auditoria`: la fila marcada que inserta el
//      gerencial NO la ve el operativo. Nota: `auditoria` es append-only por
//      diseño (sin delete permitido), así que esa fila de prueba
//      (`entidad='__verify_roles__'`) queda registrada a propósito.
//
// Nunca imprime tokens ni contraseñas. No se ejecuta en CI (necesita red y
// credenciales); ver scripts npm.

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

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

const usuarios = {
  operativo: {
    email: env.TEST_USER_OPERATIVO_EMAIL,
    clave: env.TEST_USER_OPERATIVO_PASSWORD,
  },
  gerencial: {
    email: env.TEST_USER_GERENCIAL_EMAIL,
    clave: env.TEST_USER_GERENCIAL_PASSWORD,
  },
};

if (!URL_BASE || !CLAVE_ANON) {
  console.error("✘ Faltan NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY en .env.local");
  process.exit(1);
}
for (const [rol, usuario] of Object.entries(usuarios)) {
  if (!usuario.email || !usuario.clave) {
    console.error(`✘ Faltan TEST_USER_${rol.toUpperCase()}_* en .env.local`);
    process.exit(1);
  }
}

const resultados = [];

function comprobar(nombre, condicion, detalle = "") {
  const ok = Boolean(condicion);
  resultados.push(ok);
  console.log(`${ok ? "✔" : "✘"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  return ok;
}

async function peticion(
  ruta,
  { token, metodo = "GET", cuerpo, extra = {} } = {},
) {
  const cabeceras = {
    apikey: CLAVE_ANON,
    "Content-Type": "application/json",
    ...extra,
  };
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { status: respuesta.status, datos };
}

async function iniciarSesion(email, clave) {
  const { status, datos } = await peticion(
    "/auth/v1/token?grant_type=password",
    {
      metodo: "POST",
      cuerpo: { email, password: clave },
    },
  );
  return { status, token: datos?.access_token ?? null };
}

console.log("— Verificación de roles APSys (RLS) —\n");

// 1) Logins
const sesiones = {};
for (const rol of ["operativo", "gerencial"]) {
  const { status, token } = await iniciarSesion(
    usuarios[rol].email,
    usuarios[rol].clave,
  );
  comprobar(`login ${rol}`, status === 200 && Boolean(token), `HTTP ${status}`);
  sesiones[rol] = token;
}
if (!sesiones.operativo || !sesiones.gerencial) {
  console.error("\n✘ Sin ambos logins no se puede continuar.");
  process.exit(1);
}

// 2) Cada usuario lee su propio rol
for (const rol of ["operativo", "gerencial"]) {
  const { status, datos } = await peticion("/rest/v1/perfiles?select=rol", {
    token: sesiones[rol],
  });
  comprobar(
    `${rol} lee su rol`,
    status === 200 &&
      Array.isArray(datos) &&
      datos.length === 1 &&
      datos[0]?.rol === rol,
    `HTTP ${status}`,
  );
}

// 3) Escrituras bloqueadas al operativo
const intentoTasas = await peticion("/rest/v1/tasas_cambio", {
  token: sesiones.operativo,
  metodo: "POST",
  cuerpo: { valor_bs_por_usd: 1 },
});
comprobar(
  "operativo NO puede escribir tasas_cambio",
  intentoTasas.status >= 400 && intentoTasas.datos?.code === "42501",
  `HTTP ${intentoTasas.status}`,
);

const intentoServicios = await peticion("/rest/v1/servicios", {
  token: sesiones.operativo,
  metodo: "POST",
  cuerpo: { nombre: "__verify_roles__", activo: true, orden: 0 },
});
comprobar(
  "operativo NO puede escribir servicios",
  intentoServicios.status >= 400 && intentoServicios.datos?.code === "42501",
  `HTTP ${intentoServicios.status}`,
);

// 4) Ciclo completo del gerencial en servicios (con limpieza)
const alta = await peticion("/rest/v1/servicios", {
  token: sesiones.gerencial,
  metodo: "POST",
  cuerpo: { nombre: "__verify_roles__", activo: true, orden: 0 },
  extra: { Prefer: "return=representation" },
});
const idServicio = Array.isArray(alta.datos) ? alta.datos[0]?.id : null;
comprobar(
  "gerencial crea servicio de prueba",
  alta.status === 201 && Boolean(idServicio),
  `HTTP ${alta.status}`,
);

if (idServicio) {
  const lecturaOperativo = await peticion(
    `/rest/v1/servicios?id=eq.${idServicio}&select=nombre`,
    { token: sesiones.operativo },
  );
  comprobar(
    "operativo SÍ lee el servicio creado",
    lecturaOperativo.status === 200 &&
      Array.isArray(lecturaOperativo.datos) &&
      lecturaOperativo.datos.length === 1,
    `HTTP ${lecturaOperativo.status}`,
  );

  const borrado = await peticion(`/rest/v1/servicios?id=eq.${idServicio}`, {
    token: sesiones.gerencial,
    metodo: "DELETE",
  });
  comprobar(
    "gerencial borra el servicio de prueba (limpieza)",
    borrado.status === 204,
    `HTTP ${borrado.status}`,
  );
}

// 5) Separación de lectura en auditoria (append-only: la fila queda marcada)
const idAuditoria = randomUUID();
const altaAuditoria = await peticion("/rest/v1/auditoria", {
  token: sesiones.gerencial,
  metodo: "POST",
  cuerpo: {
    entidad: "__verify_roles__",
    entidad_id: idAuditoria,
    accion: "test_t005",
    motivo:
      "Fila marcada de npm run verify:roles (append-only: queda por diseño)",
  },
});
comprobar(
  "gerencial inserta fila marcada en auditoria",
  altaAuditoria.status === 201,
  `HTTP ${altaAuditoria.status}`,
);

const auditoriaOperativo = await peticion(
  `/rest/v1/auditoria?entidad_id=eq.${idAuditoria}&select=id`,
  { token: sesiones.operativo },
);
comprobar(
  "operativo NO ve la auditoría (lectura separada)",
  auditoriaOperativo.status === 200 &&
    Array.isArray(auditoriaOperativo.datos) &&
    auditoriaOperativo.datos.length === 0,
  `HTTP ${auditoriaOperativo.status}`,
);

const auditoriaGerencial = await peticion(
  `/rest/v1/auditoria?entidad_id=eq.${idAuditoria}&select=id`,
  { token: sesiones.gerencial },
);
comprobar(
  "gerencial SÍ ve la auditoría",
  auditoriaGerencial.status === 200 &&
    Array.isArray(auditoriaGerencial.datos) &&
    auditoriaGerencial.datos.length === 1,
  `HTTP ${auditoriaGerencial.status}`,
);

// Resumen
const fallos = resultados.filter((ok) => !ok).length;
console.log(
  `\n${fallos === 0 ? "✔ TODO OK" : `✘ ${fallos} comprobación(es) fallida(s)`} — ${resultados.length - fallos}/${resultados.length} en verde.`,
);
console.log(
  "Nota: la fila de prueba en `auditoria` queda registrada por diseño (append-only).",
);
process.exit(fallos === 0 ? 0 : 1);
