package pe.edu.uni.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.FichaMedicoPublicoResponse;
import pe.edu.uni.backend.dto.MedicoPublicoResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.service.CacheDirectorio;
import pe.edu.uni.backend.service.DirectorioService;

@RestController
@RequestMapping("/api/v1/directorio/medicos")
@Tag(name = "Directorio público")
public class DirectorioController {
    private final DirectorioService directorio;
    private final CacheDirectorio cache;

    public DirectorioController(DirectorioService directorio, CacheDirectorio cache) {
        this.directorio = directorio;
        this.cache = cache;
    }

    @GetMapping
    @Operation(summary = "Busca perfiles publicados mediante filtros combinables")
    @ApiResponse(responseCode = "200", description = "Página de médicos públicos")
    @ApiResponse(responseCode = "400", description = "Filtros, orden o paginación inválidos")
    public ResponseEntity<PaginaResponse<MedicoPublicoResponse>> buscar(
            @Parameter(example = "angela pena") @RequestParam(required = false) String nombre,
            @RequestParam(required = false) Integer especialidadId,
            @RequestParam(required = false) String ciudad,
            @RequestParam(required = false) String colegiatura,
            @RequestParam(required = false) Double calificacionMinima,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @Parameter(example = "apellidos,asc") @RequestParam(required = false) String sort) {
        return ResponseEntity.ok().cacheControl(CacheControl.noCache().cachePublic())
                .body(directorio.buscar(nombre, especialidadId, ciudad, colegiatura, calificacionMinima, page, size, sort));
    }

    @GetMapping("/{medicoId}")
    @ApiResponse(responseCode = "200", description = "Ficha pública del médico")
    @ApiResponse(responseCode = "404", description = "Médico no publicable o inexistente")
    public ResponseEntity<FichaMedicoPublicoResponse> ficha(@PathVariable int medicoId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noCache().cachePublic())
                .body(cache.obtener(medicoId, () -> directorio.ficha(medicoId)));
    }
}
