import { ShellSkeleton, PageHeaderSkeleton } from "@/components/shell/shell-skeleton";

export default function PedidosLoading() {
  return (
    <ShellSkeleton>
      <div className="space-y-6">
        <PageHeaderSkeleton />

        {/* Buscador y filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-11 flex-1 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-11 w-32 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Lista de órdenes / pedidos */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-1 text-right">
                  <div className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="size-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="size-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
