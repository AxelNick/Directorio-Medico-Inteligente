package pe.edu.uni.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import pe.edu.uni.backend.dto.AdminUsuarioResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CuentaAdminServiceTest {

    @Mock UsuarioRepository usuarioRepository;
    @Mock AuditoriaService auditoriaService;

    private CuentaAdminService service;

    @BeforeEach
    void setUp() {
        service = new CuentaAdminService(usuarioRepository, auditoriaService);
    }

    @Test
    void listarUsuariosOmiteContrasenas() {
        Usuario u = usuario(2, "medico@uni.edu.pe", "ROLE_MEDICO", true);
        when(usuarioRepository.findAllBy(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(u)));

        PaginaResponse<AdminUsuarioResponse> res = service.listarUsuarios(0, 20);

        assertThat(res.items()).hasSize(1);
        assertThat(res.items().get(0).username()).isEqualTo("medico@uni.edu.pe");
        assertThat(res.items().get(0).rol()).isEqualTo("ROLE_MEDICO");
        assertThat(res.items().get(0).habilitado()).isTrue();
    }

    @Test
    void bloquearUsuarioRegistraAuditoria() {
        Usuario medico = usuario(2, "medico@uni.edu.pe", "ROLE_MEDICO", true);
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(medico));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUsuarioResponse res = service.actualizarEstado(2, false, "admin@uni.edu.pe");

        assertThat(res.habilitado()).isFalse();
        verify(auditoriaService).registrarEvento(
                "admin@uni.edu.pe", "BLOQUEAR_CUENTA", "Usuario #2", "habilitado", "true", "false");
    }

    @Test
    void impideAutoBloqueoDeAdministrador() {
        Usuario admin = usuario(1, "admin@uni.edu.pe", "ROLE_ADMIN", true);
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.actualizarEstado(1, false, "admin@uni.edu.pe"))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("propia cuenta");
    }

    @Test
    void impideBloquearAlUltimoAdministradorActivo() {
        Usuario otroAdmin = usuario(10, "admin2@uni.edu.pe", "ROLE_ADMIN", true);
        when(usuarioRepository.findById(10)).thenReturn(Optional.of(otroAdmin));
        when(usuarioRepository.countByRolNombreAndHabilitadoTrue("ROLE_ADMIN")).thenReturn(1L);

        assertThatThrownBy(() -> service.actualizarEstado(10, false, "superadmin@uni.edu.pe"))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ultimo administrador");
    }

    @Test
    void usuarioInexistenteLanza404() {
        when(usuarioRepository.findById(404)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.actualizarEstado(404, false, "admin@uni.edu.pe"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    private static Usuario usuario(int id, String username, String rolNombre, boolean habilitado) {
        Rol rol = new Rol();
        rol.setNombre(rolNombre);
        Usuario u = new Usuario();
        u.setId(id);
        u.setUsername(username);
        u.setPassword("$2a$hashSecreto");
        u.setRol(rol);
        u.setHabilitado(habilitado);
        return u;
    }
}
