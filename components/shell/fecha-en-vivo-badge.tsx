"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  formatearFechaLargaCaracas,
  obtenerTiempoHastaMedianocheCaracas,
} from "@/lib/fechas";

type Props = {
  fechaInicial?: string;
  className?: string;
};

/**
 * Badge de fecha reactiva en vivo para el banner de bienvenida (Fase 32).
 * Anclado estrictamente a la hora oficial de Venezuela (America/Caracas).
 * Se actualiza automáticamente al cruzar la medianoche sin recargar la página.
 */
export function FechaEnVivoBadge({ fechaInicial, className = "" }: Props) {
  const [fechaTexto, setFechaTexto] = useState<string>(() => {
    return fechaInicial || formatearFechaLargaCaracas(new Date());
  });

  useEffect(() => {
    let timerMedianoche: NodeJS.Timeout;

    function programarProximaMedianoche() {
      const ms = obtenerTiempoHastaMedianocheCaracas(new Date());
      // Agregar 500ms adicionales para garantizar que el nuevo día ya comenzó
      timerMedianoche = setTimeout(() => {
        setFechaTexto(formatearFechaLargaCaracas(new Date()));
        programarProximaMedianoche();
      }, ms + 500);
    }

    programarProximaMedianoche();

    // Verificación de respaldo cada minuto por si el equipo se suspendió o hibernó
    const intervaloRespaldo = setInterval(() => {
      const actual = formatearFechaLargaCaracas(new Date());
      setFechaTexto((prev) => (prev !== actual ? actual : prev));
    }, 60_000);

    return () => {
      clearTimeout(timerMedianoche);
      clearInterval(intervaloRespaldo);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 ${className}`}
    >
      <Sparkles className="size-3.5 text-amber-500" />
      <span className="capitalize" suppressHydrationWarning>
        {fechaTexto}
      </span>
    </div>
  );
}
