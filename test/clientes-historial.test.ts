import { describe, expect, it } from "vitest";
import {
  calcularMetricasCliente,
  clasificarRecurrenciaCliente,
  type PedidoHistorialInput,
} from "@/lib/clientes/historial";

describe("Historial por cliente y recurrencia (T-022a / RF-14)", () => {
  const ahora = new Date("2026-10-10T12:00:00Z");

  it("calcula métricas para un cliente con múltiples compras a lo largo del tiempo", () => {
    const pedidos: PedidoHistorialInput[] = [
      {
        id: "p1",
        numero_orden: 1,
        creado_en: "2026-08-01T10:00:00Z", // Primera compra: hace ~70 días
        estado: "entregado",
        anulado: false,
        total_usd: 100,
        tasa_valor: 40,
        pagos: [{ monto: 100, moneda: "USD", tasa_valor: 40 }],
        items_count: 2,
      },
      {
        id: "p2",
        numero_orden: 2,
        creado_en: "2026-09-01T10:00:00Z", // Segunda compra: 31 días después
        estado: "entregado",
        anulado: false,
        total_usd: 200,
        tasa_valor: 40,
        pagos: [{ monto: 200, moneda: "USD", tasa_valor: 40 }],
        items_count: 1,
      },
      {
        id: "p3",
        numero_orden: 3,
        creado_en: "2026-10-01T10:00:00Z", // Tercera compra: 30 días después (hace 9 días)
        estado: "listo_para_retiro",
        anulado: false,
        total_usd: 150,
        tasa_valor: 40,
        pagos: [{ monto: 50, moneda: "USD", tasa_valor: 40 }], // debe 100 USD
        items_count: 3,
      },
      {
        id: "p4",
        numero_orden: 4,
        creado_en: "2026-10-05T10:00:00Z",
        estado: "pendiente",
        anulado: true, // Anulado: NO debe sumar a facturación ni compras exitosas
        total_usd: 500,
        tasa_valor: 40,
        pagos: [],
        items_count: 1,
      },
    ];

    const metricas = calcularMetricasCliente(pedidos, ahora);

    expect(metricas.total_pedidos_activos).toBe(3);
    expect(metricas.total_pedidos_anulados).toBe(1);
    expect(metricas.total_gastado_usd).toBe(450); // 100 + 200 + 150
    expect(metricas.total_pagado_usd).toBe(350); // 100 + 200 + 50
    expect(metricas.saldo_pendiente_usd).toBe(100); // 450 - 350
    expect(metricas.ticket_promedio_usd).toBe(150); // 450 / 3

    expect(metricas.fecha_primera_compra).toBe("2026-08-01T10:00:00Z");
    expect(metricas.fecha_ultima_compra).toBe("2026-10-01T10:00:00Z");
    expect(metricas.dias_desde_ultima_compra).toBe(9); // del 1 de oct al 10 de oct

    // Promedio entre pedidos: (31 + 30) / 2 = 30.5 -> aprox 31 días
    expect(metricas.frecuencia_dias_promedio).toBe(31);

    expect(metricas.clasificacion).toBe("Recurrente");
  });

  it("clasifica adecuadamente la recurrencia según el volumen y la antigüedad", () => {
    // 0 pedidos
    expect(clasificarRecurrenciaCliente(0, 0, 0)).toBe("Sin compras");

    // 1 pedido reciente
    expect(clasificarRecurrenciaCliente(1, 10, 0)).toBe("Nuevo");

    // 2 pedidos recientes
    expect(clasificarRecurrenciaCliente(2, 15, 20)).toBe("Ocasional");

    // 4 pedidos recientes
    expect(clasificarRecurrenciaCliente(4, 10, 15)).toBe("Recurrente");

    // >= 5 pedidos recientes
    expect(clasificarRecurrenciaCliente(6, 5, 12)).toBe("VIP / Frecuente");

    // Cliente con muchas compras pero inactivo por más de 60 días
    expect(clasificarRecurrenciaCliente(5, 75, 15)).toBe("Inactivo (> 60 días)");
  });

  it("maneja correctamente un cliente sin pedidos", () => {
    const metricas = calcularMetricasCliente([], ahora);

    expect(metricas.total_pedidos_activos).toBe(0);
    expect(metricas.total_gastado_usd).toBe(0);
    expect(metricas.saldo_pendiente_usd).toBe(0);
    expect(metricas.ticket_promedio_usd).toBe(0);
    expect(metricas.fecha_primera_compra).toBeNull();
    expect(metricas.fecha_ultima_compra).toBeNull();
    expect(metricas.dias_desde_ultima_compra).toBeNull();
    expect(metricas.frecuencia_dias_promedio).toBeNull();
    expect(metricas.clasificacion).toBe("Sin compras");
    expect(metricas.historial_pedidos.length).toBe(0);
  });
});
