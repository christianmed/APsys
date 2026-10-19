"use client";

import {
  Banknote,
  BarChart3,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Layers,
  Printer,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  calcularConsolidadoIngresos,
  type PagoMétrica,
  type PresetFecha,
} from "@/lib/dashboard/ingresos";

import { PageHeader } from "@/components/shell/page-header";
import { formatearFechaHoraCaracas } from "@/lib/fechas";

type Props = {
  pagos: PagoMétrica[];
  presetInicial: PresetFecha;
  desdeInicial?: string;
  hastaInicial?: string;
};

function formatoFecha(iso: string): string {
  try {
    return formatearFechaHoraCaracas(iso);
  } catch {
    return "";
  }
}

export function DashboardView({
  pagos,
  presetInicial,
  desdeInicial,
  hastaInicial,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [preset, setPreset] = useState<PresetFecha>(presetInicial);
  const [fechaDesde, setFechaDesde] = useState(desdeInicial ?? "");
  const [fechaHasta, setFechaHasta] = useState(hastaInicial ?? "");

  // Calcular consolidado con los pagos actuales
  const consolidado = calcularConsolidadoIngresos(pagos);

  const aplicarFiltroPreset = (nuevoPreset: PresetFecha) => {
    setPreset(nuevoPreset);
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", nuevoPreset);
    params.delete("desde");
    params.delete("hasta");
    router.push(`/dashboard?${params.toString()}`);
  };

  const aplicarRangoPersonalizado = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "personalizado");
    if (fechaDesde) params.set("desde", `${fechaDesde}T00:00:00Z`);
    if (fechaHasta) params.set("hasta", `${fechaHasta}T23:59:59Z`);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera unificada */}
      <PageHeader
        title="Dashboard Gerencial de Ingresos"
        description="Consolidación de ingresos reales recaudados en USD y Bolívares (RF-11)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
            <TrendingUp className="size-3.5" />
            <span>Finanzas & Facturación</span>
          </span>
        }
        actions={
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center">
            <Link
              href="/tasas"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#9ece6a] dark:hover:bg-[#252b42]"
            >
              <Banknote className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Tasa del Día
            </Link>

            <Link
              href="/dashboard/rotacion"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3 text-xs font-semibold text-indigo-900 transition hover:bg-indigo-100 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#7aa2f7] dark:hover:bg-[#252b42]"
            >
              <BarChart3 className="size-3.5 text-indigo-600 dark:text-[#7aa2f7]" />
              Rotación
            </Link>

            <Link
              href="/cuentas-por-cobrar"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-900 transition hover:bg-rose-100 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#f7768e] dark:hover:bg-[#252b42]"
            >
              <Wallet className="size-3.5 text-rose-600 dark:text-rose-400" />
              Cuentas por Cobrar
            </Link>

            <Link
              href="/pedidos"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc]"
            >
              <Receipt className="size-3.5" />
              Ver Pedidos
            </Link>
          </div>
        }
      />

      {/* Barra de Filtros de Período */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26] min-w-0 max-w-full">
        {/* Presets rápidos con scroll horizontal nativo en pantallas táctiles */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none min-w-0 max-w-full">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1 shrink-0">
            Período:
          </span>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("hoy")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "hoy"
                ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("esta_semana")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "esta_semana"
                ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("este_mes")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "este_mes"
                ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("todo")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "todo"
                ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            Todo el histórico
          </button>
        </div>

        {/* Rango de fechas manual */}
        <form
          onSubmit={aplicarRangoPersonalizado}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto min-w-0"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="text-xs font-medium text-zinc-500 sm:hidden w-12 shrink-0">Desde:</span>
              <input
                type="date"
                aria-label="Fecha inicial"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-9 w-full sm:w-36 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:border-[#7aa2f7] focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] dark:focus:border-[#7aa2f7] min-w-0"
              />
            </div>
            <span className="hidden sm:inline text-xs text-zinc-400 text-center">hasta</span>
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="text-xs font-medium text-zinc-500 sm:hidden w-12 shrink-0">Hasta:</span>
              <input
                type="date"
                aria-label="Fecha final"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-9 w-full sm:w-36 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:border-[#7aa2f7] focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] dark:focus:border-[#7aa2f7] min-w-0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc] dark:hover:bg-[#252b42] shrink-0"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Botones de Exportación de Reportes (RF-17) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26] min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Exportar reporte del período:
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-bold text-zinc-800 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]">
            {preset}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center min-w-0">
          <a
            href={`/api/reportes/exportar?periodo=${preset}${fechaDesde ? `&desde=${fechaDesde}T00:00:00Z` : ""}${fechaHasta ? `&hasta=${fechaHasta}T23:59:59Z` : ""}`}
            download
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc] truncate"
          >
            <Download className="size-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span className="truncate">Descargar CSV</span>
          </a>

          <Link
            href={`/reportes/imprimir?periodo=${preset}${fechaDesde ? `&desde=${fechaDesde}T00:00:00Z` : ""}${fechaHasta ? `&hasta=${fechaHasta}T23:59:59Z` : ""}`}
            target="_blank"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc] dark:hover:bg-[#252b42] truncate"
          >
            <Printer className="size-3.5 shrink-0" />
            <span className="truncate">Imprimir / PDF</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Financieras Consolidadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Consolidado */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Consolidado
            </span>
            <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-900 dark:text-emerald-100">
            ${consolidado.totalEquivalenteUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="mt-1 block text-xs text-emerald-700/80 dark:text-emerald-400/80">
            USD equivalente (USD + Bs a tasa)
          </span>
        </div>

        {/* Ingresos en USD */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recaudado en USD
            </span>
            <DollarSign className="size-5 text-[#7aa2f7] dark:text-[#7aa2f7]" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">
            ${consolidado.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            {consolidado.conteoPagosUsd} cobros en efectivo / Zelle
          </span>
        </div>

        {/* Ingresos en Bolívares */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recaudado en Bs.
            </span>
            <CreditCard className="size-5 text-[#e0af68] dark:text-[#e0af68]" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">
            Bs. {consolidado.totalBs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            {consolidado.conteoPagosBs} cobros en Pago Móvil / Punto
          </span>
        </div>

        {/* Transacciones */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Cobros
            </span>
            <Layers className="size-5 text-[#bb9af7] dark:text-[#bb9af7]" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">
            {consolidado.totalPagosCount}
          </p>
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            operaciones registradas en el período
          </span>
        </div>
      </div>

      {/* Tabla de Detalle de Pagos */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-[#24283b] dark:bg-[#1a1b26]">
        <div className="border-b border-zinc-200 p-4 dark:border-[#24283b]">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Detalle de Pagos y Abonos Registrados ({pagos.length})
          </h2>
        </div>

        {pagos.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No se registraron cobros durante este período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                <tr>
                  <th className="py-3 px-4 font-semibold">Fecha y Hora</th>
                  <th className="py-3 px-4 font-semibold">Orden</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Monto Cobrado</th>
                  <th className="py-3 px-4 font-semibold">Referencia</th>
                  <th className="py-3 px-4 font-semibold text-right">Equivalente USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#24283b]">
                {pagos.map((pago) => {
                  const esUsd = pago.moneda === "USD";
                  const tasa = Number(pago.tasaValor) || 40.0;
                  const equivUsd = esUsd ? pago.monto : (tasa > 0 ? pago.monto / tasa : 0);

                  return (
                    <tr
                      key={pago.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-[#1f202c]/50"
                    >
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {formatoFecha(pago.creadoEn)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {pago.numeroOrden ? (
                          <Link
                            href={`/comanda/${pago.pedidoId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            ORD-{String(pago.numeroOrden).padStart(4, "0")}
                            <ExternalLink className="size-3 text-zinc-400" />
                          </Link>
                        ) : (
                          "S/N"
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                        {pago.clienteNombre ?? "Cliente"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            esUsd
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {esUsd ? "$" : "Bs. "}
                          {pago.monto.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {pago.moneda}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 font-mono">
                        {pago.referencia || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        ${equivUsd.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
