import { redirect } from "next/navigation";
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
  const { data: pedidosRaw } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      creado_en,
      listo_en,
      entregado_en,
      anulado,
      cliente_id,
      clientes (
        nombre,
        telefono
      ),
      pedido_items (
        id,
        cantidad,
        ancho,
        alto,
        acabados,
        notas,
        servicios (
          nombre,
          unidad_medida
        )
      )
    `,
    )
    .eq("anulado", false)
    .order("creado_en", { ascending: true });

  const pedidosIniciales: PedidoTaller[] = (pedidosRaw ?? []).map((p) => {
    const rawItems = (p.pedido_items as unknown as Array<{
      id: string;
      cantidad: number;
      ancho: number | null;
      alto: number | null;
      acabados: string | null;
      notas: string | null;
      servicios: { nombre: string; unidad_medida: string } | null;
    }>) ?? [];

    const clienteObj = Array.isArray(p.clientes)
      ? p.clientes[0]
      : (p.clientes as unknown as { nombre: string; telefono: string | null } | null);

    return {
      id: p.id,
      numero_orden: p.numero_orden,
      estado: p.estado as EstadoPedido,
      creado_en: p.creado_en,
      listo_en: p.listo_en,
      entregado_en: p.entregado_en,
      anulado: p.anulado,
      clientes: clienteObj,
      items: rawItems,
    };
  });

  return (
    <main className="min-h-dvh bg-zinc-100 p-3 sm:p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl">
        <TallerTablero
          pedidosIniciales={pedidosIniciales}
          rolUsuario={rolUsuario}
        />
      </div>
    </main>
  );
}
