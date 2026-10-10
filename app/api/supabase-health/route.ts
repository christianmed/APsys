import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/supabase-health — chequeo de humo de Supabase (T-002).
 *
 * Consulta el conteo de `clientes` con la clave anon (sujeta a RLS) y resume:
 *   { reachable: true,  schemaReady: true,  count }  → esquema y RLS aplicados
 *   { reachable: true,  schemaReady: false }         → PostgREST responde, la tabla no existe (PGRST205)
 *   { reachable: false, schemaReady: false, error }  → no se pudo consultar (red/configuración/permisos)
 *
 * Nunca expone claves ni filas de clientes: solo el conteo y un código.
 *
 * Nota: con `head: true` esta versión de postgrest-js no propaga el error de
 * tabla ausente (verificado con un sondeo local); con GET + limit(1) el error
 * PGRST205 llega completo. Por eso se consulta así.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("clientes")
      .select("id", { count: "exact" })
      .limit(1);

    if (error) {
      if (error.code === "PGRST205") {
        // La instancia responde; falta aplicar las migraciones.
        return Response.json({ reachable: true, schemaReady: false });
      }
      return Response.json(
        {
          reachable: false,
          schemaReady: false,
          error: error.code || "consulta_fallida",
        },
        { status: 503 },
      );
    }

    return Response.json({
      reachable: true,
      schemaReady: true,
      ...(typeof count === "number" ? { count } : {}),
    });
  } catch {
    // Variables de entorno ausentes o error de inicialización: sin detalles
    // internos hacia afuera.
    return Response.json(
      {
        reachable: false,
        schemaReady: false,
        error: "configuracion_ausente",
      },
      { status: 503 },
    );
  }
}
