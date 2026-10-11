import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  obtenerRangoFechasPreset,
  type PagoMétrica,
  type PresetFecha,
} from "@/lib/dashboard/ingresos";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./dashboard-view";

export const instant = false;

type Props = {
  searchParams: Promise<{
    preset?: string;
    desde?: string;
    hasta?: string;
  }>;
};

/**
 * Dashboard gerencial: ingresos por moneda y fechas (RF-11 / T-019).
 * Restringido a usuarios con rol 'gerencial' (RF-18).
 */
export default async function DashboardPage({ searchParams }: Props) {
  const { preset: presetQuery, desde: desdeQuery, hasta: hastaQuery } =
    await searchParams;

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

  const rolUsuario = perfil?.rol ?? "operativo";

  // RESTRICCIÓN DE PRIVACIDAD: El perfil operativo no tiene acceso a cifras financieras globales
  if (rolUsuario !== "gerencial") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/40 dark:bg-zinc-900 text-center">
          <ShieldAlert className="mx-auto size-12 text-amber-500" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Acceso Reservado a Gerencia
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Las cifras consolidadas de facturación, ingresos por moneda y métricas globales
            del negocio son privadas y requieren perfil <strong>gerencial</strong> (RF-18).
          </p>
          <div className="pt-2">
            <Link
              href="/pedidos"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <ArrowLeft className="size-4" />
              Volver a Pedidos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Determinar rango de fechas
  const preset: PresetFecha =
    presetQuery === "hoy" ||
    presetQuery === "esta_semana" ||
    presetQuery === "este_mes" ||
    presetQuery === "todo"
      ? (presetQuery as PresetFecha)
      : "este_mes";

  let fechaDesde = desdeQuery;
  let fechaHasta = hastaQuery;

  if (presetQuery !== "personalizado" || !fechaDesde || !fechaHasta) {
    const rangoCalc = obtenerRangoFechasPreset(preset);
    fechaDesde = rangoCalc.desde;
    fechaHasta = rangoCalc.hasta;
  }

  // Consultar pagos dentro del rango
  let query = supabase
    .from("pagos")
    .select(
      `
      id,
      pedido_id,
      monto,
      moneda,
      referencia,
      creado_en,
      tasas_cambio (
        valor_bs_por_usd
      ),
      pedidos (
        numero_orden,
        clientes (
          nombre
        )
      )
    `,
    )
    .order("creado_en", { ascending: false });

  if (fechaDesde) {
    query = query.gte("creado_en", fechaDesde);
  }
  if (fechaHasta) {
    query = query.lte("creado_en", fechaHasta);
  }

  const { data: pagosRaw } = await query;

  const pagosMapeados: PagoMétrica[] = (pagosRaw ?? []).map((p) => {
    const tasaObj = p.tasas_cambio as { valor_bs_por_usd?: number | string } | null;
    const tasaValor = Number(tasaObj?.valor_bs_por_usd) || 40.0;

    const pedidoObj = p.pedidos as unknown as {
      numero_orden?: number;
      clientes?: { nombre?: string } | Array<{ nombre?: string }>;
    } | null;

    const clienteData = Array.isArray(pedidoObj?.clientes)
      ? pedidoObj?.clientes[0]
      : pedidoObj?.clientes;

    return {
      id: p.id,
      pedidoId: p.pedido_id,
      numeroOrden: pedidoObj?.numero_orden,
      monto: Number(p.monto) || 0,
      moneda: p.moneda as "USD" | "Bs",
      referencia: p.referencia,
      tasaValor,
      creadoEn: p.creado_en,
      clienteNombre: clienteData?.nombre ?? "Cliente",
    };
  });

  return (
    <main className="min-h-dvh bg-zinc-50 p-4 sm:p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <DashboardView
          pagos={pagosMapeados}
          presetInicial={preset}
          desdeInicial={desdeQuery?.slice(0, 10)}
          hastaInicial={hastaQuery?.slice(0, 10)}
        />
      </div>
    </main>
  );
}
