package pe.edu.uni.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.entity.Medico;

import java.util.Optional;

/**
 * Patron Repository / Data Mapper: Spring Data genera la implementacion y el SQL
 * a partir del nombre de los metodos o consultas JPQL declarativas.
 */
public interface MedicoRepository extends JpaRepository<Medico, Integer>, JpaSpecificationExecutor<Medico> {
    Optional<Medico> findByUsuarioUsername(String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Medico m where m.usuario.username = :username")
    Optional<Medico> bloquearParaActualizarFoto(String username);
    boolean existsByColegiatura(String colegiatura);
    boolean existsByColegiaturaAndIdNot(String colegiatura, Integer id);

    @EntityGraph(attributePaths = "usuario")
    @Query("SELECT m FROM Medico m WHERE (:estado IS NULL OR m.estadoPerfil = :estado OR " +
            "(:estado = pe.edu.uni.backend.entity.EstadoPerfilMedico.PENDIENTE_REVISION AND m.estadoPerfil IS NULL))")
    Page<Medico> buscarParaModeracion(@Param("estado") EstadoPerfilMedico estado, Pageable pageable);
}
