# Auditoría Pre-Lanzamiento (/ship) — Compuerta G-001

**Proyecto:** APSys — Sistema de Gestión para Taller de Gráfica & Impresión  
**Fecha de Auditoría:** 10 de Octubre de 2026  
**Resultado:** **GO** (Aprobado para Lanzamiento a Producción)  
**Versión:** 1.0.0 (Release Candidate 1)  

---

## 1. Evaluación en los 5 Ejes de Ingeniería

### Eje 1: Correctitud Funcional y QA
- **Pruebas Unitarias:** 28 suites de prueba con **135 tests pasando en verde** (Vitest).
- **Pruebas E2E:** 21 suites Playwright cubriendo todos los flujos de usuario (autenticación, registro, comanda, tablero de taller, avisos WhatsApp, cuentas por cobrar, tasas históricas, métricas, anulación/auditoría y exportación).
- **Flujo Crítico:** Ciclo completo validado de punta a punta (`e2e/flujo-critico-taller.spec.ts`).
- **Build de Producción:** 25 rutas Next.js 16 compiladas exitosamente con Turbopack y Cache Components activos.
- **Resultado:** **APROBADO** (0 fallos).

---

### Eje 2: Seguridad y Endurecimiento (Security Audit)
- **RLS (Row Level Security):** Activo en todas las tablas (`clientes`, `servicios`, `pedidos`, `pedido_items`, `pagos`, `plantillas`, `tasas_cambio`, `auditoria`, `perfiles`).
- **Privacidad Operativa (RF-19):** El perfil operativo no puede consultar agregados de facturación global ni eventos de auditoría administrativa.
- **Auditoría Inmutable (RF-16):** Tabla `auditoria` estricta append-only sin operaciones `UPDATE` o `DELETE` permitidas por RLS.
- **Manejo de Secretos:** Cero credenciales expuestas en repositorio; uso de variables de entorno `.env.example` y `.env.local`.
- **Cabeceras HTTP en `vercel.json`:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Resultado:** **APROBADO**.

---

### Eje 3: Arquitectura y Resiliencia
- **Desacoplamiento:** Lógica pura de negocio en `lib/`, separada de la capa de renderizado Next.js y Server Actions.
- **Inmutabilidad Financiera:** Las tasas de cambio se congelan históricamente por orden; modificar la tasa vigente no recalcula pedidos previos (RF-15).
- **Exclusión Contable de Anulados:** Todas las consultas y funciones de métricas (`ingresos.ts`, `cuentas-por-cobrar.ts`, `rotacion-servicios.ts`, `historial.ts`, `exportacion.ts`) descartan estrictamente pedidos con `anulado = true`.
- **Resultado:** **APROBADO**.

---

### Eje 4: Calidad de Código y Tipado
- **TypeScript:** Chequeo estricto (`next typegen && tsc --noEmit`) con **0 errores**.
- **Linter:** ESLint sin advertencias ni supresiones no justificadas (**0 warnings, 0 errors**).
- **Convención de Commits:** Commits atómicos siguiendo formato estricto Conventional Commits (`feat:`, `docs:`, `test:`).
- **Resultado:** **APROBADO**.

---

### Eje 5: Rendimiento y Operatividad
- **Tiempo de Creación de Pedido:** Menor a 2 minutos comprobado mediante selector rápido y comanda automática.
- **Lectura en Taller:** Soporte doble para escáner físico USB (`keydown` con buffer) y cámara web (`html5-qrcode`).
- **Impresión:** Hojas técnicas A4 y comanda térmica 58/80 mm optimizadas con `@media print`.
- **Resultado:** **APROBADO**.

---

## 2. Decisión Formal de Lanzamiento

> **DECISIÓN: GO (Lanzamiento Autorizado)**  
> Todos los requisitos funcionales del PRD (RF-01 a RF-19) y no funcionales han sido implementados y verificados exhaustivamente.

---

## 3. Plan de Rollback y Contingencia

1. **Rollback de Despliegue en Vercel:**
   - En caso de anomalía visual o de renderizado post-deploy:
     - Ingresar a **Vercel Dashboard → Deployments**.
     - Seleccionar el deployment previo verificado (`Instant Rollback`).
     - Tiempo estimado de reversión: < 30 segundos.

2. **Rollback de Base de Datos:**
   - Ante inconsistencia o corrupción de esquema:
     - Seguir el [Runbook de Restauración](file:///c:/Users/medin/Documents/Proyectos/APSys-Gemini/docs/operaciones/runbook-respaldo-restauracion.md).
     - Restaurar el snapshot nativo de Supabase más reciente o aplicar dump SQL con `psql`.
     - RTO estimado: < 15 minutos.
