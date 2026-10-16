-- Migración 0005: Permitir inserción de tasas de cambio al perfil operativo
-- Justificación: El operador necesita poder sincronizar la tasa oficial emitida por el BCV
-- cuando abre el taller por la mañana o atiende órdenes.
-- Se mantiene la restricción de UPDATE y DELETE exclusivamente para gerencial.

drop policy if exists tasas_cambio_escritura_gerencial on public.tasas_cambio;
drop policy if exists tasas_cambio_escritura on public.tasas_cambio;

-- 1. Inserción permitida para roles autorizados (gerencial y operativo)
create policy tasas_cambio_escritura on public.tasas_cambio
  for insert to authenticated
  with check (public.rol_actual() in ('gerencial', 'operativo'));

-- 2. Modificación reservada exclusivamente al rol gerencial
create policy tasas_cambio_modificacion_gerencial on public.tasas_cambio
  for update to authenticated
  using (public.rol_actual() = 'gerencial')
  with check (public.rol_actual() = 'gerencial');

-- 3. Borrado reservado exclusivamente al rol gerencial
create policy tasas_cambio_borrado_gerencial on public.tasas_cambio
  for delete to authenticated
  using (public.rol_actual() = 'gerencial');
