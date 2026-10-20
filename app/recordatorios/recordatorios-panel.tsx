"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  MessageCircle,
  Package,
  Search,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  clasificarUmbralAntiguedad,
  generarEnlaceWhatsAppRecordatorio,
  ordenarPedidosPorAntiguedad,
  type PedidoListoRecordatorio,
} from "@/lib/notificaciones/recordatorios";
import { PageHeader } from "@/components/shell/page-header";
import { Card, KpiCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type Props = {
  pedidosIniciales: PedidoListoRecordatorio[];
  rolUsuario?: string;
};

type FiltroUmbral = "todos" | "atencion_48h" | "urgente_72h";

export function RecordatoriosPanel({ pedidosIniciales }: Props) {
  const [filtro, setFiltro] = useState<FiltroUmbral>("todos");
  const [busqueda, setBusqueda] = useState("");

  const pedidosOrdenados = ordenarPedidosPorAntiguedad(pedidosIniciales);

  // Métricas globales
  const totalListos = pedidosOrdenados.length;
  const conteoAtencion = pedidosOrdenados.filter(
    (p) => clasificarUmbralAntiguedad(p.horasTranscurridas) === "atencion_48h",
  ).length;
  const conteoUrgente = pedidosOrdenados.filter(
    (p) => clasificarUmbralAntiguedad(p.horasTranscurridas) === "urgente_72h",
  ).length;
  const saldoTotalRetenidoUsd = pedidosOrdenados.reduce(
    (acc, p) => acc + (p.saldoUsd > 0 ? p.saldoUsd : 0),
    0,
  );

  // Filtrado
  const pedidosFiltrados = pedidosOrdenados.filter((p) => {
    const umbral = clasificarUmbralAntiguedad(p.horasTranscurridas);
    if (filtro === "atencion_48h" && umbral !== "atencion_48h") return false;
    if (filtro === "urgente_72h" && umbral !== "urgente_72h") return false;

    if (!busqueda.trim()) return true;
    const term = busqueda.toLowerCase().trim();
    const ordStr = `ord-${String(p.numeroOrden).padStart(4, "0")}`.toLowerCase();
    const numStr = String(p.numeroOrden);
    const cliStr = p.nombreCliente.toLowerCase();

    return ordStr.includes(term) || numStr.includes(term) || cliStr.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Cabecera unificada */}
      <PageHeader
        title="Recordatorios (48–72 h)"
        description="Seguimiento a pedidos listos sin retirar para incentivar cobranza y despacho oportuno (RF-09)."
        badge={
          <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
            <Bell className="size-3.5" />
            <span>Cobranzas & Alertas</span>
          </span>
        }
        actions={
          <div className="w-full sm:w-64">
            <Input
              type="search"
              icon={Search}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar orden o cliente..."
              sizeVariant="md"
            />
          </div>
        }
      />

      {/* Tarjetas de Métricas Resumen (Homologadas a KpiCards) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          title="Total Listos"
          value={totalListos}
          icon={Package}
          variant="info"
        />

        <KpiCard
          title="Atención (≥ 48 h)"
          value={conteoAtencion}
          icon={AlertTriangle}
          variant="warning"
        />

        <KpiCard
          title="Urgente (≥ 72 h)"
          value={conteoUrgente}
          icon={AlertCircle}
          variant="danger"
        />

        <KpiCard
          title="Saldo Retenido"
          value={`$${saldoTotalRetenidoUsd.toFixed(2)}`}
          subtitle="USD pendiente"
          icon={Wallet}
          variant="success"
        />
      </div>

      {/* Pestañas de Filtros Rápidos (Canonical Tabs) */}
      <div className="border-b border-zinc-200 pb-3 dark:border-[#24283b]">
        <Tabs
          items={[
            {
              key: "todos",
              label: "Todos los listos",
              badge: <Badge variant="neutral" size="sm">{totalListos}</Badge>,
            },
            {
              key: "atencion_48h",
              label: "Atención (≥ 48 h)",
              icon: AlertTriangle,
              badge: <Badge variant="warning" size="sm">{conteoAtencion}</Badge>,
            },
            {
              key: "urgente_72h",
              label: "Urgente (≥ 72 h)",
              icon: AlertCircle,
              badge: <Badge variant="danger" size="sm">{conteoUrgente}</Badge>,
            },
          ]}
          activeKey={filtro}
          onChange={(key) => setFiltro(key as FiltroUmbral)}
        />
      </div>

      {/* Lista de Pedidos en Espera */}
      {pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-[#24283b] dark:bg-[#1a1b26]">
          <Package className="size-12 text-zinc-400" />
          <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No hay pedidos en este umbral
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {busqueda
              ? `No se encontraron coincidencias para "${busqueda}".`
              : "No hay órdenes pendientes de retiro bajo el criterio seleccionado."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => {
            const umbral = clasificarUmbralAntiguedad(pedido.horasTranscurridas);
            const ordenStr = `ORD-${String(pedido.numeroOrden).padStart(4, "0")}`;
            const diasEspera = Math.floor(pedido.horasTranscurridas / 24);

            const enlaceRecordatorio = generarEnlaceWhatsAppRecordatorio({
              telefono: pedido.telefono,
              nombreCliente: pedido.nombreCliente,
              numeroOrden: pedido.numeroOrden,
              horasTranscurridas: pedido.horasTranscurridas,
              totalUsd: pedido.totalUsd,
              saldoUsd: pedido.saldoUsd,
              tasaBsPorUsd: pedido.tasaBsPorUsd,
            });

            return (
              <Card
                key={pedido.id}
                data-testid={`recordatorio-item-${pedido.numeroOrden}`}
                className="p-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
              >
                {/* Datos del Pedido */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {ordenStr}
                    </span>

                    {/* Badge Canónico de Antigüedad */}
                    {umbral === "urgente_72h" && (
                      <Badge variant="danger" icon={AlertCircle}>
                        URGENTE: {pedido.horasTranscurridas} h ({diasEspera} d)
                      </Badge>
                    )}

                    {umbral === "atencion_48h" && (
                      <Badge variant="warning" icon={AlertTriangle}>
                        ATENCIÓN: {pedido.horasTranscurridas} h
                      </Badge>
                    )}

                    {umbral === "reciente" && (
                      <Badge variant="neutral" icon={Clock}>
                        Listo hace {pedido.horasTranscurridas} h
                      </Badge>
                    )}

                    <Link
                      href={`/comanda/${pedido.id}`}
                      target="_blank"
                      className="inline-flex size-6 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-800 dark:border-[#24283b] dark:hover:text-zinc-200 dark:hover:bg-[#1f202c]"
                      aria-label={`Ver comanda de ${ordenStr}`}
                    >
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <User className="size-3.5 text-zinc-400 shrink-0" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {pedido.nombreCliente}
                    </span>
                    {pedido.telefono && (
                      <span className="text-xs text-zinc-500 shrink-0">({pedido.telefono})</span>
                    )}
                  </div>

                  {/* Estado Financiero */}
                  <div className="text-xs">
                    {pedido.saldoUsd <= 0.009 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-[#9ece6a]">
                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-[#9ece6a] shrink-0" />
                        100% Pagado ($0.00 pendiente)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-[#f7768e]">
                        <DollarSign className="size-3.5 text-rose-600 dark:text-[#f7768e] shrink-0" />
                        Saldo pendiente: ${pedido.saldoUsd.toFixed(2)} USD
                        {pedido.tasaBsPorUsd ? (
                          <span className="font-normal text-zinc-500 ml-1">
                            (aprox. Bs.{" "}
                            {(
                              Math.round(pedido.saldoUsd * pedido.tasaBsPorUsd * 100) / 100
                            ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            )
                          </span>
                        ) : null}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acción de Envío con Button Canónico */}
                <div className="flex items-center gap-2 shrink-0">
                  {enlaceRecordatorio ? (
                    <Button
                      href={enlaceRecordatorio}
                      variant="secondary"
                      size="sm"
                      icon={MessageCircle}
                      data-testid={`btn-recordatorio-${pedido.numeroOrden}`}
                    >
                      Enviar Recordatorio
                    </Button>
                  ) : (
                    <span className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-xs text-zinc-400 dark:border-[#24283b] dark:bg-[#1f202c]">
                      Sin teléfono registrado
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
