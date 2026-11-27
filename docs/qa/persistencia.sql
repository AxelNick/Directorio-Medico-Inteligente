\set ON_ERROR_STOP on
-- Ejecutar con psql contra la base desechable del proyecto.
select version();
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = current_schema()
  and ((table_name = 'medicos' and column_name in ('nombres', 'apellidos', 'estado_perfil', 'estado_colegiatura'))
    or (table_name = 'resenas' and column_name in ('medico_id', 'paciente_id', 'puntuacion', 'estado_visibilidad')))
order by table_name, column_name;
select conname, pg_get_constraintdef(oid) definicion
from pg_constraint
where conrelid = 'resenas'::regclass and contype in ('u', 'f', 'c')
order by conname;
select indexname from pg_indexes
where schemaname = current_schema() and tablename = 'resenas'
order by indexname;
select m.id, m.nombres, m.apellidos, m.estado_perfil, m.estado_colegiatura,
       (select count(*) from centros_atencion c where c.medico_id = m.id) centros,
       (select count(*) from medico_especialidad e where e.medico_id = m.id) especialidades,
       (select count(*) from resenas r where r.medico_id = m.id) resenas,
       (select count(*) from resenas r where r.medico_id = m.id and r.estado_visibilidad = 'VISIBLE') visibles,
       (select avg(r.puntuacion) from resenas r where r.medico_id = m.id and r.estado_visibilidad = 'VISIBLE') promedio
from medicos m where m.id = :'medico_id'::integer;
select id, estado_visibilidad, puntuacion,
       count(*) over (partition by paciente_id, medico_id) filas_del_par
from resenas where medico_id = :'medico_id'::integer order by id;
