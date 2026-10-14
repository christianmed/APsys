import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Env público de Supabase. El mensaje nombra la variable pero nunca incluye
 * valores ni claves (cero secretos también en mensajes de error).
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta ${name} en .env.local. Copiar .env.local.example y completar.`,
    );
  }
  return value;
}

/**
 * Cliente de Supabase para el servidor (Server Components, Server Actions y
 * Route Handlers). Crea un cliente NUEVO por request: reutilizarlo entre
 * requests dejaría respuestas sin las cabeceras de sesión correctas.
 *
 * `setAll` escribe las cookies renovadas; desde un Server Component el runtime
 * no permite escribir cookies durante el render y se ignora; el refresco de
 * sesión en cada request vive en `proxy.ts` (patrón oficial @supabase/ssr).
 */
export async function createClient() {
  try {
    await connection();
  } catch {
    // Si se ejecuta fuera del contexto de request de Next.js (ej. tests unitarios), continúa
  }

  const cookieStore = await cookies(); // En Next.js 15+ la API es asíncrona.

  return createServerClient(
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Llamada desde un Server Component: no se pueden escribir cookies
            // durante el render. Ver TODO(auth) del encabezado.
          }
        },
      },
    },
  );
}
