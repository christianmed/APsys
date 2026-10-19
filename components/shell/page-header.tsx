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
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-4.5 sm:p-6 lg:p-8 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between min-w-0">
        <div className="space-y-1.5 min-w-0 w-full">
          {badge && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-600 dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
              {badge}
            </div>
          )}

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 break-words leading-tight">
            {title}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl break-words leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="w-full lg:w-auto min-w-0 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
