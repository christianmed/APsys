import {
  ArrowLeft,
  BookOpen,
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
    <main className="min-h-dvh bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Guía Rápida de Uso de APSys
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manual operativo por perfil para el personal del taller de gráfica.
            </p>
          </div>
        </div>

        {/* Banner de perfil actual */}
        <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 text-indigo-700 dark:text-indigo-400" />
            <span className="text-sm text-indigo-950 dark:text-indigo-200">
              Tu rol actual es: <strong className="capitalize">{rol}</strong>
            </span>
          </div>
          <Link
            href="/taller"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
          >
            Ir al Taller
          </Link>
        </div>

        {/* Sección 1: Perfil Mostrador y Recepción */}
        <section
          aria-labelledby="perfil-mostrador"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <Clock className="size-5 text-blue-600 dark:text-blue-400" />
            <h2 id="perfil-mostrador" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              1. Mostrador y Recepción (Registro &lt; 2 minutos)
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Paso A: Registrar la orden
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Ingresa a <strong>Pedidos → Nuevo</strong>. Selecciona o crea el cliente ingresando su WhatsApp. Agrega el servicio, dimensiones y acabados.
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
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
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <Flame className="size-5 text-amber-600 dark:text-amber-400" />
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
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 id="perfil-gerencial" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              3. Gerencia y Finanzas
            </h2>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-zinc-600 sm:grid-cols-3 dark:text-zinc-300">
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Tasa Diaria</h4>
              <p className="mt-1">
                Actualiza la tasa oficial en <strong>/tasas</strong> cada mañana. Los pedidos anteriores retienen su tasa inmutablemente.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Cobranzas</h4>
              <p className="mt-1">
                Revisa la cartera morosa en <strong>/cuentas-por-cobrar</strong> clasificada en 4 tramos de antigüedad con cobro WhatsApp a 1 toque.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Exportación</h4>
              <p className="mt-1">
                En el <strong>Dashboard</strong>, descarga en CSV para Excel o genera reportes ejecutivos listos para imprimir en PDF.
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <HelpCircle className="size-5 text-zinc-500" />
            <h3 className="text-sm font-bold">¿Tienes dudas o necesitas asistencia?</h3>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            El sistema incluye auditoría inmutable de todas las anulaciones y modificaciones de pedidos. Para reportes de incidencias o soporte técnico presencial, comunícate con la administración del taller.
          </p>
        </div>
      </div>
    </main>
  );
}
