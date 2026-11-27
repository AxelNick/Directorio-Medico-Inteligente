package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.Medico;

import java.util.Comparator;
import java.util.List;

public record MedicoPublicoResponse(
        Integer id, String nombres, String apellidos, String fotoUrl, String colegiatura,
        EstadoColegiatura estadoColegiatura, List<EspecialidadRefResponse> especialidades, List<String> ciudades,
        Double promedioCalificacion, long totalResenas
) {
    public static MedicoPublicoResponse desde(Medico medico, ResumenReputacion reputacion) {
        var especialidades = medico.getEspecialidades().stream()
                .filter(e -> Boolean.TRUE.equals(e.getHabilitada()))
                .map(e -> new EspecialidadRefResponse(e.getId(), e.getNombre()))
                .sorted(Comparator.comparing(EspecialidadRefResponse::nombre))
                .toList();
        var ciudades = medico.getCentros().stream().map(c -> c.getCiudad()).distinct().sorted().toList();
        return new MedicoPublicoResponse(medico.getId(), medico.getNombres(), medico.getApellidos(),
                medico.getFotoUrl(), medico.getColegiatura(), medico.getEstadoColegiatura(),
                especialidades, ciudades, reputacion.promedio(), reputacion.total());
    }
}
