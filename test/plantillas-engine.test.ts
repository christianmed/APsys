import { describe, expect, it } from "vitest";
import {
  PLANTILLAS_POR_DEFECTO,
  renderizarPlantilla,
  validarVariablesPlantilla,
} from "@/lib/notificaciones/plantillas";

describe("T-017 — Motor de plantillas y variables (RF-10)", () => {
  describe("validación de variables de plantilla", () => {
    it("acepta plantillas con variables válidas", () => {
      const texto =
        "Hola {cliente}, su orden #{orden} tiene total de ${total} y saldo ${saldo}.";
      const resultado = validarVariablesPlantilla(texto);
      expect(resultado.valido).toBe(true);
      expect(resultado.variablesDesconocidas).toHaveLength(0);
    });

    it("detecta variables no permitidas o mal escritas", () => {
      const texto =
        "Hola {cliente}, su código es {codigo_secreto} y su {descuento_invalido} aplica.";
      const resultado = validarVariablesPlantilla(texto);
      expect(resultado.valido).toBe(false);
      expect(resultado.variablesDesconocidas).toEqual([
        "{codigo_secreto}",
        "{descuento_invalido}",
      ]);
    });

    it("ignora texto normal entre llaves que no sea un tag o llaves vacías", () => {
      const texto = "Texto sin variables {} y con {cliente}.";
      const resultado = validarVariablesPlantilla(texto);
      expect(resultado.valido).toBe(true);
    });
  });

  describe("renderizado e interpolación de variables", () => {
    it("interpola correctamente todas las variables soportadas", () => {
      const plantilla =
        "Hola {cliente}, su orden #{orden} está lista. Total: ${total} USD, Saldo: ${saldo} USD (Bs. {saldo_bs} a tasa {tasa}). Días en espera: {dias}.";

      const resultado = renderizarPlantilla(plantilla, {
        cliente: "Inversiones ABC",
        orden: "ORD-0005",
        total: 150.0,
        saldo: 50.0,
        saldoBs: 2000.0,
        tasa: 40.0,
        dias: 2,
      });

      expect(resultado).toBe(
        "Hola Inversiones ABC, su orden #ORD-0005 está lista. Total: $150.00 USD, Saldo: $50.00 USD (Bs. 2,000.00 a tasa 40.00). Días en espera: 2.",
      );
    });

    it("soporta valores numéricos en 0 y cliente vacío con fallback", () => {
      const plantilla = "Cliente: {cliente}, Saldo: ${saldo}";
      const resultado = renderizarPlantilla(plantilla, {
        cliente: "",
        saldo: 0,
      });

      expect(resultado).toBe("Cliente: Cliente, Saldo: $0.00");
    });

    it("las plantillas por defecto se renderizan sin arrojar error", () => {
      const aviso = renderizarPlantilla(PLANTILLAS_POR_DEFECTO.aviso_retiro, {
        cliente: "Pedro",
        orden: "ORD-0001",
        total: 100,
        saldo: 0,
      });
      expect(aviso).toContain("Pedro");
      expect(aviso).toContain("ORD-0001");

      const recordatorio = renderizarPlantilla(
        PLANTILLAS_POR_DEFECTO.recordatorio,
        {
          cliente: "María",
          orden: "ORD-0002",
          total: 80,
          saldo: 30,
          dias: 3,
        },
      );
      expect(recordatorio).toContain("María");
      expect(recordatorio).toContain("ORD-0002");
    });
  });
});
