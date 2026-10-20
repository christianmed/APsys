"use client";

import {
  AlertCircle,
  BarChart3,
  DollarSign,
  Flame,
  Layers,
  Package,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  type CriterioOrdenRotacion,
  type MetricaServicioRotacion,
  type ResumenRotacionServicios,
} from "@/lib/dashboard/rotacion-servicios";
import { type PresetFecha } from "@/lib/dashboard/ingresos";
import { PageHeader } from "@/components/shell/page-header";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";
import { ProgressBar } from "@/components/ui/progress-bar";

type Props = {
  metricasIniciales: MetricaServicioRotacion[];
  resumenInicial: ResumenRotacionServicios;
  presetInicial: PresetFecha | "personalizado";
  criterioInicial: CriterioOrdenRotacion;
  desdeInicial?: string;
  hastaInicial?: string;
};

const OPCIONES_CRITERIO: CustomSelectOption<CriterioOrdenRotacion>[] = [
  { value: "mayor_ingreso", label: "Mayor facturación ($)" },
  { value: "mayor_demanda", label: "Mayor demanda (piezas)" },
  { value: "menor_demanda", label: "Menor demanda (rotación baja)" },
  { value: "nombre", label: "Nombre (A - Z)" },
];

function formatearUSD(monto: number): string {
  return `$${monto.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function RotacionServiciosView({
  metricasIniciales,
  resumenInicial,
  presetInicial,
  criterioInicial,
  desdeInicial,
  hastaInicial,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [preset, setPreset] = useState<PresetFecha | "personalizado">(presetInicial);
  const [criterio, setCriterio] = useState<CriterioOrdenRotacion>(criterioInicial);
  const [fechaDesde, setFechaDesde] = useState(desdeInicial ?? "");
  const [fechaHasta, setFechaHasta] = useState(hastaInicial ?? "");

  const aplicarFiltroPreset = (nuevoPreset: PresetFecha) => {
    setPreset(nuevoPreset);
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", nuevoPreset);
    params.delete("desde");
    params.delete("hasta");
    router.push(`/dashboard/rotacion?${params.toString()}`);
  };

  const aplicarFiltroPersonalizado = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "personalizado");
    if (fechaDesde) params.set("desde", `${fechaDesde}T00:00:00Z`);
    if (fechaHasta) params.set("hasta", `${fechaHasta}T23:59:59Z`);
    router.push(`/dashboard/rotacion?${params.toString()}`);
  };

  const cambiarOrden = (nuevoCriterio: CriterioOrdenRotacion) => {
    setCriterio(nuevoCriterio);
    const params = new URLSearchParams(searchParams.toString());
    params.set("orden", nuevoCriterio);
    router.push(`/dashboard/rotacion?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotación y Demanda por Servicio"
        description="Análisis de los productos y servicios con mayor y menor demanda, volumen producido y facturación (RF-13)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400">
            <BarChart3 className="size-3.5" />
            <span>Demanda & Producción</span>
          </span>
        }
        actions={
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <Link
              href="/servicios"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc]"
            >
              <Layers className="size-3.5" />
              Catálogo
            </Link>
            <Link
              href="/cuentas-por-cobrar"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc]"
            >
              Cuentas por Cobrar
            </Link>
          </div>
        }
      />

      {/* Selector de Períodos */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26] min-w-0 max-w-full">
        {/* Presets rápidos con scroll horizontal nativo */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none min-w-0 max-w-full">
          <span className="mr-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
            Período:
          </span>
          <button
            type="button"
            onClick={() => aplicarFiltroPreset("hoy")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition touch-manipulation active:scale-[0.97] ${
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
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition touch-manipulation active:scale-[0.97] ${
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
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition touch-manipulation active:scale-[0.97] ${
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
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition touch-manipulation active:scale-[0.97] ${
              preset === "todo"
                ? "bg-zinc-900 text-white dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-[#16161e] dark:text-zinc-300 dark:hover:bg-[#1f202c]"
            }`}
          >
            Todo el histórico
          </button>
        </div>

        {/* Fechas personalizadas */}
        <form
          onSubmit={aplicarFiltroPersonalizado}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs w-full lg:w-auto min-w-0"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="text-xs font-medium text-zinc-500 sm:hidden w-12 shrink-0">Desde:</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                aria-label="Fecha inicio"
                className="h-9 w-full sm:w-36 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:border-[#7aa2f7] focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] min-w-0"
              />
            </div>
            <span className="hidden sm:inline text-zinc-400 text-center">a</span>
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <span className="text-xs font-medium text-zinc-500 sm:hidden w-12 shrink-0">Hasta:</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                aria-label="Fecha fin"
                className="h-9 w-full sm:w-36 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:border-[#7aa2f7] focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] min-w-0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center rounded-xl bg-zinc-900 px-4 font-semibold text-white transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc] dark:hover:bg-[#252b42] shrink-0"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tarjetas KPI de rotación */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Líder en Facturación */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Mayor Facturación
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-[#7aa2f7] dark:bg-[#1f202c] dark:text-[#7aa2f7]">
              <Sparkles className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
            {resumenInicial.servicio_lider_ingresos?.nombre ?? "Sin datos"}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {resumenInicial.servicio_lider_ingresos
              ? `${formatearUSD(resumenInicial.servicio_lider_ingresos.ingresos_usd)} (${resumenInicial.servicio_lider_ingresos.porcentaje_ingresos}% del total)`
              : "0 en el período"}
          </p>
        </div>

        {/* Líder en Volumen / Demanda */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Mayor Demanda (Piezas)
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-emerald-600 dark:bg-[#1f202c] dark:text-[#9ece6a]">
              <Flame className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
            {resumenInicial.servicio_lider_volumen?.nombre ?? "Sin datos"}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {resumenInicial.servicio_lider_volumen
              ? `${resumenInicial.servicio_lider_volumen.cantidad_total} unidades (${resumenInicial.servicio_lider_volumen.porcentaje_cantidad}% del volumen)`
              : "0 en el período"}
          </p>
        </div>

        {/* Total Facturado en Servicios */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Facturado
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-[#1f202c] dark:text-zinc-200">
              <DollarSign className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatearUSD(resumenInicial.total_ingresos_usd)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            En {resumenInicial.total_ordenes_procesadas} órdenes procesadas
          </p>
        </div>

        {/* Total de Trabajos/Ítems Producidos */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Unidades Producidas
            </span>
            <span className="rounded-lg bg-zinc-100 p-2 text-zinc-700 dark:bg-[#1f202c] dark:text-zinc-200">
              <Package className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {resumenInicial.total_items_producidos}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Piezas y renglones confeccionados
          </p>
        </div>
      </div>

      {/* Alerta de servicios sin demanda */}
      {resumenInicial.servicios_sin_demanda.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {resumenInicial.servicios_sin_demanda.length} servicio{resumenInicial.servicios_sin_demanda.length === 1 ? "" : "s"} sin rotación en este período
              </h3>
              <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
                Los siguientes servicios del catálogo no registraron ninguna orden:{" "}
                <span className="font-semibold">
                  {resumenInicial.servicios_sin_demanda.map((s) => s.nombre).join(", ")}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visualización de Barras de Participación */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          Participación de Facturación por Servicio
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Distribución porcentual de los ingresos generados en el período seleccionado.
        </p>

        <div className="mt-6 space-y-4">
          {metricasIniciales.slice(0, 6).map((item) => (
            <div key={item.servicio_id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {item.nombre}
                </span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  {formatearUSD(item.ingresos_usd)} ({item.porcentaje_ingresos}%)
                </span>
              </div>
              <ProgressBar
                value={item.porcentaje_ingresos}
                variant="info"
                size="md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada de rotación */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 px-4 sm:px-6 py-4 dark:border-[#24283b]">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Ranking de Servicios ({metricasIniciales.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Desglose detallado por órdenes, piezas producidas y facturación
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">Ordenar por:</span>
            <CustomSelect<CriterioOrdenRotacion>
              value={criterio}
              onChange={(val) => cambiarOrden(val)}
              options={OPCIONES_CRITERIO}
              variant="header"
              size="sm"
              className="w-full sm:w-auto min-w-0"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
              <tr>
                <th className="px-6 py-3.5">Servicio</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
                <th className="px-6 py-3.5 text-right">Órdenes</th>
                <th className="px-6 py-3.5 text-right">Cantidad / Piezas</th>
                <th className="px-6 py-3.5 text-right">Facturación USD</th>
                <th className="px-6 py-3.5 text-center">Nivel de Rotación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#24283b]">
              {metricasIniciales.map((m, index) => {
                let rotacionBadge = (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:border dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-400">
                    Sin ventas
                  </span>
                );

                if (m.cantidad_total > 0) {
                  if (index < 2 && m.porcentaje_ingresos >= 25) {
                    rotacionBadge = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:border dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Flame className="size-3 text-emerald-600 dark:text-[#9ece6a]" />
                        Alta rotación
                      </span>
                    );
                  } else if (m.cantidad_total >= 3) {
                    rotacionBadge = (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:border dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-[#7aa2f7]">
                        Media rotación
                      </span>
                    );
                  } else {
                    rotacionBadge = (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-[#e0af68]">
                        Baja rotación
                      </span>
                    );
                  }
                }

                return (
                  <tr
                    key={m.servicio_id}
                    className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-[#1f202c]/50"
                  >
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                      {m.nombre}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block size-2 rounded-full ${
                          m.activo ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                        title={m.activo ? "Activo en catálogo" : "Inactivo"}
                      />
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {m.ordenes_count} {m.ordenes_count === 1 ? "orden" : "órdenes"}
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">
                      <div>{m.cantidad_total}</div>
                      <div className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                        {m.porcentaje_cantidad}% volumen
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-[#7aa2f7] dark:text-[#7aa2f7]">
                      <div className="text-sm font-extrabold">{formatearUSD(m.ingresos_usd)}</div>
                      <div className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                        {m.porcentaje_ingresos}% ingresos
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">{rotacionBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
