"use client";

import { Banknote, ChevronDown, Euro } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatearEtiquetaSidebar } from "@/lib/tasas/tasas";

export interface SidebarTasasCardProps {
  tasaHoy?: number;
  tasaEurHoy?: number;
  tasaSiguiente?: number;
  tasaEurSiguiente?: number;
  fechaHoy?: string;
  fechaSiguiente?: string;
  esGerencial?: boolean;
}

// -----------------------------------------------------------------------------
// Sincronización de Persistencia de Acordeones entre Vistas y Navegaciones
// -----------------------------------------------------------------------------

function subscribeStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("apsys-tasas-acordeon-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("apsys-tasas-acordeon-changed", callback);
  };
}

function getAcordeonHoySnapshot(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem("apsys_tasas_acordeon_hoy");
    if (val === "false") return false;
    if (val === "true") return true;
  } catch {
    // Ignorar
  }
  return true; // Abierto por defecto
}

function getAcordeonMananaSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const val = localStorage.getItem("apsys_tasas_acordeon_manana");
    if (val === "true") return true;
    if (val === "false") return false;
  } catch {
    // Ignorar
  }
  return false; // Cerrado por defecto
}

function getServerSnapshotTrue(): boolean {
  return true;
}

function getServerSnapshotFalse(): boolean {
  return false;
}

