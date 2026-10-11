import {
  CheckCircle,
  Clock,
  Euro,
  History,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatearTasaBs,
  obtenerTasaVigenteParaFecha,
  type TasaHistorica,
} from "@/lib/tasas/tasas";
import { obtenerTasasBcvCompletas } from "@/lib/tasas/bcv-service";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { TasaForm } from "./tasa-form";
import { BcvSyncPanel } from "./bcv-sync-panel";

export const instant = false;

type TasaRaw = {
  id: string;
  valor_bs_por_usd: number | string;
  vigente_desde: string;
  creado_en?: string;
};

function formatoFechaCompleta(iso: string): string {
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

/**
 * Gestión de tasa de cambio referencial (RF-15 / T-023).
 * Muestra la tasa vigente actual, tasas BCV en vivo (USD + EUR informativo),
 * formulario para nueva tasa (gerencial) y el histórico inmutable de vigencias.
 */
export default async function TasasPage() {
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

  const esGerencial = perfil?.rol === "gerencial";

  // Consultar histórico de tasas
  const { data: tasasData, error } = await supabase
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd, vigente_desde, creado_en")
    .order("vigente_desde", { ascending: false });

  if (error) {
    console.error("Error al consultar tasas_cambio:", error);
  }

  const historial: TasaHistorica[] = ((tasasData ?? []) as unknown as TasaRaw[]).map(
    (t) => ({
      id: t.id,
      valor_bs_por_usd: Number(t.valor_bs_por_usd),
      vigente_desde: t.vigente_desde,
      creado_en: t.creado_en,
    }),
  );

  const tasaVigente = obtenerTasaVigenteParaFecha(historial, new Date());

  // Consulta paralela de tasas BCV en vivo (para mostrar EUR informativo en la tarjeta)
  let tasaEurInformativa: number | null = null;
  let fechaEurActualizacion: string | null = null;

  try {
    const bcvEnVivo = await obtenerTasasBcvCompletas();
    if (bcvEnVivo.eur) {
      tasaEurInformativa = bcvEnVivo.eur.valorBs;
      fechaEurActualizacion = bcvEnVivo.eur.fechaActualizacion;
    }
  } catch {
    // Silenciar — la consulta BCV es best-effort
  }

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Tasa de Cambio Referencial"
          description="Configuración y vigencia de la tasa referencial Bs/USD. Los pedidos previos retienen su tasa histórica (RF-15)."
          actions={
            <Link
              href="/pedidos"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Ver Pedidos
            </Link>
          }
        />

        {/* Tarjeta destacada de la tasa vigente + EUR informativo */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-6 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-950/20 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            {/* USD principal */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle className="size-3.5" />
                  Tasa Vigente — USD
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                  Bs. {tasaVigente ? formatearTasaBs(tasaVigente.valor_bs_por_usd) : "—"}
                </span>
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                  / 1.00 USD
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <Clock className="size-3.5 text-zinc-400" />
                Vigente desde:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {tasaVigente ? formatoFechaCompleta(tasaVigente.vigente_desde) : "Vigencia base"}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Aplica para nuevos pedidos y cobros
              </p>
            </div>

            {/* EUR informativo */}
            <div className="min-w-[180px]">
              <div className="rounded-2xl border border-indigo-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-indigo-900/40 dark:bg-zinc-900/80">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Euro className="size-3.5" />
                  Euro BCV (Informativa)
                </div>
                {tasaEurInformativa ? (
                  <>
                    <p className="mt-1.5 text-xl font-black text-indigo-900 dark:text-indigo-100">
                      Bs. {tasaEurInformativa.toFixed(4)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-indigo-500 dark:text-indigo-400">
                      {fechaEurActualizacion
                        ? `Actualizado: ${new Date(fechaEurActualizacion).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-sm text-indigo-400 dark:text-indigo-500">
                    No disponible
                  </p>
                )}
                <span className="mt-1.5 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  No usada para cálculos
                </span>
              </div>
            </div>

            {/* Nota de inmutabilidad */}
            <div className="min-w-[200px] max-w-xs">
              <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-emerald-900/40 dark:bg-zinc-900/80 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Inmutabilidad Histórica
                </div>
                <p className="leading-relaxed text-[11px] text-zinc-500 dark:text-zinc-400">
                  Al actualizar la tasa, ninguna orden ni cobro emitido con anterioridad sufrirá cambios en sus totales en bolívares.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de 3 columnas: Sync BCV + Form Manual + Histórico */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Columna 1: Sincronización BCV */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {esGerencial ? (
                <BcvSyncPanel
                  tasaActualUsd={tasaVigente?.valor_bs_por_usd}
                />
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Tasa BCV en Vivo
                  </h3>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    La sincronización automática con BCV está disponible únicamente para el perfil <strong>gerencial</strong>.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna 2: Formulario manual */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Tasa Manual
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                {esGerencial
                  ? "Ingrese un valor personalizado para registrar una nueva vigencia."
                  : "Acción reservada para el perfil gerencial."}
              </p>

              {esGerencial ? (
                <TasaForm valorActual={tasaVigente?.valor_bs_por_usd} />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  Su usuario tiene perfil <strong>operativo</strong>. Puede consultar la tasa referencial para atender clientes en mostrador, pero la actualización está restringida a gerencia.
                </div>
              )}
            </div>
          </div>

          {/* Columna 3: Histórico Inmutable de Tasas */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-zinc-400" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Histórico ({historial.length})
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cronológico inverso
                </span>
              </div>

              {historial.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No hay registros de tasas en la base de datos.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                      <tr>
                        <th className="px-6 py-3.5">Valor (Bs. / USD)</th>
                        <th className="px-6 py-3.5">Vigente Desde</th>
                        <th className="px-6 py-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {historial.map((t) => {
                        const esLaVigente = tasaVigente?.id === t.id;
                        return (
                          <tr
                            key={t.id}
                            className={`transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 ${
                              esLaVigente ? "bg-emerald-50/30 dark:bg-emerald-950/10 font-bold" : ""
                            }`}
                          >
                            <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-white">
                              Bs. {formatearTasaBs(t.valor_bs_por_usd)}
                            </td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                              {formatoFechaCompleta(t.vigente_desde)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {esLaVigente ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Vigente
                                </span>
                              ) : (
                                <span className="text-[11px] text-zinc-400">Histórica</span>
                              )}
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
        </div>
      </div>
    </AuthenticatedShell>
  );
}
