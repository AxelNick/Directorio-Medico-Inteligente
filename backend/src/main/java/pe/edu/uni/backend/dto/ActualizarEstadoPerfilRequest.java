package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.NotNull;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;

/** Cuerpo de PATCH /api/v1/admin/medicos/{id}/estado-perfil. */
public record ActualizarEstadoPerfilRequest(
        @NotNull(message = "El estado de perfil es obligatorio")
        EstadoPerfilMedico estadoPerfil
) {}
