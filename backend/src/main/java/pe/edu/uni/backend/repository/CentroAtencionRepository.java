package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.CentroAtencion;

import java.util.List;
import java.util.Optional;

public interface CentroAtencionRepository extends JpaRepository<CentroAtencion, Integer> {
    List<CentroAtencion> findByMedicoIdOrderByIdAsc(Integer medicoId);
    /** Busca por id y propietario: evita que un medico acceda a un centro ajeno. */
    Optional<CentroAtencion> findByIdAndMedicoId(Integer id, Integer medicoId);
}
