import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { mapearPedidosTaller } from "@/lib/pedidos/taller-mapper";
import { TallerTablero } from "./taller-tablero";

export const instant = false;

/**
 * Vista de taller optimizada para tablet y móvil (RF-07 / T-014).
 * Permite cambiar el estado de las órdenes en <= 2 toques (1 toque directo para avanzar).
 */
export default async function TallerPage() {
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

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

  const pedidosIniciales = mapearPedidosTaller(pedidosRaw ?? []);

  return (
    <AuthenticatedShell>
      <TallerTablero
        pedidosIniciales={pedidosIniciales}
        rolUsuario={rolUsuario}
      />
    </AuthenticatedShell>
  );
}
