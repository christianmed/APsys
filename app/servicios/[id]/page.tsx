import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicioForm } from "../servicio-form";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

/**
 * Detalle/edición de servicio (RF-04/T-007b): guarda de sesión y rol (solo
 * gerencial administra) y formulario en modo "editar" con los datos actuales.
 * Si el id no existe, 404.
 */
export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;

  const { data: servicio } = await supabase
    .from("servicios")
    .select("id,nombre,activo,orden")
    .eq("id", id)
    .maybeSingle();

  if (!servicio) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <section className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Editar servicio
        </h1>
        <ServicioForm
          modo="editar"
          servicio={{
            id: servicio.id,
            nombre: servicio.nombre,
            orden: servicio.orden,
            activo: servicio.activo,
          }}
        />
      </section>
    </main>
  );
}
