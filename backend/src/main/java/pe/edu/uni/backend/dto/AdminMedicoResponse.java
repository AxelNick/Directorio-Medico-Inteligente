package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.entity.Medico;

/** DTO administrativo para moderacion de perfiles medicos y colegiaturas (US-ADM-02). */
public record AdminMedicoResponse(
        Integer id,
        String nombres,
        String apellidos,
        String colegiatura,
        EstadoColegiatura estadoColegiatura,
        EstadoPerfilMedico estadoPerfil
) {
    public static AdminMedicoResponse desde(Medico medico) {
        return new AdminMedicoResponse(
                medico.getId(),
                medico.getNombres() != null ? medico.getNombres() : "",
                medico.getApellidos() != null ? medico.getApellidos() : "",
                medico.getColegiatura(),
                medico.getEstadoColegiatura(),
                medico.getEstadoPerfil()
        );
    }
}
