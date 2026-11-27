package pe.edu.uni.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.TriageRequest;
import pe.edu.uni.backend.dto.TriageResponse;
import pe.edu.uni.backend.service.TriageService;

@RestController
@RequestMapping("/api/v1/triages")
@Tag(name = "Orientación de triage")
public class TriageController {
    private final TriageService triage;

    public TriageController(TriageService triage) {
        this.triage = triage;
    }

    @PostMapping
    @Operation(summary = "Orienta a una especialidad activa o devuelve emergencia o búsqueda manual")
    @ApiResponse(responseCode = "200", description = "Resultado operativo, también ante un fallo del proveedor")
    @ApiResponse(responseCode = "400", description = "Mensaje de triage inválido")
    public ResponseEntity<TriageResponse> evaluar(@Valid @RequestBody TriageRequest datos) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(triage.orientar(datos.mensaje()));
    }
}
