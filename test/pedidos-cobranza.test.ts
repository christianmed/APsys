import { describe, expect, it } from "vitest";
import {
  calcularCobranzaInicial,
  validarCobranzaInicial,
  type CobranzaInicialEntrada,
} from "@/app/pedidos/cobranza";

describe("calcularCobranzaInicial — lógica multimoneda y saldos (RF-02)", () => {
  const TASA_PRUEBA = 40.0; // 40.00 Bs por 1 USD

  it("caso 1: sin abono (monto 0) → saldo es el total completo en ambas monedas", () => {
    const totalUsd = 100.0;
    const entrada: CobranzaInicialEntrada = {
      monto: 0,
      moneda: "USD",
      referencia: null,
    };

    const res = calcularCobranzaInicial(totalUsd, entrada, TASA_PRUEBA);

    expect(res.tieneAbono).toBe(false);
    expect(res.abonoUsd).toBe(0);
    expect(res.saldoUsd).toBe(100.0);
    expect(res.saldoBs).toBe(4000.0);
    expect(res.esPagoCompleto).toBe(false);
  });

  it("caso 2: abono parcial en USD → saldo automático restante en USD y Bs", () => {
    const totalUsd = 100.0;
    const entrada: CobranzaInicialEntrada = {
      monto: 35.5,
      moneda: "USD",
      referencia: "Efectivo USD",
    };

    const res = calcularCobranzaInicial(totalUsd, entrada, TASA_PRUEBA);

    expect(res.tieneAbono).toBe(true);
    expect(res.abonoUsd).toBe(35.5);
    expect(res.saldoUsd).toBe(64.5);
    expect(res.saldoBs).toBe(2580.0); // 64.50 * 40
    expect(res.esPagoCompleto).toBe(false);
  });

  it("caso 3: abono total en USD → saldo 0", () => {
    const totalUsd = 100.0;
    const entrada: CobranzaInicialEntrada = {
      monto: 100.0,
      moneda: "USD",
      referencia: "Zelle 98213",
    };

    const res = calcularCobranzaInicial(totalUsd, entrada, TASA_PRUEBA);

    expect(res.tieneAbono).toBe(true);
    expect(res.abonoUsd).toBe(100.0);
    expect(res.saldoUsd).toBe(0);
    expect(res.saldoBs).toBe(0);
    expect(res.esPagoCompleto).toBe(true);
  });

  it("caso 4: abono parcial en Bs → conversión exacta a USD y saldo restante", () => {
    const totalUsd = 100.0; // Equivale a 4000.00 Bs
    const entrada: CobranzaInicialEntrada = {
      monto: 1000.0, // 1000 Bs / 40 = $25.00 USD
      moneda: "Bs",
      referencia: "PagoMovil BDV 4567",
    };

    const res = calcularCobranzaInicial(totalUsd, entrada, TASA_PRUEBA);

    expect(res.tieneAbono).toBe(true);
    expect(res.abonoUsd).toBe(25.0);
    expect(res.saldoUsd).toBe(75.0);
    expect(res.saldoBs).toBe(3000.0);
    expect(res.esPagoCompleto).toBe(false);
  });

  it("caso 5: abono total en Bs → saldo 0", () => {
    const totalUsd = 50.0; // Equivale a 2000.00 Bs
    const entrada: CobranzaInicialEntrada = {
      monto: 2000.0,
      moneda: "Bs",
      referencia: "Transferencia Banesco",
    };

    const res = calcularCobranzaInicial(totalUsd, entrada, TASA_PRUEBA);

    expect(res.tieneAbono).toBe(true);
    expect(res.abonoUsd).toBe(50.0);
    expect(res.saldoUsd).toBe(0);
    expect(res.saldoBs).toBe(0);
    expect(res.esPagoCompleto).toBe(true);
  });
});

describe("validarCobranzaInicial — validaciones de entrada y casos borde", () => {
  const TASA_PRUEBA = 40.0;

  it("monto negativo → error de validación", () => {
    const res = validarCobranzaInicial(
      100.0,
      { monto: -10, moneda: "USD", referencia: null },
      TASA_PRUEBA,
    );

    expect(res.errores.monto).toBe(
      "El monto del abono debe ser mayor o igual a 0.",
    );
  });

  it("abono en USD excede el total del pedido → error de excedente", () => {
    const res = validarCobranzaInicial(
      50.0,
      { monto: 50.01, moneda: "USD", referencia: null },
      TASA_PRUEBA,
    );

    expect(res.errores.monto).toBe(
      "El abono no puede ser mayor al total del pedido ($50.00 USD).",
    );
  });

  it("abono en Bs excede el total del pedido en Bs → error de excedente", () => {
    // 50 USD * 40 = 2000 Bs
    const res = validarCobranzaInicial(
      50.0,
      { monto: 2050, moneda: "Bs", referencia: null },
      TASA_PRUEBA,
    );

    expect(res.errores.monto).toBe(
      "El abono no puede ser mayor al total del pedido (2,000.00 Bs.).",
    );
  });

  it("moneda no permitida → error de moneda", () => {
    const res = validarCobranzaInicial(
      50.0,
      // @ts-expect-error probando valor inválido
      { monto: 10, moneda: "EUR", referencia: null },
      TASA_PRUEBA,
    );

    expect(res.errores.moneda).toBe("La moneda debe ser 'USD' o 'Bs'.");
  });

  it("tasa de cambio menor o igual a 0 → error de tasa", () => {
    const res = validarCobranzaInicial(
      50.0,
      { monto: 10, moneda: "USD", referencia: null },
      0,
    );

    expect(res.errores.tasa).toBe("La tasa de cambio debe ser mayor a 0.");
  });

  it("normaliza espacios en la referencia de pago", () => {
    const res = validarCobranzaInicial(
      100.0,
      { monto: 50, moneda: "USD", referencia: "   Zelle #4912   " },
      TASA_PRUEBA,
    );

    expect(res.errores).toEqual({});
    expect(res.datos.referencia).toBe("Zelle #4912");
  });
});
