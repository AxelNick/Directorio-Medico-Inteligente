package pe.edu.uni.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Resena;

public interface ResenaRepository extends JpaRepository<Resena, Long> {

    @EntityGraph(attributePaths = {"medico", "paciente"})
    Page<Resena> findByEstadoVisibilidad(EstadoVisibilidadResena estadoVisibilidad, Pageable pageable);

    @EntityGraph(attributePaths = {"medico", "paciente"})
    Page<Resena> findAllBy(Pageable pageable);
}
