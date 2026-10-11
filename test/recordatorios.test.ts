import { describe, expect, it } from "vitest";
import {
  calcularAntiguedadHoras,
  clasificarUmbralAntiguedad,
  generarMensajeRecordatorioRetiro,
  ordenarPedidosPorAntiguedad,
  type PedidoListoRecordatorio,
} from "@/lib/notificaciones/recordatorios";

describe("T-016 — Panel de recordatorios 48–72 h (RF-09)", () => {
  describe("cálculo de horas y clasificación de umbrales", () => {
    it("calcula correctamente las horas transcurridas desde listo_en", () => {
      const ahora = new Date("2026-10-10T12:00:00Z");
      const hace24h = "2026-10-09T12:00:00Z";
      const hace50h = "2026-10-08T10:00:00Z";
      const hace80h = "2026-10-07T04:00:00Z";

      expect(calcularAntiguedadHoras(hace24h, ahora)).toBe(24);
      expect(calcularAntiguedadHoras(hace50h, ahora)).toBe(50);
      expect(calcularAntiguedadHoras(hace80h, ahora)).toBe(80);
    });

    it("clasifica en los umbrales correctos (<48h, 48-72h, >=72h)", () => {
      expect(clasificarUmbralAntiguedad(20)).toBe("reciente");
      expect(clasificarUmbralAntiguedad(47.9)).toBe("reciente");
      expect(clasificarUmbralAntiguedad(48)).toBe("atencion_48h");
      expect(clasificarUmbralAntiguedad(60)).toBe("atencion_48h");
      expect(clasificarUmbralAntiguedad(71.9)).toBe("atencion_48h");
      expect(clasificarUmbralAntiguedad(72)).toBe("urgente_72h");
      expect(clasificarUmbralAntiguedad(120)).toBe("urgente_72h");
    });
  });

  describe("ordenamiento por antigüedad", () => {
    it("ordena pedidos del más antiguo al más reciente (mayor tiempo de espera primero)", () => {
      const pedidos: PedidoListoRecordatorio[] = [
        {
          id: "p1",
          numeroOrden: 1,
          nombreCliente: "Cliente A",
          horasTranscurridas: 25,
          totalUsd: 100,
          saldoUsd: 50,
          telefono: "04141112233",
        },
        {
          id: "p2",
          numeroOrden: 2,
          nombreCliente: "Cliente B",
          horasTranscurridas: 75,
          totalUsd: 200,
          saldoUsd: 0,
          telefono: "04142223344",
        },
        {
          id: "p3",
          numeroOrden: 3,
          nombreCliente: "Cliente C",
          horasTranscurridas: 49,
          totalUsd: 80,
          saldoUsd: 80,
          telefono: "04143334455",
        },
      ];

      const ordenados = ordenarPedidosPorAntiguedad(pedidos);

      expect(ordenados.map((p) => p.numeroOrden)).toEqual([2, 3, 1]);
    });
  });

  describe("generación de mensaje de recordatorio", () => {
    it("genera mensaje de recordatorio de atención (48h) con saldo pendiente", () => {
      const mensaje = generarMensajeRecordatorioRetiro({
        nombreCliente: "Comercializadora XYZ",
        numeroOrden: 88,
        horasTranscurridas: 52,
        totalUsd: 120.0,
        saldoUsd: 60.0,
        tasaBsPorUsd: 40.0,
      });

      expect(mensaje).toContain("Comercializadora XYZ");
      expect(mensaje).toContain("ORD-0088");
      expect(mensaje).toContain("recordatorio");
      expect(mensaje).toContain("*más de 48 horas listo*");
      expect(mensaje).toContain("*Saldo pendiente:* $60.00 USD");
      expect(mensaje).toContain("Bs. 2,400.00");
    });

    it("genera mensaje de recordatorio urgente (72h) solicitando retiro prioritario", () => {
      const mensaje = generarMensajeRecordatorioRetiro({
        nombreCliente: "Agencia Creativa",
        numeroOrden: 12,
        horasTranscurridas: 96,
        totalUsd: 300.0,
        saldoUsd: 0,
        tasaBsPorUsd: 40.0,
      });

      expect(mensaje).toContain("Agencia Creativa");
      expect(mensaje).toContain("ORD-0012");
      expect(mensaje).toContain("más de 3 días");
      expect(mensaje).toContain("100% Pagado");
      expect(mensaje).toContain("espacio en nuestro almacén");
    });
  });
});
