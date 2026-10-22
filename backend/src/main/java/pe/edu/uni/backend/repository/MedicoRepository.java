package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.Medico;

import java.util.Optional;

/**
 * Patron Repository / Data Mapper: Spring Data genera la implementacion y el SQL
 * a partir del nombre de los metodos; el servicio nunca escribe consultas.
 */
public interface MedicoRepository extends JpaRepository<Medico, Integer> {
    Optional<Medico> findByUsuarioUsername(String username);
    boolean existsByColegiatura(String colegiatura);
    boolean existsByColegiaturaAndIdNot(String colegiatura, Integer id);
}
