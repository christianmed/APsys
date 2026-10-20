"use client";

import {
  LoaderCircle,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  type EstadoFormularioServicio,
} from "./actions";

type ServicioExistente = {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
};

type Props =
  | { modo: "crear"; servicio?: undefined; pedidosAsociados?: undefined }
  | {
      modo: "editar";
      servicio: ServicioExistente;
      pedidosAsociados?: number;
    };

/**
 * Formulario de alta/edición de servicio (RF-04/T-007b). Resuelve la acción
 * con `useActionState` y repinta errores/valores desde el estado que devuelve
 * el servidor (T-007a). `activo` solo se edita en modo "editar": la baja de un
 * servicio es lógica (los pedidos históricos siguen referenciándolo).
 * Si el servicio no tiene pedidos asociados (0 vinculaciones), permite su
 * eliminación física definitiva; si tiene pedidos, la bloquea explicando el motivo.
 */
export function ServicioForm({ modo, servicio, pedidosAsociados = 0 }: Props) {
  const router = useRouter();
  const enEdicion = modo === "editar" ? servicio : undefined;
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null);

  const [estado, accion, pendiente] = useActionState<
    EstadoFormularioServicio,
    FormData
  >(
    enEdicion ? actualizarServicio.bind(null, enEdicion.id) : crearServicio,
    {},
  );

  const valores = {
    nombre: estado.valores?.nombre ?? enEdicion?.nombre ?? "",
    orden: estado.valores?.orden ?? enEdicion?.orden ?? 0,
  };

  const mensajeError =
    estado.errores?.general ??
    estado.errores?.nombre ??
    estado.errores?.orden ??
    errorEliminacion;

  const handleEliminar = async () => {
    if (!enEdicion) return;

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el servicio "${enEdicion.nombre}"?\n\nAl no tener pedidos registrados en el sistema, se borrará definitivamente de la base de datos.`,
    );

    if (!confirmacion) return;

    setEliminando(true);
    setErrorEliminacion(null);

    try {
      const res = await eliminarServicio(enEdicion.id);
      if (res.ok) {
        router.push("/servicios");
      } else {
        setErrorEliminacion(res.error ?? "No se pudo eliminar el servicio.");
        setEliminando(false);
      }
    } catch {
      setErrorEliminacion("Ocurrió un error inesperado al intentar eliminar el servicio.");
      setEliminando(false);
    }
  };

  return (
    <form action={accion} className="space-y-6">
      {/* Campo Nombre */}
      <div className="space-y-1.5">
        <label
          htmlFor="nombre"
          className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
        >
          Nombre del Servicio
        </label>
        <Input
          id="nombre"
          name="nombre"
          type="text"
          required
          disabled={pendiente || eliminando}
          aria-invalid={estado.errores?.nombre ? true : undefined}
          defaultValue={valores.nombre}
          placeholder="Ej: Pendones, Viniles, Gigantografías..."
          sizeVariant="lg"
        />
      </div>

      {/* Campo Prioridad / Posición en Catálogo */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="orden"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
          >
            Prioridad en Catálogo (Posición)
          </label>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Menor número = Más arriba
          </span>
        </div>
        <Input
          id="orden"
          name="orden"
          type="number"
          min={0}
          disabled={pendiente || eliminando}
          aria-invalid={estado.errores?.orden ? true : undefined}
          defaultValue={valores.orden}
          sizeVariant="lg"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Determina la posición en que aparecerá este servicio en las listas y selectores al crear nuevas órdenes (ej. 1, 2, 3...).
        </p>
      </div>

      {/* Casilla Activo / Baja Lógica */}
      {enEdicion ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-[#24283b] dark:bg-[#16161e]">
          <div className="flex items-start gap-3">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              defaultChecked={enEdicion.activo}
              disabled={pendiente || eliminando}
              className="size-4 shrink-0 mt-0.5 accent-zinc-900 dark:accent-[#7aa2f7] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div>
              <label
                htmlFor="activo"
                className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100"
              >
                Servicio Activo en Catálogo
              </label>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Si desmarcas esta opción, el servicio se ocultará al registrar nuevos pedidos (baja lógica), preservando intacto el historial contable de órdenes previas.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Advertencia de pedidos vinculados si aplica */}
      {enEdicion && pedidosAsociados > 0 ? (
        <Alert variant="warning" icon={ShieldAlert} title="Protección de Integridad Histórica:">
          Este servicio tiene <strong>{pedidosAsociados} {pedidosAsociados === 1 ? "pedido registrado" : "pedidos registrados"}</strong>. Por seguridad contable no se puede eliminar físicamente de la base de datos para no romper comandas ni reportes existentes. Para retirarlo del menú de nuevas órdenes, simplemente desmarca la casilla <strong>&quot;Servicio Activo&quot;</strong> arriba.
        </Alert>
      ) : null}

      {/* Feedback de error */}
      {mensajeError ? (
        <Alert variant="danger">
          {mensajeError}
        </Alert>
      ) : null}

      {/* Botones de acción principales */}
      <div className="space-y-2.5 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pendiente || eliminando}
          className="w-full"
        >
          {pendiente ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          <span>Guardar cambios</span>
        </Button>

        <Button
          href="/servicios"
          variant="outline"
          size="lg"
          className="w-full"
        >
          Cancelar
        </Button>
      </div>

      {/* Botón de Eliminación Segura (Solo disponible si 0 pedidos vinculados) */}
      {enEdicion && pedidosAsociados === 0 ? (
        <div className="border-t border-zinc-200 pt-5 dark:border-[#24283b]">
          <div className="space-y-2">
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={pendiente || eliminando}
              onClick={handleEliminar}
              className="w-full"
            >
              {eliminando ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5 text-rose-600 dark:text-rose-400" />
              )}
              <span>{eliminando ? "Eliminando..." : "Eliminar servicio definitivamente"}</span>
            </Button>
            <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              Este servicio no tiene órdenes asociadas y puede ser borrado de forma permanente.
            </p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
