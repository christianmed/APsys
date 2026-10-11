"use client";

import {
  Banknote,
  ClipboardList,
  Euro,
  Flame,
  Home,
  LogOut,
  Menu,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { NAVIGATION_GROUPS } from "./app-nav-items";

type Props = {
  usuarioEmail: string;
  usuarioRol: string;
  tasaHoy?: number;
  tasaEurHoy?: number;
  children: ReactNode;
  accionCerrarSesion: () => Promise<void>;
};

export function AppShell({
  usuarioEmail,
  usuarioRol,
  tasaHoy,
  tasaEurHoy,
  children,
  accionCerrarSesion,
}: Props) {
  const pathname = usePathname();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const esGerencial = usuarioRol === "gerencial";

  const estaRutaActiva = (href: string, exactMatch?: boolean) => {
    if (exactMatch) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      {/* =========================================================================
          1. SIDEBAR DESKTOP (visible en md y superior)
          ========================================================================= */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Branding superior */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm transition group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900">
              <span className="font-mono text-base font-black tracking-tighter">AP</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                APSys
              </span>
              <span className="block text-[10px] font-medium text-zinc-400 -mt-1">
                Taller de Gráfica
              </span>
            </div>
          </Link>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            v1.0
          </span>
        </div>

        {/* Widget de Tasas de Cambio del día (USD + EUR equilibrados) */}
        {tasaHoy && (
          <div className="mx-3 mt-3">
            <Link
              href={esGerencial ? "/tasas" : "#"}
              className={`block rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-2.5 text-xs shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/60 dark:hover:border-zinc-700 ${
                esGerencial ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <span>Tasas Referenciales</span>
                {esGerencial && (
                  <span className="text-[9px] font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                    Ajustar
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Bloque USD */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    <Banknote className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>USD</span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs font-black text-emerald-950 dark:text-emerald-100">
                    Bs. {tasaHoy.toFixed(2)}
                  </p>
                </div>

                {/* Bloque EUR */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-2 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    <Euro className="size-3 text-indigo-600 dark:text-indigo-400" />
                    <span>EUR</span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs font-black text-indigo-950 dark:text-indigo-100">
                    {tasaEurHoy ? `Bs. ${tasaEurHoy.toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Menú de navegación agrupado */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 text-xs">
          {NAVIGATION_GROUPS.map((grupo) => {
            // Filtrar grupos/items que requieren rol gerencial
            const itemsFiltrados = grupo.items.filter(
              (item) => !item.rolRequerido || item.rolRequerido === usuarioRol,
            );

            if (itemsFiltrados.length === 0) return null;

            return (
              <div key={grupo.title} className="space-y-1">
                <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {grupo.title}
                </h3>
                <div className="space-y-0.5">
                  {itemsFiltrados.map((item) => {
                    const activa = estaRutaActiva(item.href, item.exactMatch);
                    const Icono = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          activa
                            ? "bg-zinc-900 text-white font-semibold shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icono
                            className={`size-4 transition-colors ${
                              activa
                                ? "text-white dark:text-zinc-900"
                                : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Perfil del usuario autenticado al pie del Sidebar */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                <User className="size-4" />
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {usuarioEmail}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                  <Shield className="size-3 text-zinc-400" />
                  {usuarioRol}
                </span>
              </div>
            </div>

            <form action={accionCerrarSesion}>
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. HEADER MÓVIL (visible en móviles < md)
          ========================================================================= */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono font-black text-xs dark:bg-zinc-100 dark:text-zinc-900">
            AP
          </div>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            APSys
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {tasaHoy && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Banknote className="size-3 text-emerald-600 dark:text-emerald-400" />
                Bs. {tasaHoy.toFixed(2)}
              </span>
              {tasaEurHoy && (
                <span
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-mono font-bold text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                  title={`Euro BCV Oficial: Bs. ${tasaEurHoy.toFixed(4)}`}
                >
                  <Euro className="size-3 text-indigo-600 dark:text-indigo-400" />
                  Bs. {tasaEurHoy.toFixed(2)}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            aria-label="Abrir menú de navegación"
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {menuMovilAbierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Drawer deslizante para móvil */}
      {menuMovilAbierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMenuMovilAbierto(false)}
          />
          <div className="relative ml-auto flex h-full w-4/5 max-w-sm flex-col bg-white shadow-xl dark:bg-zinc-900">
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Menú de Navegación
              </span>
              <button
                type="button"
                onClick={() => setMenuMovilAbierto(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4 text-xs">
              {NAVIGATION_GROUPS.map((grupo) => {
                const itemsFiltrados = grupo.items.filter(
                  (item) => !item.rolRequerido || item.rolRequerido === usuarioRol,
                );
                if (itemsFiltrados.length === 0) return null;

                return (
                  <div key={grupo.title} className="space-y-1">
                    <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      {grupo.title}
                    </h3>
                    <div className="space-y-0.5">
                      {itemsFiltrados.map((item) => {
                        const activa = estaRutaActiva(item.href, item.exactMatch);
                        const Icono = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuMovilAbierto(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${
                              activa
                                ? "bg-zinc-900 text-white font-semibold dark:bg-zinc-100 dark:text-zinc-900"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <Icono className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 text-xs text-zinc-500">
                Sesión: <strong className="text-zinc-800 dark:text-zinc-200">{usuarioEmail}</strong> ({usuarioRol})
              </div>
              <form action={accionCerrarSesion}>
                <button
                  type="submit"
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. CONTENIDO PRINCIPAL
          ========================================================================= */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 pt-20 md:pt-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* =========================================================================
          4. BOTTOM NAVIGATION BAR MÓVIL (visible en móviles < md)
          ========================================================================= */}
      <nav
        aria-label="Navegación rápida móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-zinc-200 bg-white/95 px-2 backdrop-blur shadow-lg dark:border-zinc-800 dark:bg-zinc-900/95"
      >
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition ${
            pathname === "/" ? "text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Home className="size-5" />
          <span>Inicio</span>
        </Link>

        <Link
          href="/pedidos"
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition ${
            pathname.startsWith("/pedidos") ? "text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <ClipboardList className="size-5" />
          <span>Pedidos</span>
        </Link>

        <Link
          href="/taller"
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition ${
            pathname.startsWith("/taller") ? "text-amber-600 font-bold" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Flame className="size-5" />
          <span>Taller</span>
        </Link>

        <Link
          href="/clientes"
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition ${
            pathname.startsWith("/clientes") ? "text-zinc-900 dark:text-zinc-50 font-bold" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Users className="size-5" />
          <span>Clientes</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuMovilAbierto(true)}
          className="flex flex-col items-center gap-1 p-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-600"
        >
          <Menu className="size-5" />
          <span>Menú</span>
        </button>
      </nav>
    </div>
  );
}
