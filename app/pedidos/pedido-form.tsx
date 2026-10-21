"use client";

import {
  Banknote,
  CheckCircle2,
  CreditCard,
  DollarSign,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useId, useMemo, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { crearPedido, type EstadoFormularioPedido } from "./actions";
import {
  calcularCobranzaInicial,
  type MonedaCobranza,
} from "./cobranza";
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

type TasaInfo = {
  id: string | null;
  valor_bs_por_usd: number;
  vigente_desde?: string;
};

type Props = {
  clientes: ClienteOpcion[];
  servicios: ServicioOpcion[];
  tasaCambio?: number;
  tasaVigente?: TasaInfo;
  tasaProgramada?: TasaInfo | null;
};

type ItemLocal = ItemPedidoEntrada & { localId: string };

const CLASES_INPUT =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-[#7aa2f7] focus:ring-2 focus:ring-[#7aa2f7]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25";

/**
 * Formulario interactivo de registro de pedidos y cobranza inicial (RF-01 / RF-02 / T-008 / T-009).
 * Permite seleccionar cliente, desglosar renglones de trabajo, calcular totales y
 * registrar abonos en moneda dual (USD / Bs) con cálculo automático del saldo pendiente.
 */
export function PedidoForm({
  clientes,
  servicios,
  tasaCambio = 40.0,
  tasaVigente,
  tasaProgramada,
}: Props) {
  const router = useRouter();
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

  const opcionesClientes = useMemo(() => {
    return clientes.map((c) => ({
      value: c.id,
      label: c.nombre,
      subtitle: c.telefono ? `Tel: ${c.telefono}` : undefined,
    }));
  }, [clientes]);

  const opcionesServicios = useMemo(() => {
    return servicios.map((s) => ({
      value: s.id,
      label: s.nombre,
    }));
  }, [servicios]);

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

  // Estado de cobranza inicial (T-009)
  const [registrarAbono, setRegistrarAbono] = useState<boolean>(() => {
    return Number(estado.valores?.abono_monto ?? 0) > 0;
  });
  const [abonoMoneda, setAbonoMoneda] = useState<MonedaCobranza>(
    estado.valores?.abono_moneda ?? "USD",
  );
  const [abonoMonto, setAbonoMonto] = useState<string>(
    estado.valores?.abono_monto ? String(estado.valores.abono_monto) : "",
  );
  const [abonoReferencia, setAbonoReferencia] = useState<string>(
    estado.valores?.abono_referencia ?? "",
  );

  // Manejo de tasa de cambio (Hoy vs Mañana para presupuestos)
  const [tasaElegidaTipo, setTasaElegidaTipo] = useState<"hoy" | "manana">("hoy");

  const tasaActiva =
    tasaElegidaTipo === "manana" && tasaProgramada
      ? tasaProgramada.valor_bs_por_usd
      : tasaVigente?.valor_bs_por_usd ?? tasaCambio;

  const tasaActivaId =
    tasaElegidaTipo === "manana" && tasaProgramada
      ? tasaProgramada.id
      : tasaVigente?.id ?? null;

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

  const cobranzaCalculo = calcularCobranzaInicial(
    totalCalculado,
    {
      monto: registrarAbono ? abonoMonto : 0,
      moneda: abonoMoneda,
      referencia: abonoReferencia,
    },
    tasaActiva,
  );

  const errorGeneral =
    estado.errores?.general ??
    estado.errores?.items ??
    estado.errores?.cliente_id;

  return (
    <form action={accion} className="space-y-8">
      {/* Mensaje de error general si aplica */}
      {errorGeneral ? (
        <Alert variant="danger">
          {errorGeneral}
        </Alert>
      ) : null}

      {/* Inputs ocultos con datos serializados */}
      <input type="hidden" name="tasa_id" value={tasaActivaId ?? ""} />
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
      <input
        type="hidden"
        name="abono_monto"
        value={registrarAbono ? abonoMonto : "0"}
      />
      <input type="hidden" name="abono_moneda" value={abonoMoneda} />
      <input
        type="hidden"
        name="abono_referencia"
        value={registrarAbono ? abonoReferencia : ""}
      />

      {/* SECCIÓN CLIENTE */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor={`${formId}-cliente`}
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Cliente <span className="text-red-500">*</span>
          </label>
          <Button
            href="/clientes/nuevo"
            variant="secondary"
            size="sm"
            icon={UserPlus}
          >
            Nuevo Cliente
          </Button>
        </div>

        <div>
          <CustomSelect
            id={`${formId}-cliente`}
            name="cliente_id"
            value={clienteId}
            onChange={(val) => setClienteId(val)}
            options={opcionesClientes}
            placeholder="-- Seleccionar cliente --"
            searchable={true}
            searchPlaceholder="Buscar por nombre o teléfono..."
            emptyText="No se encontraron clientes registrados"
            error={Boolean(estado.errores?.cliente_id)}
            actionButton={{
              label: "Registrar Nuevo Cliente",
              icon: UserPlus,
              onClick: () => router.push("/clientes/nuevo"),
            }}
          />
          {estado.errores?.cliente_id ? (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {estado.errores.cliente_id}
            </p>
          ) : null}
        </div>
      </section>

      {/* SECCIÓN SERVICIOS / ÍTEMS */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Servicios y acabados <span className="text-red-500">*</span>
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {items.length} {items.length === 1 ? "ítem" : "ítems"}
          </span>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-[#24283b]">
          {items.map((item, idx) => {
            const subtotal =
              (Number(item.cantidad) || 0) * (Number(item.precio_usd) || 0);

            const errServicio = estado.errores?.[`items[${idx}].servicio_id`];
            const errCantidad = estado.errores?.[`items[${idx}].cantidad`];
            const errPrecio = estado.errores?.[`items[${idx}].precio_usd`];

            return (
              <div
                key={item.localId}
                className="space-y-3 py-5 first:pt-0 last:pb-2"
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
                    <CustomSelect
                      value={item.servicio_id}
                      onChange={(val) =>
                        actualizarItem(
                          item.localId,
                          "servicio_id",
                          val,
                        )
                      }
                      options={opcionesServicios}
                      placeholder="-- Seleccionar servicio --"
                      searchable={servicios.length > 5}
                      searchPlaceholder="Buscar servicio..."
                      error={Boolean(errServicio)}
                      size="sm"
                    />
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

        {servicios.length === 0 ? (
          <Alert variant="warning">
            No hay servicios activos en el catálogo.{" "}
            <Link
              href="/servicios/nuevo"
              className="font-bold underline hover:opacity-80"
            >
              Registra un nuevo servicio aquí
            </Link>{" "}
            para poder cotizar la orden de trabajo.
          </Alert>
        ) : null}

        <button
          type="button"
          onClick={agregarItem}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation active:scale-[0.97] dark:border-[#2f3654] dark:bg-[#1f202c] dark:text-zinc-200 dark:hover:bg-[#252b42] dark:hover:border-[#7aa2f7]/50 dark:hover:text-white"
        >
          <Plus className="size-3.5 text-zinc-500 dark:text-zinc-400" />
          Agregar otro ítem
        </button>
      </section>

      {/* SECCIÓN COBRANZA INICIAL (RF-02 / T-009) */}
      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
        {/* Selector de tasa programada (si el BCV ya publicó para mañana) */}
        {tasaProgramada && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <Banknote className="size-4 text-amber-600 dark:text-amber-400" />
                  <span>Tasa de Cambio para esta Orden / Presupuesto</span>
                </div>
                <p className="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  El BCV ya emitió la tasa oficial para el siguiente día hábil. Elige con cuál cotizar:
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-amber-300/80 bg-white p-1 dark:border-[#2f3654] dark:bg-[#16161e] shrink-0">
                <button
                  type="button"
                  onClick={() => setTasaElegidaTipo("hoy")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    tasaElegidaTipo === "hoy"
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  Hoy (Bs. {(tasaVigente?.valor_bs_por_usd ?? tasaCambio).toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setTasaElegidaTipo("manana")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    tasaElegidaTipo === "manana"
                      ? "bg-amber-600 text-white shadow-sm dark:bg-amber-500/90 dark:text-white"
                      : "text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
                  }`}
                >
                  Mañana (Bs. {tasaProgramada.valor_bs_por_usd.toFixed(2)})
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-[#24283b]">
          <div className="flex items-center gap-2.5">
            <CreditCard className="size-5 text-zinc-900 dark:text-[#7aa2f7]" />
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Cobranza inicial (Abono)
            </h2>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={registrarAbono}
              onChange={(e) => {
                setRegistrarAbono(e.target.checked);
                if (!e.target.checked) {
                  setAbonoMonto("");
                  setAbonoReferencia("");
                }
              }}
              className="size-4 accent-[#7aa2f7] dark:accent-[#7aa2f7]"
            />
            Registrar abono en recepción
          </label>
        </div>

        {registrarAbono ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3.5 py-2 text-xs text-zinc-600 dark:bg-[#16161e] dark:border dark:border-[#24283b] dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Banknote className="size-4 text-[#7aa2f7]" /> Tasa de cambio de referencia:
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                1 USD = {tasaActiva.toFixed(2)} Bs. {tasaElegidaTipo === "manana" ? "(Tasa Mañana)" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              {/* Selector de moneda */}
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Moneda
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-[#24283b] dark:bg-[#16161e]">
                  <button
                    type="button"
                    onClick={() => setAbonoMoneda("USD")}
                    className={`flex h-9 items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors ${
                      abonoMoneda === "USD"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <DollarSign className="size-3.5" /> USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoMoneda("Bs")}
                    className={`flex h-9 items-center justify-center gap-1 rounded-md text-xs font-semibold transition-colors ${
                      abonoMoneda === "Bs"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-[#1f202c] dark:border dark:border-[#2f3654] dark:text-[#f8fafc]"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Bs.
                  </button>
                </div>
              </div>

              {/* Monto del abono */}
              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Monto abonado ({abonoMoneda})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={abonoMonto}
                  onChange={(e) => setAbonoMonto(e.target.value)}
                  className={CLASES_INPUT}
                />
                {estado.errores?.monto ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {estado.errores.monto}
                  </p>
                ) : null}
              </div>

              {/* Referencia */}
              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Referencia / Método de pago
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago Móvil BDV / Efectivo / Zelle"
                  value={abonoReferencia}
                  onChange={(e) => setAbonoReferencia(e.target.value)}
                  className={CLASES_INPUT}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            El pedido quedará registrado con saldo total pendiente por cobrar al momento del retiro.
          </p>
        )}

        {/* Resumen financiero del pedido */}
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-[#24283b] dark:bg-[#16161e]">
          <div className="flex flex-wrap items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Total del contrato:
            </span>
            <div className="text-right">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                ${totalCalculado.toFixed(2)} USD
              </span>
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                (~ {(totalCalculado * tasaActiva).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.)
              </span>
            </div>
          </div>

          {registrarAbono && cobranzaCalculo.tieneAbono ? (
            <div className="flex flex-wrap items-center justify-between text-sm">
              <span className="text-green-700 dark:text-green-400">
                Abono inicial capturado:
              </span>
              <div className="text-right text-green-700 dark:text-green-400">
                <span className="font-bold">
                  -${cobranzaCalculo.abonoUsd.toFixed(2)} USD
                </span>
                <span className="ml-2 text-xs">
                  ({cobranzaCalculo.abonoMontoOriginal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                  {cobranzaCalculo.abonoMoneda})
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between border-t border-zinc-200/60 pt-3 dark:border-[#24283b] text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Saldo pendiente al retiro:
              </span>
              {cobranzaCalculo.esPagoCompleto ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-500/15 dark:text-green-300">
                  <CheckCircle2 className="size-3" /> Pagado 100%
                </span>
              ) : null}
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ${cobranzaCalculo.saldoUsd.toFixed(2)} USD
              </span>
              <span className="ml-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                (~ {cobranzaCalculo.saldoBs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN NOTAS */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-[#24283b] dark:bg-[#1a1b26]">
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
            className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-[#7aa2f7] focus:ring-2 focus:ring-[#7aa2f7]/20 focus:outline-none dark:border-[#24283b] dark:bg-[#16161e] dark:text-[#f8fafc] dark:placeholder:text-zinc-500 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]/25"
          />
        </div>
      </section>

      {/* ACCIONES DEL FORMULARIO */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          href="/pedidos"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto px-6"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pendiente}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto px-6"
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
        </Button>
      </div>
    </form>
  );
}
