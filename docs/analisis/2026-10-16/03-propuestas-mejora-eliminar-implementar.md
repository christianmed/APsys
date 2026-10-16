# Propuestas de Ingeniería: Qué Mejorar, Qué Eliminar y Qué Implementar en APSys

- **Fecha:** 16 de Octubre de 2026
- **Autor:** Antigravity Engineering Team / Senior Software Architect
- **Alcance:** Evaluación técnica y estratégica de la arquitectura de APSys `v0.9.2`.
- **Criterio Guía:** Pragmatismo operativo, cero sobre-ingeniería, protección de la rentabilidad del taller y estabilidad en producción.

---

## 1. Filosofía de Evolución

Un sistema de misión crítica para un taller de manufactura y publicidad no necesita incorporar tecnologías de moda sin justificación. Cada línea de código agregada debe cumplir una de tres metas:

1. **Acelerar la velocidad operativa** (reducir los segundos que un operador o vendedor tarda frente a la pantalla).
2. **Blindar los márgenes de ganancia** (evitar fugas de dinero por cotizaciones con tasas desactualizadas o cuentas por cobrar olvidadas).
3. **Garantizar la disponibilidad del sistema** (cero caídas, cero pérdidas de órdenes y cero errores silenciosos).

A continuación se detalla el plan honesto y directo de mejoras, eliminaciones y nuevas implementaciones.

---

## 2. Qué Mejorar (Refinamiento, Rendimiento y Resiliencia)

Estas son optimizaciones sobre lo que **ya existe** en el sistema para elevar su robustez técnica:

### 2.1 Índices Estratégicos en PostgreSQL (Supabase)

- **Diagnóstico:** Si bien `pedidos.numero_orden` cuenta con un índice B-Tree automático por su restricción `UNIQUE`, no existen índices explícitos en las columnas más consultadas en filtros y relaciones.
- **Acción:** Crear una nueva migración `supabase/migrations/0006_indices_rendimiento.sql` con los siguientes índices B-Tree:
  ```sql
  -- Acelera la búsqueda de historial de pedidos por cliente
  CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);

  -- Acelera el tablero Kanban y filtros de órdenes activas
  CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

  -- Acelera los reportes de ingresos y dashboards por rango de fechas
  CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_registro ON pedidos(fecha_registro DESC);

  -- Acelera la búsqueda predictiva de clientes por teléfono o RIF
  CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
  CREATE INDEX IF NOT EXISTS idx_clientes_cedula_rif ON clientes(cedula_rif);
  ```
- **Impacto:** Reduce el tiempo de respuesta de las consultas en el dashboard y el selector de clientes de `O(n)` a `O(log n)` cuando la base supere los 5.000 registros.

### 2.2 Paginación por Cursor en `/clientes` y `/pedidos`

- **Diagnóstico:** Las vistas actuales cargan listas fijas de hasta 50 o 100 registros.
- **Acción:** Reemplazar la carga plana por paginación basada en cursor (`created_at < cursor` con `limit 25`) o implementar scroll infinito virtualizado.
- **Impacto:** Evita la sobrecarga de memoria en dispositivos móviles de los operarios en planta y asegura tiempos de carga constantes sin importar el crecimiento de la base de datos.

### 2.3 Validación Tipada en Tiempo de Ejecución con Zod

- **Diagnóstico:** La validación actual se apoya en TypeScript en compilación y restricciones `CHECK` en PostgreSQL. Sin embargo, las Server Actions que reciben payloads del cliente deben sanitizar las entradas antes de tocar la base de datos.
- **Acción:** Crear esquemas de validación con **Zod** para:
  - Creación de Pedidos (`pedidoSchema`: dimensiones > 0, cantidad entero > 0, total_usd coherente).
  - Creación de Clientes (`clienteSchema`: formato de teléfono internacional y longitud de cédula/RIF).
  - Registro de Abonos (`abonoSchema`: monto > 0 y menor o igual al saldo deudor).
- **Impacto:** Elimina cualquier posibilidad de insertar datos corruptos o montos negativos por manipulación de formulario.

### 2.4 Monitoreo y Alertas del Cron Job de Tasas BCV

