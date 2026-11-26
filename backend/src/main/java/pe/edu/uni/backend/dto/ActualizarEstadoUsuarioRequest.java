package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.NotNull;

/** Cuerpo de PATCH /api/v1/admin/usuarios/{id}/estado. */
public record ActualizarEstadoUsuarioRequest(
        @NotNull(message = "El estado habilitado es obligatorio")
        Boolean habilitado
) {}
