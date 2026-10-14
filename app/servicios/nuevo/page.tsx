import { Layers } from "lucide-react";
import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
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
  const { user, perfil } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  if (perfil?.rol !== "gerencial") {
    redirect("/servicios");
  }

  return (
    <AuthenticatedShell>
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader
          title="Nuevo servicio"
          description="Registra una nueva categoría de trabajo en el catálogo de producción."
          badge={
            <span className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400">
              <Layers className="size-3.5" />
              <span>Registro de Servicio</span>
            </span>
          }
        />

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <ServicioForm modo="crear" />
        </section>
      </div>
    </AuthenticatedShell>
  );
}
