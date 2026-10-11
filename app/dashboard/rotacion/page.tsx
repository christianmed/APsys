import { ArrowLeft, ShieldAlert } from "lucide-react";
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
      <main className="flex min-h-dvh items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-900/40 dark:bg-zinc-900">
          <ShieldAlert className="mx-auto size-12 text-amber-500" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Acceso Reservado a Gerencia
          </h1>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Las estadísticas de demanda, rotación de servicios y rentabilidad agregada
            requieren rol <strong>gerencial</strong> (RF-18 / RF-19).
          </p>
          <div className="pt-2">
            <Link
              href="/pedidos"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <ArrowLeft className="size-3.5" />
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

  const criterioOrden: CriterioOrdenRotacion =
    ordenQuery === "mayor_demanda" ||
    ordenQuery === "menor_demanda" ||
    ordenQuery === "menor_ingreso" ||
    ordenQuery === "nombre"
      ? ordenQuery
      : "mayor_ingreso";

  // 1. Consultar catálogo de servicios
  const { data: serviciosData } = await supabase
    .from("servicios")
    .select("id, nombre, activo, orden")
    .order("orden", { ascending: true });

  const catalogo: ServicioCatalogo[] = (serviciosData ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    activo: Boolean(s.activo),
    orden: Number(s.orden) || 0,
  }));

  // 2. Consultar pedidos con sus renglones de pedido_items
  let queryPedidos = supabase
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
    .eq("anulado", false);

  if (fechaDesde) {
    queryPedidos = queryPedidos.gte("creado_en", fechaDesde);
  }
  if (fechaHasta) {
    queryPedidos = queryPedidos.lte("creado_en", fechaHasta);
  }

  const { data: pedidosData, error } = await queryPedidos;

  if (error) {
    console.error("Error al consultar pedidos para rotación:", error);
  }

  const pedidosMapeados: PedidoRotacionInput[] = (
    (pedidosData ?? []) as unknown as PedidoRaw[]
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
    <main className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <RotacionServiciosView
        metricasIniciales={metricasPorServicio}
        resumenInicial={resumen}
        presetInicial={preset}
        criterioInicial={criterioOrden}
        desdeInicial={desdeQuery}
        hastaInicial={hastaQuery}
      />
    </main>
  );
}
