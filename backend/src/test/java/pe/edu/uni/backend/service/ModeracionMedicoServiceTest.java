package pe.edu.uni.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.edu.uni.backend.dto.AdminMedicoResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.EstadoPerfilMedico;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.MedicoRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModeracionMedicoServiceTest {

    @Mock MedicoRepository medicoRepository;
    @Mock AuditoriaService auditoriaService;

    private ModeracionMedicoService service;

    @BeforeEach
    void setUp() {
        service = new ModeracionMedicoService(medicoRepository, auditoriaService, org.mockito.Mockito.mock(org.springframework.context.ApplicationEventPublisher.class));
    }

    @Test
    void listarMedicosDevuelvePaginaFiltrada() {
        Medico m = medico(1, EstadoPerfilMedico.PENDIENTE_REVISION, EstadoColegiatura.PENDIENTE_VERIFICACION);
        when(medicoRepository.buscarParaModeracion(eq(EstadoPerfilMedico.PENDIENTE_REVISION), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(m)));

        PaginaResponse<AdminMedicoResponse> res = service.listarMedicos(EstadoPerfilMedico.PENDIENTE_REVISION, 0, 10);

        assertThat(res.items()).hasSize(1);
        assertThat(res.items().get(0).colegiatura()).isEqualTo("CMP-10001");
        assertThat(res.total()).isEqualTo(1);
    }

    @Test
    void listarMedicosRechazaPaginacionInvalida() {
        assertThatThrownBy(() -> service.listarMedicos(null, -1, 10))
                .isInstanceOf(ValidacionException.class);
        assertThatThrownBy(() -> service.listarMedicos(null, 0, 101))
                .isInstanceOf(ValidacionException.class);
    }

    @Test
    void aprobarPerfilRegistraAuditoria() {
        Medico m = medico(5, EstadoPerfilMedico.PENDIENTE_REVISION, EstadoColegiatura.VERIFICADA);
        when(medicoRepository.findById(5)).thenReturn(Optional.of(m));
        when(medicoRepository.save(any(Medico.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminMedicoResponse res = service.actualizarEstadoPerfil(5, EstadoPerfilMedico.APROBADO, "admin@uni.edu.pe");

        assertThat(res.estadoPerfil()).isEqualTo(EstadoPerfilMedico.APROBADO);
        verify(auditoriaService).registrarEvento(
                "admin@uni.edu.pe", "MODERAR_PERFIL", "Medico #5",
                "estadoPerfil", "PENDIENTE_REVISION", "APROBADO");
    }

    @Test
    void aprobarPerfilYaAprobadoLanzaConflicto409() {
        Medico m = medico(5, EstadoPerfilMedico.APROBADO, EstadoColegiatura.VERIFICADA);
        when(medicoRepository.findById(5)).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.actualizarEstadoPerfil(5, EstadoPerfilMedico.APROBADO, "admin@uni.edu.pe"))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void suspenderPerfilPendienteLanzaConflictoPorTransicionInvalida() {
        Medico m = medico(5, EstadoPerfilMedico.PENDIENTE_REVISION, EstadoColegiatura.PENDIENTE_VERIFICACION);
        when(medicoRepository.findById(5)).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.actualizarEstadoPerfil(5, EstadoPerfilMedico.SUSPENDIDO, "admin@uni.edu.pe"))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    void moderarMedicoInexistenteLanza404() {
        when(medicoRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizarColegiatura(99, EstadoColegiatura.VERIFICADA, "admin@uni.edu.pe"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void verificarColegiaturaRegistraAuditoria() {
        Medico m = medico(3, EstadoPerfilMedico.PENDIENTE_REVISION, EstadoColegiatura.PENDIENTE_VERIFICACION);
        when(medicoRepository.findById(3)).thenReturn(Optional.of(m));
        when(medicoRepository.save(any(Medico.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminMedicoResponse res = service.actualizarColegiatura(3, EstadoColegiatura.VERIFICADA, "admin@uni.edu.pe");

        assertThat(res.estadoColegiatura()).isEqualTo(EstadoColegiatura.VERIFICADA);
        verify(auditoriaService).registrarEvento(
                "admin@uni.edu.pe", "MODERAR_COLEGIATURA", "Medico #3",
                "estadoColegiatura", "PENDIENTE_VERIFICACION", "VERIFICADA");
    }

    private static Medico medico(int id, EstadoPerfilMedico perfil, EstadoColegiatura cmp) {
        Medico m = new Medico();
        m.setId(id);
        m.setNombres("Ana");
        m.setApellidos("Quispe");
        m.setColegiatura("CMP-1000" + id);
        m.setEstadoPerfil(perfil);
        m.setEstadoColegiatura(cmp);
        return m;
    }
}
