package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

public record CrearResenaRequest(
        @NotNull @Min(1) @Max(5) @Schema(example = "5") Integer puntuacion,
        @Size(max = 500) @Schema(example = "Comentario ficticio de la demostración") String comentario
) {}
