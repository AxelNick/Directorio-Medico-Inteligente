package pe.edu.uni.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.ActualizarEspecialidadRequest;
import pe.edu.uni.backend.dto.CrearEspecialidadRequest;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.EspecialidadRepository;

import java.util.List;

/**
 * US-ADM-03: Gestor del Catalogo Oficial de Especialidades.
 * Aplica restriccion de borrado logico (habilitada = false) para no eliminar registros
 * fisicos vinculados a medicos activos.
 */
@Service
@Transactional
public class EspecialidadService {

    private final EspecialidadRepository especialidadRepository;

    public EspecialidadService(EspecialidadRepository especialidadRepository) {
        this.especialidadRepository = especialidadRepository;
    }

    @Transactional(readOnly = true)
    public List<Especialidad> listarHabilitadas() {
        return especialidadRepository.findByHabilitadaTrueOrderByNombreAsc();
    }

    @Transactional(readOnly = true)
    public List<Especialidad> listarTodas() {
        return especialidadRepository.findAllByOrderByIdAsc();
    }

    public Especialidad crear(CrearEspecialidadRequest request) {
        String nombre = normalizar(request.nombre());
        if (especialidadRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ConflictoException("Ya existe una especialidad con ese nombre");
        }
        Especialidad especialidad = new Especialidad();
        especialidad.setNombre(nombre);
        especialidad.setHabilitada(true);
        return especialidadRepository.save(especialidad);
    }

    public Especialidad actualizar(Integer id, ActualizarEspecialidadRequest request) {
        Especialidad especialidad = especialidadRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("La especialidad no existe"));
        String nombre = normalizar(request.nombre());
        if (especialidadRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ConflictoException("Ya existe otra especialidad con ese nombre");
        }
        especialidad.setNombre(nombre);
        // Borrado logico: cambiar habilitada a false mantiene las asignaciones existentes en medicos
        especialidad.setHabilitada(request.habilitada());
        return especialidadRepository.save(especialidad);
    }

    private String normalizar(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new ValidacionException("El nombre de la especialidad es obligatorio");
        }
        return nombre.trim();
    }
}
