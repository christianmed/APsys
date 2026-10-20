---
name: APSys Tokyo Night
description: Sistema de diseño sobrio, utilitario, de alta densidad y cero-slop para producción gráfica y taller
tokens:
  light:
    background: "#f8fafc"
    surface: "#ffffff"
    surface-elevated: "#f1f5f9"
    border-subtle: "#e2e8f0"
    border-strong: "#cbd5e1"
    text-primary: "#0f172a"
    text-secondary: "#475569"
    text-muted: "#94a3b8"
    semantic:
      info: "#5a82d6"
      info-subtle: "#f0f4fc"
      info-text: "#3b5998"
      warning: "#cf9b4e"
      warning-subtle: "#fbf6ee"
      warning-text: "#966b24"
      orange: "#d67644"
      orange-subtle: "#fcf4ef"
      orange-text: "#b05224"
      danger: "#cf586c"
      danger-subtle: "#fcf1f3"
      danger-text: "#a83246"
      success: "#4f8a5a"
      success-subtle: "#f0f7f2"
      success-text: "#2e6237"
  dark:
    background: "#16161e"
    surface: "#1a1b26"
    surface-elevated: "#1f202c"
    border-subtle: "#24283b"
    border-strong: "#2f3654"
    text-primary: "#f8fafc"
    text-secondary: "#a9b1d6"
    text-muted: "#565f89"
    semantic:
      info: "#7aa2f7"
      info-subtle: "rgba(122, 162, 247, 0.12)"
      info-text: "#7aa2f7"
      warning: "#e0af68"
      warning-subtle: "rgba(224, 175, 104, 0.12)"
      warning-text: "#e0af68"
      orange: "#ff9e64"
      orange-subtle: "rgba(255, 158, 100, 0.12)"
      orange-text: "#ff9e64"
      danger: "#f7768e"
      danger-subtle: "rgba(247, 118, 142, 0.12)"
      danger-text: "#f7768e"
      success: "#9ece6a"
      success-subtle: "rgba(158, 206, 106, 0.12)"
      success-text: "#9ece6a"
typography:
  display: "Inter, system-ui, -apple-system, sans-serif"
  body: "Inter, system-ui, -apple-system, sans-serif"
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace"
  numeric: "tabular-nums"
radii:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
---

# Design System: APSys Tokyo Night & Editorial Light

Este documento define la **Fuente Única de Verdad (Single Source of Truth)** para el sistema de diseño de APSys. Este manifiesto está diseñado para ser exportable y replicable de forma inmediata en cualquier otro producto o proyecto de software operativo.

---

## 1. Fundamentos y Filosofía (Reglas Anti-Slop)

1. **Color en los Datos, Cromo Neutro (Regla del 3–5%):**
   El marco de la aplicación (sidebar, encabezados, fondos, tarjetas, bordes) debe permanecer estrictamente neutro (blanco/gris claro en modo claro, `#16161e`/`#1a1b26` en modo oscuro). El color se reserva exclusivamente para transmitir significado operativo:
   - **Azul (`info`):** Órdenes por iniciar, primer tramo corriente de cobro (0-7 días), acciones informativas.
   - **Ámbar (`warning`):** Órdenes en producción, tramo moderado de cobro (8-15 días), tasas programadas para el día siguiente.
   - **Naranja (`orange`):** Alertas de cobranza (16-30 días).
   - **Rojo (`danger`):** Deudas morosas críticas (> 30 días), pedidos anulados o cancelados.
   - **Verde (`success`):** Pedidos listos para entrega, saldos 100% cobrados y solventes.

2. **Sin Colores Neón ni Gradientes Estridentes:**
   En modo claro se prohíbe el azul eléctrico `bg-blue-600` (`#2563eb`) o el amarillo cono de tráfico `bg-amber-500` (`#f59e0b`). Se emplean tonos editoriales suaves (`#5a82d6` y `#cf9b4e`). En modo oscuro rigen los tonos suaves y de bajo cansancio visual de **Tokyo Night**.

3. **Jerarquía Tipográfica sobre "Iconos en Círculos":**
   Las métricas clave (KPIs) se expresan con tipografía audaz y legible (`text-3xl font-extrabold tracking-tight`). Se prohíbe encerrar iconos en círculos o cuadrados de colores estridentes como sustituto de contenido real.

4. **Micro-Interacción Física Instantánea:**
   Todo elemento interactivo (botones, tarjetas clickeables, selectores) cuenta con compresión táctil física `:active:scale-[0.97]`, transición rápida de 150ms y optimización móvil `touch-action: manipulation` para suprimir el tap-delay de 300ms.

