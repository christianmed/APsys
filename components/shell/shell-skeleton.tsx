import { type ReactNode } from "react";

interface ShellSkeletonProps {
  children?: ReactNode;
}

/**
 * Skeleton base que imita la estructura visual completa de AppShell (sidebar, header, mobile bars)
 * para proporcionar transiciones de página instantáneas con 0 flicker y 0 CLS.
 */
export function ShellSkeleton({ children }: ShellSkeletonProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      {/* 1. SIDEBAR DESKTOP SKELETON */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Branding placeholder */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-2.5 w-10 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tasa Bar placeholder */}
        <div className="border-b border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="h-10 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 animate-pulse" />
        </div>

        {/* Nav list placeholder */}
        <div className="flex-1 space-y-4 px-3 py-4">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse px-2" />
            <div className="space-y-1.5">
              <div className="h-9 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse" />
              <div className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              <div className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse px-2" />
            <div className="space-y-1.5">
              <div className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              <div className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              <div className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            </div>
          </div>
        </div>

        {/* User footer placeholder */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-2.5 w-12 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. TOPBAR MOBILE SKELETON */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="size-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </header>

      {/* 3. MAIN SKELETON CONTENT */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 pt-20 md:pt-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* 4. BOTTOM BAR MOBILE SKELETON */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-zinc-200 bg-white/95 px-2 backdrop-blur shadow-lg dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-8 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </nav>
    </div>
  );
}

/**
 * Placeholder estándar para PageHeader
 */
export function PageHeaderSkeleton() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="h-5 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-8 w-64 sm:w-80 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-48 sm:w-96 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
