package pe.edu.uni.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.uni.backend.entity.Especialidad;

import java.util.List;

public interface EspecialidadRepository extends JpaRepository<Especialidad, Integer> {
    List<Especialidad> findByHabilitadaTrueOrderByNombreAsc();
    List<Especialidad> findAllByOrderByIdAsc();
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Integer id);
}
