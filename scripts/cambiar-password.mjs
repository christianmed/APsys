import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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
const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("✘ Error: Se requieren NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const [,, emailArg, newPasswordArg] = process.argv;

async function main() {
  if (!emailArg || !newPasswordArg) {
    console.log("=================================================");
    console.log("   APSys: Utilidad de Cambio de Contraseñas      ");
    console.log("=================================================");
    console.log("Uso: node scripts/cambiar-password.mjs <correo> <nueva_contraseña>\n");
    console.log("Consultando lista de usuarios registrados...");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("✘ Error al listar usuarios:", error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log("No se encontraron usuarios en Supabase Auth.");
      return;
    }

    console.log("\nUsuarios disponibles:");
    for (const u of users) {
      console.log(`- ${u.email} (ID: ${u.id})`);
    }
    console.log("\nEjemplo para cambiar clave:");
    console.log(`node scripts/cambiar-password.mjs ${users[0].email} miClaveSegura123`);
    return;
  }

  // Buscar el usuario por email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("✘ Error al buscar usuario:", listError.message);
    process.exit(1);
  }

  const usuario = users.find((u) => u.email?.toLowerCase() === emailArg.toLowerCase());
  if (!usuario) {
    console.error(`✘ No se encontró ningún usuario con el correo: "${emailArg}"`);
    console.log("\nCorreos existentes:");
    users.forEach((u) => console.log(`  - ${u.email}`));
    process.exit(1);
  }

  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    usuario.id,
    { password: newPasswordArg }
  );

  if (updateError) {
    console.error("✘ Error al actualizar contraseña:", updateError.message);
    process.exit(1);
  }

  console.log(`✔ Contraseña actualizada exitosamente para el usuario: ${data.user.email}`);
}

main().catch((err) => {
  console.error("✘ Error inesperado:", err);
  process.exit(1);
});
