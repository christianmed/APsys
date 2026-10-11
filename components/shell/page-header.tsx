import { type ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  badge?: ReactNode;
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
  actions,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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

        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
