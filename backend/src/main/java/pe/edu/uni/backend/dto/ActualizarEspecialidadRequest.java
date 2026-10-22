package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * US-ADM-03: Cuerpo para PUT /admin/especialidades/{id} (incluye borrado logico via habilitada=false).
 */
public record ActualizarEspecialidadRequest(
        @NotBlank(message = "El nombre de la especialidad es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String nombre,
        @NotNull(message = "El estado habilitada es obligatorio")
        Boolean habilitada
) {
}
