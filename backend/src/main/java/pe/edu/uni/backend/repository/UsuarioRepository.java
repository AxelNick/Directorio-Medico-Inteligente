package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
}
