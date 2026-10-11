import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import {
  calcularMetricasCliente,
  type PedidoHistorialInput,
} from "@/lib/clientes/historial";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../cliente-form";
import { HistorialClienteView } from "./historial-cliente-view";

export const instant = false;

type PagoRaw = {
  monto: number | string;
  moneda: "USD" | "VES";
  tasa_id?: string | null;
};

type PedidoRaw = {
  id: string;
  numero_orden: number;
  creado_en: string;
  estado: string;
  anulado: boolean | null;
  total_usd: number | string;
  tasas_cambio: {
    valor_bs_por_usd: number | string;
  } | null;
  pagos: PagoRaw[] | null;
  pedido_items: Array<{ id: string }> | null;
};

/**
 * Detalle, edición e historial por cliente (RF-01 / RF-14 / T-022).
 * Muestra el formulario de edición junto al historial consolidado de compras,
 * saldos por cobrar y métricas de recurrencia.
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

  // 1. Consultar datos del cliente
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id,nombre,telefono,notas,creado_en")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) {
    notFound();
  }

  // 2. Consultar pedidos históricos del cliente
  const { data: pedidosData } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      creado_en,
      estado,
      anulado,
      total_usd,
      tasas_cambio (
        valor_bs_por_usd
      ),
      pagos (
        monto,
        moneda,
        tasa_id
      ),
      pedido_items (
        id
      )
    `,
    )
    .eq("cliente_id", id)
    .order("numero_orden", { ascending: false });

  // 3. Tasas de cambio históricas para congelamiento de abonos
  const { data: tasasData } = await supabase
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd");

  const mapaTasas = new Map<string, number>();
  if (tasasData) {
    for (const t of tasasData) {
      mapaTasas.set(t.id, Number(t.valor_bs_por_usd));
    }
  }

  const pedidosMapeados: PedidoHistorialInput[] = (
    (pedidosData ?? []) as unknown as PedidoRaw[]
  ).map((p) => {
    const tasaPedido = p.tasas_cambio?.valor_bs_por_usd
      ? Number(p.tasas_cambio.valor_bs_por_usd)
      : 1;

    const pagosMapeados = (p.pagos ?? []).map((pago) => {
      let tasaPago = tasaPedido;
      if (pago.tasa_id && mapaTasas.has(pago.tasa_id)) {
        tasaPago = mapaTasas.get(pago.tasa_id)!;
      }
      return {
        monto: Number(pago.monto),
        moneda: pago.moneda,
        tasa_valor: tasaPago,
      };
    });

    return {
      id: p.id,
      numero_orden: p.numero_orden,
      creado_en: p.creado_en,
      estado: p.estado,
      anulado: Boolean(p.anulado),
      total_usd: Number(p.total_usd),
      tasa_valor: tasaPedido,
      pagos: pagosMapeados,
      items_count: p.pedido_items?.length ?? 1,
    };
  });

  const metricas = calcularMetricasCliente(pedidosMapeados);

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title={cliente.nombre}
          description={`${cliente.telefono ? `Teléfono: ${cliente.telefono} • ` : ""}${metricas.total_pedidos_activos} compras registradas`}
          backHref="/clientes"
          backLabel="Volver a Clientes"
          actions={
            <Link
              href={`/pedidos/nuevo?cliente_id=${cliente.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Crear Pedido para Cliente
            </Link>
          }
        />

        {/* Layout de 2 secciones: Formulario + Historial */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna Izquierda: Formulario de Datos del Cliente */}
          <div className="lg:col-span-4">
            <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Datos del Cliente
              </h2>
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
          </div>

          {/* Columna Derecha: Métricas de Recurrencia e Historial */}
          <div className="lg:col-span-8">
            <HistorialClienteView
              clienteId={cliente.id}
              clienteNombre={cliente.nombre}
              clienteTelefono={cliente.telefono}
              metricas={metricas}
            />
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
