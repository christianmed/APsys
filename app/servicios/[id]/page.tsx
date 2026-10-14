import { Layers } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
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
  await connection();
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

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
    <AuthenticatedShell>
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader
          title={servicio.nombre}
          description="Modifica los parámetros y disponibilidad del servicio."
          badge={
            <span className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400">
              <Layers className="size-3.5" />
              <span>Edición de Servicio</span>
            </span>
          }
        />

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
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
      </div>
    </AuthenticatedShell>
  );
}
