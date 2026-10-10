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

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta el servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción (requiere `npm run build`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos (`tsc --noEmit`) |
| `npm run format` | Formatea el código con Prettier |

## Estructura

- `app/` — rutas y vistas (App Router)
- `lib/` — utilidades y lógica compartida
- `docs/` — propuesta, PRD y especificaciones
- `tasks/` — plan de ejecución del MVP
- `.agents/skills/` — pack de skills de ingeniería del proyecto

## Documentación

- Reglas de ingeniería: [`AGENTS.md`](./AGENTS.md)
- Especificación: [`docs/specs/PRD-2026-10-001-sistema-gestion-pedidos.md`](./docs/specs/PRD-2026-10-001-sistema-gestion-pedidos.md)
- Plan de tareas: [`tasks/todo.md`](./tasks/todo.md)
