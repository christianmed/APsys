import { ShellSkeleton, PageHeaderSkeleton } from "@/components/shell/shell-skeleton";

export default function DashboardLoading() {
  return (
    <ShellSkeleton>
      <div className="space-y-6">
        <PageHeaderSkeleton />

        {/* Selector de rango de fechas */}
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>

        {/* Tarjetas de métricas financieras */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="size-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
              <div className="h-8 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Gráfico / desglose por moneda placeholder */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-64 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 animate-pulse" />
        </div>
      </div>
    </ShellSkeleton>
  );
}
