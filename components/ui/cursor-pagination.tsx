import Link from "next/link";
import { construirUrlPaginacion } from "@/lib/paginacion/cursor";

export interface CursorPaginationProps {
  /** Ruta base a la que pertenecen los registros (ej. "/pedidos", "/clientes") */
  baseUrl: string;
  /** Parámetros de búsqueda actuales (ej. { q: "termino" }) */
  searchParams?: Record<string, string | number | boolean | null | undefined>;
  /** Cursor de la página actual (null o undefined si estamos en la primera página) */
  cursorActivo?: string | number | null;
  /** Cursor para la página siguiente (null si estamos en la última página) */
  siguienteCursor?: string | number | null;
  /** Cantidad de registros mostrados en la página actual */
  totalEnPagina?: number;
}

/**
 * Componente universal de paginación por cursor para APSys.
 * Permite navegar hacia la siguiente página mediante cursor y regresar al inicio.
 */
export function CursorPagination({
  baseUrl,
  searchParams = {},
  cursorActivo,
  siguienteCursor,
}: CursorPaginationProps) {
  const tienePaginaAnterior = Boolean(cursorActivo);
  const tienePaginaSiguiente = Boolean(siguienteCursor);

  // Si no hay cursor activo (página 1) y no hay más registros que mostrar, no renderizar nada
  if (!tienePaginaAnterior && !tienePaginaSiguiente) {
    return null;
  }

  // URL para volver al inicio (mantiene el término de búsqueda `q` si existe, pero elimina `cursor`)
  const urlInicio = construirUrlPaginacion(baseUrl, {
    ...searchParams,
    cursor: null,
  });

  // URL para avanzar a la página siguiente
  const urlSiguiente = construirUrlPaginacion(baseUrl, {
    ...searchParams,
    cursor: siguienteCursor,
  });

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 border-t border-zinc-200/80 pt-4 dark:border-[#24283b]"
    >
      <div>
        {tienePaginaAnterior ? (
          <Link
            href={urlInicio}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-xs sm:text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none dark:border-[#2f3654] dark:bg-[#1a1b26] dark:text-zinc-200 dark:hover:bg-[#1f202c] dark:hover:text-[#f8fafc]"
          >
            ← Inicio
          </Link>
        ) : (
          <span className="invisible select-none text-xs">← Inicio</span>
        )}
      </div>

      <div>
        {tienePaginaSiguiente ? (
          <Link
            href={urlSiguiente}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-xs sm:text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none dark:border-[#2f3654] dark:bg-[#1a1b26] dark:text-zinc-200 dark:hover:bg-[#1f202c] dark:hover:text-[#f8fafc]"
          >
            Siguiente →
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
