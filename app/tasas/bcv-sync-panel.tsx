"use client";

import {
  CheckCircle2,
  Clock,
  Euro,
  Loader2,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTasas } from "@/context/tasas-context";
import {
  esTasaBcvFutura,
  calcularDiferenciaDiasCaracas,
  obtenerNombreDiaSemanaCaracas,
} from "@/lib/tasas/tasas";
import {
  consultarTasasBcvEnVivo,
  sincronizarTasaBcv,
  type EstadoSincronizacionBcv,
} from "./actions";
import type { TasasBcvCompletas } from "@/lib/tasas/bcv-service";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  tasaActualUsd?: number;
  tasasIniciales?: TasasBcvCompletas | null;
};

/**
 * Panel de sincronización BCV con consulta en vivo de USD y EUR,
 * y botón para aplicar la tasa USD como nueva vigencia (RF-15).
 */
export function BcvSyncPanel({ tasaActualUsd, tasasIniciales }: Props) {
  const router = useRouter();
  const { refrescarTasas } = useTasas();
  const [consultando, iniciarConsulta] = useTransition();
  const [sincronizando, iniciarSync] = useTransition();

  const [tasasEnVivo, setTasasEnVivo] = useState<TasasBcvCompletas | null>(
    tasasIniciales ?? null,
  );
  const [resultadoSync, setResultadoSync] =
    useState<EstadoSincronizacionBcv | null>(null);

  const handleConsultar = () => {
    setResultadoSync(null);
    iniciarConsulta(async () => {
      const resultado = await consultarTasasBcvEnVivo();
      setTasasEnVivo(resultado);
    });
  };

  const handleSincronizar = () => {
    iniciarSync(async () => {
      const resultado = await sincronizarTasaBcv();
      setResultadoSync(resultado);
      if (resultado.exito) {
        // Refrescar las tasas en vivo después de sincronizar
        const nuevasTasas = await consultarTasasBcvEnVivo();
        setTasasEnVivo(nuevasTasas);
        // Actualizar el contexto en memoria RAM (Sidebar, Header y conversores)
        await refrescarTasas();
        // Revalidar el Server Component de la ruta actual (/tasas)
        router.refresh();
      }
    });
  };

  const tasaUsdEnVivo = tasasEnVivo?.usd;
  const tasaEurEnVivo = tasasEnVivo?.eur;
  const esFutura = tasaUsdEnVivo
    ? esTasaBcvFutura(tasaUsdEnVivo.fechaActualizacion)
    : false;
  const diffDias = tasaUsdEnVivo
    ? calcularDiferenciaDiasCaracas(tasaUsdEnVivo.fechaActualizacion)
    : 0;
  const nombreDiaFuturo =
    diffDias === 1
      ? "Mañana"
      : tasaUsdEnVivo?.fechaActualizacion
      ? obtenerNombreDiaSemanaCaracas(tasaUsdEnVivo.fechaActualizacion)
      : "el Próximo Día Hábil";

  return (
    <div className="space-y-4">
      {/* Encabezado del panel */}
      <div className="flex items-center gap-2">
        <Wifi className="size-4 text-blue-500" />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
          Sincronización BCV en Vivo
        </h3>
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Consulta las tasas oficiales del BCV desde la API pública y aplícalas
        con un solo clic.
      </p>

      {/* Botón de consulta en vivo */}
      <button
        type="button"
        onClick={handleConsultar}
        disabled={consultando || sincronizando}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-800 shadow-sm transition hover:bg-blue-100 disabled:opacity-60 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-[#7aa2f7] dark:hover:bg-[#252b42]"
      >
        {consultando ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Consultando API...
          </>
        ) : (
          <>
            <RefreshCw className="size-3.5" />
            Consultar Tasas BCV en Vivo
          </>
        )}
      </button>

      {/* Resultado de la consulta en vivo */}
      {tasasEnVivo && (
        <div className="space-y-3">
          {/* Tasa USD */}
          {tasaUsdEnVivo ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-[#16161e]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  USD / BCV Oficial
                </span>
                <p className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                  Bs. {tasaUsdEnVivo.valorBs.toFixed(4)}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Actualizado:{" "}
                  {new Date(
                    tasaUsdEnVivo.fechaActualizacion,
                  ).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {tasaActualUsd && (
                <div className="text-right text-[10px]">
                  <span className="block text-zinc-500 dark:text-zinc-400">
                    Tu tasa actual
                  </span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    Bs. {tasaActualUsd.toFixed(4)}
                  </span>
                  {Math.abs(tasaUsdEnVivo.valorBs - tasaActualUsd) > 0.01 && (
                    <span className="mt-0.5 block font-bold text-amber-600 dark:text-amber-400">
                      Δ{" "}
                      {(tasaUsdEnVivo.valorBs - tasaActualUsd) > 0 ? "+" : ""}
                      {(tasaUsdEnVivo.valorBs - tasaActualUsd).toFixed(4)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Tasa EUR (informativa) */}
          {tasaEurEnVivo ? (
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-[#24283b] dark:bg-[#16161e]">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-[#7aa2f7]">
                  <Euro className="size-3" />
                  EUR / BCV Oficial (informativa)
                </span>
                <p className="text-lg font-black text-blue-900 dark:text-[#f8fafc]">
                  Bs. {tasaEurEnVivo.valorBs.toFixed(4)}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-[#7aa2f7]">
                  Actualizado:{" "}
                  {new Date(
                    tasaEurEnVivo.fechaActualizacion,
                  ).toLocaleDateString("es-VE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-[#7aa2f7]">
                Solo informativa
              </span>
            </div>
          ) : null}

          {tasasEnVivo.error && (
            <Alert variant="warning">
              {tasasEnVivo.error}
            </Alert>
          )}

          {/* Botón para aplicar la tasa USD como vigencia */}
          {tasaUsdEnVivo && (
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={handleSincronizar}
                disabled={sincronizando || consultando}
                variant="primary"
                size="lg"
                className="w-full text-xs"
              >
                {sincronizando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>
                      {esFutura
                        ? `Programando tasa para ${nombreDiaFuturo}...`
                        : "Aplicando tasa de hoy..."}
                    </span>
                  </>
                ) : esFutura ? (
                  <>
                    <Clock className="size-4" />
                    <span>Programar Bs. {tasaUsdEnVivo.valorBs.toFixed(4)} para {nombreDiaFuturo} (Día Hábil)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Aplicar Bs. {tasaUsdEnVivo.valorBs.toFixed(4)} como Tasa Vigente de Hoy</span>
                  </>
                )}
              </Button>

              {esFutura && (
                <Alert variant="warning" title="Nota operativa:">
                  Esta tasa oficial entrará en vigencia automática el <strong>{nombreDiaFuturo} a las 12:00 a. m.</strong> La tasa actual permanece vigente para el cierre del día. Ya puedes usar la tasa programada para cotizar o facturar en <strong>Nuevo Pedido</strong> usando el selector interactivo.
                </Alert>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback de sincronización */}
      {resultadoSync?.exito && (
        <Alert variant="success">
          {resultadoSync.mensaje}
        </Alert>
      )}

      {resultadoSync?.error && (
        <Alert variant="danger">
          {resultadoSync.error}
        </Alert>
      )}
    </div>
  );
}
