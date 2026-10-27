package pe.edu.uni.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.edu.uni.backend.dto.RegistroPacienteRequest;
import pe.edu.uni.backend.dto.RegistroPacienteResponse;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PacienteServiceTest {
    @Mock UsuarioRepository usuarioRepository;
    @Mock RolRepository rolRepository;
    @Mock PasswordEncoder passwordEncoder;

    private PacienteService service;

    @BeforeEach
    void setUp() {
        service = new PacienteService(usuarioRepository, rolRepository, passwordEncoder);
    }

    @Test
    void registraUsuarioNormalizadoConRolPacienteYHash() {
        Rol rol = new Rol();
        rol.setNombre("ROLE_PACIENTE");
        when(rolRepository.findByNombre("ROLE_PACIENTE")).thenReturn(Optional.of(rol));
        when(passwordEncoder.encode("ClaveSegura2026!")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuario = invocation.getArgument(0);
            usuario.setId(42);
            return usuario;
        });

        RegistroPacienteResponse respuesta = service.registrar(
                new RegistroPacienteRequest("  Paciente@Ejemplo.test  ", "ClaveSegura2026!"));

        assertThat(respuesta).isEqualTo(new RegistroPacienteResponse(42, "paciente@ejemplo.test", "ROLE_PACIENTE"));
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getRol()).isSameAs(rol);
        assertThat(captor.getValue().getPassword()).isEqualTo("hash-bcrypt");
        assertThat(captor.getValue().getHabilitado()).isTrue();
    }

    @Test
    void rechazaCorreoUsadoPorCualquierRolAntesDeGuardar() {
        when(usuarioRepository.existsByUsername("medico@ejemplo.test")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(
                new RegistroPacienteRequest("Medico@Ejemplo.test", "ClaveSegura2026!")))
                .isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).save(any());
    }
}
