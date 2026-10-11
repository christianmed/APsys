import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Carga credenciales de prueba desde .env.local (si existe) para el E2E de login.
// En CI no hay archivo: los tests que requieren credenciales se omiten solos.
try {
  for (const linea of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const coincidencia = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (coincidencia && process.env[coincidencia[1]] === undefined) {
      process.env[coincidencia[1]] = coincidencia[2].replace(
        /^["']|["']$/g,
        "",
      );
    }
  }
} catch {
  // Sin .env.local: continuar sin credenciales.
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
