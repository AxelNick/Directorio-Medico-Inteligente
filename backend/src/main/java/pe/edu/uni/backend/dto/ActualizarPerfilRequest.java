package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Cuerpo de PUT /medicos/me/perfil (US-MED-02, US-MED-03 y US-MED-05). */
public record ActualizarPerfilRequest(
        @Size(max = 2000, message = "La biografia no puede superar 2000 caracteres")
        String biografia,

        @Min(value = 0, message = "Los anios de experiencia no pueden ser negativos")
        @Max(value = 70, message = "Los anios de experiencia no pueden superar 70")
        Integer aniosExperiencia,

        @NotBlank(message = "La colegiatura es obligatoria")
        @Pattern(regexp = "^[A-Za-z0-9-]{4,20}$", message = "La colegiatura debe tener entre 4 y 20 caracteres alfanumericos")
        String colegiatura,

        List<Integer> especialidadIds
) {}