export function SidebarTasasCard({
  tasaHoy,
  tasaEurHoy,
  tasaSiguiente,
  tasaEurSiguiente,
  fechaHoy,
  fechaSiguiente,
}: SidebarTasasCardProps) {
  // Estado reactivo persistente en localStorage para que se mantenga entre páginas
  const acordeonHoyAbierto = useSyncExternalStore(
    subscribeStorage,
    getAcordeonHoySnapshot,
    getServerSnapshotTrue,
  );

  const acordeonMananaAbierto = useSyncExternalStore(
    subscribeStorage,
    getAcordeonMananaSnapshot,
    getServerSnapshotFalse,
  );

  const toggleAcordeonHoy = () => {
    try {
      const nuevo = !acordeonHoyAbierto;
      localStorage.setItem("apsys_tasas_acordeon_hoy", String(nuevo));
      window.dispatchEvent(new Event("apsys-tasas-acordeon-changed"));
    } catch {
      // Ignorar
    }
  };

  const toggleAcordeonManana = () => {
    try {
      const nuevo = !acordeonMananaAbierto;
      localStorage.setItem("apsys_tasas_acordeon_manana", String(nuevo));
      window.dispatchEvent(new Event("apsys-tasas-acordeon-changed"));
    } catch {
      // Ignorar
    }
  };

  const fechaTextoHoy = formatearEtiquetaSidebar({
    fechaVigencia: fechaHoy,
    esTasaActiva: true,
  });
  const fechaTextoManana = formatearEtiquetaSidebar({
    fechaVigencia: fechaSiguiente,
    esTasaActiva: false,
  });

  const hayTasaManana = Boolean(
    (tasaSiguiente && tasaSiguiente > 0) || (tasaEurSiguiente && tasaEurSiguiente > 0)
  );

  return (
    <div className="mx-3 mt-3">
      <div className="rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-2.5 text-xs shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/60 dark:hover:border-zinc-700">
        {/* =====================================================================
            1. ENCABEZADO DE LA TARJETA
            ===================================================================== */}
        <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <span>Tasas Referenciales BCV</span>

          <Link
            href="/tasas"
            className="text-[9px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Ajustar
          </Link>
        </div>

        <div className="space-y-2">
          {/* =====================================================================
              2. ACORDEÓN 1: HOY
                 - Borde verde (border-emerald-500/40)
                 - Mismo fondo que el actual (bg-white/90 dark:bg-zinc-900/90)
                 - Circulito verde encendido
                 - Texto: "Hoy, DD/MM/AAAA" (sin palabra vigente/en vigencia)
                 - Estado persistente al navegar entre vistas
              ===================================================================== */}
          <div className="overflow-hidden rounded-xl border border-emerald-500/40 bg-white/90 shadow-xs transition-colors dark:border-emerald-600/50 dark:bg-zinc-900/90">
            <button
              type="button"
              onClick={toggleAcordeonHoy}
              aria-expanded={acordeonHoyAbierto}
              className="flex w-full items-center justify-between p-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  {fechaTextoHoy}
                </span>
              </div>

              <ChevronDown
                className={`size-3.5 text-zinc-400 transition-transform duration-200 dark:text-zinc-500 ${
                  acordeonHoyAbierto ? "rotate-180" : ""
                }`}
              />
            </button>

            {acordeonHoyAbierto && (
              <div className="space-y-1.5 border-t border-zinc-100 px-2.5 pt-2.5 pb-2.5 animate-in slide-in-from-top-1 duration-150 dark:border-zinc-800/60">
                <RenglonTasa
                  divisa="USD"
                  valor={tasaHoy}
                  variante="emerald"
                  icono={<Banknote className="size-3.5" />}
                />

                <RenglonTasa
                  divisa="EUR"
                  valor={tasaEurHoy}
                  variante="indigo"
                  icono={<Euro className="size-3.5" />}
                />
              </div>
            )}
          </div>

          {/* =====================================================================
              3. ACORDEÓN 2: MAÑANA
                 - Borde naranja/ámbar solamente (border-amber-500/50)
                 - Mismo fondo que el de hoy (bg-white/90 dark:bg-zinc-900/90)
                 - Sin fondo naranja
                 - SIN la palabra BCV en el encabezado
                 - Circulito encendido (si hay tasa) u opaco (si está pendiente)
                 - Estado persistente al navegar entre vistas
              ===================================================================== */}
          <div
            className={`overflow-hidden rounded-xl border transition-colors shadow-xs ${
              hayTasaManana
                ? "border-amber-500/50 dark:border-amber-600/50"
                : "border-zinc-300/80 dark:border-zinc-800"
            } bg-white/90 dark:bg-zinc-900/90`}
          >
            <button
              type="button"
              onClick={toggleAcordeonManana}
              aria-expanded={acordeonMananaAbierto}
              className="flex w-full items-center justify-between p-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-2">
                {/* Circulito: ámbar encendido si hay tasa, o gris opaco si está pendiente */}
                {hayTasaManana ? (
                  <span className="size-2 rounded-full bg-amber-500 shadow-xs animate-pulse" />
                ) : (
                  <span className="size-2 rounded-full bg-zinc-400/80 dark:bg-zinc-600" />
                )}

                <span
                  className={`text-[11px] font-bold ${
                    hayTasaManana
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {fechaTextoManana}
                </span>
              </div>

              {/* Solo la flechita chevron: eliminada la palabra BCV */}
              <ChevronDown
                className={`size-3.5 text-zinc-400 transition-transform duration-200 dark:text-zinc-500 ${
                  acordeonMananaAbierto ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Contenido desplegable con espaciado pt-2.5 */}
            {acordeonMananaAbierto && (
              <div className="space-y-1.5 border-t border-zinc-100 px-2.5 pt-2.5 pb-2.5 animate-in slide-in-from-top-1 duration-150 dark:border-zinc-800/60">
                <RenglonTasa
                  divisa="USD"
                  valor={tasaSiguiente}
                  variante={hayTasaManana ? "amber" : "muted"}
                  icono={<Banknote className="size-3.5" />}
                />

                <RenglonTasa
                  divisa="EUR"
                  valor={tasaEurSiguiente}
                  variante={hayTasaManana ? "indigo" : "muted"}
                  icono={<Euro className="size-3.5" />}
                />

                {!hayTasaManana && (
                  <p className="pt-1 text-center text-[9px] italic text-zinc-400 dark:text-zinc-500">
                    Tasa oficial aún no emitida por el BCV
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Componente de renglón individual de divisa */
function RenglonTasa({
  divisa,
  valor,
  variante,
  icono,
}: {
  divisa: "USD" | "EUR";
  valor?: number;
  variante: "emerald" | "indigo" | "amber" | "muted";
  icono: React.ReactNode;
}) {
  const estilos = {
    emerald: {
      contenedor:
        "border-emerald-200/90 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/30",
      etiqueta: "text-emerald-800 dark:text-emerald-300",
      icono: "text-emerald-600 dark:text-emerald-400",
      valor: "text-emerald-950 dark:text-emerald-100",
    },
    indigo: {
      contenedor:
        "border-indigo-200/90 bg-indigo-50/80 dark:border-indigo-900/60 dark:bg-indigo-950/30",
      etiqueta: "text-indigo-800 dark:text-indigo-300",
      icono: "text-indigo-600 dark:text-indigo-400",
      valor: "text-indigo-950 dark:text-indigo-100",
    },
    amber: {
      contenedor:
        "border-amber-200/90 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30",
      etiqueta: "text-amber-800 dark:text-amber-300",
      icono: "text-amber-600 dark:text-amber-400",
      valor: "text-amber-950 dark:text-amber-100",
    },
    muted: {
      contenedor:
        "border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/30",
      etiqueta: "text-zinc-500 dark:text-zinc-400",
      icono: "text-zinc-400 dark:text-zinc-500",
      valor: "text-zinc-400 dark:text-zinc-500",
    },
  }[variante];

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 transition-colors ${estilos.contenedor}`}
    >
      <div className={`flex items-center gap-1.5 text-xs font-bold ${estilos.etiqueta}`}>
        <span className={estilos.icono}>{icono}</span>
        <span>{divisa}</span>
      </div>

      <span className={`font-mono text-xs font-black ${estilos.valor}`}>
        {typeof valor === "number" && !isNaN(valor) && valor > 0
          ? `Bs. ${valor.toFixed(2)}`
          : "Bs. —"}
      </span>
    </div>
  );
}
