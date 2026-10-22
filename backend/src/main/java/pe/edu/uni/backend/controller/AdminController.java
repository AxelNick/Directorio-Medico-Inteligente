package pe.edu.uni.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.ActualizarEspecialidadRequest;
import pe.edu.uni.backend.dto.AuditoriaPaginaResponse;
import pe.edu.uni.backend.dto.CrearEspecialidadRequest;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.service.AuditoriaService;
import pe.edu.uni.backend.service.EspecialidadService;

import java.util.List;

/**
 * US-ADM-04 y US-ADM-03: Controlador administrativo.
 * Expone la consulta paginada de auditoria y el CRUD del catalogo oficial de especialidades.
 * Todas las rutas /admin/** requieren ROLE_ADMIN.
 */
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AuditoriaService auditoriaService;
    private final EspecialidadService especialidadService;

    public AdminController(AuditoriaService auditoriaService,
                           EspecialidadService especialidadService) {
        this.auditoriaService = auditoriaService;
        this.especialidadService = especialidadService;
    }

    // ---------- US-ADM-04: Auditoria AOP ----------

    @GetMapping("/auditoria")
    public AuditoriaPaginaResponse listarAuditoria(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return auditoriaService.listar(page, size);
    }

    // ---------- US-ADM-03: Catalogo de Especialidades (Admin) ----------

    @GetMapping("/especialidades")
    public List<Especialidad> listarEspecialidadesAdmin() {
        return especialidadService.listarTodas();
    }

    @PostMapping("/especialidades")
    public ResponseEntity<Especialidad> crearEspecialidad(
            @Valid @RequestBody CrearEspecialidadRequest request) {
        Especialidad creada = especialidadService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/especialidades/{id}")
    public Especialidad actualizarEspecialidad(
            @PathVariable Integer id,
            @Valid @RequestBody ActualizarEspecialidadRequest request) {
        return especialidadService.actualizar(id, request);
    }
}
