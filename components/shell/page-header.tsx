import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
};

/**
 * Encabezado de página unificado y coherente con navegación de retorno explícita.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  breadcrumbs,
  actions,
}: Props) {
  return (
    <div className="space-y-3 pb-2">
      {/* Migas de pan / Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Home className="size-3.5" />
            <span>Inicio</span>
          </Link>
          {breadcrumbs.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="size-3 text-zinc-400" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Fila principal: Botón Volver + Título + Acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title={backLabel ?? "Volver atrás"}
            >
              <ArrowLeft className="size-4" />
              <span>{backLabel ?? "Volver"}</span>
            </Link>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
