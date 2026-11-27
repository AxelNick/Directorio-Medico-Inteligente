package pe.edu.uni.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.CrearResenaRequest;
import pe.edu.uni.backend.dto.PaginaResenasResponse;
import pe.edu.uni.backend.dto.ResenaPublicaResponse;
import pe.edu.uni.backend.service.ResenaService;

@RestController
@RequestMapping("/api/v1/medicos")
@Tag(name = "Reseñas y reputación")
public class ResenaController {
    private final ResenaService resenas;

    public ResenaController(ResenaService resenas) {
        this.resenas = resenas;
    }

    @PostMapping("/{medicoId}/resenas")
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponse(responseCode = "201", description = "Reseña registrada y pendiente de moderación")
    @ApiResponse(responseCode = "400", description = "Puntuación o comentario inválidos")
    @ApiResponse(responseCode = "401", description = "Sesión ausente")
    @ApiResponse(responseCode = "403", description = "Solo pacientes")
    @ApiResponse(responseCode = "404", description = "Médico no publicable o inexistente")
    @ApiResponse(responseCode = "409", description = "Ya existe una reseña del paciente para ese médico")
    public ResponseEntity<ResenaPublicaResponse> crear(@PathVariable int medicoId, Authentication auth,
            @Valid @RequestBody CrearResenaRequest datos) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
                .body(resenas.crear(medicoId, auth.getName(), datos));
    }

    @GetMapping("/{medicoId}/resenas")
    public ResponseEntity<PaginaResenasResponse> listar(@PathVariable int medicoId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noCache().cachePublic())
                .body(resenas.listarPublicas(medicoId, page, size));
    }

    @GetMapping("/me/reputacion")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<PaginaResenasResponse> reputacion(Authentication auth,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore().cachePrivate())
                .body(resenas.reputacionPropia(auth.getName(), page, size));
    }
}
