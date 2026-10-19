---
name: APSys Tokyo Night
description: Sistema de diseño sobrio, utilitario y de alta densidad para producción gráfica y taller
colors:
  canvas-dark: "#16161e"
  surface-dark: "#1a1b26"
  elevated-dark: "#1f202c"
  border-dark: "#24283b"
  primary-blue: "#7aa2f7"
  status-amber: "#e0af68"
  status-emerald: "#9ece6a"
  status-purple: "#bb9af7"
  status-red: "#f7768e"
  text-primary: "#f8fafc"
  text-muted: "#a9b1d6"
  canvas-light: "#f8fafc"
  surface-light: "#ffffff"
  border-light: "#e2e8f0"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.lg}"
    textColor: "{colors.text-primary}"
  input:
    backgroundColor: "{colors.canvas-dark}"
    rounded: "{rounded.md}"
    textColor: "{colors.text-primary}"
  button-primary:
    backgroundColor: "{colors.primary-blue}"
    textColor: "#0f172a"
    rounded: "{rounded.md}"
---

# Design System: APSys Tokyo Night

## Overview
APSys es una herramienta de misión crítica para personal de mostrador, taller y administración. La interfaz debe transmitir máxima certidumbre, sobriedad y ergonomía visual en jornadas prolongadas. El tema oficial por defecto es Tokyo Night (#16161e / #1a1b26), acompañado de soporte accesible para modo claro.

## Colors
* **Lienzo Principal (`canvas-dark`):** `#16161e` — Fondo base profundo que reduce el cansancio ocular.
* **Superficies y Tarjetas (`surface-dark`):** `#1a1b26` — Contenedores de contenido, sidebar y tarjetas KPI.
* **Superficies Elevadas y Campos (`elevated-dark`):** `#1f202c` — Inputs, dropdowns, estados hover y botones utilitarios.
* **Líneas y Bordes (`border-dark`):** `#24283b` — Delimitación nítida y sutil entre elementos adyacentes.
* **Acentos Semánticos (Regla 3–5% de Color):**
  - **Azul Zafiro (`#7aa2f7`):** Pedidos por iniciar / recibidos, acciones primarias y selección activa.
  - **Ámbar Noche (`#e0af68`):** Pedidos en producción, alertas preventivas y tasas programadas para el día siguiente.
  - **Esmeralda Bosque (`#9ece6a`):** Pedidos listos para entrega, saldos 100% solventes y sincronización exitosa.
  - **Rojo Coral (`#f7768e`):** Pedidos cancelados, deudas críticas y confirmaciones de anulación.

## Typography
* **Fuente del Sistema:** `Inter`, optimizada con `-webkit-font-smoothing: antialiased`.
* **Jerarquía de Métricas (KPIs Tipográficos):** Las cifras cuantitativas (ej. ingresos, órdenes activas, deuda) se expresan con tipografía audaz y nítida (`text-3xl font-extrabold tracking-tight`). Se prohíbe envolver números en azulejos circulares de colores estridentes o degradados artificiales.
* **Cifras Financieras y Códigos:** Uso de variante tabular o monoespaciada para alinear montos en dólares y bolívares.

## Layout
* **Estructura Shell:** Sidebar persistente colapsable a la izquierda con acceso directo a módulos clave y widget informativo de tasas de cambio con desglose temporal (Hoy vs. Mañana).
* **Área de Trabajo:** Flujo vertical limpio, cabecera universal `PageHeader` integrada en la superficie de la página, sin márgenes desbordantes en dispositivos móviles (`overflow-x-hidden`).
* **Densidad Operativa:** Cuadrículas compactas y adaptativas (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

## Elevation & Depth
* **Profundidad por Superficie:** La jerarquía se construye mediante contraste de luminosidad tonal (`#16161e` base → `#1a1b26` tarjeta → `#1f202c` botón/elevación), eliminando sombras difusas pesadas que ensucian pantallas de taller.
* **Bordes Nítidos:** Todos los contenedores usan un micro-borde sutil `border border-[#24283b]` (o `border-zinc-200` en tema claro).

## Shapes
* **Tarjetas y Paneles:** Esquinas redondeadas suaves (`rounded-2xl` / 16px).
* **Inputs, Selectores y Botones:** Esquinas balanceadas (`rounded-xl` / 12px).
* **Píldoras de Estado (Badges):** Formato píldora redondeada (`rounded-full`) con padding horizontal equilibrado (`px-2.5 py-0.5`).

## Components
* **Botones de Avance Operativo:** Botón sólido de alto contraste con feedback táctil inmediato `:active:scale-[0.97]` y transición rápida (`transition-all duration-150`).
* **CustomSelect Universal:** Selector accesible por teclado con buscador integrado, prevención de scroll exterior y menú desplegable elevado (`#1a1b26` con borde `#2f3654`).
* **Iconografía:** Exclusivamente SVG limpios de `lucide-react` (ej. `Play`, `Printer`, `PackageCheck`, `HandCoins`, `CheckCircle2`). Cero emojis en etiquetas o textos técnicos.

## Do's and Don'ts
* **DO:**
  - Reservar el color únicamente para datos semánticos, badges de estado y botones primarios de acción (3–5% de píxeles).
  - Incluir `:active:scale-[0.97]` en todo control clickeable.
  - Asegurar `touch-action: manipulation` para suprimir el retraso de 300ms en tablets de producción.
  - Probar pantallas con datos extremos (nombres largos, emails de prueba, cantidades cero o millonarias) usando `break-ui`.
* **DON'T:**
  - NO usar degradados violetas o cianes "AI slop" en fondos ni bordes fluorescentes.
  - NO anidar tarjetas dentro de tarjetas con el mismo color de fondo.
  - NO colocar iconos decorativos flotando dentro de círculos de colores chillones en tarjetas KPI.
  - NO permitir transiciones `scale(0)` en la apertura de modales (deben iniciar en escala `0.95` o deslizarse desde el origen).
