package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.NotNull;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;

/** Cuerpo de PATCH /api/v1/admin/resenas/{id}. */
public record ActualizarEstadoResenaRequest(
        @NotNull(message = "El estado de la resena es obligatorio")
        EstadoVisibilidadResena estado
) {}
