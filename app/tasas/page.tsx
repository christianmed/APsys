import {
  Banknote,
  CheckCircle,
  Clock,
  History,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatearTasaBs,
  obtenerTasaVigenteParaFecha,
  obtenerTasaProgramadaParaFecha,
  describirEstadoVigencia,
  type TasaHistorica,
} from "@/lib/tasas/tasas";
import { obtenerTasasBcvCompletas } from "@/lib/tasas/bcv-service";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
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
  const { user, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  // Consultar histórico de tasas
  // Consulta paralela del histórico y de tasas BCV en vivo para precargar instantáneamente
  const [tasasRes, tasasBcvIniciales] = await Promise.all([
    supabase
      .from("tasas_cambio")
      .select("id, valor_bs_por_usd, vigente_desde, creado_en")
      .order("vigente_desde", { ascending: false }),
    obtenerTasasBcvCompletas().catch(() => null),
  ]);

  const tasasData = tasasRes.data;
  if (tasasRes.error) {
    console.error("Error al consultar tasas_cambio:", tasasRes.error);
  }

  const historial: TasaHistorica[] = ((tasasData ?? []) as unknown as TasaRaw[]).map(
    (t) => ({
      id: t.id,
      valor_bs_por_usd: Number(t.valor_bs_por_usd),
      vigente_desde: t.vigente_desde,
      creado_en: t.creado_en,
    }),
  );

  const ahora = new Date();
  const tasaVigente = obtenerTasaVigenteParaFecha(historial, ahora);
  const tasaProgramada = obtenerTasaProgramadaParaFecha(historial, ahora);

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Tasa de Cambio Referencial"
          description="Configuración y vigencia de la tasa referencial Bs/USD. Los pedidos previos retienen su tasa histórica (RF-15)."
          badge={
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <Banknote className="size-3.5" />
              <span>Divisas & BCV</span>
            </span>
          }
          actions={
            <Button
              href="/pedidos"
              variant="outline"
              size="sm"
            >
              Ver Pedidos
            </Button>
          }
        />

        {/* Tarjeta destacada de la tasa vigente */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-6 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-[#1a1b26] dark:to-emerald-950/20 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            {/* USD principal */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Badge variant="success" icon={CheckCircle}>
                  Tasa Vigente — USD
                </Badge>
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

            {/* Nota de inmutabilidad */}
            <div className="min-w-[200px] max-w-sm">
              <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#24283b] dark:bg-[#16161e]/80 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
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

          {/* Banner de tasa futura programada (si existe) */}
          {tasaProgramada && (
            <Alert
              variant="warning"
              icon={Clock}
              title="Tasa Oficial Programada para Mañana:"
              className="mt-6"
            >
              Bs. {formatearTasaBs(tasaProgramada.valor_bs_por_usd)} / USD (vigente a partir de {formatoFechaCompleta(tasaProgramada.vigente_desde)}).
            </Alert>
          )}
        </div>

        {/* Sección de 2 columnas de igual ancho: Sincronización BCV en Vivo e Histórico (en móvil: Sincronización arriba, Histórico abajo) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Columna 1: Sincronización BCV en Vivo */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
            <BcvSyncPanel
              tasaActualUsd={tasaVigente?.valor_bs_por_usd}
              tasasIniciales={tasasBcvIniciales}
            />
          </div>

          {/* Columna 2: Histórico Inmutable de Tasas */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-[#24283b] flex items-center justify-between">
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
                    <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                      <tr>
                        <th className="px-6 py-3.5">Valor (Bs. / USD)</th>
                        <th className="px-6 py-3.5">Vigente Desde</th>
                        <th className="px-6 py-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-[#24283b]">
                      {historial.map((t) => {
                        const esLaVigente = tasaVigente?.id === t.id;
                        const estadoVigencia = describirEstadoVigencia({
                          fechaVigencia: t.vigente_desde,
                          esLaVigente,
                          fechaReferencia: ahora,
                        });
                        const esLaProgramada = estadoVigencia.esProgramada;
                        return (
                          <tr
                            key={t.id}
                            className={`transition-colors hover:bg-zinc-50/70 dark:hover:bg-[#1f202c]/50 ${
                              esLaVigente
                                ? "bg-emerald-50/30 dark:bg-emerald-950/10 font-bold"
                                : esLaProgramada
                                ? "bg-amber-50/30 dark:bg-amber-950/10 font-bold"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4 font-mono font-bold text-zinc-900 dark:text-white">
                              Bs. {formatearTasaBs(t.valor_bs_por_usd)}
                            </td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                              {formatoFechaCompleta(t.vigente_desde)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge
                                variant={
                                  esLaVigente
                                    ? "success"
                                    : esLaProgramada
                                    ? "warning"
                                    : "neutral"
                                }
                              >
                                {esLaVigente || esLaProgramada
                                  ? estadoVigencia.etiquetaBadge
                                  : "Histórica"}
                              </Badge>
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
    </AuthenticatedShell>
  );
}
