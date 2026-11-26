package pe.edu.uni.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.edu.uni.backend.dto.AdminResenaResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.EstadoVisibilidadResena;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.entity.Resena;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.ResenaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModeracionResenasServiceTest {

    @Mock ResenaRepository resenaRepository;
    @Mock AuditoriaService auditoriaService;

    private ModeracionResenasService service;

    @BeforeEach
    void setUp() {
        service = new ModeracionResenasService(resenaRepository, auditoriaService);
    }

    @Test
    void listarResenasNoExponeCorreoDePaciente() {
        Resena resena = crearResena(10L, EstadoVisibilidadResena.PENDIENTE_REVISION);
        when(resenaRepository.findByEstadoVisibilidad(eq(EstadoVisibilidadResena.PENDIENTE_REVISION), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(resena)));

        PaginaResponse<AdminResenaResponse> pagina = service.listarResenas(EstadoVisibilidadResena.PENDIENTE_REVISION, 0, 10);

        assertThat(pagina.items()).hasSize(1);
        AdminResenaResponse dto = pagina.items().get(0);
        assertThat(dto.paciente()).isEqualTo("Paciente #77");
        assertThat(dto.paciente()).doesNotContain("@");
        assertThat(dto.medicoNombre()).isEqualTo("Ana Quispe");
    }

    @Test
    void ocultarResenaActualizaYAudita() {
        Resena resena = crearResena(10L, EstadoVisibilidadResena.VISIBLE);
        when(resenaRepository.findById(10L)).thenReturn(Optional.of(resena));
        when(resenaRepository.save(any(Resena.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminResenaResponse dto = service.actualizarEstado(10L, EstadoVisibilidadResena.OCULTA, "admin@uni.edu.pe");

        assertThat(dto.estado()).isEqualTo(EstadoVisibilidadResena.OCULTA);
        verify(auditoriaService).registrarEvento(
                "admin@uni.edu.pe", "MODERAR_RESENA", "Resena #10",
                "estadoVisibilidad", "VISIBLE", "OCULTA");
    }

    @Test
    void rechazaEstadoNoPermitidoCon400() {
        assertThatThrownBy(() -> service.actualizarEstado(10L, EstadoVisibilidadResena.PENDIENTE_REVISION, "admin@uni.edu.pe"))
                .isInstanceOf(ValidacionException.class);
    }

    @Test
    void rechazaResenaInexistenteCon404() {
        when(resenaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizarEstado(999L, EstadoVisibilidadResena.OCULTA, "admin@uni.edu.pe"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void rechazaEstadoRepetidoCon409() {
        Resena resena = crearResena(10L, EstadoVisibilidadResena.OCULTA);
        when(resenaRepository.findById(10L)).thenReturn(Optional.of(resena));

        assertThatThrownBy(() -> service.actualizarEstado(10L, EstadoVisibilidadResena.OCULTA, "admin@uni.edu.pe"))
                .isInstanceOf(ConflictoException.class);
    }

    private static Resena crearResena(Long id, EstadoVisibilidadResena estado) {
        Usuario paciente = new Usuario();
        paciente.setId(77);
        paciente.setUsername("paciente.privado@correo.com");

        Medico medico = new Medico();
        medico.setId(15);
        medico.setNombres("Ana");
        medico.setApellidos("Quispe");
        medico.setColegiatura("CMP-12345");

        Resena r = new Resena();
        r.setId(id);
        r.setPaciente(paciente);
        r.setMedico(medico);
        r.setPuntuacion(5);
        r.setComentario("Muy buena atencion");
        r.setEstadoVisibilidad(estado);
        r.setFechaCreacion(OffsetDateTime.now());
        return r;
    }
}
