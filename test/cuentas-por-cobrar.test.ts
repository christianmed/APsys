import { describe, expect, it } from "vitest";
import {
  calcularAntiguedadDias,
  clasificarTramoAntiguedad,
  calcularCuentasPorCobrar,
  filtrarYOrdenarCuentas,
  generarMensajeCobranza,
  type PedidoConDeudaInput,
} from "@/lib/cobranzas/cuentas-por-cobrar";

describe("Cálculos de cuentas por cobrar y antigüedad (T-020a)", () => {
  const ahora = new Date("2026-10-10T12:00:00Z");

  it("calcula los días de antigüedad correctamente", () => {
    const fecha5Dias = new Date("2026-10-05T12:00:00Z");
    const fecha20Dias = new Date("2026-09-20T12:00:00Z");

    expect(calcularAntiguedadDias(fecha5Dias, ahora)).toBe(5);
    expect(calcularAntiguedadDias(fecha20Dias, ahora)).toBe(20);
    expect(calcularAntiguedadDias(ahora, ahora)).toBe(0);
  });

  it("clasifica en los tramos de antigüedad correctos", () => {
    expect(clasificarTramoAntiguedad(3)).toBe("0_a_7");
    expect(clasificarTramoAntiguedad(7)).toBe("0_a_7");
    expect(clasificarTramoAntiguedad(8)).toBe("8_a_15");
    expect(clasificarTramoAntiguedad(15)).toBe("8_a_15");
    expect(clasificarTramoAntiguedad(16)).toBe("16_a_30");
    expect(clasificarTramoAntiguedad(30)).toBe("16_a_30");
    expect(clasificarTramoAntiguedad(31)).toBe("mas_de_30");
    expect(clasificarTramoAntiguedad(60)).toBe("mas_de_30");
  });

  it("calcula saldos pendientes en USD y Bs omitiendo pedidos cancelados o sin saldo", () => {
    const pedidos: PedidoConDeudaInput[] = [
      {
        id: "p1",
        numero_orden: "ORD-001",
        cliente_id: "c1",
        cliente_nombre: "Acme Corp",
        cliente_telefono: "04141234567",
        estado: "listo_para_retiro",
        anulado: false,
        total_usd: 100,
        tasa_valor: 40,
        creado_en: "2026-10-05T12:00:00Z", // 5 días -> 0_a_7
        pagos: [
          { monto: 40, moneda: "USD", tasa_valor: 40 }, // abonó 40 USD, debe 60 USD
        ],
      },
      {
        id: "p2",
        numero_orden: "ORD-002",
        cliente_id: "c2",
        cliente_nombre: "Boutique Glam",
        cliente_telefono: "04249876543",
        estado: "en_diseno",
        anulado: false,
        total_usd: 200,
        tasa_valor: 40,
        creado_en: "2026-09-20T12:00:00Z", // 20 días -> 16_a_30
        pagos: [
          { monto: 2000, moneda: "VES", tasa_valor: 40 }, // abonó 50 USD eq, debe 150 USD
        ],
      },
      {
        id: "p3",
        numero_orden: "ORD-003",
        cliente_id: "c3",
        cliente_nombre: "Totalmente Pagado",
        cliente_telefono: "04120000000",
        estado: "entregado",
        anulado: false,
        total_usd: 80,
        tasa_valor: 40,
        creado_en: "2026-09-01T12:00:00Z",
        pagos: [
          { monto: 80, moneda: "USD", tasa_valor: 40 }, // saldo 0 -> no debe figurar
        ],
      },
      {
        id: "p4",
        numero_orden: "ORD-004",
        cliente_id: "c4",
        cliente_nombre: "Pedido Anulado",
        cliente_telefono: "04121111111",
        estado: "pendiente",
        anulado: true, // anulado -> no debe figurar
        total_usd: 150,
        tasa_valor: 40,
        creado_en: "2026-08-01T12:00:00Z",
        pagos: [],
      },
      {
        id: "p5",
        numero_orden: "ORD-005",
        cliente_id: "c1", // mismo cliente c1
        cliente_nombre: "Acme Corp",
        cliente_telefono: "04141234567",
        estado: "entregado",
        anulado: false,
        total_usd: 50,
        tasa_valor: 40,
        creado_en: "2026-08-10T12:00:00Z", // 61 días -> mas_de_30
        pagos: [], // debe 50 USD
      },
    ];

    const resultado = calcularCuentasPorCobrar(pedidos, ahora);

    expect(resultado.cuentas.length).toBe(3); // p1, p2, p5
    expect(resultado.resumen.total_pedidos_con_deuda).toBe(3);
    expect(resultado.resumen.total_clientes_deudores).toBe(2); // c1 y c2
    expect(resultado.resumen.total_por_cobrar_usd).toBe(260); // 60 + 150 + 50
    expect(resultado.resumen.total_por_cobrar_bs).toBe(10400); // 260 * 40

    // Verificación de tramos
    expect(resultado.resumen.tramos["0_a_7"].monto_usd).toBe(60);
    expect(resultado.resumen.tramos["0_a_7"].cantidad).toBe(1);

    expect(resultado.resumen.tramos["8_a_15"].monto_usd).toBe(0);
    expect(resultado.resumen.tramos["8_a_15"].cantidad).toBe(0);

    expect(resultado.resumen.tramos["16_a_30"].monto_usd).toBe(150);
    expect(resultado.resumen.tramos["16_a_30"].cantidad).toBe(1);

    expect(resultado.resumen.tramos["mas_de_30"].monto_usd).toBe(50);
    expect(resultado.resumen.tramos["mas_de_30"].cantidad).toBe(1);
  });

  it("filtra por tramo y por búsqueda de cliente", () => {
    const pedidos: PedidoConDeudaInput[] = [
      {
        id: "p1",
        numero_orden: "ORD-001",
        cliente_id: "c1",
        cliente_nombre: "Acme Corp",
        cliente_telefono: "04141234567",
        estado: "listo_para_retiro",
        anulado: false,
        total_usd: 100,
        tasa_valor: 40,
        creado_en: "2026-10-05T12:00:00Z", // 0_a_7
        pagos: [],
      },
      {
        id: "p2",
        numero_orden: "ORD-002",
        cliente_id: "c2",
        cliente_nombre: "Boutique Glam",
        cliente_telefono: "04249876543",
        estado: "en_impresion",
        anulado: false,
        total_usd: 200,
        tasa_valor: 40,
        creado_en: "2026-08-01T12:00:00Z", // mas_de_30
        pagos: [],
      },
    ];

    const { cuentas } = calcularCuentasPorCobrar(pedidos, ahora);

    // Filtro por tramo
    const soloCriticos = filtrarYOrdenarCuentas(cuentas, {
      tramo: "mas_de_30",
      busqueda: "",
      ordenarPor: "mayor_saldo",
    });
    expect(soloCriticos.length).toBe(1);
    expect(soloCriticos[0].numero_orden).toBe("ORD-002");

    // Filtro por búsqueda
    const busquedaAcme = filtrarYOrdenarCuentas(cuentas, {
      tramo: "todos",
      busqueda: "acme",
      ordenarPor: "mayor_saldo",
    });
    expect(busquedaAcme.length).toBe(1);
    expect(busquedaAcme[0].numero_orden).toBe("ORD-001");
  });

  it("genera mensaje de recordatorio de cobranza formal con enlace wa.me", () => {
    const cuenta = {
      numero_orden: "ORD-042",
      cliente_nombre: "Inversiones Los Andes",
      cliente_telefono: "0414-123.45.67",
      saldo_usd: 45.5,
      saldo_bs: 1820,
      dias_antiguedad: 12,
    };

    const { mensaje, enlaceWhatsApp } = generarMensajeCobranza(cuenta);

    expect(mensaje).toContain("Inversiones Los Andes");
    expect(mensaje).toContain("ORD-042");
    expect(mensaje).toContain("$45.50");
    expect(mensaje).toContain("Bs. 1.820,00");
    expect(enlaceWhatsApp).toContain("https://wa.me/584141234567?text=");
  });
});
