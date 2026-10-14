import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  calcularCuentasPorCobrar,
  type PedidoConDeudaInput,
} from "@/lib/cobranzas/cuentas-por-cobrar";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { CuentasCobrarView } from "./cuentas-view";

export const instant = false;

type PedidoRaw = {
  id: string;
  numero_orden: number;
  estado: string;
  total_usd: number | string;
  creado_en: string;
  anulado: boolean | null;
  cliente_id: string;
  clientes: {
    nombre: string;
    telefono: string | null;
  } | null;
  pagos: Array<{
    monto: number | string;
    moneda: "USD" | "VES";
    tasa_id?: string | null;
  }> | null;
  tasas_cambio: {
    valor_bs_por_usd: number | string;
  } | null;
};

/**
 * Cuentas por cobrar: vista consolidada de saldos pendientes y antigüedad (RF-12 / T-020).
 * Protegido por RLS y perfil: Solo usuarios gerenciales tienen acceso a la cartera consolidada (RF-18 / RF-19).
 */
export default async function CuentasPorCobrarPage() {
  await connection();
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const rolUsuario = perfil?.rol ?? "operativo";

  // RESTRICCIÓN DE PRIVACIDAD: El perfil operativo no ve saldos globales ni cartera consolidada
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
              La vista consolidada de cartera de cuentas por cobrar y análisis de antigüedad
              es confidencial y requiere perfil <strong>gerencial</strong> (RF-18 / RF-19).
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

  // Consultar pedidos activos para procesar cartera
  const { data: pedidosData, error } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      numero_orden,
      estado,
      total_usd,
      creado_en,
      anulado,
      cliente_id,
      clientes (
        nombre,
        telefono
      ),
      pagos (
        monto,
        moneda,
        tasa_id
      ),
      tasas_cambio (
        valor_bs_por_usd
      )
    `,
    )
    .order("numero_orden", { ascending: false });

  if (error) {
    console.error("Error al obtener pedidos para cuentas por cobrar:", error);
  }

  const pedidos = (pedidosData as unknown as PedidoRaw[]) ?? [];

  // Mapear al contrato que espera la lógica de negocio pura
  const pedidosMapeados: PedidoConDeudaInput[] = pedidos.map(
    (p): PedidoConDeudaInput => {
      const tasaPedido = Number(p.tasas_cambio?.valor_bs_por_usd) || 40.0;

      const pagosMapeados = (p.pagos ?? []).map((pago) => {
        let tasaPago = tasaPedido;
        if (pago.tasa_id && pago.tasa_id !== "") {
          tasaPago = tasaPedido;
        }
        return {
          monto: Number(pago.monto),
          moneda: pago.moneda,
          tasa_valor: tasaPago,
        };
      });

      return {
        id: p.id,
        numero_orden: p.numero_orden,
        cliente_id: p.cliente_id,
        cliente_nombre: p.clientes?.nombre ?? "Cliente no registrado",
        cliente_telefono: p.clientes?.telefono ?? null,
        estado: p.estado,
        anulado: Boolean(p.anulado),
        total_usd: Number(p.total_usd),
        tasa_valor: tasaPedido,
        creado_en: p.creado_en,
        pagos: pagosMapeados,
      };
    },
  );

  const { cuentas, resumen } = calcularCuentasPorCobrar(pedidosMapeados);

  return (
    <AuthenticatedShell>
      <CuentasCobrarView cuentasIniciales={cuentas} resumenInicial={resumen} />
    </AuthenticatedShell>
  );
}
