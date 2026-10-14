import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { generarCodigoBarrasSvg } from "@/lib/comanda/barcode";
import { generarQrSvg } from "@/lib/comanda/qr";
import { createClient } from "@/lib/supabase/server";
import { ComandaVista } from "./comanda-vista";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Ruta dedicada para la comanda imprimible del pedido (RF-03, D-4 / T-011).
 * Accesible tanto por recepción como por personal de taller.
 */
export default async function ComandaPage({ params }: Props) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Consultar cabecera, cliente, renglones, pagos y tasa del pedido
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      total_usd,
      notas,
      creado_en,
      clientes (
        nombre,
        telefono
      ),
      pedido_items (
        id,
        descripcion,
        dimensiones,
        acabados,
        cantidad,
        precio_usd,
        servicios (
          nombre
        )
      ),
      pagos (
        monto,
        moneda,
        referencia
      ),
      tasas_cambio (
        valor_bs_por_usd
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !pedido) {
    notFound();
  }

  const clienteData = Array.isArray(pedido.clientes)
    ? pedido.clientes[0]
    : pedido.clientes;

  const tasaObj = pedido.tasas_cambio as {
    valor_bs_por_usd?: number | string;
  } | null;
  const tasaBs = Number(tasaObj?.valor_bs_por_usd) || 40.0;

  const items = Array.isArray(pedido.pedido_items)
    ? pedido.pedido_items.map((it) => {
        const servData = Array.isArray(it.servicios)
          ? it.servicios[0]
          : it.servicios;
        return {
          id: it.id,
          servicio_nombre: servData?.nombre ?? "Servicio",
          descripcion: it.descripcion,
          dimensiones: it.dimensiones,
          acabados: it.acabados,
          cantidad: Number(it.cantidad) || 1,
          precio_usd: Number(it.precio_usd) || 0,
        };
      })
    : [];

  const pagos = Array.isArray(pedido.pagos)
    ? pedido.pagos.map((p) => ({
        monto: Number(p.monto) || 0,
        moneda: p.moneda,
        referencia: p.referencia,
      }))
    : [];

  // Generar marcado vectorial para escáneres y lectores
  const barcodeSvg = generarCodigoBarrasSvg(`ORD-${pedido.numero_orden}`);
  const qrSvg = generarQrSvg(
    `https://apsys.local/pedidos/${pedido.id}`,
    { tamaño: 120 },
  );

  return (
    <ComandaVista
      pedido={{
        id: pedido.id,
        numero_orden: pedido.numero_orden,
        estado: pedido.estado,
        total_usd: Number(pedido.total_usd) || 0,
        creado_en: pedido.creado_en,
        notas: pedido.notas,
        cliente: clienteData
          ? {
              nombre: clienteData.nombre,
              telefono: clienteData.telefono,
            }
          : null,
        items,
        pagos,
        tasa_bs: tasaBs,
      }}
      barcodeSvg={barcodeSvg}
      qrSvg={qrSvg}
    />
  );
}
