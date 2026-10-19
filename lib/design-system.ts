/**
 * Sistema de Diseño Oficial APSys - Paleta Tokyo Night (Fase 34).
 *
 * Single Source of Truth para tokens, variables cromáticas y clases estándar
 * de Tailwind CSS aplicables transversalmente a toda la plataforma.
 */

export const TOKYO_NIGHT_TOKENS = {
  // Lienzo y fondos principales
  canvas: "#16161e",
  surface: "#1a1b26",
  elevated: "#1f202c",
  hover: "#252b42",

  // Bordes y delimitadores
  border: "#24283b",
  borderActive: "#2f3654",

  // Acentos cromáticos oficiales
  accentBlue: "#7aa2f7",     // Flujo de recepción / Pedidos / Acciones primarias
  accentCyan: "#7dcfff",     // Resaltados técnicos
  accentAmber: "#e0af68",    // En producción / Tasas futuras / Advertencias
  accentEmerald: "#9ece6a",  // Listos para retiro / Éxito / Pagado / Tasas vigentes
  accentPurple: "#bb9af7",   // Servicios / Categorías
  accentRed: "#f7768e",      // Anulaciones / Errores / Alertas críticas

  // Tipografía de alto contraste (WCAG AAA)
  textPrimary: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
} as const;

export const DESIGN_SYSTEM = {
  // Tarjetas contenedoras principales
  card:
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition dark:border-[#24283b] dark:bg-[#1a1b26]",

  // Tarjetas secundarias / elementos anidados
  cardSubtle:
    "rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition dark:border-[#24283b] dark:bg-[#1f202c]",

  // Campos de formulario e inputs
  input:
    "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-[#7aa2f7] focus:ring-2 focus:ring-[#7aa2f7]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#24283b] dark:bg-[#16161e] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25",

  // Botón principal de llamada a la acción
  buttonPrimary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-98 disabled:opacity-50 dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42]",

  // Botón secundario tipo outline
  buttonSecondary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-98 disabled:opacity-50 dark:border-[#2f3654] dark:bg-[#1a1b26] dark:text-zinc-200 dark:hover:bg-[#1f202c]",

  // Botón neutral elevado para acciones rápidas o barras
  buttonNeutral:
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-3.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-200 active:scale-98 disabled:opacity-50 dark:border dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-white",

  // Tablas de datos
  tableHeader:
    "border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300",
  tableRow:
    "border-b border-zinc-100 transition hover:bg-zinc-50/60 dark:border-[#24283b]/60 dark:hover:bg-[#1f202c]/50",

  // Badges y píldoras temáticas de alta legibilidad
  badgeBlue:
    "inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-[#7aa2f7]",
  badgeAmber:
    "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-[#e0af68]",
  badgeEmerald:
    "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-[#9ece6a]",
  badgePurple:
    "inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-[#bb9af7]",
  badgeRed:
    "inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-[#f7768e]",
  badgeNeutral:
    "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300",
} as const;
