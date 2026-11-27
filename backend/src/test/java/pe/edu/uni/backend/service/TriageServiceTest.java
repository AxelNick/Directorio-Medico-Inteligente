package pe.edu.uni.backend.service;

import org.junit.jupiter.api.Test;
import pe.edu.uni.backend.adapter.ProveedorTriageException;
import pe.edu.uni.backend.adapter.TriageProvider;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.factory.MockTriageCreator;
import pe.edu.uni.backend.repository.EspecialidadRepository;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class TriageServiceTest {
    private final EspecialidadRepository repositorio = mock(EspecialidadRepository.class);
    private final TriageProvider proveedor = mock(TriageProvider.class);
    private final EmergencyDetectionService emergencia = new EmergencyDetectionService("dolor toracico");

    @Test
    void emergenciaSeResuelveAntesDeLeerCatalogoOInvocarProveedor() {
        var respuesta = servicio(proveedor).orientar("Prueba de dolor torácico");
        assertThat(respuesta.emergencia()).isTrue();
        assertThat(respuesta.fallback()).isFalse();
        assertThat(respuesta.especialidad()).isNull();
        verifyNoInteractions(proveedor, repositorio);
    }

    @Test
    void simuladoOrientaSoloConIdActivoDelCatalogo() {
        var cardio = prepararCatalogo();
        var respuesta = servicio(new MockTriageCreator().createProvider()).orientar("Consulta ficticia: CARDIOLOGIA");
        assertThat(respuesta.especialidad().id()).isEqualTo(2);
        assertThat(respuesta.fallback()).isFalse();
        cardio.setHabilitada(false);
        assertThat(servicio(new MockTriageCreator().createProvider()).orientar("Cardiología").fallback()).isTrue();
    }

    @Test
    void salidaInvalidaYErroresDelProveedorDanOrientacionManual() {
        prepararCatalogo();
        when(proveedor.sugerir(anyString(), anyList())).thenReturn(Optional.of(99));
        assertThat(servicio(proveedor).orientar("Consulta ficticia").fallback()).isTrue();
        when(proveedor.sugerir(anyString(), anyList())).thenThrow(new ProveedorTriageException("timeout"));
        var resultado = servicio(proveedor).orientar("Consulta ficticia");
        assertThat(resultado.fallback()).isTrue();
        assertThat(resultado.especialidad()).isNull();
    }

    private Especialidad prepararCatalogo() {
        Especialidad cardio = new Especialidad();
        cardio.setId(2);
        cardio.setNombre("Cardiología");
        cardio.setHabilitada(true);
        when(repositorio.findByHabilitadaTrueOrderByNombreAsc()).thenReturn(List.of(cardio));
        when(repositorio.findById(2)).thenReturn(Optional.of(cardio));
        return cardio;
    }

    private TriageService servicio(TriageProvider producto) {
        return new TriageService(emergencia, new TriageFallbackService(), producto, repositorio);
    }
}
