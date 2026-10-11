import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicioForm } from "../servicio-form";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

/**
 * Alta de servicio (RF-04/T-007b): guarda de sesión y de rol. Solo el perfil
 * gerencial administra el catálogo; el resto vuelve al listado.
 */
export default async function NuevoServicioPage() {
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

  if (perfil?.rol !== "gerencial") {
    redirect("/servicios");
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <section className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Nuevo servicio
        </h1>
        <ServicioForm modo="crear" />
      </section>
    </main>
  );
}
