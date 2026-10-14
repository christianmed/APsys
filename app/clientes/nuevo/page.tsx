import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { ClienteForm } from "../cliente-form";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

/** Alta de cliente (RF-01): guarda de sesión + formulario en modo "crear". */
export default async function NuevoClientePage() {
  await connection();
  const { user } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Nuevo Cliente"
          description="Registra un cliente en el directorio para facturar y enviar avisos de comanda."
          badge={
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <UserPlus className="size-3.5" />
              <span>Registro de Cliente</span>
            </span>
          }
        />

        <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <ClienteForm modo="crear" />
        </div>
      </div>
    </AuthenticatedShell>
  );
}
