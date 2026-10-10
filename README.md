# APSys

Plataforma web para la gestión y notificación de pedidos de una gráfica: clientes, cobranza multi-moneda, comanda imprimible, taller y métricas gerenciales.

## Stack

- [Next.js](https://nextjs.org) 16 — App Router, TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4
- [Lucide](https://lucide.dev) — iconos
- [Supabase](https://supabase.com) — base de datos y autenticación (se conecta en T-002)
- ESLint + Prettier

## Requisitos

- Node.js 24+
- npm

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # completar con las credenciales del proyecto Supabase (dev)
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Comandos

| Comando             | Descripción                                             |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Levanta el servidor de desarrollo                       |
| `npm run build`     | Build de producción                                     |
| `npm run start`     | Sirve el build de producción (requiere `npm run build`) |
| `npm run lint`      | ESLint                                                  |
| `npm run typecheck` | Verificación de tipos (`next typegen && tsc --noEmit`)  |
| `npm test`          | Pruebas unitarias con Vitest (`vitest run`)             |
| `npm run test:e2e`  | Pruebas E2E con Playwright (Chromium)                   |
| `npm run format`    | Formatea el código con Prettier                         |

## Pruebas

El proyecto sigue TDD: primero un test que falle, luego el código que lo haga pasar.

- **Unitarias** (Vitest + Testing Library, entorno jsdom): en `test/`, archivos `*.test.ts(x)`.
- **E2E** (Playwright, Chromium): en `e2e/`, archivos `*.spec.ts`. El servidor se levanta automáticamente.

```bash
npm test           # pruebas unitarias (una sola pasada)
npm run test:e2e   # pruebas E2E (requiere npx playwright install chromium la primera vez)
```

La CI (`.github/workflows/ci.yml`) ejecuta lint, typecheck, unitarias, build y E2E en cada push a `main` y en cada pull request.

## Estructura

- `app/` — rutas y vistas (App Router)
- `lib/` — utilidades y lógica compartida
- `test/` — pruebas unitarias (Vitest)
- `e2e/` — pruebas end-to-end (Playwright)
- `docs/` — propuesta, PRD y especificaciones
- `tasks/` — plan de ejecución del MVP
- `.agents/skills/` — pack de skills de ingeniería del proyecto

## Documentación

- Reglas de ingeniería: [`AGENTS.md`](./AGENTS.md)
- Especificación: [`docs/specs/PRD-2026-10-001-sistema-gestion-pedidos.md`](./docs/specs/PRD-2026-10-001-sistema-gestion-pedidos.md)
- Plan de tareas: [`tasks/todo.md`](./tasks/todo.md)
