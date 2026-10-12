import {
  ArrowRight,
  Banknote,
  Bell,
  BookOpen,
  ClipboardList,
  Flame,
  MessageSquare,
  Package,
  Plus,
  Printer,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";

export const instant = false;

/**
 * Centro de Mando Operativo y Panel de Inicio de APSys (Rediseño UX/UI).
 */
export default async function Home() {
  await connection();
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const rol: string = perfil?.rol ?? "operativo";
  const esGerencial = rol === "gerencial";

  // Consultar métricas operativas en vivo
  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select("id, estado, anulado")
    .eq("anulado", false);

  const listaPedidos = pedidosRaw ?? [];
  const conteoPorImprimir = listaPedidos.filter((p) => p.estado === "registrado").length;
  const conteoEnImpresion = listaPedidos.filter((p) => p.estado === "imprimiendo").length;
  const conteoListos = listaPedidos.filter((p) => p.estado === "listo").length;
  const totalActivos = listaPedidos.filter((p) => p.estado !== "entregado").length;

  const fechaFormateada = new Date().toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AuthenticatedShell>
      <div className="space-y-8">
        {/* =========================================================================
            1. BANNER DE BIENVENIDA Y ACCIONES RÁPIDAS
            ========================================================================= */}
        <section
          aria-label="Bienvenida"
          className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Sparkles className="size-3.5 text-amber-500" />
                <span className="capitalize" suppressHydrationWarning>
                  {fechaFormateada}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                ¡Hola de nuevo!
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
                Panel central de operaciones del taller de gráfica. Gestiona órdenes de
                trabajo, flujo de producción táctil y cobranzas multimoneda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/pedidos/nuevo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Plus className="size-4" />
                Nueva Orden de Trabajo
              </Link>

              <Link
                href="/taller"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <Flame className="size-4 text-amber-600 dark:text-amber-400" />
                Tablero de Taller
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. KPIS EN VIVO DE PRODUCCIÓN (TALLER)
            ========================================================================= */}
        <section aria-label="Métricas del taller" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Estado de Producción en Vivo
            </h2>
            <Link
              href="/taller"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <span>Ver tablero kanban</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Activos en taller */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Activas en Taller</span>
                <Package className="size-4" />
              </div>
              <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">
                {totalActivos}
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Trabajos en curso
              </span>
            </div>

            {/* Por imprimir */}
            <Link
              href="/taller"
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="text-xs font-medium">Por Imprimir</span>
                <ClipboardList className="size-4 text-blue-500" />
              </div>
              <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                {conteoPorImprimir}
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                En cola de inicio
              </span>
            </Link>

            {/* En máquina */}
            <Link
              href="/taller"
              className="group rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-sm transition hover:bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
            >
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                <span className="text-xs font-medium">En Impresión</span>
                <Printer className="size-4 text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-black text-amber-950 dark:text-amber-100">
                {conteoEnImpresion}
              </p>
              <span className="mt-1 block text-[11px] text-amber-700/80 dark:text-amber-400/70">
                En máquina / acabados
              </span>
            </Link>

            {/* Listos para entrega */}
            <Link
              href="/taller"
              className="group rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-sm transition hover:bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
            >
              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                <span className="text-xs font-medium">Listos para Retiro</span>
                <Flame className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-950 dark:text-emerald-100">
                {conteoListos}
              </p>
              <span className="mt-1 block text-[11px] text-emerald-700/80 dark:text-emerald-400/70">
                Aviso WhatsApp disponible
              </span>
            </Link>
          </div>
        </section>

        {/* =========================================================================
            3. MÓDULOS DE OPERACIONES Y GESTIÓN EN GRID COHERENTE
            ========================================================================= */}
        <section aria-label="Módulos del sistema" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Tarjeta: Gestión de Órdenes */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <ClipboardList className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Gestión de Pedidos
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Búsqueda rápida por número de orden, lector de escáner USB, comandas técnicas y cobranza de saldos.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/pedidos"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Ver Pedidos
                </Link>
                <Link
                  href="/pedidos/nuevo"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  + Nuevo
                </Link>
              </div>
            </div>

            {/* Tarjeta: Taller Kanban */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <Flame className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Tablero de Taller Táctil
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tablero visual para producción en 4 columnas. Avance de estados con un solo toque y disparador de avisos WhatsApp.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/taller"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-amber-600 text-xs font-semibold text-white transition hover:bg-amber-500 shadow-sm"
                >
                  Abrir Tablero de Taller
                </Link>
              </div>
            </div>

            {/* Tarjeta: Directorio de Clientes */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Users className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Clientes & Recurrencia
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Historial de compras acumuladas, perfil de recurrencia, números de teléfono para WhatsApp y cuentas vinculadas.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/clientes"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Directorio
                </Link>
                <Link
                  href="/clientes/nuevo"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  + Agregar
                </Link>
              </div>
            </div>

            {/* Tarjeta: Catálogo de Servicios */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                  <Tag className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Catálogo de Servicios
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Administración de servicios de impresión (viniles, pendones, gigantografías, talonarios) y acabados del taller.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/servicios"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Gestionar Catálogo
                </Link>
              </div>
            </div>

            {/* Tarjeta: Recordatorios */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Bell className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Recordatorios de Retiro
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Seguimiento de pedidos listos que superan las 48 a 72 horas sin retirar para despejar espacio en almacén.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/recordatorios"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Revisar Alertas (48–72h)
                </Link>
              </div>
            </div>

            {/* Tarjeta: Plantillas WhatsApp */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                  <MessageSquare className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Plantillas de WhatsApp
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Personalización de mensajes con etiquetas dinámicas para avisos de trabajo listo y recordatorios de saldo.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/plantillas"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Editar Mensajes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. SECCIÓN GERENCIAL Y FINANCIERA (exclusiva para rol gerencial)
            ========================================================================= */}
        {esGerencial && (
          <section aria-label="Módulos gerenciales" className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Administración y Finanzas
                </h2>
                <p className="text-xs text-zinc-500">
                  Métricas consolidadas, gestión de cobranza y configuración de tasas.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Acceso Gerencial
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard"
                className="group flex flex-col justify-between rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-zinc-900 dark:hover:border-emerald-800"
              >
                <div>
                  <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700">
                    Dashboard de Ingresos
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Consolidado multimoneda USD/Bs y reportes exportables.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Abrir</span>
                  <ArrowRight className="size-3" />
                </span>
              </Link>

              <Link
                href="/cuentas-por-cobrar"
                className="group flex flex-col justify-between rounded-2xl border border-rose-200 bg-white p-5 shadow-sm transition hover:border-rose-400 hover:bg-rose-50/20 dark:border-rose-900/60 dark:bg-zinc-900 dark:hover:border-rose-800"
              >
                <div>
                  <Wallet className="size-5 text-rose-600 dark:text-rose-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-700">
                    Cuentas por Cobrar
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Saldos pendientes en 4 tramos de antigüedad y avisos formales.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  <span>Revisar saldos</span>
                  <ArrowRight className="size-3" />
                </span>
              </Link>

              <Link
                href="/dashboard/rotacion"
                className="group flex flex-col justify-between rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50/20 dark:border-indigo-900/60 dark:bg-zinc-900 dark:hover:border-indigo-800"
              >
                <div>
                  <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-700">
                    Rotación por Servicio
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Demanda de catálogo, facturación por ítem y servicios sin rotación.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <span>Ver rotación</span>
                  <ArrowRight className="size-3" />
                </span>
              </Link>

              <Link
                href="/tasas"
                className="group flex flex-col justify-between rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/20 dark:border-emerald-900/60 dark:bg-zinc-900 dark:hover:border-emerald-800"
              >
                <div>
                  <Banknote className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700">
                    Tasa de Cambio
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Actualización de tasa referencial con histórico inmutable.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Actualizar</span>
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* =========================================================================
            5. PIE DE PÁGINA: GUÍA RÁPIDA DE USO
            ========================================================================= */}
        <footer className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Guía Rápida de Uso del Sistema
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Instrucciones paso a paso para Mostrador, Operario de Taller y Gerencia.
                </p>
              </div>
            </div>

            <Link
              href="/ayuda"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Consultar Guía
            </Link>
          </div>
        </footer>
      </div>
    </AuthenticatedShell>
  );
}
