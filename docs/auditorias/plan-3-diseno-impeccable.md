# Auditoría Exhaustiva: Macro-Diseño, App Screens y Erradicación de Slop

* **Fecha:** 2026-10-19
* **Rama:** `audit/diseno-impeccable`
* **Estatus:** Diagnóstico Completado — Cero Cambios a Código Productivo
* **Marcos aplicados:** Impeccable (`pbakaus/impeccable`) + Taste Skill (`leonxlnx/taste-skill`)

---

## 1. Resumen Ejecutivo de Hallazgos

| # | Vista / Componente | Severidad | Tell de IA / Violación | Diagnóstico y Síntoma Visual |
| :--- | :--- | :--- | :--- | :--- |
| **D-1** | Cuadrícula de Módulos en Home ([app/page.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/page.tsx#L186-L300)) | **Media-Alta** | AI Tell Ola 2 (Arcoíris de Iconos) | 6 tarjetas adyacentes usan cajitas de colores surtidos: azul, ámbar, esmeralda, púrpura, índigo. Rota la coherencia Tokyo Night. |
| **D-2** | Tarjetas KPI de Producción ([app/page.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/page.tsx#L126-L175)) | **Media** | Violación Regla 3–5% de Color | Fondos teñidos con `bg-blue-950/20`, `bg-amber-950/20`, `bg-emerald-950/20`. Ocupan más del 25% del área con tinte de color. |
| **D-3** | Formularios con Doble Envoltorio | **Baja-Media** | Cajas Anidadas (Card-in-a-Card) | En algunas secciones de `/pedidos/nuevo` y `/clientes/nuevo` conviven tarjetas anidadas con bordes redundantes sobre la misma superficie. |
| **D-4** | Micro-Escala Inconsistente | **Baja** | Física Táctil | Uso disperso de `active:scale-98` en lugar del estándar físico calibrado `active:scale-[0.97]`. |

---

## 2. Detalle Técnico de los Hallazgos

### D-1: Erradicación del Arcoíris de Iconos en la Cuadrícula del Dashboard

* **Ubicación:** [app/page.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/page.tsx#L186-L300)
* **Diagnóstico Taste Skill:**
  Uno de los *tells* deterministas más reconocibles en interfaces generadas por modelos es asignar un color de acento distinto a cada tarjeta en un grid de características:
  - Tarjeta 1 (Pedidos): Cuadro azul `bg-blue-950/50 text-[#7aa2f7]`
  - Tarjeta 2 (Taller): Cuadro ámbar `bg-amber-950/50 text-amber-400`
  - Tarjeta 3 (Clientes): Cuadro esmeralda `bg-emerald-950/50 text-emerald-400`
  - Tarjeta 4 (Servicios): Cuadro púrpura `bg-purple-950/50 text-purple-400`
  - Tarjeta 5 (Recordatorios): Cuadro índigo `bg-indigo-950/50 text-indigo-400`
  Este patrón genera ruido cromático y hace que un software de producción parezca una plantilla genérica.
* **Solución de Diseño Recomendada:**
  Unificar los contenedores de iconos a la superficie elevada neutral Tokyo Night (`bg-[#1f202c] border border-[#24283b]`), con texto e iconos en `text-zinc-300 dark:text-zinc-200` y acento sutil azul zafiro únicamente en la tarjeta activa o al hacer hover (`group-hover:text-[#7aa2f7]`).

---

### D-2: Aplicación Estricta de la Regla de "App Screens" (Color al 3–5%)

* **Ubicación:** [app/page.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/page.tsx#L126-L175)
* **Diagnóstico Impeccable & Taste Skill:**
  En pantallas de trabajo operativo (ERP, POS, taller), el cromo debe ser calmo y neutral. Las tarjetas KPI de producción ("Por Iniciar", "En Producción", "Listos") tienen actualmente fondos con tintes coloreados (`bg-blue-950/20`, `bg-amber-950/20`, etc.).
* **Solución de Diseño Recomendada:**
  1. Fondo de la tarjeta 100% neutral Tokyo Night: `dark:bg-[#1a1b26] dark:border-[#24283b]`.
  2. El número principal (`text-3xl font-black`) permanece nítido en blanco `dark:text-zinc-50`.
  3. El color semántico se confina a un micro-indicador puntual: una píldora de 16px o micro-punto luminoso (`w-2 h-2 rounded-full bg-[#7aa2f7]`), garantizando que el color no supere el 3–5% de los píxeles visibles.

---

## 3. Plan de Acción y Trazabilidad (Tracer Bullets)

1. **Tarea DIS-01:** Unificar contenedores de iconos en la cuadrícula de Home a superficie neutral elevated (`dark:bg-[#1f202c] dark:border-[#24283b]`).
2. **Tarea DIS-02:** Migrar tarjetas KPI de producción en Home a superficie neutral con micro-badges semánticos al 3–5% de color.
3. **Tarea DIS-03:** Auditar y aplanar cajas anidadas redundantes en formularios de pedidos y clientes.
4. **Tarea DIS-04:** Validar en navegador visual con DevTools (Desktop 1536x826 y Móvil 390x844).
