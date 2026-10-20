/**
 * Estilos visuales de tarjetas de taller por estado (Fase 33).
 *
 * Principio rector:
 * El estado de la orden lo comunica la superficie y el borde de la tarjeta en su totalidad
 * mediante tintes sobrios sobre la paleta Tokyo Night (#1a1b26), mientras que los botones
 * de acción son 100% neutrales y elegantes sin colores chillones.
 */

import type { EstadoPedido } from "@/lib/pedidos/estados";

export interface EstilosTarjetaTaller {
  estado: EstadoPedido;
  cardContainer: string;
  badge: string;
  btnAction: string;
  iconoAccion: "Play" | "Printer" | "PackageCheck";
  btnCobrarSaldo?: string;
  iconoCobrar?: "HandCoins";
}

export function obtenerEstilosTarjetaTaller(
  estado: EstadoPedido,
): EstilosTarjetaTaller {
  switch (estado) {
    case "recibido":
      return {
        estado: "recibido",
        cardContainer:
          "border-blue-200/90 bg-blue-50/20 hover:border-blue-400/80 hover:bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 dark:hover:border-blue-800/80 dark:hover:bg-blue-950/30",
        badge:
          "border border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/70 dark:text-[#7aa2f7]",
        btnAction:
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] disabled:opacity-50 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42]",
        iconoAccion: "Play",
      };

    case "en_produccion":
      return {
        estado: "en_produccion",
        cardContainer:
          "border-amber-200/90 bg-amber-50/20 hover:border-amber-400/80 hover:bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/15 dark:hover:border-amber-800/80 dark:hover:bg-amber-950/25",
        badge:
          "border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/70 dark:text-amber-200",
        btnAction:
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] disabled:opacity-50 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42]",
        iconoAccion: "Printer",
      };

    case "listo":
      return {
        estado: "listo",
        cardContainer:
          "border-emerald-200/90 bg-emerald-50/20 hover:border-emerald-400/80 hover:bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/15 dark:hover:border-emerald-800/80 dark:hover:bg-emerald-950/25",
        badge:
          "border border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/70 dark:text-emerald-200",
        btnAction:
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] disabled:opacity-50 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42]",
        iconoAccion: "PackageCheck",
        btnCobrarSaldo:
          "flex h-13 w-full flex-col items-center justify-center rounded-xl bg-zinc-900 px-4 text-white shadow-xs transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] disabled:opacity-50 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42]",
        iconoCobrar: "HandCoins",
      };

    default:
      return {
        estado,
        cardContainer:
          "border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#24283b] dark:bg-[#1a1b26] dark:hover:border-[#2f3654]",
        badge:
          "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        btnAction:
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] disabled:opacity-50 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42]",
        iconoAccion: "Play",
      };
  }
}
