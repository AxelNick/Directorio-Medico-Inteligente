package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.Auditoria;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
}
