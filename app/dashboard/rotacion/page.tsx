import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  obtenerRangoFechasPreset,
  type PresetFecha,
} from "@/lib/dashboard/ingresos";
import {
  calcularRotacionServicios,
  type CriterioOrdenRotacion,
  type PedidoRotacionInput,
  type ServicioCatalogo,
} from "@/lib/dashboard/rotacion-servicios";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { RotacionServiciosView } from "./rotacion-view";

export const instant = false;

type Props = {
  searchParams: Promise<{
    preset?: string;
    desde?: string;
    hasta?: string;
    orden?: string;
  }>;
};

type ItemRaw = {
  servicio_id: string;
  cantidad: number;
  precio_usd: number | string;
};

type PedidoRaw = {
  id: string;
  anulado: boolean | null;
  creado_en: string;
  pedido_items: ItemRaw[] | null;
};

/**
 * Métricas de rotación por servicio: mayor/menor demanda, período seleccionable (RF-13 / T-021).
 * Restringido a usuarios con rol 'gerencial' (RF-18 / RF-19).
 */
export default async function RotacionServiciosPage({ searchParams }: Props) {
  const {
    preset: presetQuery,
    desde: desdeQuery,
    hasta: hastaQuery,
    orden: ordenQuery,
  } = await searchParams;

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

  // RESTRICCIÓN DE PRIVACIDAD OPERATIVA
  if (rolUsuario !== "gerencial") {
    return (
      <AuthenticatedShell>
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-amber-900/40 dark:bg-zinc-900">
            <ShieldAlert className="mx-auto size-12 text-amber-500" />
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Acceso Reservado a Gerencia
            </h1>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Las estadísticas de demanda, rotación de servicios y rentabilidad agregada
              requieren rol <strong>gerencial</strong> (RF-18 / RF-19).
            </p>
            <div className="pt-2">
              <Link
                href="/pedidos"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                ← Volver a Pedidos
              </Link>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
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

  // Criterio de ordenación inicial
  const criterioOrden: CriterioOrdenRotacion =
    ordenQuery === "mayor_demanda" ||
    ordenQuery === "menor_demanda" ||
    ordenQuery === "mayor_ingreso" ||
    ordenQuery === "menor_ingreso"
      ? ordenQuery
      : "mayor_demanda";

  // Cargar catálogo de servicios completo
  const { data: serviciosRaw } = await supabase
    .from("servicios")
    .select("id, nombre, activo, orden")
    .order("nombre", { ascending: true });

  const catalogo: ServicioCatalogo[] = (serviciosRaw ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    activo: Boolean(s.activo),
    orden: Number(s.orden) || 0,
  }));

  // Consultar pedidos y sus ítems dentro del rango
  let query = supabase
    .from("pedidos")
    .select(
      `
      id,
      anulado,
      creado_en,
      pedido_items (
        servicio_id,
        cantidad,
        precio_usd
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

  const { data: pedidosRaw } = await query;

  const pedidosMapeados: PedidoRotacionInput[] = (
    (pedidosRaw as unknown as PedidoRaw[]) ?? []
  ).map((p) => ({
    id: p.id,
    anulado: Boolean(p.anulado),
    creado_en: p.creado_en,
    items: (p.pedido_items ?? []).map((it) => ({
      servicio_id: it.servicio_id,
      cantidad: Number(it.cantidad) || 0,
      precio_usd: Number(it.precio_usd) || 0,
    })),
  }));

  const { metricasPorServicio, resumen } = calcularRotacionServicios(
    catalogo,
    pedidosMapeados,
    criterioOrden,
  );

  return (
    <AuthenticatedShell>
      <RotacionServiciosView
        metricasIniciales={metricasPorServicio}
        resumenInicial={resumen}
        presetInicial={preset}
        criterioInicial={criterioOrden}
        desdeInicial={desdeQuery}
        hastaInicial={hastaQuery}
      />
    </AuthenticatedShell>
  );
}
