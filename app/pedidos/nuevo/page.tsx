import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerTasaVigente } from "../actions";
import { PedidoForm } from "../pedido-form";

// Con Cache Components, leer la sesión (cookies) impide el shell estático:
// se bloquea la ruta con la opción documentada (`instant = false`).
export const instant = false;

/**
 * Pantalla de registro de nuevo pedido (RF-01 / RF-02 / T-008 / T-009).
 * Accesible tanto para el perfil operativo (recepción) como para el gerencial.
 */
export default async function NuevoPedidoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cargar clientes para el selector
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id,nombre,telefono")
    .order("nombre", { ascending: true });

  // Cargar servicios activos del catálogo
  const { data: servicios } = await supabase
    .from("servicios")
    .select("id,nombre")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  // Cargar la tasa de cambio vigente para conversiones automáticas
  const tasaVigente = await obtenerTasaVigente(supabase);

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/pedidos"
            aria-label="Volver a pedidos"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Nuevo pedido
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Registra los detalles del cliente, servicios, medidas y cobranza inicial.
            </p>
          </div>
        </div>

        <PedidoForm
          clientes={clientes ?? []}
          servicios={servicios ?? []}
          tasaCambio={tasaVigente.valor_bs_por_usd}
        />
      </div>
    </main>
  );
}
