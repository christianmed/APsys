/**
 * Utilidades de extracción y validación de tokens JWT de Supabase en memoria.
 *
 * Permite a `proxy.ts` (middleware) y Server Components validar la presencia y
 * vigencia de la sesión en < 1ms sin realizar llamadas remotas de red por HTTPS
 * a los servidores de Supabase Auth en cada navegación.
 *
 * @module lib/supabase/jwt-session
 */

export type JwtPayload = {
  sub: string;
  email?: string;
  role?: string;
  exp: number;
  [key: string]: unknown;
};

export type UsuarioJwtSesion = {
  id: string;
  email?: string;
  role?: string;
  exp: number;
};

export type CookieEntrada = {
  name: string;
  value: string;
};

/**
 * Decodifica el payload (segundo segmento) de un token JWT en formato JSON.
 * No verifica la firma criptográfica (esta la verifica Postgres con RLS), pero
 * extrae los claims y la expiración en sub-milisegundos.
 */
export function decodificarJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Normalizar base64url a base64 estándar
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf8");
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed !== "object" || parsed === null || typeof parsed.sub !== "string") {
      return null;
    }

    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Comprueba si los claims de un token siguen dentro de su ventana de vigencia temporal.
 *
 * @param payload - Claims del JWT decodificado
 * @param margenSegundos - Margen de seguridad opcional en segundos antes de la expiración real
 */
export function esTokenVigente(
  payload: { exp?: number; [key: string]: unknown } | null,
  margenSegundos: number = 0,
): boolean {
  if (!payload || typeof payload.exp !== "number") return false;
  const ahoraSegundos = Math.floor(Date.now() / 1000);
  return payload.exp > ahoraSegundos + margenSegundos;
}

/**
 * Extrae el access_token JWT de las cookies de Supabase (`sb-*-auth-token`).
 * Soporta almacenamiento estándar, chunks (.0, .1) y formato codificado `base64-`.
 */
export function extraerTokenJwtDeCookies(cookies: CookieEntrada[]): string | null {
  if (!cookies || cookies.length === 0) return null;

  // Filtrar cookies que pertenecen a la sesión de Supabase
  const authCookies = cookies
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
    .sort((a, b) => {
      const idxA = a.name.includes(".") ? parseInt(a.name.split(".").pop() ?? "0", 10) : 0;
      const idxB = b.name.includes(".") ? parseInt(b.name.split(".").pop() ?? "0", 10) : 0;
      return idxA - idxB;
    });

  if (authCookies.length === 0) return null;

  let rawValue = authCookies.map((c) => c.value).join("");

  if (rawValue.startsWith("base64-")) {
    try {
      rawValue = Buffer.from(rawValue.slice(7), "base64").toString("utf8");
    } catch {
      return null;
    }
  }

  try {
    const data = JSON.parse(rawValue);
    if (typeof data.access_token === "string") {
      return data.access_token;
    }
  } catch {
    // Si no es JSON pero tiene la estructura de 3 partes de un JWT
    if (rawValue.split(".").length === 3) {
      return rawValue;
    }
  }

  return null;
}

/**
 * Inspecciona las cookies de la petición y devuelve el usuario si la sesión es válida y vigente.
 * Retorna `null` si no hay sesión o si el token ya expiró.
 */
export function extraerUsuarioVigenteDeCookies(
  cookies: CookieEntrada[],
  margenSegundos: number = 0,
): UsuarioJwtSesion | null {
  const token = extraerTokenJwtDeCookies(cookies);
  if (!token) return null;

  const payload = decodificarJwtPayload(token);
  if (!payload || !esTokenVigente(payload, margenSegundos)) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    exp: payload.exp,
  };
}
