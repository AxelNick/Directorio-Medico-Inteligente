package pe.edu.uni.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.edu.uni.backend.dto.ActualizarPerfilRequest;
import pe.edu.uni.backend.dto.CentroAtencionRequest;
import pe.edu.uni.backend.dto.CentroAtencionResponse;
import pe.edu.uni.backend.dto.PerfilMedicoResponse;
import pe.edu.uni.backend.dto.RegistroMedicoRequest;
import pe.edu.uni.backend.dto.RegistroMedicoResponse;
import pe.edu.uni.backend.entity.CentroAtencion;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.entity.EstadoColegiatura;
import pe.edu.uni.backend.entity.Medico;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.CentroAtencionRepository;
import pe.edu.uni.backend.repository.EspecialidadRepository;
import pe.edu.uni.backend.repository.MedicoRepository;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Pruebas unitarias del servicio con repositorios simulados (sin base de datos). */
@ExtendWith(MockitoExtension.class)
class MedicoServiceTest {

    private static final String USERNAME = "medico@uni.edu.pe";

    @Mock MedicoRepository medicoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock RolRepository rolRepository;
    @Mock CentroAtencionRepository centroRepository;
    @Mock EspecialidadRepository especialidadRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AlmacenamientoFotoService almacenamientoFoto;

    private MedicoService service;

    @BeforeEach
    void setUp() {
        service = new MedicoService(medicoRepository, usuarioRepository, rolRepository,
                centroRepository, especialidadRepository, passwordEncoder, almacenamientoFoto);
    }

    // ---------- US-MED-03 ----------

    @Test
    void registrarCreaMedicoConColegiaturaPendiente() {
        Rol rol = new Rol();
        rol.setNombre(MedicoService.ROL_MEDICO);
        when(usuarioRepository.existsByUsername(USERNAME)).thenReturn(false);
        when(medicoRepository.existsByColegiatura("CMP-12345")).thenReturn(false);
        when(rolRepository.findByNombre(MedicoService.ROL_MEDICO)).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode("Secreta123")).thenReturn("$2a$hash");
        when(medicoRepository.save(any(Medico.class))).thenAnswer(inv -> {
            Medico m = inv.getArgument(0);
            m.setId(7);
            return m;
        });

        RegistroMedicoResponse respuesta = service.registrar(
                new RegistroMedicoRequest("Medico@UNI.edu.pe", "Secreta123", "cmp-12345"));

        assertThat(respuesta.id()).isEqualTo(7);
        assertThat(respuesta.username()).isEqualTo(USERNAME);
        assertThat(respuesta.estadoColegiatura()).isEqualTo(EstadoColegiatura.PENDIENTE_VERIFICACION);

        ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(usuarioCaptor.capture());
        assertThat(usuarioCaptor.getValue().getPassword()).isEqualTo("$2a$hash");
        assertThat(usuarioCaptor.getValue().getRol()).isSameAs(rol);

