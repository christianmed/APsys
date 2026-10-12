import { ShellSkeleton, PageHeaderSkeleton } from "@/components/shell/shell-skeleton";

export default function TallerLoading() {
  return (
    <ShellSkeleton>
      <div className="space-y-6">
        <PageHeaderSkeleton />

        {/* Barra de pestañas / estados de taller */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-28 shrink-0 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>

        {/* Grid de órdenes de taller */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-64"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/40 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800/40 animate-pulse" />
                </div>
              </div>

              {/* Botón de avance rápido de estado */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="h-11 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
