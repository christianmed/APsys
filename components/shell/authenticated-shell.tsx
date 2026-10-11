import { redirect } from "next/navigation";
import { connection } from "next/server";
import { type ReactNode } from "react";
import { cerrarSesion } from "@/app/actions";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { obtenerTasaBcv } from "@/lib/tasas/bcv-service";
import { AppShell } from "./app-shell";

type Props = {
  children: ReactNode;
};

/**
 * Envoltorio de Servidor que resuelve la sesión, perfil y tasas del día
 * de forma paralela y optimizada para máxima velocidad de respuesta.
 */
export async function AuthenticatedShell({ children }: Props) {
  await connection();
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const ahoraIso = new Date().toISOString();

  // Ejecución simultánea y en paralelo de todas las consultas de tasas
  const [tasaDataRes, tasaProgramadaDataRes, eurBcvRes] = await Promise.all([
    // 1. Tasa vigente oficial para cobros de hoy (vigente_desde <= NOW)
    supabase
      .from("tasas_cambio")
      .select("valor_bs_por_usd")
      .lte("vigente_desde", ahoraIso)
      .order("vigente_desde", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 2. Tasa programada para el siguiente día hábil (vigente_desde > NOW)
    supabase
      .from("tasas_cambio")
      .select("valor_bs_por_usd")
      .gt("vigente_desde", ahoraIso)
      .order("vigente_desde", { ascending: true })
      .limit(1)
      .maybeSingle(),

    // 3. Consulta best-effort de tasa EUR (informativa) desde API BCV
    obtenerTasaBcv("EUR").catch(() => null),
  ]);

  const valorTasa = Number(tasaDataRes.data?.valor_bs_por_usd) || 40.0;
  const valorTasaProgramada = tasaProgramadaDataRes.data
    ? Number(tasaProgramadaDataRes.data.valor_bs_por_usd)
    : undefined;
  const tasaEurHoy = eurBcvRes ? eurBcvRes.valorBs : undefined;

  return (
    <AppShell
      usuarioEmail={user.email ?? "Usuario"}
      usuarioRol={perfil?.rol ?? "operativo"}
      tasaHoy={valorTasa}
      tasaEurHoy={tasaEurHoy}
      tasaSiguiente={valorTasaProgramada}
      accionCerrarSesion={cerrarSesion}
    >
      {children}
    </AppShell>
  );
}
