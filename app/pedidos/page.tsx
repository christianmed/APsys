import { ArrowLeft, Clock, Package, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const ESTADO_BADGES: Record<string, { label: string; clases: string }> = {
  recibido: {
    label: "Recibido",
    clases:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  en_produccion: {
    label: "En Producción",
    clases: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },
  listo: {
    label: "Listo para Retiro",
    clases:
      "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  },
  entregado: {
    label: "Entregado",
    clases: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  cancelado: {
    label: "Cancelado",
    clases: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

/**
 * Listado de pedidos (RF-01 / T-008b).
 * Muestra el resumen de órdenes registradas con cliente, número de orden,
 * estado actual, total en USD y fecha de creación.
 */
export default async function PedidosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      total_usd,
      creado_en,
      anulado,
      clientes (
        nombre,
        telefono
      )
    `,
    )
    .order("numero_orden", { ascending: false });

  const lista = pedidos ?? [];

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Volver al inicio"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Pedidos
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Gestión de órdenes, comanda y seguimiento de producción.
              </p>
            </div>
          </div>

          <Link
            href="/pedidos/nuevo"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 focus-visible:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
          >
            <Plus aria-hidden className="size-4" />
            Nuevo pedido
          </Link>
        </div>

        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Package className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No hay pedidos registrados
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Comienza registrando la primera orden de trabajo.
            </p>
            <Link
              href="/pedidos/nuevo"
              className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="size-4" />
              Crear pedido
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {lista.map((pedido) => {
              const badge =
                ESTADO_BADGES[pedido.estado] ?? ESTADO_BADGES.recibido;
              const fecha = new Date(pedido.creado_en).toLocaleDateString(
                "es-VE",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              // Manejar tipado de cliente que puede venir como objeto o array según Supabase types
              const clienteData = Array.isArray(pedido.clientes)
                ? pedido.clientes[0]
                : pedido.clientes;

              return (
                <div
                  key={pedido.id}
                  className="flex flex-col gap-3 p-5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
                        #{pedido.numero_orden}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.clases}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {clienteData?.nombre ?? "Cliente no especificado"}
                      {clienteData?.telefono ? (
                        <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                          ({clienteData.telefono})
                        </span>
                      ) : null}
                    </p>

                    <p className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <Clock className="size-3.5" />
                      {fecha}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      ${Number(pedido.total_usd).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
