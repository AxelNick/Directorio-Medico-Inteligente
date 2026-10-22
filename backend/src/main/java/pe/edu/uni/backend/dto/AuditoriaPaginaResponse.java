package pe.edu.uni.backend.dto;

import java.util.List;

/**
 * US-ADM-04: Respuesta paginada de GET /admin/auditoria.
 */
public record AuditoriaPaginaResponse(
        List<AuditoriaEventoResponse> items,
        int page,
        int size,
        long total
) {
}
