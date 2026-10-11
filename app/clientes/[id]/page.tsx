import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../cliente-form";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`),
// igual que en / y /login.
export const instant = false;

/**
 * Detalle/edición de cliente (RF-01): guarda de sesión y formulario en modo
 * "editar" con los datos actuales. Si el id no existe, 404.
 */
export default async function EditarClientePage({
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

  const { id } = await params;

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id,nombre,telefono,notas")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <section className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Editar cliente
        </h1>
        <ClienteForm
          modo="editar"
          cliente={{
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            notas: cliente.notas,
          }}
        />
      </section>
    </main>
  );
}
