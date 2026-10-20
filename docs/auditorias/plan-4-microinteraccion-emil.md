# Auditoría Exhaustiva: Micro-Interacción, Física Táctil y Experiencia Móvil

* **Fecha:** 2026-10-19
* **Rama:** `audit/microinteraccion-emil`
* **Estatus:** Diagnóstico Completado — Cero Cambios a Código Productivo
* **Marcos aplicados:** Emil Kowalski (`emilkowalski/skills`) — Physical Motion, Mobile Native & Break UI

---

## 1. Resumen Ejecutivo de Hallazgos

| # | Área / Componente | Severidad | Estándar de Emil Kowalski | Diagnóstico y Síntoma |
| :--- | :--- | :--- | :--- | :--- |
| **M-1** | Botones e interactivos globales | **Media** | Frecuencia de Micro-Tacto (`scale(0.97)`) | Dispersión de valores: 30 botones usan `active:scale-98` (imperceptible), 5 usan `active:scale-95` (excesivo) y algunos `active:scale-[0.99]`. Debe estandarizarse a `active:scale-[0.97]`. |
| **M-2** | Rendimiento Táctil Global | **Media** | Retardo de 300ms (`mobile-native`) | Falta declarar `touch-action: manipulation;` en `app/globals.css` para botones y enlaces, permitiendo retraso de 300ms en tablets de taller. |
| **M-3** | Tarjetas de Taller (`break-ui`) ([app/taller/taller-tablero.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/taller/taller-tablero.tsx#L460)) | **Baja-Media** | Stress Testing de Flexbox | El contenedor del nombre de cliente carece de `min-w-0`, por lo que nombres corporativos largos desbordan la tarjeta en lugar de truncar limpiamente. |
| **M-4** | Estados Hover en Pantallas Táctiles | **Baja** | Sticky Hover en Tablets | Al pulsar un botón en iPad o tablet Android en taller, el estado hover queda pegado hasta que el operario pulsa en otro lugar. Debe protegerse con `@media (hover: hover)`. |
| **M-5** | Modales y Popovers | **Cumplido** | Prohibición de `scale(0)` | Cero ocurrencias de `scale-0`. Todos los diálogos inician en `scale(0.95)` o entran con fundido opaco. |

---

## 2. Detalle Técnico de los Hallazgos

### M-1: Estandarización de la Micro-Física `:active:scale-[0.97]`

* **Diagnóstico Emil Kowalski:**
  La retroalimentación táctil de un botón digital debe imitar la compresión elástica de un interruptor físico (microswitch).
  - `active:scale-98` (o `0.99`): La deformación es de apenas 1% a 2%, lo cual es imperceptible para el ojo y el dedo humano.
  - `active:scale-95`: Una reducción del 5% produce un efecto gomoso o infantil ("cartoon bounce").
  - `active:scale-[0.97]`: Es el valor óptimo calibrado que transmite solidez y certeza de clic en < 100ms.
* **Solución Recomendada:**
  Centralizar en `lib/design-system.ts` en `BUTTON_PRIMARY`, `BUTTON_SECONDARY`, `BUTTON_NEUTRAL` y botones de avance de taller la clase:
  `active:scale-[0.97] transition-all duration-100 ease-out`

---

### M-2: Eliminación Global del Tap Delay de 300ms con `touch-action: manipulation`

* **Ubicación:** [app/globals.css](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/globals.css)
* **Diagnóstico Emil Kowalski (`mobile-native`):**
  En navegadores móviles basados en WebKit (iOS Safari, navegadores en tablets), el motor web retrasa el disparo del evento `click` hasta 300 milisegundos tras levantar el dedo para discernir si el usuario intentará un doble tap de zoom.
* **Solución Recomendada:**
  Agregar en la capa base de CSS:
  ```css
  button, [role="button"], a {
    touch-action: manipulation;
  }
  ```
  Esto desactiva el gesto de doble tap de zoom en interactivos y dispara el evento instantáneamente (0ms de retraso).

---

### M-3: Blindaje de Flexbox Truncate en Taller (`break-ui`)

* **Ubicación:** [app/taller/taller-tablero.tsx](file:///C:/Users/medin/Documents/Proyectos/APSys-Gemini/app/taller/taller-tablero.tsx#L460)
* **Diagnóstico `break-ui`:**
  ```html
  <!-- Código actual sin min-w-0 -->
  <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
    <User className="size-4 shrink-0 text-zinc-400" />
    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
      {pedido.clientes?.nombre}
    </span>
  </div>
  ```
  En la especificación CSS Flexbox, los elementos flexibles tienen `min-width: auto` por defecto. Si un nombre de cliente supera el ancho de la columna Kanban (ej. "Inversiones Gráficas y Publicidad Exterior Nacional C.A."), el contenedor se expande forzando scroll horizontal en la tarjeta.
* **Solución Recomendada:**
  Agregar `min-w-0` al contenedor padre flex: `className="flex min-w-0 items-center gap-2 ..."` para que `truncate` corte con elipsis (`...`) de manera infalible.

---

## 3. Plan de Acción y Trazabilidad (Tracer Bullets)

1. **Tarea MIC-01:** Incorporar `touch-action: manipulation` en `app/globals.css` para botones, links y roles interactivos.
2. **Tarea MIC-02:** Estandarizar la micro-física a `active:scale-[0.97]` en `lib/design-system.ts`, botones de taller y cabeceras.
3. **Tarea MIC-03:** Añadir `min-w-0` en contenedores flexibles con `truncate` en tarjetas de taller Kanban, comanda y pedidos.
4. **Tarea MIC-04:** Configurar `@media (hover: hover)` en hovers delicados para prevenir sticky hover en dispositivos táctiles.
5. **Tarea MIC-05:** Validación de gestos y respuesta táctil en navegador mediante DevTools.
