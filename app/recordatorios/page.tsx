import { redirect } from "next/navigation";
import {
  calcularAntiguedadHoras,
  type PedidoListoRecordatorio,
} from "@/lib/notificaciones/recordatorios";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { RecordatoriosPanel } from "./recordatorios-panel";

export const instant = false;

/**
 * Panel de recordatorios para pedidos listos sin retirar (RF-09 / T-016).
 * Alertas automáticas para órdenes con 48 h (atención) o 72 h (urgente) en espera.
 */
export default async function RecordatoriosPage() {
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const rolUsuario = perfil?.rol ?? "operativo";

  // Consultar pedidos listos sin retirar
  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      total_usd,
      creado_en,
      listo_en,
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
      )
    `,
    )
    .eq("estado", "listo")
    .eq("anulado", false)
    .order("listo_en", { ascending: true });

  const ahora = new Date();

  const pedidosListos: PedidoListoRecordatorio[] = (pedidosRaw ?? []).map((p) => {
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

    const fechaReferencia = p.listo_en ?? p.creado_en;
    const horas = calcularAntiguedadHoras(fechaReferencia, ahora);

    return {
      id: p.id,
      numeroOrden: p.numero_orden,
      nombreCliente: clienteObj?.nombre ?? "Cliente",
      telefono: clienteObj?.telefono,
      horasTranscurridas: horas,
      totalUsd,
      saldoUsd,
      tasaBsPorUsd: tasaValor,
      listoEn: p.listo_en,
    };
  });

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <RecordatoriosPanel
          pedidosIniciales={pedidosListos}
          rolUsuario={rolUsuario}
        />
      </div>
    </AuthenticatedShell>
  );
}
