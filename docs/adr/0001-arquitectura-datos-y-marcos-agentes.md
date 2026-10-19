# 0001. Arquitectura de Datos con Supabase y Marcos de Ingeniería de Agentes

- **Fecha:** 2026-10-19
- **Estado:** Aceptado
- **Decisores:** Usuario / Cerebro Orquestador

---

### Contexto y Planteamiento del Problema

APSys es un sistema de gestión empresarial (pedidos, punto de venta, taller de producción y control de caja) que opera en un entorno de alta exigencia operativa y multimoneda (USD y Bolívares con tasa oficial BCV).
Necesitamos garantizar:

1. Una arquitectura de datos escalable, en tiempo real y con seguridad a nivel de fila (Row Level Security).
2. Un marco metodológico estricto para agentes de IA que erradique el "vibe coding", el código no probado y el diseño genérico artificial ("AI slop").

---

### Decisión de Arquitectura de Datos: Supabase Nativo

Se ratifica que el sistema de persistencia y backend utiliza **Supabase** (PostgreSQL en la nube):

- **SDKs Oficiales:** `@supabase/supabase-js` y `@supabase/ssr` para manejo de sesiones seguras por cookies en Next.js.
- **Seguridad en BD:** Aplicación de políticas **Row Level Security (RLS)** en PostgreSQL para garantizar que cada consulta y mutación esté restringida según el rol autenticado (`operador` vs `administrador`).
- **No-ORM (Cero Prisma):** Las consultas se realizan mediante la API tipada de Supabase y funciones RPC almacenadas en base de datos para operaciones atómicas (ej. registrar abono y actualizar saldo en una única transacción).

---

### Decisión de Marcos de Trabajo para Agentes (El Cuadrumvirato)

Para el desarrollo asistido por IA en la rama `dev`, se adopta el estándar de cuatro repositorios especializados:

1. **Matt Pocock (`mattpocock/skills`):** Gobierna la lógica de negocio, arquitectura de módulos profundos, modelado de dominio (`GLOSSARY.md`, `docs/adr/`) y desarrollo guiado por pruebas (TDD) en costuras públicas acordadas.
2. **Impeccable (`pbakaus/impeccable`):** Gobierna el sistema de diseño macro, la ejecución de 24 comandos quirúrgicos (`/distill`, `/polish`, etc.) y la vigilancia previa con 61 detectores deterministas.
3. **Taste Skill (`leonxlnx/taste-skill`):** Gobierna la dirección de arte y las reglas de _App Screens_ (color limitado al 3–5% en datos, cromo neutro, KPIs tipográficos limpios y erradicación de tells de IA).
4. **Emil Kowalski (`emilkowalski/skills`):** Gobierna el micro-tacto (escala `0.97` en `:active`), popovers conscientes del origen, blindaje de pantallas táctiles (`touch-action: manipulation`, `100dvh`) y pruebas con datos extremos (`break-ui`).

---

### Consecuencias

- **Positivas:**
  - Cero dependencias innecesarias de ORMs en Node.js; menor tiempo de compilación y menor tamaño de bundle.
  - La base de datos es la fuente de verdad protegida por RLS.
  - El código nuevo se somete a validación de especificación y estándares en dos ejes paralelos antes de llegar a `main`.
- **Negativas / Compromisos:**
  - Toda consulta a Supabase debe tiparse explícitamente y respetar las políticas RLS.
  - Las nuevas funcionalidades requieren especificación previa mediante entrevista de _Grilling_.
