import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { type EstadoPedido } from "@/lib/pedidos/estados";
import { createClient } from "@/lib/supabase/server";
import { PedidoTaller, TallerTablero } from "./taller-tablero";

export const instant = false;

/**
 * Vista de taller optimizada para tablet y móvil (RF-07 / T-014).
 * Permite cambiar el estado de las órdenes en <= 2 toques (1 toque directo para avanzar).
 */
export default async function TallerPage() {
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

  // Traer pedidos activos de taller (no anulados)
  const { data: pedidosRaw, error: errPedidos } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      total_usd,
      creado_en,
      listo_en,
      entregado_en,
      anulado,
      cliente_id,
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
      ),
      pedido_items (
        id,
        cantidad,
        descripcion,
        dimensiones,
        acabados,
        servicios (
          nombre
        )
      )
    `,
    )
    .eq("anulado", false)
    .order("creado_en", { ascending: true });

  if (errPedidos) {
    console.error("[taller] Error al consultar pedidos:", errPedidos);
  }

  const pedidosIniciales: PedidoTaller[] = (pedidosRaw ?? []).map((p) => {
    const rawItems = (p.pedido_items as unknown as Array<{
      id: string;
      cantidad: number;
      descripcion: string | null;
      dimensiones: string | null;
      acabados: string | null;
      servicios: { nombre: string } | null;
    }>) ?? [];

    const clienteObj = Array.isArray(p.clientes)
      ? p.clientes[0]
      : (p.clientes as unknown as { nombre: string; telefono: string | null } | null);

    const tasaObj = p.tasas_cambio as { valor_bs_por_usd?: number | string } | null;
    const tasaValor = Number(tasaObj?.valor_bs_por_usd) || 40.0;
    const listaPagos = (p.pagos as unknown as Array<{ monto: number | string; moneda: string }>) ?? [];

    const totalPagadoUsd = listaPagos.reduce((acc, pago) => {
      const monto = Number(pago.monto) || 0;
      if (pago.moneda === "USD") return acc + monto;
      return acc + monto / tasaValor;
    }, 0);

    const totalUsd = Number(p.total_usd) || 0;
    const saldoUsd = Math.max(0, Math.round((totalUsd - totalPagadoUsd) * 100) / 100);

    return {
      id: p.id,
      numero_orden: p.numero_orden,
      estado: p.estado as EstadoPedido,
      creado_en: p.creado_en,
      listo_en: p.listo_en,
      entregado_en: p.entregado_en,
      anulado: p.anulado,
      total_usd: totalUsd,
      saldo_usd: saldoUsd,
      tasa_bs: tasaValor,
      clientes: clienteObj,
      items: rawItems,
    };
  });

  return (
    <AuthenticatedShell>
      <TallerTablero
        pedidosIniciales={pedidosIniciales}
        rolUsuario={rolUsuario}
      />
    </AuthenticatedShell>
  );
}
