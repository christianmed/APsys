"use client";

import {
  CircleAlert,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { crearPedido, type EstadoFormularioPedido } from "./actions";
import { type ItemPedidoEntrada } from "./validaciones";

type ClienteOpcion = {
  id: string;
  nombre: string;
  telefono: string | null;
};

type ServicioOpcion = {
  id: string;
  nombre: string;
};

type Props = {
  clientes: ClienteOpcion[];
  servicios: ServicioOpcion[];
};

type ItemLocal = ItemPedidoEntrada & { localId: string };

const CLASES_INPUT =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-400 dark:focus-visible:ring-zinc-100/15";

const CLASES_SELECT = `${CLASES_INPUT} appearance-none`;

const CLASES_BOTON =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950";

const CLASES_BOTON_SECUNDARIO =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

/**
 * Formulario interactivo de registro de pedidos (RF-01 / T-008b).
 * Permite seleccionar cliente, agregar múltiples servicios o ítems con dimensiones y acabados,
 * calcular subtotales y total en USD en tiempo real, y persistir la orden.
 */
export function PedidoForm({ clientes, servicios }: Props) {
  const formId = useId();
  const [estado, accion, pendiente] = useActionState<
    EstadoFormularioPedido,
    FormData
  >(crearPedido, {});

  const [clienteId, setClienteId] = useState<string>(
    estado.valores?.cliente_id ?? "",
  );
  const [notas, setNotas] = useState<string>(estado.valores?.notas ?? "");

  const servicioDefault = servicios[0]?.id ?? "";

  const [items, setItems] = useState<ItemLocal[]>(() => {
    if (estado.valores?.items && estado.valores.items.length > 0) {
      return estado.valores.items.map((item, idx) => ({
        ...item,
        localId: `item-${idx}`,
      }));
    }
    return [
      {
        localId: "item-init-1",
        servicio_id: servicioDefault,
        descripcion: "",
        dimensiones: "",
        acabados: "",
        cantidad: 1,
        precio_usd: 0,
      },
    ];
  });

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        localId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        servicio_id: servicioDefault,
        descripcion: "",
        dimensiones: "",
        acabados: "",
        cantidad: 1,
        precio_usd: 0,
      },
    ]);
  };

  const eliminarItem = (localId: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.localId !== localId));
  };

  const actualizarItem = (
    localId: string,
    campo: keyof ItemPedidoEntrada,
    valor: string | number,
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.localId !== localId) return i;
        return { ...i, [campo]: valor };
      }),
    );
  };

  const totalCalculado = items.reduce((acc, it) => {
    const cant =
      typeof it.cantidad === "number" ? it.cantidad : Number(it.cantidad) || 0;
    const precio =
      typeof it.precio_usd === "number"
        ? it.precio_usd
        : Number(it.precio_usd) || 0;
    return acc + (cant > 0 && precio >= 0 ? cant * precio : 0);
  }, 0);

  const errorGeneral =
    estado.errores?.general ??
    estado.errores?.items ??
    estado.errores?.cliente_id;

  return (
    <form action={accion} className="space-y-8">
      {/* Mensaje de error general si aplica */}
      {errorGeneral ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <CircleAlert aria-hidden className="size-5 shrink-0" />
          <span>{errorGeneral}</span>
        </div>
      ) : null}

      {/* Input oculto con serialización de ítems */}
      <input
        type="hidden"
        name="items_json"
        value={JSON.stringify(
          items.map((item) => ({
            servicio_id: item.servicio_id,
            descripcion: item.descripcion,
            dimensiones: item.dimensiones,
            acabados: item.acabados,
            cantidad: item.cantidad,
            precio_usd: item.precio_usd,
          })),
        )}
      />

      {/* SECCIÓN CLIENTE */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor={`${formId}-cliente`}
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Cliente <span className="text-red-500">*</span>
          </label>
          <Link
            href="/clientes/nuevo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <UserPlus className="size-4" />+ Registrar nuevo cliente
          </Link>
        </div>

        <div>
          <select
            id={`${formId}-cliente`}
            name="cliente_id"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className={CLASES_SELECT}
          >
            <option value="">-- Seleccionar cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.telefono ? ` (${c.telefono})` : ""}
              </option>
            ))}
          </select>
          {estado.errores?.cliente_id ? (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {estado.errores.cliente_id}
            </p>
          ) : null}
        </div>
      </section>

      {/* SECCIÓN SERVICIOS / ÍTEMS */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Servicios y acabados <span className="text-red-500">*</span>
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {items.length} {items.length === 1 ? "ítem" : "ítems"}
          </span>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const subtotal =
              (Number(item.cantidad) || 0) * (Number(item.precio_usd) || 0);

            const errServicio = estado.errores?.[`items[${idx}].servicio_id`];
            const errCantidad = estado.errores?.[`items[${idx}].cantidad`];
            const errPrecio = estado.errores?.[`items[${idx}].precio_usd`];

            return (
              <div
                key={item.localId}
                className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Renglón #{idx + 1}
                  </span>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => eliminarItem(item.localId)}
                      aria-label={`Eliminar ítem ${idx + 1}`}
                      className="inline-flex items-center gap-1 text-xs text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="size-3.5" />
                      Eliminar
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  {/* Selector de servicio */}
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Servicio
                    </label>
                    <select
                      value={item.servicio_id}
                      onChange={(e) =>
                        actualizarItem(
                          item.localId,
                          "servicio_id",
                          e.target.value,
                        )
                      }
                      required
                      className={CLASES_SELECT}
                    >
                      <option value="">-- Seleccionar --</option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                    {errServicio ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errServicio}
                      </p>
                    ) : null}
                  </div>

                  {/* Dimensiones */}
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Dimensiones
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 1.20 x 0.80 m"
                      value={item.dimensiones ?? ""}
                      onChange={(e) =>
                        actualizarItem(
                          item.localId,
                          "dimensiones",
                          e.target.value,
                        )
                      }
                      className={CLASES_INPUT}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarItem(
                          item.localId,
                          "cantidad",
                          Number.parseInt(e.target.value, 10) || 1,
                        )
                      }
                      className={CLASES_INPUT}
                    />
                    {errCantidad ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errCantidad}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  {/* Acabados */}
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Acabados / Especificaciones
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Ojetes cada 50 cm, corte recto"
                      value={item.acabados ?? ""}
                      onChange={(e) =>
                        actualizarItem(item.localId, "acabados", e.target.value)
                      }
                      className={CLASES_INPUT}
                    />
                  </div>

                  {/* Descripción / Detalle */}
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Detalle adicional
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Logo corporativo"
                      value={item.descripcion ?? ""}
                      onChange={(e) =>
                        actualizarItem(
                          item.localId,
                          "descripcion",
                          e.target.value,
                        )
                      }
                      className={CLASES_INPUT}
                    />
                  </div>

                  {/* Precio USD y subtotal */}
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Precio unit. (USD)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={item.precio_usd}
                        onChange={(e) =>
                          actualizarItem(
                            item.localId,
                            "precio_usd",
                            e.target.value,
                          )
                        }
                        className={CLASES_INPUT}
                      />
                    </div>
                    {errPrecio ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errPrecio}
                      </p>
                    ) : null}
                    <p className="mt-1 text-right text-xs text-zinc-500 dark:text-zinc-400">
                      Subtotal:{" "}
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        ${subtotal.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={agregarItem}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          <Plus className="size-4" />+ Agregar otro ítem
        </button>
      </section>

      {/* SECCIÓN NOTAS Y TOTAL */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label
            htmlFor={`${formId}-notas`}
            className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            Notas u observaciones del pedido (opcional)
          </label>
          <textarea
            id={`${formId}-notas`}
            name="notas"
            rows={3}
            placeholder="Indicaciones para taller o recepción..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-base text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-900/10 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Total estimado del pedido
          </span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            ${totalCalculado.toFixed(2)} USD
          </span>
        </div>
      </section>

      {/* ACCIONES DEL FORMULARIO */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/pedidos"
          className={`${CLASES_BOTON_SECUNDARIO} w-full sm:w-auto px-6`}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pendiente}
          className={`${CLASES_BOTON} w-full sm:w-auto px-6`}
        >
          {pendiente ? (
            <>
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
              Guardando pedido...
            </>
          ) : (
            <>
              <Save aria-hidden className="size-4" />
              Registrar pedido
            </>
          )}
        </button>
      </div>
    </form>
  );
}
