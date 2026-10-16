import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { extraerUsuarioVigenteDeCookies } from "@/lib/supabase/jwt-session";

/**
 * Proxy de sesión de alto rendimiento (Next.js 16).
 *
 * 1) Vía Rápida (Opción A): Valida el JWT de la cookie en memoria local (< 1ms).
 *    Si el token es vigente, inyecta cabeceras `x-user-id` y `x-user-email` (Opción B)
 *    para que los Server Components no realicen llamadas remotas repetidas a Supabase Auth.
 * 2) Vía de Respaldo: Solo si el token expiró o requiere refresco, recurre a `getUser()`.
 * 3) Rutas públicas: /login y /api/supabase-health pasan de inmediato sin tocar la red.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const esRutaPublica =
    pathname === "/login" ||
    pathname.startsWith("/api/supabase-health") ||
    pathname.startsWith("/api/tasas");

  // =========================================================================
  // 1. VÍA RÁPIDA (Opción A): Validación local de JWT en memoria (< 1ms)
  // =========================================================================
  const usuarioLocal = extraerUsuarioVigenteDeCookies(request.cookies.getAll());

  if (usuarioLocal) {
    // Si ya está autenticado e intenta ir a /login, redirigir al home
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Opción B: Inyectar headers con la sesión del usuario para Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", usuarioLocal.id);
    if (usuarioLocal.email) {
      requestHeaders.set("x-user-email", usuarioLocal.email);
    }
    if (usuarioLocal.role) {
      requestHeaders.set("x-user-role", usuarioLocal.role);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Si no hay sesión pero la ruta es pública, dar paso inmediato sin tocar la red
  if (esRutaPublica) {
    return NextResponse.next({ request });
  }

  // =========================================================================
  // 2. VÍA DE RESPALDO: El token local expiró o es inexistente en ruta privada
  //    Intentar refresco con Supabase Auth (@supabase/ssr)
  // =========================================================================
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requerirEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requerirEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY,
    ),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Si el usuario se recuperó vía refresh, inyectar headers en la respuesta
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.id);
  if (user.email) {
    requestHeaders.set("x-user-email", user.email);
  }
  if (user.role) {
    requestHeaders.set("x-user-role", user.role);
  }

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Transferir cookies renovadas a la respuesta final
  response.cookies.getAll().forEach((cookie) => {
    nextResponse.cookies.set(cookie);
  });

  return nextResponse;
}

function requerirEnv(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta ${nombre} en .env.local.`);
  }
  return valor;
}

export const config = {
  matcher: [
    // Todo excepto estáticos de Next, favicon e imágenes/xml/txt.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
