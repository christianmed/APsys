# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Operador de Taller:** Personal de planta y producción que monitorea la cola de trabajos, cambia estados de órdenes (`recibido` → `en_produccion` → `listo`), consulta detalles técnicos en comandas (dimensiones, acabados) y cobra saldo pendiente contra entrega en tablet o móvil.
2. **Asesor Comercial / Cajero:** Encargado de recepción de clientes, cotización rápida con selector de servicios dinámico, cálculo de tasa oficial BCV (vigencia hoy vs. mañana), registro de abonos y emisión de comandas digitales vía WhatsApp o impresión térmica.
3. **Gerente / Administrador:** Dirección operativa y financiera. Monitorea métricas en tiempo real de ingresos, cuentas por cobrar, rotación de servicios, control inmutable de auditoría y configuración de sincronización de tasas de cambio.

## Product Purpose

APSys es el sistema operativo comercial y de taller para empresas de publicidad, gigantografía e imprenta digital. Existe para erradicar las pérdidas por desfase cambiario en economías multimoneda (USD / Bs. BCV), eliminar cuellos de botella en la entrega de trabajos físicos mediante sincronización en tiempo real y asegurar que ninguna orden sea entregada con saldo deudor pendiente.

## Positioning

A diferencia de los ERPs genéricos o sistemas de punto de venta tradicionales, APSys modela la realidad operativa de la industria gráfica venezolana: gestión de ítems por metros cuadrados y dimensiones personalizadas, cálculo automático de tasas BCV con doble vigencia (tasa hoy vs. tasa programada siguiente día hábil), flujo Kanban físico para taller y despacho blindado a saldo $0.

## Operating Context

* **Entorno Taller:** Iluminación variable, pantallas táctiles y tablets con guantes o dedos húmedos. Requiere retroalimentación táctil inmediata (`:active scale(0.97)`), botones de gran área de toque (`min-h-[44px]`), ausencia de zoom accidental (`touch-action: manipulation`) y actualización en tiempo real sin recargar página.
* **Mostrador / Ventas:** Atención rápida al cliente en caja. Búsqueda instantánea de clientes, adición dinámica de ítems con medidas, cálculo automático de conversión a Bolívares y envío de comanda con un clic a WhatsApp.
* **Dispositivos:** Navegadores modernos (Chrome, Safari, Firefox, Edge) en resoluciones móviles (390px - 430px) y estaciones de escritorio (1080p - 2K).

## Capabilities and Constraints

* **Persistencia y Backend:** Supabase nativo sobre PostgreSQL con Row Level Security (RLS) estricto. Cero ORMs intermediarios (sin Prisma).
* **Gestión Multimoneda:** Precios base en USD, conversión a Bolívares con tasa oficial del Banco Central de Venezuela (BCV), histórico inmutable de vigencias y transiciones automáticas a medianoche (12:00 a. m. Caracas).
* **Entrega Blindada:** Regla de negocio inquebrantable: un pedido solo puede pasar a estado `entregado` si `saldo_usd === 0.00`.
* **Tiempo Real:** Suscripciones WebSockets de Supabase Realtime en el tablero de taller con refresco continuo sin parpadeo de pantalla.
* **Diseño:** Sistema visual Tokyo Night (tema oscuro principal con tema claro accesible) bajo el estándar de App Screens (color reservado al 3–5% de la superficie para datos y estados, cromo neutro).

## Brand Commitments

* **Nombre:** APSys (Automated Production & Sales System).
* **Voz y Tono:** Profesional, sobrio, utilitario, de alta certidumbre y precisión numérica.
* **Erradicación de AI Tells:** Cero degradados púrpuras chillones de IA, cero cajas anidadas innecesarias, cero emojis informales en la interfaz técnica (uso exclusivo de iconos SVG vectoriales de Lucide).

## Product Principles

1. **La Verdad vive en los Datos:** Los colores se usan para comunicar estado o valor numérico (3–5% de píxeles), nunca como mera decoración de fondo o azulejos estridentes.
2. **Cero Retraso Táctil:** Toda pulsación ofrece confirmación física instantánea en pantalla sin bloqueo del hilo principal.
3. **Idempotencia y Trazabilidad:** Todo movimiento financiero o cambio de estado operativo deja una huella inmutable en la tabla de auditoría.
4. **Resiliencia Operativa:** Si la red exterior falla, el sistema opera con caché local y reintenta de forma transparente.
