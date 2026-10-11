import { describe, expect, it } from "vitest";
import {
  calcularConversionBsUsd,
  calcularConversionUsdBs,
  obtenerTasaVigenteParaFecha,
  validarEntradaTasa,
  type TasaHistorica,
} from "@/lib/tasas/tasas";

describe("Tasa de cambio y congelamiento histórico (T-023a / RF-15)", () => {
  const historialTasas: TasaHistorica[] = [
    {
      id: "t1",
      valor_bs_por_usd: 36.5,
      vigente_desde: "2026-08-01T00:00:00Z",
    },
    {
      id: "t2",
      valor_bs_por_usd: 40.0,
      vigente_desde: "2026-09-01T00:00:00Z",
    },
    {
      id: "t3",
      valor_bs_por_usd: 42.5,
      vigente_desde: "2026-10-01T00:00:00Z",
    },
  ];

  it("resuelve la tasa vigente correcta según la fecha cronológica", () => {
    // Fecha en agosto: debe tomar t1 (36.5)
    const tasaAgosto = obtenerTasaVigenteParaFecha(
      historialTasas,
      new Date("2026-08-15T12:00:00Z"),
    );
    expect(tasaAgosto?.id).toBe("t1");
    expect(tasaAgosto?.valor_bs_por_usd).toBe(36.5);

    // Fecha en septiembre: debe tomar t2 (40.0)
    const tasaSeptiembre = obtenerTasaVigenteParaFecha(
      historialTasas,
      new Date("2026-09-10T12:00:00Z"),
    );
    expect(tasaSeptiembre?.id).toBe("t2");
    expect(tasaSeptiembre?.valor_bs_por_usd).toBe(40.0);

    // Fecha en octubre o actual: debe tomar t3 (42.5)
    const tasaActual = obtenerTasaVigenteParaFecha(
      historialTasas,
      new Date("2026-10-10T12:00:00Z"),
    );
    expect(tasaActual?.id).toBe("t3");
    expect(tasaActual?.valor_bs_por_usd).toBe(42.5);
  });

  it("garantiza que cambiar la tasa no altera los pedidos históricos congelados", () => {
    // Pedido creado en agosto con tasa t1 congelada
    const pedidoAgosto = {
      id: "ord-1",
      total_usd: 100,
      tasa_id: "t1",
      tasa_valor: 36.5,
      total_bs: calcularConversionBsUsd(100, 36.5), // Bs. 3650.00
    };

    expect(pedidoAgosto.total_bs).toBe(3650);

    // Se registra una nueva tasa t4 en octubre
    const nuevaTasa: TasaHistorica = {
      id: "t4",
      valor_bs_por_usd: 45.0,
      vigente_desde: "2026-10-11T00:00:00Z",
    };
    const historialActualizado = [...historialTasas, nuevaTasa];

    // 1. El pedido previo sigue usando su tasa congelada intacta (36.5 -> 3650 Bs)
    const pedidoAgostoRecalculado = {
      ...pedidoAgosto,
      total_bs: calcularConversionBsUsd(pedidoAgosto.total_usd, pedidoAgosto.tasa_valor),
    };
    expect(pedidoAgostoRecalculado.total_bs).toBe(3650);

    // 2. Un nuevo pedido creado hoy después de la nueva tasa usa la nueva tasa (45.0)
    const tasaParaNuevoPedido = obtenerTasaVigenteParaFecha(
      historialActualizado,
      new Date("2026-10-11T12:00:00Z"),
    );
    expect(tasaParaNuevoPedido?.id).toBe("t4");

    const nuevoPedido = {
      id: "ord-2",
      total_usd: 100,
      tasa_id: tasaParaNuevoPedido!.id,
      tasa_valor: tasaParaNuevoPedido!.valor_bs_por_usd,
      total_bs: calcularConversionBsUsd(100, tasaParaNuevoPedido!.valor_bs_por_usd),
    };
    expect(nuevoPedido.total_bs).toBe(4500); // 100 * 45.0 = Bs. 4500.00
  });

  it("calcula conversiones exactas al centavo entre USD y Bolívares", () => {
    // 100 USD a 41.25 Bs/USD = 4125.00 Bs
    expect(calcularConversionBsUsd(100, 41.25)).toBe(4125);

    // 15.50 USD a 41.25 Bs/USD = 639.38 Bs
    expect(calcularConversionBsUsd(15.5, 41.25)).toBe(639.38);

    // 4125 Bs a 41.25 Bs/USD = 100.00 USD
    expect(calcularConversionUsdBs(4125, 41.25)).toBe(100);

    // Tasa no válida o 0 no genera Infinity ni NaN
    expect(calcularConversionUsdBs(100, 0)).toBe(0);
  });

  it("valida la entrada numérica de una nueva tasa de cambio", () => {
    // Entradas válidas
    expect(validarEntradaTasa("42.50").valido).toBe(true);
    expect(validarEntradaTasa("42,50").valido).toBe(true); // Soporta coma decimal
    expect(validarEntradaTasa(" 50 ").valido).toBe(true);
    expect(validarEntradaTasa("45.1234").valido).toBe(true);

    // Entradas inválidas
    expect(validarEntradaTasa("").valido).toBe(false);
    expect(validarEntradaTasa("0").valido).toBe(false);
    expect(validarEntradaTasa("-12.5").valido).toBe(false);
    expect(validarEntradaTasa("abc").valido).toBe(false);
  });
});
