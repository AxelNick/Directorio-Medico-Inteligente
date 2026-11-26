package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.entity.Resena;

import java.time.OffsetDateTime;

/**
 * DTO administrativo para moderacion de resenas (US-ADM-06).
 * Nunca expone correo ni credenciales del paciente.
 */
public record AdminResenaResponse(
        Long id,
        Integer medicoId,
        String medicoNombre,
        String paciente,
        Integer puntuacion,
        String comentario,
        EstadoVisibilidadResena estado,
        OffsetDateTime fechaCreacion
) {
    public static AdminResenaResponse desde(Resena resena) {
        Medico medico = resena.getMedico();
        String nombreCompleto = ((medico.getNombres() != null ? medico.getNombres().trim() : "") + " " +
                (medico.getApellidos() != null ? medico.getApellidos().trim() : "")).trim();
        String medicoNombre = !nombreCompleto.isEmpty() ? nombreCompleto : medico.getColegiatura();
        String aliasPaciente = "Paciente #" + resena.getPaciente().getId();
        return new AdminResenaResponse(
                resena.getId(),
                medico.getId(),
                medicoNombre,
                aliasPaciente,
                resena.getPuntuacion(),
                resena.getComentario(),
                resena.getEstadoVisibilidad(),
                resena.getFechaCreacion()
        );
    }
}