- **Diagnóstico:** El cron job registra su ejecución en la tabla de `auditoria` y en los logs de Vercel, pero no notifica proactivamente al administrador si la API del BCV está caída durante más de 24 horas continuas.
- **Acción:** Incorporar un micro-webhook (hacia un canal de Telegram privado o correo del administrador) que emita una alerta únicamente si fallan los 3 intentos consecutivos de sincronización automática.
- **Impacto:** Permite al equipo comercial enterarse de contingencias cambiarias antes de abrir el taller en la mañana.

### 2.5 Ampliación de Pruebas E2E de Flujo Completo

- **Diagnóstico:** El sistema cuenta con 216 pruebas unitarias e integrales en Vitest y una prueba E2E de navegación en Playwright.
- **Acción:** Incorporar 2 suites E2E adicionales en Playwright:
  1. _Flujo Comercial:_ Iniciar sesión -> Crear cliente -> Cotizar orden con Tasa de Mañana -> Verificar comanda.
  2. _Flujo de Planta:_ Ver orden en Taller Kanban -> Mover a Producción -> Mover a Listo -> Verificar actualización en tiempo real.
- **Impacto:** Blindaje absoluto contra regresiones visuales o de interacción antes de cada despliegue a producción.

---

## 3. Qué Eliminar (Reducción de Deuda Técnica y Código Huérfano)

La excelencia técnica también radica en saber qué retirar para mantener el código base ligero y comprensible:

### 3.1 Archivos de Auditoría Externa Obsoletos o Sintéticos

- **Qué retirar:** Limpiar de la raíz los archivos temporales como `pruebna.md` y archivar de manera definitiva `Analisis-PI.md` dentro de la carpeta histórica de auditorías (`docs/analisis/2026-10-16/`).
- **Por qué:** Mantener archivos markdown sueltos en la raíz con afirmaciones falsas sobre "falta de tests" o código sintético con errores confunde a nuevos desarrolladores y a herramientas de IA que escanean el repositorio.

### 3.2 Props Residuales en Componentes de UI

- **Qué retirar:** Limpiar interfaces de componentes que aún conservan props opcionales no utilizados tras la migración de navegación centralizada en el Sidebar (ej. props de navegación manual en cabeceras).
- **Por qué:** Reduce el ruido mental en la lectura de componentes y previene usos indebidos de props obsoletos.

### 3.3 Formularios Manuales Antiguos de Tasas

- **Qué retirar:** Asegurar que no quede ningún remanente de lógica para "inserción arbitraria de tasas" en `app/tasas/actions.ts` que permita fijar fechas con horas arbitrarias fuera de `00:00:00-04:00`.
- **Por qué:** La tasa oficial del BCV debe respetar siempre el estándar de fecha legal oficial a medianoche para evitar discrepancias contables.

---

## 4. Qué Implementar (Nuevas Funcionalidades de Alto Valor)

Las siguientes iniciativas representan las funcionalidades de mayor retorno de inversión comercial para el taller:

### 4.1 Generación y Descarga de Presupuestos Formales en PDF

- **Descripción:** Actualmente el sistema permite imprimir la comanda de taller mediante la vista web de navegador. Se propone incorporar un generador de **Presupuestos y Comprobantes en formato PDF formal** con diseño vectorial corporativo (logotipo del taller, datos fiscales, desglose de ítems con acabados, montos en USD y Bs BCV, y notas de validez de la oferta).
- **Tecnología sugerida:** `@react-pdf/renderer` o endpoint serverless ligero con `jspdf`.
- **Valor para el Negocio:** Permite al vendedor descargar en 1 segundo un presupuesto en PDF de calidad profesional y enviarlo por WhatsApp o correo electrónico al cliente corporativo.

### 4.2 Desglose de Pagos Mixtos y Multimoneda

- **Descripción:** En la realidad comercial venezolana, un cliente suele pagar una orden de $100 de forma mixta (ejemplo: $40 en efectivo USD, $30 por Zelle y el equivalente a $30 en Bolívares por Pago Móvil a la tasa oficial del día).
- **Implementación:**
  - Nueva tabla relacional `pedido_pagos` vinculada a `pedidos`.
  - Campos: `metodo_pago` (_efectivo_usd_, _zelle_, _pago_movil_bs_, _transferencia_bs_, _punto_venta_), `monto_usd`, `monto_bs`, `tasa_aplicada`, `referencia_bancaria`, `fecha_pago`.
- **Valor para el Negocio:** Conciliación de caja impecable al final de la jornada y eliminación total de discrepancias entre lo cobrado en banco y lo registrado en el sistema.

