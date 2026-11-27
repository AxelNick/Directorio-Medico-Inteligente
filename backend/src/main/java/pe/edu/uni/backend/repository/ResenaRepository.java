package pe.edu.uni.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.uni.backend.dto.ResumenReputacion;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Resena;

import java.util.Collection;
import java.util.List;

public interface ResenaRepository extends JpaRepository<Resena, Long> {

    @EntityGraph(attributePaths = {"medico", "paciente"})
    Page<Resena> findByEstadoVisibilidad(EstadoVisibilidadResena estadoVisibilidad, Pageable pageable);

    @EntityGraph(attributePaths = {"medico", "paciente"})
    Page<Resena> findAllBy(Pageable pageable);

    Page<Resena> findByMedicoIdAndEstadoVisibilidad(Integer medicoId, EstadoVisibilidadResena estado, Pageable pageable);

    @Query("""
            select new pe.edu.uni.backend.dto.ResumenReputacion(r.medico.id, avg(r.puntuacion), count(r))
            from Resena r
            where r.medico.id in :ids and r.estadoVisibilidad = :estado
            group by r.medico.id
            """)
    List<ResumenReputacion> resumir(Collection<Integer> ids, EstadoVisibilidadResena estado);
}
