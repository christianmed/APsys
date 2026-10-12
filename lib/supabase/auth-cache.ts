import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "./server";

export type PerfilUsuario = {
  rol: string;
} | null;

export type UsuarioSesion = {
  id: string;
  email?: string;
  role?: string;
};

/**
 * Consulta y memoiza el usuario autenticado y su perfil en el ciclo de vida
 * del request actual (per-request cache de React Server Components).
 *
 * 1) Vía Rápida (Opción B): Si `proxy.ts` inyectó cabeceras `x-user-id` y `x-user-email`,
 *    las consume inmediatamente en memoria, eliminando la llamada remota de red a Supabase Auth.
 * 2) Vía de Respaldo: Si no hay cabeceras (ej. Server Actions o tests unitarios), consulta
 *    `supabase.auth.getUser()`.
 */
export const obtenerUsuarioSesion = cache(async () => {
  const supabase = await createClient();

  // Opción B: Inspeccionar cabeceras inyectadas por proxy.ts
  let headerUserId: string | null = null;
  let headerUserEmail: string | null = null;
  let headerUserRole: string | null = null;

  try {
    const headerStore = await headers();
    headerUserId = headerStore.get("x-user-id");
    headerUserEmail = headerStore.get("x-user-email");
    headerUserRole = headerStore.get("x-user-role");
  } catch {
    // Si no está en contexto de request de Next.js (ej. tests unitarios), continúa
  }

  let user: UsuarioSesion | null = null;

  if (headerUserId) {
    user = {
      id: headerUserId,
      email: headerUserEmail ?? undefined,
      role: headerUserRole ?? undefined,
    };
  } else {
    // Fallback: consulta directa a Supabase Auth
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      user = {
        id: userData.user.id,
        email: userData.user.email,
        role: userData.user.role,
      };
    }
  }

  if (!user) {
    return { user: null, perfil: null, supabase };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  return { user, perfil, supabase };
});

