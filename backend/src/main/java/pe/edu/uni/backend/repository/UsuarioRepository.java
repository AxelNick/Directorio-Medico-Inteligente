package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import pe.edu.uni.backend.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    @EntityGraph(attributePaths = "rol")
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
}
