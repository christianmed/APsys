import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  calcularCuentasPorCobrar,
  type PedidoConDeudaInput,
} from "@/lib/cobranzas/cuentas-por-cobrar";
import { createClient } from "@/lib/supabase/server";
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

  // RESTRICCIÓN DE PRIVACIDAD: El perfil operativo no ve saldos globales ni cartera consolidada
  if (rolUsuario !== "gerencial") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm dark:border-amber-900/40 dark:bg-zinc-900">
          <ShieldAlert className="mx-auto size-12 text-amber-500" />
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Acceso Reservado a Gerencia
          </h1>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            La vista consolidada de cartera de cuentas por cobrar y análisis de antigüedad
            es confidencial y requiere perfil <strong>gerencial</strong> (RF-18 / RF-19).
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
    .eq("anulado", false)
    .order("numero_orden", { ascending: false });

  if (error) {
    console.error("Error al cargar pedidos para cuentas por cobrar:", error);
  }

  // Traer tasas congeladas para pagos si aplica
  const { data: tasasHistoricas } = await supabase
    .from("tasas_cambio")
    .select("id, valor_bs_por_usd");

  const mapaTasas = new Map<string, number>();
  if (tasasHistoricas) {
    for (const t of tasasHistoricas) {
      mapaTasas.set(t.id, Number(t.valor_bs_por_usd));
    }
  }

  const pedidosMapeados: PedidoConDeudaInput[] = ((pedidosData ?? []) as unknown as PedidoRaw[]).map(
    (p) => {
      const tasaPedido = p.tasas_cambio?.valor_bs_por_usd
        ? Number(p.tasas_cambio.valor_bs_por_usd)
        : 1;

      const pagosMapeados = (p.pagos ?? []).map((pago) => {
        let tasaPago = tasaPedido;
        if (pago.tasa_id && mapaTasas.has(pago.tasa_id)) {
          tasaPago = mapaTasas.get(pago.tasa_id)!;
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
    <main className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <CuentasCobrarView cuentasIniciales={cuentas} resumenInicial={resumen} />
    </main>
  );
}
