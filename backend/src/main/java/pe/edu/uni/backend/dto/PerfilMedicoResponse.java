package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.Medico;

import java.util.Comparator;
import java.util.List;

/** Objeto Perfil del contrato Sprint 2. Nunca incluye datos del usuario de seguridad. */
public record PerfilMedicoResponse(
        String biografia,
        Integer aniosExperiencia,
        String fotoUrl,
        String colegiatura,
        EstadoColegiatura estadoColegiatura,
        List<Integer> especialidadIds
) {
    public static PerfilMedicoResponse desde(Medico medico) {
        List<Integer> ids = medico.getEspecialidades().stream()
                .map(e -> e.getId())
                .sorted(Comparator.naturalOrder())
                .toList();
        return new PerfilMedicoResponse(
                medico.getBiografia() == null ? "" : medico.getBiografia(),
                medico.getAniosExperiencia(),
                medico.getFotoUrl(),
                medico.getColegiatura(),
                medico.getEstadoColegiatura(),
                ids);
    }
}
