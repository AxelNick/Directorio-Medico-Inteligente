package pe.edu.uni.backend.dto;

/** Contrato de respuesta para POST /api/v1/triages (Sprint 4). */
public record TriageResponse(
        boolean emergencia,
        boolean fallback,
        EspecialidadRefResponse especialidad,
        String orientacion
) {}
