package pe.edu.uni.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    @EntityGraph(attributePaths = "rol")
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);

    @EntityGraph(attributePaths = "rol")
    Page<Usuario> findAllBy(Pageable pageable);

    long countByRolNombreAndHabilitadoTrue(String rolNombre);
}
