package pe.edu.uni.backend.service;

import org.junit.jupiter.api.Test;
import pe.edu.uni.backend.dto.EspecialidadRefResponse;
import pe.edu.uni.backend.dto.TriageResponse;

import static org.assertj.core.api.Assertions.assertThat;

class TriageResilienciaServiceTest {

    private final EmergencyDetectionService emergencyService =
            new EmergencyDetectionService("dolor de pecho,dolor toracico,dificultad para respirar,perdida de conciencia");
    private final TriageFallbackService fallbackService = new TriageFallbackService();

    @Test
    void detectaEmergenciaConTildesYMayusculas() {
        assertThat(emergencyService.detectarEmergencia("Siento un fuerte DOLOR TORÁCICO desde hace 10 minutos")).isTrue();
        assertThat(emergencyService.detectarEmergencia("Tengo dificultad para respirar")).isTrue();
        assertThat(emergencyService.detectarEmergencia("Dolor leve de garganta desde ayer")).isFalse();
        assertThat(emergencyService.detectarEmergencia("   ")).isFalse();
    }

    @Test
    void respuestaEmergenciaActivaAlertaSinEspecialidadNiFallback() {
        TriageResponse resp = emergencyService.construirRespuestaEmergencia();

        assertThat(resp.emergencia()).isTrue();
        assertThat(resp.fallback()).isFalse();
        assertThat(resp.especialidad()).isNull();
        assertThat(resp.orientacion()).contains("emergencias");
    }

    @Test
    void fallbackConservaEspecialidadValidaSiExisteYMarcaFallbackTrue() {
        EspecialidadRefResponse cardio = new EspecialidadRefResponse(2, "Cardiología");
        TriageResponse resp = fallbackService.construirFallback(cardio, "timeout");

        assertThat(resp.emergencia()).isFalse();
        assertThat(resp.fallback()).isTrue();
        assertThat(resp.especialidad()).isEqualTo(cardio);
        assertThat(resp.orientacion()).contains("directorio");
        assertThat(fallbackService.esErrorRecuperable(429)).isTrue();
        assertThat(fallbackService.esErrorRecuperable(503)).isTrue();
        assertThat(fallbackService.esErrorRecuperable(400)).isFalse();
    }
}
