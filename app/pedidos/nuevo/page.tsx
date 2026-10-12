import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { createClient } from "@/lib/supabase/server";
import { obtenerTasaProgramada, obtenerTasaVigente } from "../actions";
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

  // Cargar la tasa de cambio vigente y tasa programada (para presupuestos de mañana)
  const tasaVigente = await obtenerTasaVigente(supabase);
  const tasaProgramada = await obtenerTasaProgramada(supabase);

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Nueva Orden de Trabajo"
          description="Registra los detalles del cliente, servicios, medidas y cobranza inicial."
          badge={
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <Plus className="size-3.5" />
              <span>Registro de Orden</span>
            </span>
          }
        />

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <PedidoForm
            clientes={clientes ?? []}
            servicios={servicios ?? []}
            tasaCambio={tasaVigente.valor_bs_por_usd}
            tasaVigente={tasaVigente}
            tasaProgramada={tasaProgramada}
          />
        </div>
      </div>
    </AuthenticatedShell>
  );
}
