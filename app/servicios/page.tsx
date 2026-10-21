import { Layers, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/shell/authenticated-shell";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { obtenerUsuarioSesion } from "@/lib/supabase/auth-cache";

/**
 * Catálogo de servicios (RF-04/T-007b): listado completo ordenado por `orden`
 * y nombre, con badge de estado. Solo el perfil gerencial administra: ve el
 * alta y abre cada fila para editar (incluida la baja lógica vía `activo`).
 */
export const instant = false;

export default async function ServiciosPage() {
  const { user, perfil, supabase } = await obtenerUsuarioSesion();

  if (!user) {
    redirect("/login");
  }

  const esGerencial = perfil?.rol === "gerencial";

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id,nombre,activo,orden")
    .order("orden", { ascending: true })
    .order("nombre");

  const lista = servicios ?? [];

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <PageHeader
          title="Catálogo de Servicios"
          description="Servicios de impresión, acabados y orden en comandas de taller."
          badge={
            <span className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400">
              <Layers className="size-3.5" />
              <span>Catálogo de Servicios</span>
            </span>
          }
          actions={
            esGerencial ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  href="/dashboard/rotacion"
                  variant="outline"
                >
                  Rotación
                </Button>
                <Button
                  href="/servicios/nuevo"
                  variant="primary"
                >
                  <Plus className="size-4" />
                  Nuevo Servicio
                </Button>
              </div>
            ) : null
          }
        />

        {esGerencial ? null : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Solo la gerencia administra el catálogo.
          </p>
        )}

        {lista.length > 0 ? (
          <ul className="space-y-3">
            {lista.map((servicio) => {
              const contenido = (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {servicio.nombre}
                    </p>
                    <Badge variant={servicio.activo ? "success" : "neutral"}>
                      {servicio.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Prioridad en Catálogo: {servicio.orden}
                  </p>
                </>
              );

              return (
                <li key={servicio.id}>
                  {esGerencial ? (
                    <Card
                      href={`/servicios/${servicio.id}`}
                      className="p-4"
                    >
                      {contenido}
                    </Card>
                  ) : (
                    <Card className="p-4">{contenido}</Card>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-[#24283b] dark:bg-[#1a1b26] dark:text-zinc-400">
            Aún no hay servicios
          </p>
        )}
      </div>
    </AuthenticatedShell>
  );
}
