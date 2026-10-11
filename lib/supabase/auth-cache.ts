import { cache } from "react";
import { createClient } from "./server";

export type PerfilUsuario = {
  rol: string;
} | null;

/**
 * Consulta y memoiza el usuario autenticado y su perfil en el ciclo de vida
 * del request actual (per-request cache de React Server Components).
 *
 * Evita que múltiples Server Components (o una página y su AuthenticatedShell)
 * realicen llamadas de red repetidas a Supabase Auth y a la tabla `perfiles`.
 */
export const obtenerUsuarioSesion = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
