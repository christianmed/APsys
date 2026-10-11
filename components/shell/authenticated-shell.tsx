import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { cerrarSesion } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "./app-shell";

type Props = {
  children: ReactNode;
};

/**
 * Envoltorio de Servidor que resuelve la sesión, perfil y tasa del día
 * para renderizar el AppShell unificado con Sidebar y Header persistentes.
 */
export async function AuthenticatedShell({ children }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const { data: tasaData } = await supabase
    .from("tasas_cambio")
    .select("valor_bs_por_usd")
    .order("vigente_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  const valorTasa = Number(tasaData?.valor_bs_por_usd) || 40.0;

  return (
    <AppShell
      usuarioEmail={user.email ?? "Usuario"}
      usuarioRol={perfil?.rol ?? "operativo"}
      tasaHoy={valorTasa}
      accionCerrarSesion={cerrarSesion}
    >
      {children}
    </AppShell>
  );
}
