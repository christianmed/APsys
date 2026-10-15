import { NextResponse } from "next/server";
import { obtenerTasasBcvCompletas } from "@/lib/tasas/bcv-service";


/**
 * Endpoint de consulta rápida de tasas oficiales BCV (USD y EUR).
 * Consume el caché en memoria (15 min) para devolver los datos en <2ms.
 */
export async function GET() {
  try {
    const tasas = await obtenerTasasBcvCompletas();
    return NextResponse.json(
      {
        exito: true,
        tasas,
        hoy: tasas.hoy ?? {
          usd: tasas.usd?.valorBs ?? 0,
          eur: tasas.eur?.valorBs ?? 0,
          fecha: tasas.usd?.fechaActualizacion ?? "",
        },
        siguiente: tasas.siguiente ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[api/tasas/en-vivo] Error al consultar tasas:", error);
    return NextResponse.json(
      { exito: false, error: "No se pudieron obtener las tasas en vivo" },
      { status: 500 },
    );
  }
}
