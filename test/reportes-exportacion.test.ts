import { describe, expect, it } from "vitest";
import {
  calcularResumenReporte,
  escaparCampoCsv,
  filtrarPedidosPorPeriodo,
  generarCsvReportePedidos,
  type PedidoReporte,
} from "@/lib/reportes/exportacion";

describe("T-025 — Exportación de reportes de pedidos y métricas (RF-17)", () => {
  it("escaparCampoCsv escapa comillas dobles, saltos de línea y rodea con comillas si hay comas", () => {
    expect(escaparCampoCsv("Texto simple")).toBe("Texto simple");
    expect(escaparCampoCsv('Texto con "comillas"')).toBe('"Texto con ""comillas"""');
    expect(escaparCampoCsv("Texto, con coma")).toBe('"Texto, con coma"');
    expect(escaparCampoCsv("Línea 1\nLínea 2")).toBe('"Línea 1\nLínea 2"');
    expect(escaparCampoCsv(123.45)).toBe("123.45");
  });

  it("filtrarPedidosPorPeriodo filtra pedidos según preset de fechas y excluye los fuera de rango", () => {
    const fechaRef = new Date("2026-10-10T12:00:00Z");
    const pedidos: PedidoReporte[] = [
      {
        id: "p-hoy",
        numeroOrden: 1,
        creadoEn: "2026-10-10T10:00:00Z",
        clienteNombre: "Cliente Hoy",
        clienteTelefono: null,
        estado: "registrado",
        anulado: false,
        totalUsd: 100,
        tasaBsPorUsd: 40,
        pagos: [],
      },
      {
        id: "p-ayer",
        numeroOrden: 2,
        creadoEn: "2026-10-09T10:00:00Z",
        clienteNombre: "Cliente Ayer",
        clienteTelefono: null,
        estado: "registrado",
        anulado: false,
        totalUsd: 50,
        tasaBsPorUsd: 40,
        pagos: [],
      },
    ];

    const filtradosHoy = filtrarPedidosPorPeriodo(pedidos, {
      preset: "hoy",
      fechaReferencia: fechaRef,
    });
    expect(filtradosHoy).toHaveLength(1);
    expect(filtradosHoy[0].id).toBe("p-hoy");

    const filtradosTodo = filtrarPedidosPorPeriodo(pedidos, { preset: "todo" });
    expect(filtradosTodo).toHaveLength(2);
  });

  it("calcularResumenReporte suma con precisión y descarta anulados", () => {
    const pedidos: PedidoReporte[] = [
      {
        id: "p-1",
        numeroOrden: 1,
        creadoEn: "2026-10-10T10:00:00Z",
        clienteNombre: "A",
        clienteTelefono: null,
        estado: "registrado",
        anulado: false,
        totalUsd: 100,
        tasaBsPorUsd: 40,
        pagos: [{ monto: 40, moneda: "USD" }],
      },
      {
        id: "p-2",
        numeroOrden: 2,
        creadoEn: "2026-10-10T11:00:00Z",
        clienteNombre: "B",
        clienteTelefono: null,
        estado: "registrado",
        anulado: true,
        totalUsd: 300,
        tasaBsPorUsd: 40,
        pagos: [],
      },
    ];

    const resumen = calcularResumenReporte(pedidos);
    expect(resumen.totalFacturadoUsd).toBe(100);
    expect(resumen.totalCobradoUsd).toBe(40);
    expect(resumen.saldoPendienteUsd).toBe(60);
    expect(resumen.totalPedidos).toBe(1);
  });

  it("generarCsvReportePedidos incluye BOM UTF-8, cabeceras exactas, filas de pedidos y bloque de totales", () => {
    const pedidosMuestra: PedidoReporte[] = [
      {
        id: "p-1",
        numeroOrden: 101,
        creadoEn: "2026-10-10T10:00:00Z",
        clienteNombre: "Imprenta Bolívar, C.A.",
        clienteTelefono: "+58 412 111 2233",
        estado: "listo",
        anulado: false,
        totalUsd: 100,
        tasaBsPorUsd: 40,
        pagos: [
          { monto: 50, moneda: "USD" },
          { monto: 800, moneda: "Bs" }, // 800 Bs / 40 = 20 USD. Total pagado = 70 USD. Saldo = 30 USD
        ],
      },
      {
        id: "p-2",
        numeroOrden: 102,
        creadoEn: "2026-10-10T12:00:00Z",
        clienteNombre: "Diseños Rápidos",
        clienteTelefono: null,
        estado: "entregado",
        anulado: false,
        totalUsd: 50,
        tasaBsPorUsd: 40,
        pagos: [{ monto: 50, moneda: "USD" }], // Total pagado = 50 USD. Saldo = 0 USD
      },
    ];

    const csv = generarCsvReportePedidos(pedidosMuestra);

    // Debe incluir BOM UTF-8 para compatibilidad universal con Excel
    expect(csv.startsWith("\uFEFF")).toBe(true);

    // Debe incluir cabeceras de columnas
    expect(csv).toContain("N° Orden,Fecha,Cliente,Teléfono,Estado,Total USD,Total Bs (ref),Pagado USD,Saldo USD,Cobranza");

    // Debe contener las filas
    expect(csv).toContain("#101");
    expect(csv).toContain('"Imprenta Bolívar, C.A."');
    expect(csv).toContain("#102");

    // Debe contener el pie de totales contables
    expect(csv).toContain("TOTALES DEL PERÍODO");
    expect(csv).toContain("Total Facturado USD: 150.00");
    expect(csv).toContain("Total Cobrado USD: 120.00");
    expect(csv).toContain("Saldo Pendiente USD: 30.00");
    expect(csv).toContain("Total de Pedidos: 2");
  });

  it("excluye pedidos anulados de las filas contables y totales del CSV", () => {
    const pedidosConAnulado: PedidoReporte[] = [
      {
        id: "p-1",
        numeroOrden: 101,
        creadoEn: "2026-10-10T10:00:00Z",
        clienteNombre: "Cliente Activo",
        clienteTelefono: "0414-1234567",
        estado: "registrado",
        anulado: false,
        totalUsd: 80,
        tasaBsPorUsd: 40,
        pagos: [{ monto: 40, moneda: "USD" }],
      },
      {
        id: "p-2",
        numeroOrden: 102,
        creadoEn: "2026-10-10T11:00:00Z",
        clienteNombre: "Cliente Cancelado",
        clienteTelefono: null,
        estado: "registrado",
        anulado: true,
        totalUsd: 500,
        tasaBsPorUsd: 40,
        pagos: [],
      },
    ];

    const csv = generarCsvReportePedidos(pedidosConAnulado);

    // No debe sumar los 500 USD del pedido anulado
    expect(csv).toContain("Total Facturado USD: 80.00");
    expect(csv).toContain("Total Cobrado USD: 40.00");
    expect(csv).toContain("Saldo Pendiente USD: 40.00");
    expect(csv).toContain("Total de Pedidos: 1");
    expect(csv).not.toContain("Cliente Cancelado");
  });

  it("calcula correctamente pedidos sin pagos o con pagos únicamente en Bolívares", () => {
    const pedidosSoloBs: PedidoReporte[] = [
      {
        id: "p-3",
        numeroOrden: 103,
        creadoEn: "2026-10-10T14:00:00Z",
        clienteNombre: "Gobernación",
        clienteTelefono: null,
        estado: "imprimiendo",
        anulado: false,
        totalUsd: 200,
        tasaBsPorUsd: 40,
        pagos: [{ monto: 4000, moneda: "Bs" }], // 4000 Bs / 40 = 100 USD pagados. Saldo = 100 USD
      },
    ];

    const csv = generarCsvReportePedidos(pedidosSoloBs);
    expect(csv).toContain("Total Facturado USD: 200.00");
    expect(csv).toContain("Total Cobrado USD: 100.00");
    expect(csv).toContain("Saldo Pendiente USD: 100.00");
    expect(csv).toContain("Total de Pedidos: 1");
  });
});
