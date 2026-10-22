package pe.edu.uni.backend.dto;

import pe.edu.uni.backend.entity.Auditoria;
import java.time.format.DateTimeFormatter;

/**
 * US-ADM-04: Formato de cada evento de auditoria segun docs/contratos/auditoria-v1.md.
 */
public record AuditoriaEventoResponse(
        String id,
        String actor,
        String accion,
        String entidad,
        String campo,
        String valorAnterior,
        String valorNuevo,
        String ocurrioEn
) {
    public static AuditoriaEventoResponse desde(Auditoria a) {
        return new AuditoriaEventoResponse(
                "evento-" + a.getId(),
                a.getActor(),
                a.getAccion(),
                a.getEntidad(),
                a.getCampo(),
                a.getValorAnterior(),
                a.getValorNuevo(),
                a.getOcurrioEn().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
        );
    }
}
