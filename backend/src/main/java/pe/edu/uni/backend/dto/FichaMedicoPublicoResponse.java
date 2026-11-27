package pe.edu.uni.backend.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import pe.edu.uni.backend.entity.Medico;

import java.util.Comparator;
import java.util.List;

public record FichaMedicoPublicoResponse(
        @JsonUnwrapped MedicoPublicoResponse resumen,
        String biografia, Integer aniosExperiencia, List<CentroAtencionResponse> centros
) {
    public static FichaMedicoPublicoResponse desde(Medico medico, ResumenReputacion reputacion) {
        var centros = medico.getCentros().stream().map(CentroAtencionResponse::desde)
                .sorted(Comparator.comparing(CentroAtencionResponse::id)).toList();
        return new FichaMedicoPublicoResponse(MedicoPublicoResponse.desde(medico, reputacion),
                medico.getBiografia() == null ? "" : medico.getBiografia(), medico.getAniosExperiencia(), centros);
    }
}
