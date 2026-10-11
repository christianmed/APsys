import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type PresetFecha } from "@/lib/dashboard/ingresos";
import {
  calcularResumenReporte,
  filtrarPedidosPorPeriodo,
  type PedidoReporte,
} from "@/lib/reportes/exportacion";
import { createClient } from "@/lib/supabase/server";
import { BotonImprimir } from "./boton-imprimir";

export const instant = false;

type Props = {
  searchParams: Promise<{
    periodo?: string;
    desde?: string;
    hasta?: string;
  }>;
};

export default async function ReporteImprimirPage({ searchParams }: Props) {
  const { periodo, desde, hasta } = await searchParams;
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
    redirect("/");
  }

  const preset: PresetFecha =
    periodo === "hoy" ||
    periodo === "esta_semana" ||
    periodo === "este_mes" ||
    periodo === "todo"
      ? periodo
      : "este_mes";

  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      creado_en,
      estado,
      anulado,
      total_usd,
      clientes (
        nombre,
        telefono
      ),
      pagos (
        monto,
        moneda
      ),
      tasas_cambio (
        valor_bs_por_usd
      )
    `,
    )
    .order("numero_orden", { ascending: false });

  const lista = pedidosRaw ?? [];

  const pedidosMapeados: PedidoReporte[] = lista.map((p) => {
    const clienteData = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes;
    const tasaObj = p.tasas_cambio as { valor_bs_por_usd?: number | string } | null;
    const tasaValor = Number(tasaObj?.valor_bs_por_usd) || 40.0;
    const listaPagos = Array.isArray(p.pagos) ? p.pagos : [];

    return {
      id: p.id,
      numeroOrden: p.numero_orden,
      creadoEn: p.creado_en,
      clienteNombre: clienteData?.nombre ?? "Cliente no registrado",
      clienteTelefono: clienteData?.telefono ?? null,
      estado: p.estado,
      anulado: Boolean(p.anulado),
      totalUsd: Number(p.total_usd) || 0,
      tasaBsPorUsd: tasaValor,
      pagos: listaPagos.map((pago) => ({
        monto: Number(pago.monto) || 0,
        moneda: (pago.moneda as "USD" | "Bs") ?? "USD",
      })),
    };
  });

  const pedidosFiltrados = filtrarPedidosPorPeriodo(pedidosMapeados, {
    preset: desde || hasta ? undefined : preset,
    rango: desde || hasta ? { desde, hasta } : undefined,
  });

  const resumen = calcularResumenReporte(pedidosFiltrados);
  const pedidosActivos = pedidosFiltrados.filter((p) => !p.anulado);

  const etiquetaPeriodo =
    preset === "hoy"
      ? "Hoy"
      : preset === "esta_semana"
        ? "Esta semana"
        : preset === "este_mes"
          ? "Este mes"
          : desde || hasta
            ? `Personalizado (${desde ?? "inicio"} al ${hasta ?? "fin"})`
            : "Histórico completo";

  return (
    <div className="min-h-dvh bg-zinc-100 p-4 font-sans text-zinc-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 print:max-w-none print:rounded-none print:p-4 print:shadow-none print:ring-0">
        {/* Barra superior de acciones (oculta al imprimir) */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-4 print:hidden">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="size-4" />
            Volver al Dashboard
          </Link>

          <BotonImprimir />
        </div>

        {/* Encabezado formal del reporte */}
        <header className="border-b-2 border-zinc-900 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-zinc-950">
                APSys — Gráfica & Impresión
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                Sistema Integral de Gestión de Pedidos y Cobranzas
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 print:border print:border-zinc-300">
                REPORTE GERENCIAL
              </span>
              <p className="mt-1 text-[11px] text-zinc-500">
                Emisión: {new Date().toLocaleDateString("es-VE")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
            <div>
              <span className="font-semibold text-zinc-800">Período analizado:</span>{" "}
              {etiquetaPeriodo}
            </div>
            <div>
              <span className="font-semibold text-zinc-800">Pedidos activos:</span>{" "}
              {resumen.totalPedidos}
            </div>
          </div>
        </header>

        {/* Resumen ejecutivo de cifras clave */}
        <section className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Resumen financiero">
          <div className="rounded-lg border border-zinc-200 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">Total Facturado</span>
            <p className="mt-1 text-lg font-bold text-zinc-900">
              ${resumen.totalFacturadoUsd.toFixed(2)} USD
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5">
            <span className="text-[11px] font-medium text-emerald-800">Total Cobrado</span>
            <p className="mt-1 text-lg font-bold text-emerald-950">
              ${resumen.totalCobradoUsd.toFixed(2)} USD
            </p>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3.5">
            <span className="text-[11px] font-medium text-rose-800">Saldo Pendiente</span>
            <p className="mt-1 text-lg font-bold text-rose-950">
              ${resumen.saldoPendienteUsd.toFixed(2)} USD
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">Cantidad de Órdenes</span>
            <p className="mt-1 text-lg font-bold text-zinc-900">
              {resumen.totalPedidos}
            </p>
          </div>
        </section>

        {/* Detalle de órdenes en tabla formal */}
        <section className="mt-6" aria-label="Detalle de órdenes">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-700">
            Detalle de Órdenes del Período
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-300 bg-zinc-50 text-[11px] font-semibold text-zinc-600 print:bg-zinc-100">
                  <th className="py-2.5 pr-2">N° Orden</th>
                  <th className="px-2 py-2.5">Fecha</th>
                  <th className="px-2 py-2.5">Cliente</th>
                  <th className="px-2 py-2.5">Estado</th>
                  <th className="px-2 py-2.5 text-right">Total USD</th>
                  <th className="px-2 py-2.5 text-right">Cobrado</th>
                  <th className="px-2 py-2.5 text-right">Saldo</th>
                  <th className="py-2.5 pl-2 text-right">Cobranza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {pedidosActivos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-zinc-500">
                      No se registraron órdenes en el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  pedidosActivos.map((p) => {
                    let cobrado = 0;
                    for (const pago of p.pagos) {
                      if (pago.moneda === "USD") {
                        cobrado += pago.monto;
                      } else {
                        cobrado += pago.monto / p.tasaBsPorUsd;
                      }
                    }
                    cobrado = Math.round(cobrado * 100) / 100;
                    const saldo = Math.max(0, Math.round((p.totalUsd - cobrado) * 100) / 100);

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 pr-2 font-mono font-bold text-zinc-900">
                          #{p.numeroOrden}
                        </td>
                        <td className="px-2 py-2.5 text-zinc-500">
                          {new Date(p.creadoEn).toLocaleDateString("es-VE")}
                        </td>
                        <td className="px-2 py-2.5 font-medium text-zinc-800">
                          {p.clienteNombre}
                        </td>
                        <td className="px-2 py-2.5 capitalize text-zinc-600">
                          {p.estado}
                        </td>
                        <td className="px-2 py-2.5 text-right font-semibold text-zinc-900">
                          ${p.totalUsd.toFixed(2)}
                        </td>
                        <td className="px-2 py-2.5 text-right text-emerald-800">
                          ${cobrado.toFixed(2)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-medium text-zinc-900">
                          ${saldo.toFixed(2)}
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          {saldo === 0 ? (
                            <span className="font-semibold text-emerald-700">Pagado</span>
                          ) : cobrado > 0 ? (
                            <span className="font-semibold text-amber-700">Abono</span>
                          ) : (
                            <span className="text-zinc-500">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pie de página de validez y firma */}
        <footer className="mt-12 border-t border-zinc-200 pt-6 text-[11px] text-zinc-400">
          <div className="flex items-center justify-between">
            <p>Generado automáticamente por APSys. Documento para uso interno y administrativo.</p>
            <p className="font-mono">Pág. 1 / 1</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
