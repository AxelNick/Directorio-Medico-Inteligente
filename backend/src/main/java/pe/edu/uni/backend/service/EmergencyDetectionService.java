package pe.edu.uni.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pe.edu.uni.backend.dto.TriageResponse;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Deteccion local conservadora de senales de emergencia antes de invocar al proveedor LLM (Sprint 4).
 * Emite una alerta operativa para buscar atencion de urgencia; no diagnostica ni receta.
 * No registra en logs el texto completo de sintomas.
 */
@Service
public class EmergencyDetectionService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyDetectionService.class);

    static final String MENSAJE_ALERTA_URGENCIA =
            "Se detectaron senales compatibles con una posible urgencia medica. " +
            "Acude de inmediato al servicio de emergencias mas cercano o llama a los servicios de auxilio.";

    private final List<String> senalesRiesgo;

    public EmergencyDetectionService(
            @Value("${app.triage.emergency-keywords:dolor de pecho,dolor toracico,opresion en el pecho,dificultad para respirar,no puedo respirar,falta de aire,perdida de conciencia,desmayo,convulsion,convulsiones,hemorragia severa,sangrado abundante,infarto,paro cardiaco,paralisis,ideacion suicida}")
            String keywordsConfig) {
        this.senalesRiesgo = Arrays.stream(keywordsConfig.split(","))
                .map(EmergencyDetectionService::normalizar)
                .filter(s -> !s.isBlank())
                .toList();
    }

    public boolean detectarEmergencia(String mensaje) {
        if (mensaje == null || mensaje.isBlank()) {
            return false;
        }
        String normalizado = normalizar(mensaje);
        boolean detectada = senalesRiesgo.stream().anyMatch(normalizado::contains);
        if (detectada) {
            log.info("Alerta operativa de emergencia activada por regla local; se omite llamada a LLM");
        }
        return detectada;
    }

    public TriageResponse construirRespuestaEmergencia() {
        return new TriageResponse(true, false, null, MENSAJE_ALERTA_URGENCIA);
    }

    private static String normalizar(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }
}
