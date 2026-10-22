package pe.edu.uni.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.service.EspecialidadService;

import java.util.List;

/**
 * US-ADM-03 / US-MED-05: Catalogo publico / medico de especialidades activas.
 */
@RestController
@RequestMapping("/especialidades")
public class EspecialidadController {

    private final EspecialidadService especialidadService;

    public EspecialidadController(EspecialidadService especialidadService) {
        this.especialidadService = especialidadService;
    }

    @GetMapping
    public List<Especialidad> listarHabilitadas() {
        return especialidadService.listarHabilitadas();
    }
}
