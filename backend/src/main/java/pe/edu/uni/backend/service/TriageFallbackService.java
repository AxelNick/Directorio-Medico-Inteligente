package pe.edu.uni.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import pe.edu.uni.backend.dto.EspecialidadRefResponse;
import pe.edu.uni.backend.dto.TriageResponse;

/**
 * Servicio de fallback ante indisponibilidad, timeout, HTTP 429, 5xx o respuesta invalida
 * del proveedor LLM durante el triage (Sprint 4).
 * No oculta la falla ni emite diagnosticos; orienta al paciente hacia el directorio manual.
 */
@Service
public class TriageFallbackService {

    private static final Logger log = LoggerFactory.getLogger(TriageFallbackService.class);

    static final String MENSAJE_FALLBACK =
            "El asistente inteligente no esta disponible en este momento. " +
            "Por favor, continua la busqueda manualmente en el directorio de especialistas.";

    public TriageResponse construirFallback() {
        return construirFallback(null, "no_disponible");
    }

    public TriageResponse construirFallback(EspecialidadRefResponse especialidadSugerida) {
        return construirFallback(especialidadSugerida, "no_disponible");
    }

    public TriageResponse construirFallback(EspecialidadRefResponse especialidadSugerida, String motivo) {
        log.warn("Triage en modo fallback operativo (motivo={})", motivo != null ? motivo : "desconocido");
        return new TriageResponse(false, true, especialidadSugerida, MENSAJE_FALLBACK);
    }

    public boolean esErrorRecuperable(int httpStatus) {
        return httpStatus == 429 || httpStatus >= 500;
    }
}
