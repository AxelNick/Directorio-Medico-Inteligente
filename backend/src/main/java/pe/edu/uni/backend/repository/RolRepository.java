package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.Rol;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {
    Optional<Rol> findByNombre(String nombre);
}
