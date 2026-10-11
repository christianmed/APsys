"use client";

import { CircleAlert, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  actualizarServicio,
  crearServicio,
  type EstadoFormularioServicio,
} from "./actions";

type ServicioExistente = {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
};

type Props =
  | { modo: "crear"; servicio?: undefined }
  | { modo: "editar"; servicio: ServicioExistente };

const CLASES_INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-100/15";

const CLASES_BOTON =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

const CLASES_BOTON_SECUNDARIO =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

const CLASES_CHECKBOX =
  "size-4 shrink-0 accent-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:accent-zinc-50";

/**
 * Formulario de alta/edición de servicio (RF-04/T-007b). Resuelve la acción
 * con `useActionState` y repinta errores/valores desde el estado que devuelve
 * el servidor (T-007a). `activo` solo se edita en modo "editar": la baja de un
 * servicio es lógica (los pedidos históricos siguen referenciándolo).
 */
export function ServicioForm({ modo, servicio }: Props) {
  const enEdicion = modo === "editar" ? servicio : undefined;

  const [estado, accion, pendiente] = useActionState<
    EstadoFormularioServicio,
    FormData
  >(enEdicion ? actualizarServicio.bind(null, enEdicion.id) : crearServicio, {});

  const valores = {
    nombre: estado.valores?.nombre ?? enEdicion?.nombre ?? "",
    orden: estado.valores?.orden ?? enEdicion?.orden ?? 0,
  };

  const mensajeError =
    estado.errores?.general ?? estado.errores?.nombre ?? estado.errores?.orden;

  return (
    <form action={accion} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          disabled={pendiente}
          aria-invalid={estado.errores?.nombre ? true : undefined}
          defaultValue={valores.nombre}
          className={CLASES_INPUT}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="orden"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Orden
        </label>
        <input
          id="orden"
          name="orden"
          type="number"
          min={0}
          disabled={pendiente}
          aria-invalid={estado.errores?.orden ? true : undefined}
          defaultValue={valores.orden}
          className={CLASES_INPUT}
        />
      </div>

      {enEdicion ? (
        <div className="flex items-center gap-3">
          <input
            id="activo"
            name="activo"
            type="checkbox"
            defaultChecked={enEdicion.activo}
            disabled={pendiente}
            className={CLASES_CHECKBOX}
          />
          <label
            htmlFor="activo"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Activo
          </label>
        </div>
      ) : null}

      {mensajeError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{mensajeError}</span>
        </p>
      ) : null}

      <div className="space-y-3">
        <button type="submit" disabled={pendiente} className={CLASES_BOTON}>
          {pendiente ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden className="size-4" />
          )}
          Guardar servicio
        </button>

        <Link href="/servicios" className={CLASES_BOTON_SECUNDARIO}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
