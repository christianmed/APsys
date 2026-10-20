# GLOSSARY.md — Vocabulario Ubicuo de Dominio (APSys)

Este documento define el vocabulario canónico del negocio. Tanto desarrolladores como agentes de IA deben utilizar estos términos con precisión estricta, evitando sinónimos o lenguaje ambiguo.

---

### Entidades y Conceptos Principales

- **Comanda:**  
  Documento operativo generado al registrar un pedido. Detalla los artículos, especificaciones técnicas de personalización, fecha de entrega acordada, desglose monetario y estado de pago. Sirve como contrato de producción entre el mostrador y el taller.

- **Taller (Cola de Producción):**  
  Módulo y vista operativa donde el personal de confección/ensamblaje visualiza los pedidos pendientes, gestiona su ciclo de fabricación y ejecuta las transiciones de estado:
  - `Pendiente`: En espera de inicio.
  - `En Proceso`: Fabricación iniciada mediante la acción _Iniciar Producción_.
  - `Listo`: Fabricación concluida mediante la acción _Marcar Listo_, listo para ser trasladado a mostrador.

- **Despacho / Entrega:**  
  Estado operativo final (`Entregado`) donde el producto terminado es entregado formalmente al cliente en mostrador, requiriendo validación obligatoria de que el saldo pendiente sea exactamente cero.

- **Tasa Oficial (Tasa BCV):**  
  Tipo de cambio de referencia legal emitido por el Banco Central de Venezuela (USD y EUR expresados en Bolívares).
  - _Regla de vigencia:_ Sincronización automática a partir de las 12:00 AM al iniciar el sistema si la tasa de la API supera a la de base de datos.
  - _Ventana manual:_ El operador tiene potestad de ajuste manual hasta las 11:59 PM.

- **Monto Total:**  
  Importe bruto convenido del pedido, expresado canónicamente en Dólares Estadounidenses (USD) y proyectado en Bolívares (VES) según la tasa vigente al momento del registro.

- **Abono:**  
  Pago parcial registrado hacia la cancelación del monto total de un pedido. Admite pagos multimoneda (efectivo USD, Bolívares por Pago Móvil/Transferencia, Punto de Venta). Cada abono se congela con la tasa y fecha en que se efectuó.

- **Saldo Pendiente (Resta):**  
  Diferencia aritmética calculada entre el `Monto Total` y la suma acumulada de todos los `Abonos`. Si el saldo pendiente es mayor a cero, la comanda muestra la píldora informativa _"Resta $XX.XX"_ y bloquea la entrega final sin liquidación.

- **Cliente:**  
  Persona natural o jurídica receptora del servicio, identificada por nombre, documento de identidad (C.I./RIF) y teléfono de contacto.

- **Operador:**  
  Rol de usuario para cajeros, recepcionistas y personal de taller. Permite registrar pedidos, registrar abonos y cambiar estados en taller, con restricciones sobre configuraciones críticas del sistema.

- **Administrador:**  
  Rol de usuario con privilegios totales: conciliación de caja, auditoría de usuarios, gestión de tasas y acceso a métricas globales.
