import { createBrowserClient } from "@supabase/ssr";

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

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Cliente de Supabase para el navegador (Client Components).
 *
 * Solo usa la clave anon/publishable: la `service_role` jamás llega al
 * navegador. La sesión se persiste en cookies vía @supabase/ssr, de modo que
 * el servidor lee la misma sesión que escribió el navegador (patrón SSR de
 * Supabase). En el navegador reutiliza una instancia singleton para evitar
 * reconexiones de red redundantes.
 */
export function createClient() {
  const url = requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (typeof window !== "undefined") {
    if (browserClientInstance) {
      return browserClientInstance;
    }
    browserClientInstance = createBrowserClient(url, anonKey);
    return browserClientInstance;
  }

  return createBrowserClient(url, anonKey);
}

/**
 * Alias semántico para obtener la instancia única del cliente de Supabase en el navegador.
 */
export function getSupabaseBrowserClient() {
  return createClient();
}

