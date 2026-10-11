import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("T-026 — Verificación de configuración de despliegue en Vercel y producción", () => {
  it("vercel.json existe y define cabeceras HTTP de seguridad estrictas", () => {
    const rutaVercel = resolve(process.cwd(), "vercel.json");
    const contenido = JSON.parse(readFileSync(rutaVercel, "utf-8"));

    expect(contenido.framework).toBe("nextjs");
    expect(contenido.headers).toBeInstanceOf(Array);

    const cabecerasGlobales = contenido.headers[0].headers;
    const nombresCabeceras = cabecerasGlobales.map((h: { key: string }) => h.key);

    expect(nombresCabeceras).toContain("X-Content-Type-Options");
    expect(nombresCabeceras).toContain("X-Frame-Options");
    expect(nombresCabeceras).toContain("Strict-Transport-Security");
    expect(nombresCabeceras).toContain("Referrer-Policy");
  });

  it(".env.example documenta todas las variables requeridas para producción", () => {
    const rutaEnv = resolve(process.cwd(), ".env.example");
    const contenido = readFileSync(rutaEnv, "utf-8");

    expect(contenido).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(contenido).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(contenido).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(contenido).toContain("NEXT_PUBLIC_APP_URL");
  });
});
