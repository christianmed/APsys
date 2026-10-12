import { describe, it, expect } from "vitest";
import {
  extraerTokenJwtDeCookies,
  decodificarJwtPayload,
  esTokenVigente,
  extraerUsuarioVigenteDeCookies,
} from "@/lib/supabase/jwt-session";

describe("jwt-session: extracción y validación de tokens de Supabase", () => {
  function crearMockJwt(claims: { sub: string; email?: string; role?: string; exp: number }) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `${header}.${payload}.mockSignature12345`;
  }

  describe("decodificarJwtPayload", () => {
    it("decodifica correctamente los claims de un JWT bien formado", () => {
      const now = Math.floor(Date.now() / 1000);
      const token = crearMockJwt({
        sub: "usr-001",
        email: "test@apsys.com",
        role: "authenticated",
        exp: now + 3600,
      });

      const claims = decodificarJwtPayload(token);
      expect(claims).not.toBeNull();
      expect(claims?.sub).toBe("usr-001");
      expect(claims?.email).toBe("test@apsys.com");
      expect(claims?.role).toBe("authenticated");
      expect(claims?.exp).toBe(now + 3600);
    });

    it("retorna null si el token no tiene 3 partes o es inválido", () => {
      expect(decodificarJwtPayload("invalido")).toBeNull();
      expect(decodificarJwtPayload("parte1.parte2")).toBeNull();
      expect(decodificarJwtPayload("p1.no-es-base64-json.p3")).toBeNull();
    });
  });

  describe("esTokenVigente", () => {
    it("retorna true si exp está en el futuro", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: "usr-001", exp: now + 600 };
      expect(esTokenVigente(payload)).toBe(true);
    });

    it("retorna false si exp está en el pasado", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: "usr-001", exp: now - 10 };
      expect(esTokenVigente(payload)).toBe(false);
    });

    it("respeta el margen de seguridad si se especifica", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: "usr-001", exp: now + 20 };
      // Si el margen es de 30 segundos, un token que expira en 20s debe considerarse no vigente
      expect(esTokenVigente(payload, 30)).toBe(false);
      // Si el margen es de 10 segundos, es vigente
      expect(esTokenVigente(payload, 10)).toBe(true);
    });

    it("retorna false si el payload es null o no tiene exp numérico", () => {
      expect(esTokenVigente(null)).toBe(false);
      expect(esTokenVigente({ sub: "usr-001", exp: undefined as unknown as number })).toBe(false);
    });
  });

  describe("extraerTokenJwtDeCookies", () => {
    it("extrae el token de una cookie JSON estándar de Supabase", () => {
      const now = Math.floor(Date.now() / 1000);
      const mockToken = crearMockJwt({ sub: "usr-001", exp: now + 3600 });
      const cookieValue = JSON.stringify({
        access_token: mockToken,
        expires_at: now + 3600,
        user: { id: "usr-001" },
      });

      const cookies = [{ name: "sb-myproj-auth-token", value: cookieValue }];
      const token = extraerTokenJwtDeCookies(cookies);
      expect(token).toBe(mockToken);
    });

    it("soporta cookies divididas en chunks (.0, .1)", () => {
      const now = Math.floor(Date.now() / 1000);
      const mockToken = crearMockJwt({ sub: "usr-chunk", exp: now + 3600 });
      const fullValue = JSON.stringify({ access_token: mockToken });
      const mitad = Math.floor(fullValue.length / 2);
      const chunk0 = fullValue.slice(0, mitad);
      const chunk1 = fullValue.slice(mitad);

      const cookies = [
        { name: "sb-proj-auth-token.1", value: chunk1 },
        { name: "sb-proj-auth-token.0", value: chunk0 },
      ];

      const token = extraerTokenJwtDeCookies(cookies);
      expect(token).toBe(mockToken);
    });

    it("soporta cookies codificadas con prefijo base64-", () => {
      const now = Math.floor(Date.now() / 1000);
      const mockToken = crearMockJwt({ sub: "usr-b64", exp: now + 3600 });
      const jsonStr = JSON.stringify({ access_token: mockToken });
      const base64Value = `base64-${Buffer.from(jsonStr).toString("base64")}`;

      const cookies = [{ name: "sb-proj-auth-token", value: base64Value }];
      const token = extraerTokenJwtDeCookies(cookies);
      expect(token).toBe(mockToken);
    });

    it("retorna null si no hay cookies de Supabase auth", () => {
      const cookies = [
        { name: "otra_cookie", value: "valor" },
        { name: "session_id", value: "123" },
      ];
      expect(extraerTokenJwtDeCookies(cookies)).toBeNull();
      expect(extraerTokenJwtDeCookies([])).toBeNull();
    });
  });

  describe("extraerUsuarioVigenteDeCookies", () => {
    it("retorna el usuario completo si la cookie contiene un JWT vigente", () => {
      const now = Math.floor(Date.now() / 1000);
      const mockToken = crearMockJwt({
        sub: "user-uuid-999",
        email: "operativo@apsys.com",
        role: "authenticated",
        exp: now + 1800,
      });

      const cookies = [
        {
          name: "sb-apsys-auth-token",
          value: JSON.stringify({ access_token: mockToken }),
        },
      ];

      const usuario = extraerUsuarioVigenteDeCookies(cookies);
      expect(usuario).not.toBeNull();
      expect(usuario?.id).toBe("user-uuid-999");
      expect(usuario?.email).toBe("operativo@apsys.com");
      expect(usuario?.role).toBe("authenticated");
    });

    it("retorna null si el token en la cookie ha expirado", () => {
      const now = Math.floor(Date.now() / 1000);
      const tokenExpirado = crearMockJwt({
        sub: "user-expirado",
        email: "expirado@apsys.com",
        exp: now - 60,
      });

      const cookies = [
        {
          name: "sb-apsys-auth-token",
          value: JSON.stringify({ access_token: tokenExpirado }),
        },
      ];

      expect(extraerUsuarioVigenteDeCookies(cookies)).toBeNull();
    });
  });
});
