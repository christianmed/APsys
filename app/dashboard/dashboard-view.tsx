"use client";

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  ExternalLink,
  Layers,
  Receipt,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  calcularConsolidadoIngresos,
  type PagoMétrica,
  type PresetFecha,
} from "@/lib/dashboard/ingresos";

type Props = {
  pagos: PagoMétrica[];
  presetInicial: PresetFecha;
  desdeInicial?: string;
  hastaInicial?: string;
};

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Dashboard Gerencial de Ingresos
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Gerencial
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Consolidación de ingresos reales recaudados en USD y Bolívares (RF-11).
            </p>
          </div>
        </div>

        <Link
          href="/pedidos"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Receipt className="size-4" />
          Ver Pedidos
        </Link>
      </div>

      {/* Barra de Filtros de Período */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Presets rápidos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
            Período:
          </span>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("hoy")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "hoy"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("esta_semana")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "esta_semana"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("este_mes")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "este_mes"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("todo")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              preset === "todo"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Todo el histórico
          </button>
        </div>

        {/* Rango de fechas manual */}
        <form
          onSubmit={aplicarRangoPersonalizado}
          className="flex flex-wrap items-center gap-2"
        >
          <Calendar className="size-4 text-zinc-400" />
          <input
            type="date"
            aria-label="Fecha inicial"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
          <span className="text-xs text-zinc-400">hasta</span>
          <input
            type="date"
            aria-label="Fecha final"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tarjetas de Métricas Financieras Consolidadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Consolidado */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
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
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recaudado en USD
            </span>
            <DollarSign className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">
            ${consolidado.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            {consolidado.conteoPagosUsd} cobros en efectivo / Zelle
          </span>
        </div>

        {/* Ingresos en Bolívares */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recaudado en Bs.
            </span>
            <CreditCard className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">
            Bs. {consolidado.totalBs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
            {consolidado.conteoPagosBs} cobros en Pago Móvil / Punto
          </span>
        </div>

        {/* Transacciones */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Cobros
            </span>
            <Layers className="size-5 text-indigo-600 dark:text-indigo-400" />
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
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
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
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Fecha y Hora</th>
                  <th className="py-3 px-4 font-semibold">Orden</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold">Monto Cobrado</th>
                  <th className="py-3 px-4 font-semibold">Referencia</th>
                  <th className="py-3 px-4 font-semibold text-right">Equivalente USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {pagos.map((pago) => {
                  const esUsd = pago.moneda === "USD";
                  const tasa = Number(pago.tasaValor) || 40.0;
                  const equivUsd = esUsd ? pago.monto : (tasa > 0 ? pago.monto / tasa : 0);

                  return (
                    <tr
                      key={pago.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
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
