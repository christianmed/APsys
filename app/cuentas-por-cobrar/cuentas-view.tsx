"use client";

import {
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageCircle,
  Search,
  TrendingDown,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  filtrarYOrdenarCuentas,
  formatearMonedaBs,
  formatearMonedaUSD,
  generarMensajeCobranza,
  type CuentaPorCobrar,
  type ResumenCuentasPorCobrar,
  type TramoAntiguedad,
} from "@/lib/cobranzas/cuentas-por-cobrar";
import { PageHeader } from "@/components/shell/page-header";
import { formatearFechaHoraCaracas } from "@/lib/fechas";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";
import {
  SegmentedProgressBar,
  PROGRESS_VARIANT_STYLES,
  type ProgressVariant,
} from "@/components/ui/progress-bar";

type CriterioOrdenCuentas =
  | "mayor_saldo"
  | "mas_antiguo"
  | "mas_reciente"
  | "cliente";

const OPCIONES_ORDEN_CUENTAS: CustomSelectOption<CriterioOrdenCuentas>[] = [
  { value: "mayor_saldo", label: "Mayor saldo pendiente" },
  { value: "mas_antiguo", label: "Más antiguos primero" },
  { value: "mas_reciente", label: "Más recientes primero" },
  { value: "cliente", label: "Cliente (A - Z)" },
];

type Props = {
  cuentasIniciales: CuentaPorCobrar[];
  resumenInicial: ResumenCuentasPorCobrar;
};

const NOMBRES_TRAMOS: Record<
  TramoAntiguedad,
  {
    titulo: string;
    descripcion: string;
    variant: ProgressVariant;
    color: string;
    badgeColor: string;
  }
> = {
  "0_a_7": {
    titulo: "0 a 7 días",
    descripcion: "Corriente / Reciente",
    variant: "info",
    color: PROGRESS_VARIANT_STYLES.info.bar,
    badgeColor: PROGRESS_VARIANT_STYLES.info.badge,
  },
  "8_a_15": {
    titulo: "8 a 15 días",
    descripcion: "Vencimiento moderado",
    variant: "warning",
    color: PROGRESS_VARIANT_STYLES.warning.bar,
    badgeColor: PROGRESS_VARIANT_STYLES.warning.badge,
  },
  "16_a_30": {
    titulo: "16 a 30 días",
    descripcion: "Alerta de cobranza",
    variant: "orange",
    color: PROGRESS_VARIANT_STYLES.orange.bar,
    badgeColor: PROGRESS_VARIANT_STYLES.orange.badge,
  },
  mas_de_30: {
    titulo: "Más de 30 días",
    descripcion: "Crítico / Moroso",
    variant: "danger",
    color: PROGRESS_VARIANT_STYLES.danger.bar,
    badgeColor: PROGRESS_VARIANT_STYLES.danger.badge,
  },
};

function formatoFechaCorta(iso: string): string {
  try {
    return formatearFechaHoraCaracas(iso, false);
  } catch {
    return "";
  }
}

