import { ShellSkeleton, PageHeaderSkeleton } from "@/components/shell/shell-skeleton";

export default function TasasLoading() {
  return (
    <ShellSkeleton>
      <div className="space-y-6">
        <PageHeaderSkeleton />

        {/* Banner destacado de tasas vigentes */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-6 sm:p-8 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-950/20">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="h-5 w-36 rounded-full bg-emerald-200 dark:bg-emerald-900/60 animate-pulse" />
              <div className="h-12 w-56 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-40 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
            <div className="space-y-2 border-t border-emerald-100 pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0 dark:border-emerald-900/40">
              <div className="h-5 w-32 rounded-full bg-emerald-200 dark:bg-emerald-900/60 animate-pulse" />
              <div className="h-9 w-44 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Grid de 2 columnas: Sincronización e Historial */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card de sincronización */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            <div className="h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 animate-pulse p-4" />
            <div className="h-11 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>

          {/* Card de historial */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/60"
                >
                  <div className="h-5 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-36 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ShellSkeleton>
  );
}
