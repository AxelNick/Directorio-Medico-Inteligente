package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

public record TriageRequest(
        @NotBlank @Size(max = 1000)
        @Schema(example = "Consulta ficticia de Cardiología") String mensaje
) {}
