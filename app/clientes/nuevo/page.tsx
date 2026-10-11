import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../cliente-form";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

/** Alta de cliente (RF-01): guarda de sesión + formulario en modo "crear". */
export default async function NuevoClientePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <section className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Nuevo cliente
        </h1>
        <ClienteForm modo="crear" />
      </section>
    </main>
  );
}
