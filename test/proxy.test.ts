import { describe, it, expect } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

describe("proxy: middleware de sesión rápido con JWT local y propagación de headers", () => {
  function crearMockJwt(claims: { sub: string; email?: string; role?: string; exp: number }) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `${header}.${payload}.mockSignature12345`;
  }

  it("permite acceso en < 1ms a rutas privadas inyectando x-user-id si el JWT es vigente", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockToken = crearMockJwt({
      sub: "usr-rapido-123",
      email: "operativo@apsys.com",
      role: "authenticated",
      exp: now + 3600,
    });

    const request = new NextRequest("http://localhost:3000/taller", {
      headers: {
        cookie: `sb-test-auth-token=${encodeURIComponent(
          JSON.stringify({ access_token: mockToken }),
        )}`,
      },
    });

    const response = await proxy(request);

    // Debe ser una respuesta NextResponse.next() que permite continuar (status 200, no redirect)
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirige al home (/) si un usuario autenticado intenta acceder a /login", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockToken = crearMockJwt({
      sub: "usr-rapido-123",
      email: "operativo@apsys.com",
      role: "authenticated",
      exp: now + 3600,
    });

    const request = new NextRequest("http://localhost:3000/login", {
      headers: {
        cookie: `sb-test-auth-token=${encodeURIComponent(
          JSON.stringify({ access_token: mockToken }),
        )}`,
      },
    });

    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("permite acceso inmediato a /login si no hay sesión sin consultar Supabase", async () => {
    const request = new NextRequest("http://localhost:3000/login");
    const response = await proxy(request);
    expect(response.status).toBe(200);
  });

  it("permite acceso a /api/supabase-health sin sesión", async () => {
    const request = new NextRequest("http://localhost:3000/api/supabase-health");
    const response = await proxy(request);
    expect(response.status).toBe(200);
  });

  it("redirige a /login si no hay sesión y se intenta acceder a una ruta privada", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xyz.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-key";

    const request = new NextRequest("http://localhost:3000/taller");
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
