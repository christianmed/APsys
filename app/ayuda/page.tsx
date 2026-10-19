import {
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";

export const instant = false;

/**
 * Vista de Guía Rápida y Manual Operativo por Perfil (T-028).
 */
export default async function AyudaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const rol = perfil?.rol ?? "operativo";

  return (
    <AuthenticatedShell>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <PageHeader
          title="Guía Rápida de Uso"
          description="Manual operativo por perfil para el personal del taller de imprenta (v0.9.1)."
          badge={
            <span className="flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400">
              <HelpCircle className="size-3.5" />
              <span>Soporte & Manual</span>
            </span>
          }
        />

        {/* Banner de perfil actual */}
        <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-[#7aa2f7]/30 dark:bg-[#7aa2f7]/10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 text-indigo-700 dark:text-[#7aa2f7]" />
            <span className="text-sm text-indigo-950 dark:text-zinc-200">
              Tu rol actual es: <strong className="capitalize">{rol}</strong>
            </span>
          </div>
          <Link
            href="/taller"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 dark:bg-[#7aa2f7] dark:text-[#16161e] dark:hover:bg-[#7aa2f7]/90"
          >
            Ir al Taller
          </Link>
        </div>

        {/* Sección 1: Perfil Mostrador y Recepción */}
        <section
          aria-labelledby="perfil-mostrador"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-[#24283b]">
            <Clock className="size-5 text-blue-600 dark:text-[#7aa2f7]" />
            <h2 id="perfil-mostrador" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              1. Mostrador y Recepción (Registro &lt; 2 minutos)
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:border dark:border-[#24283b] dark:bg-[#1f202c]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Paso A: Registrar la orden
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Ingresa a <strong>Pedidos → Nuevo</strong>. Selecciona o crea el cliente ingresando su WhatsApp. Agrega el servicio, dimensiones y acabados.
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:border dark:border-[#24283b] dark:bg-[#1f202c]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Paso B: Cobranza y Comanda
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Registra abonos en USD efectivo o Pago Móvil (Bs). La tasa oficial se aplica al centavo. Guarda e imprime la <strong>Comanda Técnica</strong> con código de barras.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 2: Perfil Taller y Operarios */}
        <section
          aria-labelledby="perfil-taller"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-[#24283b]">
            <Flame className="size-5 text-amber-600 dark:text-[#e0af68]" />
            <h2 id="perfil-taller" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              2. Taller y Producción (Tablero Táctil)
            </h2>
          </div>

          <ul className="mt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Por Imprimir:</strong> Lee el código de barras o pulsa &quot;Comenzar Impresión&quot; al cargar el rollo o material en máquina.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>En Impresión:</strong> Al terminar corte, laminado y empaque, pulsa &quot;Marcar Listo&quot;.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MessageCircle className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Aviso WhatsApp:</strong> Al pasar a &quot;Listo&quot;, pulsa el botón verde de WhatsApp para enviar el mensaje automático de retiro y saldo pendiente.
              </span>
            </li>
          </ul>
        </section>

        {/* Sección 3: Perfil Gerencial */}
        <section
          aria-labelledby="perfil-gerencial"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-[#24283b]">
            <TrendingUp className="size-5 text-emerald-600 dark:text-[#9ece6a]" />
            <h2 id="perfil-gerencial" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              3. Gerencia y Finanzas
            </h2>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-zinc-600 sm:grid-cols-3 dark:text-zinc-300">
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-[#24283b] dark:bg-[#1f202c]">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Tasas BCV y Sidebar</h4>
              <p className="mt-1">
                Visualiza en la barra lateral las tasas oficiales de <strong>Hoy</strong> y <strong>Mañana</strong> (USD y EUR). Los acordeones memorizan su estado abierto/cerrado al navegar. La gerencia puede sincronizar o ajustar vigencias en <strong>/tasas</strong>.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-[#24283b] dark:bg-[#1f202c]">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Cobranzas</h4>
              <p className="mt-1">
                Revisa la cartera morosa en <strong>/cuentas-por-cobrar</strong> clasificada en 4 tramos de antigüedad con cobro WhatsApp a 1 toque.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-[#24283b] dark:bg-[#1f202c]">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Exportación</h4>
              <p className="mt-1">
                En el <strong>Dashboard</strong>, descarga en CSV para Excel o genera reportes ejecutivos listos para imprimir en PDF.
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 dark:border-[#24283b] dark:bg-[#1a1b26]">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <HelpCircle className="size-5 text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-sm font-bold">¿Tienes dudas o necesitas asistencia?</h3>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            El sistema incluye auditoría inmutable de todas las anulaciones y modificaciones de pedidos. Para reportes de incidencias o soporte técnico presencial, comunícate con la administración del taller.
          </p>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
