"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Cierra la sesión SOLO en este navegador (scope local) y vuelve al login
 * (RF-18). Evita el signOut global: con cuentas compartidas entre dispositivos
 * (modo mostrador, D-1), cerrar sesión en la PC no debe expulsar a la tablet.
 */
export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
