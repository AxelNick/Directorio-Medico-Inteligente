\set ON_ERROR_STOP on
-- Datos sintéticos repetibles. Usar solo en la base QA desechable.
begin;
insert into usuarios (username, password, habilitado, rol_id)
select 'bench-' || n || '@ensayo.invalid', 'sin-login', false,
       (select id from roles where nombre = 'ROLE_MEDICO')
from generate_series(1, 1000) n
on conflict (username) do nothing;

insert into medicos (usuario_id, nombres, apellidos, colegiatura, estado_perfil, estado_colegiatura)
select id, 'Alícia', 'Quiñones Carga', 'B-' || split_part(split_part(username, '@', 1), '-', 2),
       'APROBADO', 'VERIFICADA'
from usuarios where username ~ '^bench-[0-9]+@ensayo[.]invalid$'
on conflict (usuario_id) do nothing;

insert into medico_especialidad (medico_id, especialidad_id)
select m.id, e.id from medicos m cross join especialidades e
where m.colegiatura ~ '^B-[0-9]+$' and e.nombre in ('Cardiología', 'Medicina General')
on conflict do nothing;

insert into centros_atencion (medico_id, nombre, direccion, ciudad)
select m.id, t.nombre, 'Vía ficticia', 'Líma'
from medicos m cross join (values ('Centro de carga 1'), ('Centro de carga 2')) t(nombre)
where m.colegiatura ~ '^B-[0-9]+$'
  and not exists (select 1 from centros_atencion c where c.medico_id = m.id and c.nombre = t.nombre);
commit;
