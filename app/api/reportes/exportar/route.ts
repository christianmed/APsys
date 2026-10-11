import { type NextRequest } from "next/server";
import { type PresetFecha } from "@/lib/dashboard/ingresos";
import {
  filtrarPedidosPorPeriodo,
  generarCsvReportePedidos,
  type PedidoReporte,
} from "@/lib/reportes/exportacion";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/reportes/exportar — Descarga de reporte contable en CSV (RF-17).
 * Restringido a perfil gerencial (RF-19).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "gerencial") {
    return new Response(
      JSON.stringify({
        error: "Acceso denegado: solo personal gerencial puede exportar reportes",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const periodoParam = searchParams.get("periodo") as PresetFecha | null;
  const desdeParam = searchParams.get("desde");
  const hastaParam = searchParams.get("hasta");

  const preset: PresetFecha =
    periodoParam === "hoy" ||
    periodoParam === "esta_semana" ||
    periodoParam === "este_mes" ||
    periodoParam === "todo"
      ? periodoParam
      : "este_mes";

  // Consultar pedidos con clientes, pagos y tasas de cambio
  const { data: pedidosRaw, error } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      creado_en,
      estado,
      anulado,
      total_usd,
      clientes (
        nombre,
        telefono
      ),
      pagos (
        monto,
        moneda
      ),
      tasas_cambio (
        valor_bs_por_usd
      )
    `,
    )
    .order("numero_orden", { ascending: false });

  if (error || !pedidosRaw) {
    return new Response(
      JSON.stringify({ error: "Error al consultar pedidos para exportación" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const pedidosMapeados: PedidoReporte[] = pedidosRaw.map((p) => {
    const clienteData = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes;
    const tasaObj = p.tasas_cambio as { valor_bs_por_usd?: number | string } | null;
    const tasaValor = Number(tasaObj?.valor_bs_por_usd) || 40.0;
    const listaPagos = Array.isArray(p.pagos) ? p.pagos : [];

    return {
      id: p.id,
      numeroOrden: p.numero_orden,
      creadoEn: p.creado_en,
      clienteNombre: clienteData?.nombre ?? "Cliente no registrado",
      clienteTelefono: clienteData?.telefono ?? null,
      estado: p.estado,
      anulado: Boolean(p.anulado),
      totalUsd: Number(p.total_usd) || 0,
      tasaBsPorUsd: tasaValor,
      pagos: listaPagos.map((pago) => ({
        monto: Number(pago.monto) || 0,
        moneda: (pago.moneda as "USD" | "Bs") ?? "USD",
      })),
    };
  });

  const pedidosFiltrados = filtrarPedidosPorPeriodo(pedidosMapeados, {
    preset: desdeParam || hastaParam ? undefined : preset,
    rango:
      desdeParam || hastaParam
        ? { desde: desdeParam ?? undefined, hasta: hastaParam ?? undefined }
        : undefined,
  });

  const csv = generarCsvReportePedidos(pedidosFiltrados);

  const fechaIso = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `reporte-apsys-${periodoParam ?? "periodo"}-${fechaIso}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
