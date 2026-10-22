package pe.edu.uni.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.uni.backend.dto.ActualizarPerfilRequest;
import pe.edu.uni.backend.dto.CentroAtencionRequest;
import pe.edu.uni.backend.dto.CentroAtencionResponse;
import pe.edu.uni.backend.dto.PerfilMedicoResponse;
import pe.edu.uni.backend.service.MedicoService;

import java.util.List;

/**
 * Capa de presentacion REST para la autogestion del medico.
 * Solo traduce HTTP <-> DTO y delega toda la logica a {@link MedicoService}.
 * Todas las rutas /medicos/me/** exigen ROLE_MEDICO (ver SecurityConfig) y operan sobre el medico de la sesion.
 */
@RestController
@RequestMapping("/medicos/me")
public class MedicoController {

    private final MedicoService medicoService;

    public MedicoController(MedicoService medicoService) {
        this.medicoService = medicoService;
    }

    // ---------- US-MED-02 / 03 / 05: perfil ----------

    @GetMapping("/perfil")
    public PerfilMedicoResponse obtenerPerfil(Authentication auth) {
        return medicoService.obtenerPerfil(auth.getName());
    }

    @PutMapping("/perfil")
    public PerfilMedicoResponse actualizarPerfil(Authentication auth,
                                                 @Valid @RequestBody ActualizarPerfilRequest request) {
        return medicoService.actualizarPerfil(auth.getName(), request);
    }

    @PutMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PerfilMedicoResponse actualizarFoto(Authentication auth,
                                               @RequestPart("foto") MultipartFile foto) {
        return medicoService.actualizarFoto(auth.getName(), foto);
    }

    // ---------- US-MED-04: centros de atencion ----------

    @GetMapping("/centros")
    public List<CentroAtencionResponse> listarCentros(Authentication auth) {
        return medicoService.listarCentros(auth.getName());
    }

    @PostMapping("/centros")
    public ResponseEntity<CentroAtencionResponse> crearCentro(Authentication auth,
                                                              @Valid @RequestBody CentroAtencionRequest request) {
        CentroAtencionResponse creado = medicoService.crearCentro(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/centros/{id}")
    public CentroAtencionResponse actualizarCentro(Authentication auth,
                                                   @PathVariable Integer id,
                                                   @Valid @RequestBody CentroAtencionRequest request) {
        return medicoService.actualizarCentro(auth.getName(), id, request);
    }

    @DeleteMapping("/centros/{id}")
    public ResponseEntity<Void> eliminarCentro(Authentication auth, @PathVariable Integer id) {
        medicoService.eliminarCentro(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
