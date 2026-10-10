import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("une las clases con un espacio", () => {
    expect(cn("pedido", "urgente")).toBe("pedido urgente");
  });

  it("omite valores falsy", () => {
    expect(cn("base", false, null, undefined, "", "activo")).toBe(
      "base activo",
    );
  });

  it("devuelve cadena vacía sin clases", () => {
    expect(cn()).toBe("");
  });
});
