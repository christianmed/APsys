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
  badge?: ReactNode;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
};

/**
 * Encabezado de página unificado y coherente, diseñado como tarjeta contenedora
 * consistente con la estética del panel principal (Inicio).
 */
export function PageHeader({
  title,
  description,
  badge,
  backHref,
  backLabel,
  breadcrumbs,
  actions,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Migas de pan opcionales (si se proporcionan) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
        >
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

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          {backHref && (
            <Link
              href={backHref}
              className="mt-1 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              title={backLabel ?? "Volver atrás"}
            >
              <ArrowLeft className="size-4" />
              <span>{backLabel ?? "Volver"}</span>
            </Link>
          )}

          <div className="space-y-1.5">
            {badge && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {badge}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>

            {description && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