        ArgumentCaptor<Medico> medicoCaptor = ArgumentCaptor.forClass(Medico.class);
        verify(medicoRepository).save(medicoCaptor.capture());
        assertThat(medicoCaptor.getValue().getColegiatura()).isEqualTo("CMP-12345");
        assertThat(medicoCaptor.getValue().getUsuario()).isSameAs(usuarioCaptor.getValue());
    }

    @Test
    void registrarRechazaColegiaturaDuplicada() {
        when(usuarioRepository.existsByUsername(USERNAME)).thenReturn(false);
        when(medicoRepository.existsByColegiatura("CMP-12345")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(new RegistroMedicoRequest(USERNAME, "Secreta123", "CMP-12345")))
                .isInstanceOf(ConflictoException.class);
        verify(medicoRepository, never()).save(any());
    }

    @Test
    void registrarRechazaCorreoDuplicado() {
        when(usuarioRepository.existsByUsername(USERNAME)).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(new RegistroMedicoRequest(USERNAME, "Secreta123", "CMP-12345")))
                .isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    // ---------- US-MED-02 / US-MED-05 ----------

    @Test
    void actualizarPerfilGuardaCartaDePresentacionYEspecialidadesActivas() {
        Medico medico = medicoExistente();
        Especialidad cardio = especialidad(2, "Cardiologia", true);
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(especialidadRepository.findAllById(any())).thenReturn(List.of(cardio));
        when(medicoRepository.save(medico)).thenReturn(medico);

        PerfilMedicoResponse perfil = service.actualizarPerfil(USERNAME,
                new ActualizarPerfilRequest("  Cardiologo con 10 anios  ", 10, "CMP-12345", List.of(2)));

        assertThat(perfil.biografia()).isEqualTo("Cardiologo con 10 anios");
        assertThat(perfil.aniosExperiencia()).isEqualTo(10);
        assertThat(perfil.especialidadIds()).containsExactly(2);
        assertThat(perfil.estadoColegiatura()).isEqualTo(EstadoColegiatura.VERIFICADA);
    }

    @Test
    void cambiarColegiaturaVuelveAPendienteVerificacion() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(medicoRepository.existsByColegiaturaAndIdNot("CMP-99999", 1)).thenReturn(false);
        when(medicoRepository.save(medico)).thenReturn(medico);

        PerfilMedicoResponse perfil = service.actualizarPerfil(USERNAME,
                new ActualizarPerfilRequest("", null, "cmp-99999", List.of()));

        assertThat(perfil.colegiatura()).isEqualTo("CMP-99999");
        assertThat(perfil.estadoColegiatura()).isEqualTo(EstadoColegiatura.PENDIENTE_VERIFICACION);
    }

    @Test
    void cambiarColegiaturaAUnaDeOtroMedicoDevuelveConflicto() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(medicoRepository.existsByColegiaturaAndIdNot("CMP-99999", 1)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizarPerfil(USERNAME,
                new ActualizarPerfilRequest("", null, "CMP-99999", List.of())))
                .isInstanceOf(ConflictoException.class);
        verify(medicoRepository, never()).save(any());
    }

    @Test
    void asignarEspecialidadDeshabilitadaNuevaEsRechazada() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(especialidadRepository.findAllById(any()))
                .thenReturn(List.of(especialidad(3, "Homeopatia", false)));

        assertThatThrownBy(() -> service.actualizarPerfil(USERNAME,
                new ActualizarPerfilRequest("", null, "CMP-12345", List.of(3))))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("no esta habilitada");
    }

    @Test
    void especialidadDeshabilitadaYaAsignadaSeConserva() {
        Medico medico = medicoExistente();
        Especialidad antigua = especialidad(3, "Homeopatia", false);
        medico.getEspecialidades().add(antigua);
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(especialidadRepository.findAllById(any())).thenReturn(List.of(antigua));
        when(medicoRepository.save(medico)).thenReturn(medico);

        PerfilMedicoResponse perfil = service.actualizarPerfil(USERNAME,
                new ActualizarPerfilRequest("", null, "CMP-12345", List.of(3)));

        assertThat(perfil.especialidadIds()).containsExactly(3);
    }

    @Test
    void asignarEspecialidadInexistenteEsRechazada() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(especialidadRepository.findAllById(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service.actualizarPerfil(USERNAME,
                new ActualizarPerfilRequest("", null, "CMP-12345", List.of(99))))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("no existe");
    }

    @Test
    void obtenerPerfilSinMedicoDevuelve404() {
        when(medicoRepository.findByUsuarioUsername(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.obtenerPerfil("otro@uni.edu.pe"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    // ---------- US-MED-04 ----------

    @Test
    void crearCentroLoAsociaAlMedicoDeLaSesion() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(centroRepository.save(any(CentroAtencion.class))).thenAnswer(inv -> {
            CentroAtencion c = inv.getArgument(0);
            c.setId(10);
            return c;
        });

        CentroAtencionResponse creado = service.crearCentro(USERNAME,
                new CentroAtencionRequest(" Clinica Norte ", "Av. Peru 123", "Lima"));

        assertThat(creado.id()).isEqualTo(10);
        assertThat(creado.nombre()).isEqualTo("Clinica Norte");
        ArgumentCaptor<CentroAtencion> captor = ArgumentCaptor.forClass(CentroAtencion.class);
        verify(centroRepository).save(captor.capture());
        assertThat(captor.getValue().getMedico()).isSameAs(medico);
    }

    @Test
    void actualizarCentroAjenoDevuelve404() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(centroRepository.findByIdAndMedicoId(anyInt(), anyInt())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizarCentro(USERNAME, 55,
                new CentroAtencionRequest("X", "Y", "Z")))
                .isInstanceOf(RecursoNoEncontradoException.class);
        verify(centroRepository, never()).save(any());
    }

    @Test
    void eliminarCentroPropioLoBorra() {
        Medico medico = medicoExistente();
        CentroAtencion centro = new CentroAtencion();
        centro.setId(10);
        centro.setMedico(medico);
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(centroRepository.findByIdAndMedicoId(10, 1)).thenReturn(Optional.of(centro));

        service.eliminarCentro(USERNAME, 10);

        verify(centroRepository).delete(centro);
    }

    @Test
    void eliminarCentroAjenoDevuelve404() {
        Medico medico = medicoExistente();
        when(medicoRepository.findByUsuarioUsername(USERNAME)).thenReturn(Optional.of(medico));
        when(centroRepository.findByIdAndMedicoId(10, 1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.eliminarCentro(USERNAME, 10))
                .isInstanceOf(RecursoNoEncontradoException.class);
        verify(centroRepository, never()).delete(any());
    }

    // ---------- helpers ----------

    private static Medico medicoExistente() {
        Usuario usuario = new Usuario();
        usuario.setId(1);
        usuario.setUsername(USERNAME);
        Medico medico = new Medico();
        medico.setId(1);
        medico.setUsuario(usuario);
        medico.setColegiatura("CMP-12345");
        medico.setEstadoColegiatura(EstadoColegiatura.VERIFICADA);
        medico.setEspecialidades(new java.util.HashSet<>(Set.of()));
        return medico;
    }

    private static Especialidad especialidad(int id, String nombre, boolean habilitada) {
        Especialidad e = new Especialidad();
        e.setId(id);
        e.setNombre(nombre);
        e.setHabilitada(habilitada);
        return e;
    }
}
