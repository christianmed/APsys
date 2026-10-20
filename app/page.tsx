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
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { FechaEnVivoBadge } from "@/components/shell/fecha-en-vivo-badge";
import { calcularContadoresProduccion } from "@/lib/pedidos/estados";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { Card, KpiCard } from "@/components/ui/card";

export const instant = false;

/**
 * Centro de Mando Operativo y Panel de Inicio de APSys (Rediseño UX/UI).
 */
export default async function Home() {
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const rol: string = perfil?.rol ?? "operativo";
  const esGerencial = rol === "gerencial";

  // Consultar métricas operativas en vivo con estados canónicos de taller (Fase 32)
  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select("id, estado, anulado")
    .eq("anulado", false);

  const { porIniciar, enProduccion, listos, totalActivos } =
    calcularContadoresProduccion(pedidosRaw ?? []);

  return (
    <AuthenticatedShell>
      <div className="space-y-8">
        {/* =========================================================================
            1. BANNER DE BIENVENIDA Y ACCIONES RÁPIDAS
            ========================================================================= */}
        <Card
          className="relative overflow-hidden p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <FechaEnVivoBadge />
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 active:scale-98 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <Plus className="size-4" />
                Nueva Orden de Trabajo
              </Link>

              <Link
                href="/taller"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-100 active:scale-98 dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42]"
              >
                <Flame className="size-4 text-amber-500" />
                Tablero de Taller
              </Link>
            </div>
          </div>
        </Card>

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
            <KpiCard
              title="Activas en Taller"
              value={totalActivos}
              subtitle="Trabajos en curso"
              icon={Package}
              href="/taller?tab=activos"
            />

            {/* Recibido */}
            <KpiCard
              title="Recibido"
              value={porIniciar}
              subtitle="En cola de inicio"
              icon={ClipboardList}
              variant="info"
              href="/taller?tab=recibido"
            />

            {/* En producción */}
            <KpiCard
              title="En Producción"
              value={enProduccion}
              subtitle="En máquina / acabados"
              icon={Printer}
              variant="warning"
              href="/taller?tab=en_produccion"
            />

            {/* Listos para entrega */}
            <KpiCard
              title="Listos para Retiro"
              value={listos}
              subtitle="Aviso WhatsApp disponible"
              icon={Flame}
              variant="success"
              href="/taller?tab=listo"
            />
          </div>
        </section>

        {/* =========================================================================
            3. MÓDULOS DE OPERACIONES Y GESTIÓN EN GRID COHERENTE
            ========================================================================= */}
        <section aria-label="Módulos del sistema" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Tarjeta: Gestión de Órdenes */}
            <Card className="flex flex-col justify-between p-6">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                  <ClipboardList className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Gestión de Pedidos
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Búsqueda rápida por número de orden, lector de escáner USB, comandas técnicas y cobranza de saldos.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-[#24283b]">
                <Link
                  href="/pedidos"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42] dark:hover:text-white"
                >
                  Ver Pedidos
                </Link>
                <Link
                  href="/pedidos/nuevo"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:text-zinc-300 dark:hover:bg-[#1f202c] dark:hover:text-white"
                >
                  + Nuevo
                </Link>
              </div>
            </Card>

            {/* Tarjeta: Taller Kanban */}
            <Card className="flex flex-col justify-between p-6">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                  <Flame className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Tablero de Taller Táctil
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tablero visual para producción en 4 columnas. Avance de estados con un solo toque y disparador de avisos WhatsApp.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-[#24283b]">
                <Link
                  href="/taller"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42] dark:hover:text-white shadow-xs"
                >
                  Abrir Tablero de Taller
                </Link>
              </div>
            </Card>

            {/* Tarjeta: Directorio de Clientes */}
            <Card className="flex flex-col justify-between p-6">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                  <Users className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Clientes & Recurrencia
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Historial de compras acumuladas, perfil de recurrencia, números de teléfono para WhatsApp y cuentas vinculadas.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-[#24283b]">
                <Link
                  href="/clientes"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white transition hover:bg-zinc-800 touch-manipulation active:scale-[0.97] dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-zinc-100 dark:hover:bg-[#252b42] dark:hover:text-white"
                >
                  Directorio
                </Link>
                <Link
                  href="/clientes/nuevo"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:text-zinc-300 dark:hover:bg-[#1f202c] dark:hover:text-white"
                >
                  + Agregar
                </Link>
              </div>
            </Card>

            {/* Tarjeta: Catálogo de Servicios */}
            <Card className="flex flex-col justify-between p-6">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                  <Tag className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Catálogo de Servicios
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Administración de servicios de impresión (viniles, pendones, gigantografías, talonarios) y acabados del taller.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-[#24283b]">
                <Link
                  href="/servicios"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-white"
                >
                  Gestionar Catálogo
                </Link>
              </div>
            </Card>

            {/* Tarjeta: Recordatorios */}
            <Card className="flex flex-col justify-between p-6">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                  <Bell className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Recordatorios de Retiro
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Seguimiento de pedidos listos que superan las 48 a 72 horas sin retirar para despejar espacio en almacén.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-[#24283b]">
                <Link
                  href="/recordatorios"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-white"
                >
                  Revisar Alertas (48–72h)
                </Link>
              </div>
            </Card>

            {/* Tarjeta: Plantillas WhatsApp */}
            <Card className="flex flex-col justify-between p-6">
              <div className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-zinc-300">
                  <MessageSquare className="size-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Plantillas de WhatsApp
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Personalización de mensajes con etiquetas dinámicas para avisos de trabajo listo y recordatorios de saldo.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-[#24283b]">
                <Link
                  href="/plantillas"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-white"
                >
                  Editar Mensajes
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* =========================================================================
            4. SECCIÓN GERENCIAL Y FINANCIERA (exclusiva para rol gerencial)
            ========================================================================= */}
        {esGerencial && (
          <section aria-label="Módulos gerenciales" className="space-y-4 pt-4 border-t border-zinc-200 dark:border-[#24283b]">
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
              <Card
                href="/dashboard"
                className="group flex flex-col justify-between p-5"
              >
                <div>
                  <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Dashboard de Ingresos
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Consolidado multimoneda USD/Bs y reportes exportables.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Abrir</span>
                  <ArrowRight className="size-3" />
                </span>
              </Card>

              <Card
                href="/cuentas-por-cobrar"
                className="group flex flex-col justify-between p-5"
              >
                <div>
                  <Wallet className="size-5 text-rose-600 dark:text-rose-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Cuentas por Cobrar
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Saldos pendientes en 4 tramos de antigüedad y avisos formales.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                  <span>Revisar saldos</span>
                  <ArrowRight className="size-3" />
                </span>
              </Card>

              <Card
                href="/dashboard/rotacion"
                className="group flex flex-col justify-between p-5"
              >
                <div>
                  <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Rotación por Servicio
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Demanda de catálogo, facturación por ítem y servicios sin rotación.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <span>Ver rotación</span>
                  <ArrowRight className="size-3" />
                </span>
              </Card>

              <Card
                href="/tasas"
                className="group flex flex-col justify-between p-5"
              >
                <div>
                  <Banknote className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Tasa de Cambio
                  </h4>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Actualización de tasa referencial con histórico inmutable.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Actualizar</span>
                  <ArrowRight className="size-3" />
                </span>
              </Card>
            </div>
          </section>
        )}

        {/* =========================================================================
            5. PIE DE PÁGINA: GUÍA RÁPIDA DE USO
            ========================================================================= */}
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:border dark:border-[#24283b] dark:bg-[#1f202c] dark:text-[#7aa2f7]">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Guía Rápida de Uso del Sistema
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Instrucciones paso a paso para Mostrador, Operario de Taller y Gerencia.
                </p>
              </div>
            </div>

            <Link
              href="/ayuda"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-transparent bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-200 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:text-[#f8fafc]"
            >
              Consultar Guía
            </Link>
          </div>
        </Card>
      </div>
    </AuthenticatedShell>
  );
}
