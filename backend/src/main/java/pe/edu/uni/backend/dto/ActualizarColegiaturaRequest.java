package pe.edu.uni.backend.dto;

import jakarta.validation.constraints.NotNull;
import pe.edu.uni.backend.entity.EstadoColegiatura;

/** Cuerpo de PATCH /api/v1/admin/medicos/{id}/colegiatura. */
public record ActualizarColegiaturaRequest(
        @NotNull(message = "El estado de colegiatura es obligatorio")
        EstadoColegiatura estadoColegiatura
) {}
