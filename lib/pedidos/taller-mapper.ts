import type { EstadoPedido } from "@/lib/pedidos/estados";

export type PedidoTallerItem = {
  id: string;
  cantidad: number;
  descripcion?: string | null;
  dimensiones?: string | null;
  acabados?: string | null;
  ancho?: number | null;
  alto?: number | null;
  notas?: string | null;
  servicios?: {
    nombre: string;
    unidad_medida?: string;
  } | null;
};

export type PedidoTaller = {
  id: string;
  numero_orden: number;
  estado: EstadoPedido;
  creado_en: string;
  listo_en: string | null;
  entregado_en: string | null;
  anulado: boolean;
  total_usd?: number;
  saldo_usd?: number;
  tasa_bs?: number;
  clientes?: {
    nombre: string;
    telefono: string | null;
  } | null;
  items: PedidoTallerItem[];
};

/**
 * Función pura de mapeo para pedidos de taller.
 * Puede ser invocada de forma segura tanto desde Server Components como desde Client Components.
 */
export function mapearPedidosTaller(pedidosRaw: unknown[]): PedidoTaller[] {
  return (pedidosRaw ?? []).map((pItemRaw: unknown) => {
    const pItem = pItemRaw as Record<string, unknown>;
    const rawItems =
      (pItem.pedido_items as unknown as Array<{
        id: string;
        cantidad: number;
        descripcion: string | null;
        dimensiones: string | null;
        acabados: string | null;
        servicios: { nombre: string } | null;
      }>) ?? [];

    const clienteObj = Array.isArray(pItem.clientes)
      ? (pItem.clientes[0] as { nombre: string; telefono: string | null } | null)
      : (pItem.clientes as unknown as { nombre: string; telefono: string | null } | null);

    const tasaObj = pItem.tasas_cambio as {
      valor_bs_por_usd?: number | string;
    } | null;
    const tasaValor = Number(tasaObj?.valor_bs_por_usd) || 40.0;
    const listaPagos =
      (pItem.pagos as unknown as Array<{
        monto: number | string;
        moneda: string;
      }>) ?? [];

    const totalPagadoUsd = listaPagos.reduce((acc, pago) => {
      const monto = Number(pago.monto) || 0;
      if (pago.moneda === "USD") return acc + monto;
      return acc + monto / tasaValor;
    }, 0);

    const totalUsd = Number(pItem.total_usd) || 0;
    const saldoUsd = Math.max(
      0,
      Math.round((totalUsd - totalPagadoUsd) * 100) / 100,
    );

    return {
      id: String(pItem.id),
      numero_orden: Number(pItem.numero_orden),
      estado: pItem.estado as EstadoPedido,
      creado_en: String(pItem.creado_en),
      listo_en: (pItem.listo_en as string | null) ?? null,
      entregado_en: (pItem.entregado_en as string | null) ?? null,
      anulado: Boolean(pItem.anulado),
      total_usd: totalUsd,
      saldo_usd: saldoUsd,
      tasa_bs: tasaValor,
      clientes: clienteObj,
      items: rawItems,
    };
  });
}
