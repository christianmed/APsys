import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy de sesión (Next.js 16 — antes «middleware»).
 *
 * 1) Refresca las cookies de Supabase en cada request (patrón oficial
 *    @supabase/ssr) para que los Server Components vean el token vigente.
 * 2) Chequeo optimista: sin sesión, las rutas privadas redirigen a /login.
 *    La autorización real (quién puede qué) vive en RLS, en la base de datos.
 *
 * Rutas públicas: /login y /api/supabase-health. Estáticos: excluidos en matcher.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requerirEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requerirEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  // getUser() revalida el token contra Supabase (no usar getSession() aquí).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaPublica =
    pathname === "/login" || pathname.startsWith("/api/supabase-health");

  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
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