export function CuentasCobrarView({ cuentasIniciales, resumenInicial }: Props) {
  const [tramoSeleccionado, setTramoSeleccionado] = useState<"todos" | TramoAntiguedad>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<"mayor_saldo" | "mas_antiguo" | "mas_reciente" | "cliente">("mayor_saldo");

  const cuentasFiltradas = useMemo(() => {
    return filtrarYOrdenarCuentas(cuentasIniciales, {
      tramo: tramoSeleccionado,
      busqueda,
      ordenarPor,
    });
  }, [cuentasIniciales, tramoSeleccionado, busqueda, ordenarPor]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas por Cobrar"
        description="Control de saldos pendientes de clientes, tramos de vencimiento y gestión activa de cobro (RF-12)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
            <Wallet className="size-3.5" />
            <span>Saldos & Cobranzas</span>
          </span>
        }
        actions={
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <Link
              href="/recordatorios"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc] truncate"
            >
              <span className="truncate">Recordatorios</span>
            </Link>
            <Link
              href="/pedidos"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc] truncate"
            >
              <span className="truncate">Ver Pedidos</span>
            </Link>
          </div>
        }
      />

      {/* Tarjetas KPI de resumen */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total por Cobrar USD */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total por Cobrar (USD)
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-rose-600 dark:bg-[#1f202c] dark:text-[#f7768e]">
              <Wallet className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-rose-600 dark:text-[#f7768e]">
            {formatearMonedaUSD(resumenInicial.total_por_cobrar_usd)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            En {resumenInicial.total_pedidos_con_deuda} orden{resumenInicial.total_pedidos_con_deuda === 1 ? "" : "es"} activas
          </p>
        </div>

        {/* Total por Cobrar en Bs */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Equivalente en Bolívares
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-[#1f202c] dark:text-zinc-200">
              <TrendingDown className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatearMonedaBs(resumenInicial.total_por_cobrar_bs)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Calculado a tasa referencial de cada pedido
          </p>
        </div>

        {/* Clientes Deudores */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Clientes con Saldo
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-[#1f202c] dark:text-zinc-200">
              <Users className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {resumenInicial.total_clientes_deudores}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Clientes únicos con pedidos pendientes de cobro
          </p>
        </div>

        {/* Tramo Crítico (> 30 días) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cartera Morosa (&gt; 30 días)
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-amber-600 dark:bg-[#1f202c] dark:text-[#e0af68]">
              <AlertTriangle className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-600 dark:text-[#e0af68]">
            {formatearMonedaUSD(resumenInicial.tramos.mas_de_30.monto_usd)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {resumenInicial.tramos.mas_de_30.porcentaje_del_total}% del total ({resumenInicial.tramos.mas_de_30.cantidad} pedidos)
          </p>
        </div>
      </div>

      {/* Visualización de Tramos de Antigüedad */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
          Antigüedad de la Cartera por Cobrar (Aging)
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Distribución de la deuda según días transcurridos desde el ingreso del pedido.
        </p>

        {/* Barra proporcional visual */}
        <SegmentedProgressBar
          className="mt-4"
          size="lg"
          segments={(["0_a_7", "8_a_15", "16_a_30", "mas_de_30"] as TramoAntiguedad[]).map((t) => {
            const tramoInfo = resumenInicial.tramos[t];
            return {
              key: t,
              value: tramoInfo.porcentaje_del_total,
              variant: NOMBRES_TRAMOS[t].variant,
              title: `${NOMBRES_TRAMOS[t].titulo}: ${formatearMonedaUSD(tramoInfo.monto_usd)} (${tramoInfo.porcentaje_del_total}%)`,
            };
          })}
        />

        {/* Tarjetas de cada tramo */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["0_a_7", "8_a_15", "16_a_30", "mas_de_30"] as TramoAntiguedad[]).map((t) => {
            const tramoData = resumenInicial.tramos[t];
            const meta = NOMBRES_TRAMOS[t];
            const estaActivo = tramoSeleccionado === t;

            return (
              <button
                key={t}
                type="button"
                onClick={() => setTramoSeleccionado(estaActivo ? "todos" : t)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  estaActivo
                    ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900 dark:border-[#7aa2f7] dark:bg-[#1f202c] dark:ring-2 dark:ring-[#7aa2f7]/40"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#24283b] dark:bg-[#16161e] dark:hover:border-[#2f3654]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${meta.color}`} />
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {meta.titulo}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {tramoData.cantidad} {tramoData.cantidad === 1 ? "pedido" : "pedidos"}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white">
                    {formatearMonedaUSD(tramoData.monto_usd)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {tramoData.porcentaje_del_total}% del saldo total
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controles de Filtros y Búsqueda */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26] lg:flex-row lg:items-center lg:justify-between min-w-0 max-w-full">
        {/* Pestañas de tramo */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => setTramoSeleccionado("todos")}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tramoSeleccionado === "todos"
                ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            Todos ({resumenInicial.total_pedidos_con_deuda})
          </button>
          {(["0_a_7", "8_a_15", "16_a_30", "mas_de_30"] as TramoAntiguedad[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTramoSeleccionado(t)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tramoSeleccionado === t
                  ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
              }`}
            >
              {NOMBRES_TRAMOS[t].titulo} ({resumenInicial.tramos[t].cantidad})
            </button>
          ))}
        </div>

        {/* Buscador y orden */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto min-w-0">
          <div className="relative w-full sm:w-64 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, orden o tlf..."
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#7aa2f7] focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25 min-w-0"
            />
          </div>

          <CustomSelect<CriterioOrdenCuentas>
            value={ordenarPor}
            onChange={(val) => setOrdenarPor(val)}
            options={OPCIONES_ORDEN_CUENTAS}
            variant="header"
            size="sm"
            className="w-full sm:w-auto min-w-0 sm:min-w-[200px]"
          />
        </div>
      </div>

      {/* Tabla detallada de cuentas por cobrar */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-[#24283b]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Detalle de Saldos por Cobrar ({cuentasFiltradas.length})
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Mostrando {cuentasFiltradas.length} de {cuentasIniciales.length} pedidos
            </span>
          </div>
        </div>

        {cuentasFiltradas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              No se encontraron pedidos con saldo pendiente para el filtro seleccionado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                <tr>
                  <th className="px-6 py-3.5">Orden</th>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Antigüedad</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                  <th className="px-6 py-3.5 text-right">Abonado</th>
                  <th className="px-6 py-3.5 text-right">Saldo Pendiente</th>
                  <th className="px-6 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-[#24283b]">
                {cuentasFiltradas.map((cuenta) => {
                  const meta = NOMBRES_TRAMOS[cuenta.tramo];
                  const { enlaceWhatsApp } = generarMensajeCobranza({
                    cliente_nombre: cuenta.cliente_nombre,
                    cliente_telefono: cuenta.cliente_telefono,
                    numero_orden: cuenta.numero_orden,
                    saldo_usd: cuenta.saldo_usd,
                    saldo_bs: cuenta.saldo_bs,
                    dias_antiguedad: cuenta.dias_antiguedad,
                  });

                  return (
                    <tr
                      key={cuenta.pedido_id}
                      className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-[#1f202c]/50"
                    >
                      {/* Orden */}
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        <Link
                          href={`/pedidos/${cuenta.pedido_id}`}
                          className="inline-flex items-center gap-1.5 hover:underline"
                        >
                          {cuenta.numero_orden}
                          <ExternalLink className="size-3 text-zinc-400" />
                        </Link>
                        <div className="mt-0.5 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                          {cuenta.estado.replace(/_/g, " ")}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {cuenta.cliente_nombre}
                          </span>
                        </div>
                        {cuenta.cliente_telefono && (
                          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            {cuenta.cliente_telefono}
                          </div>
                        )}
                      </td>

                      {/* Antigüedad */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeColor}`}
                        >
                          <Clock className="size-3" />
                          {cuenta.dias_antiguedad === 0
                            ? "Hoy"
                            : `${cuenta.dias_antiguedad} día${cuenta.dias_antiguedad === 1 ? "" : "s"}`}
                        </span>
                        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {formatoFechaCorta(cuenta.creado_en)}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        {formatearMonedaUSD(cuenta.total_usd)}
                      </td>

                      {/* Abonado */}
                      <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatearMonedaUSD(cuenta.total_pagado_usd)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        <div className="text-sm font-extrabold">
                          {formatearMonedaUSD(cuenta.saldo_usd)}
                        </div>
                        <div className="mt-0.5 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                          {formatearMonedaBs(cuenta.saldo_bs)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {enlaceWhatsApp ? (
                            <a
                              href={enlaceWhatsApp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#9ece6a] dark:hover:border-emerald-700/60 dark:hover:bg-[#252b42]"
                              title="Enviar recordatorio formal de cobro por WhatsApp"
                            >
                              <MessageCircle className="size-3.5 text-emerald-600 dark:text-[#9ece6a]" />
                              Cobrar WA
                            </a>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">Sin tlf</span>
                          )}

                          <Link
                            href={`/pedidos/${cuenta.pedido_id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc]"
                          >
                            Abonar
                          </Link>
                        </div>
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