### 4.3 WhatsApp Cloud API Desatendido (Notificación Automática de Retiro)

- **Descripción:** Automatizar el aviso de entrega. Cuando el operario de taller presiona el botón "Listo para Retiro" en el tablero Kanban, el servidor ejecuta un webhook a la **WhatsApp Cloud API** de Meta para enviar un mensaje automático al cliente:
  > _"¡Hola [Nombre]! Tu orden ORD-1025 ([Descripción]) ya está impresa, revisada y lista para retirar en nuestro taller. Saldo pendiente: $20 (Bs. 840,00). Te esperamos en horario de 8:00am a 5:00pm."_
- **Valor para el Negocio:** Reduce a cero el tiempo muerto de pedidos terminados acumulando polvo en el taller y acelera el cobro de saldos pendientes en más de un 40%.

### 4.4 Módulo de Inventario de Bobinas y Sustratos de Impresión

- **Descripción:** Un panel sencillo para registrar el inventario de materias primas principales:
  - Bobinas de Lona Banner (13 oz brillante, 13 oz mate, 10 oz).
  - Vinil Adhesivo (brillante, mate, transparente, microperforado).
  - Tintas (Cyan, Magenta, Yellow, Black en litros).
    Cada vez que se complete un pedido de 3x2 metros de lona, el sistema descuenta automáticamente 6 m² más un margen configurable de merma (ej. 5% de desperdicio por refilado y ojales).
- **Valor para el Negocio:** Permite al gerente saber exactamente cuántos metros quedan en stock y ordenar bobinas antes de que una orden quede paralizada por falta de material.

### 4.5 Soporte PWA Offline-First Básico

- **Descripción:** Configurar un Service Worker que permita a los vendedores abrir la aplicación y consultar el catálogo de servicios, precios por metro cuadrado y clientes recientes incluso si ocurre una interrupción del servicio de internet o de energía en el mostrador.
- **Valor para el Negocio:** Continuidad de ventas ininterrumpida ante contingencias de conectividad en Venezuela.

---

## 5. Matriz de Priorización Estratégica (Impacto vs. Esfuerzo)

```mermaid
quadrantChart
    title Matriz de Priorización de Iniciativas
    x-axis Esfuerzo de Desarrollo (Bajo --> Alto)
    y-axis Impacto en el Negocio (Bajo --> Alto)
    quadrant-1 Prioridad Alta (Proyectos Clave)
    quadrant-2 Victorias Rápidas (Quick Wins)
    quadrant-3 Evaluar o Descartar
    quadrant-4 Alto Esfuerzo / Bajo Retorno
    "Índices PostgreSQL": [0.15, 0.85]
    "Validación Zod": [0.25, 0.75]
    "Presupuestos PDF": [0.45, 0.90]
    "Pagos Mixtos": [0.55, 0.85]
    "Paginación Cursor": [0.35, 0.65]
    "WhatsApp Cloud API": [0.60, 0.80]
    "Alertas Cron Telegram": [0.20, 0.60]
    "Inventario de Bobinas": [0.75, 0.70]
    "PWA Offline": [0.80, 0.50]
```

### Plan de Despliegue en 3 Etapas

| Fase                                           | Alcance                                     | Tareas Clave                                                                                                                                                                              | Plazo Estimado |
| :--------------------------------------------- | :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| **Etapa 1: Blindaje Inmediato (v1.0.0)**       | Estabilidad, Rendimiento y Calidad de Datos | 1. Índices PostgreSQL en claves foráneas y fechas.<br>2. Validación estricta con esquemas Zod.<br>3. Paginación por cursor en `/clientes`.<br>4. Ajuste de hora de cron en `vercel.json`. | 1 semana       |
| **Etapa 2: Potencia Comercial (v1.1.0)**       | Experiencia del Cliente y Cobranza          | 1. Generador de Presupuestos en PDF formal.<br>2. Sistema de Pagos Mixtos Multimoneda.<br>3. Alertas por Telegram de fallos de tasa BCV.                                                  | 2 a 3 semanas  |
| **Etapa 3: Automatización de Planta (v1.2.0)** | Integración y Manufactura                   | 1. WhatsApp Cloud API desatendido.<br>2. Módulo de control de bobinas e inventario básico.<br>3. Soporte PWA offline para ventas en mostrador.                                            | 4 a 6 semanas  |