---

## 2. Mapa de Tokens y Variables CSS (`app/globals.css`)

Cualquier cambio en la identidad visual se realiza **modificando la variable en `app/globals.css`**, actualizando automáticamente cada componente del sistema:

| Token Semántico | Variable CSS | Modo Claro (Light) | Modo Oscuro (Tokyo Night) |
| :--- | :--- | :--- | :--- |
| **Fondo Base** | `--background` | `#f8fafc` | `#16161e` |
| **Superficie Tarjeta** | `--surface` | `#ffffff` | `#1a1b26` |
| **Superficie Elevada** | `--surface-elevated` | `#f1f5f9` | `#1f202c` |
| **Borde Sutil** | `--border` | `#e2e8f0` | `#24283b` |
| **Borde Activo** | `--border-strong` | `#cbd5e1` | `#2f3654` |
| **Azul Informativo** | `--color-info` | `#5a82d6` | `#7aa2f7` |
| **Ámbar Preventivo** | `--color-warning` | `#cf9b4e` | `#e0af68` |
| **Naranja Alerta** | `--color-orange` | `#d67644` | `#ff9e64` |
| **Rojo Peligro/Mora** | `--color-danger` | `#cf586c` | `#f7768e` |
| **Verde Éxito/Listo** | `--color-success` | `#4f8a5a` | `#9ece6a` |

---

## 3. Catálogo de Componentes Canónicos (`@/components/ui/`)

### 3.1 `<Card />` y `<KpiCard />` (`@/components/ui/card.tsx`)
* **Uso:** Todas las pantallas deben usar este contenedor estándar para métricas y paneles.
* **Propiedades de `<KpiCard />`:**
  - `title`: Título en mayúsculas (`text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400`).
  - `value`: Métrica cuantitativa (`text-3xl font-extrabold tracking-tight`).
  - `subtitle`?: Texto descriptivo contextual o desglose secundario.
  - `icon`?: Componente de icono Lucide (`size-5 text-zinc-700 dark:text-zinc-200`).
  - `variant`?: `"default"` | `"info"` | `"warning"` | `"danger"` | `"success"`.
  - `onClick`?: Si es clickeable mediante botón, activa `:active:scale-[0.97]` automáticamente.
  - `href`?: Si es un enlace de navegación, renderiza un `next/link` accesible con la misma interacción `:active:scale-[0.97]`.

### 3.2 `<Badge />` (`@/components/ui/badge.tsx`)
* **Uso:** Píldoras de estado en tablas, encabezados y listas.
* **Variantes:** `"info"` | `"warning"` | `"orange"` | `"danger"` | `"success"` | `"neutral"`.
* **Formato:** Píldora redondeada (`rounded-full border px-2.5 py-0.5 text-[11px] font-bold`).

### 3.3 `<Button />` (`@/components/ui/button.tsx`)
* **Uso:** Disparadores de acciones y navegación.
* **Variantes:**
  - `"primary"`: Sólido oscuro en claro (`bg-zinc-900 text-white`), superficie elevada en oscuro (`dark:bg-[#1f202c] dark:border dark:border-[#2f3654]`).
  - `"secondary"` / `"outline"`: Borde sutil, fondo blanco / `#1a1b26`, hover neutral.
  - `"danger"`: Destructivo con advertencia clara.
* **Comportamiento:** `:active:scale-[0.97] touch-manipulation transition-all duration-150`.

### 3.4 `<ProgressBar />` y `<SegmentedProgressBar />` (`@/components/ui/progress-bar.tsx`)
* **Uso:** Distribución porcentual y barras acumulativas de antigüedad de cartera (*Aging*).
* **Consumo:** Lee directamente los tokens semánticos `--color-info`, `--color-warning`, `--color-orange`, `--color-danger` y `--color-success`.

### 3.5 `<CustomSelect />` (`@/components/ui/custom-select.tsx`)
* **Uso:** Selectores accesibles WAI-ARIA con búsqueda en tiempo real, prevención de scroll exterior y dropdown elevado con borde Tokyo Night.

---

## 4. Convención de Replicación en Otros Proyectos

Para llevar este sistema de diseño a un nuevo proyecto:
1. Copia este archivo `DESIGN.md` en la raíz del repositorio.
2. Copia la sección `:root` y `.dark` de `app/globals.css`.
3. Copia la carpeta `components/ui/` (`card.tsx`, `badge.tsx`, `button.tsx`, `progress-bar.tsx`, `custom-select.tsx`).
4. Toda la interfaz del nuevo sistema heredará inmediatamente la misma estética prémium, sobria, accesible y verificada en 120fps.
