import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <AuthenticatedShell>
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader
          title={servicio.nombre}
          description="Modifica los parámetros y disponibilidad del servicio."
          backHref="/servicios"
          backLabel="Volver a Servicios"
          breadcrumbs={[
            { label: "Servicios", href: "/servicios" },
            { label: servicio.nombre },
          ]}
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
