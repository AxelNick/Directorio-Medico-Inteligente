package pe.edu.uni.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.AdminUsuarioResponse;
import pe.edu.uni.backend.dto.PaginaResponse;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.exception.RecursoNoEncontradoException;
import pe.edu.uni.backend.exception.ValidacionException;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.List;

/**
 * Servicio administrativo para listar y habilitar/bloquear cuentas de usuario (US-ADM-05).
 * Impide el auto-bloqueo del administrador y dejar el sistema sin administradores activos.
 */
@Service
@Transactional
public class CuentaAdminService {

    private static final String ROL_ADMIN = "ROLE_ADMIN";

    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    public CuentaAdminService(UsuarioRepository usuarioRepository, AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AdminUsuarioResponse> listarUsuarios(int page, int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new ValidacionException("Parametros de paginacion invalidos (page >= 0, 1 <= size <= 100)");
        }
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("id")));
        Page<Usuario> pagina = usuarioRepository.findAllBy(pageable);
        List<AdminUsuarioResponse> items = pagina.getContent().stream()
                .map(AdminUsuarioResponse::desde)
                .toList();
        return new PaginaResponse<>(items, page, size, pagina.getTotalElements());
    }

    public AdminUsuarioResponse actualizarEstado(Integer usuarioId, boolean habilitado, String actorUsername) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("La cuenta de usuario no existe"));

        if (!habilitado && actorUsername != null && usuario.getUsername().equalsIgnoreCase(actorUsername.trim())) {
            throw new ConflictoException("No puedes bloquear tu propia cuenta de administrador");
        }

        boolean estadoAnterior = Boolean.TRUE.equals(usuario.getHabilitado());
        if (estadoAnterior == habilitado) {
            throw new ConflictoException("La cuenta ya se encuentra " + (habilitado ? "habilitada" : "bloqueada"));
        }

        if (!habilitado && ROL_ADMIN.equals(usuario.getRol().getNombre())
                && usuarioRepository.countByRolNombreAndHabilitadoTrue(ROL_ADMIN) <= 1) {
            throw new ConflictoException("No se puede bloquear al ultimo administrador activo del sistema");
        }

        usuario.setHabilitado(habilitado);
        Usuario guardado = usuarioRepository.save(usuario);
        auditoriaService.registrarEvento(
                actorUsername,
                habilitado ? "HABILITAR_CUENTA" : "BLOQUEAR_CUENTA",
                "Usuario #" + guardado.getId(),
                "habilitado",
                String.valueOf(estadoAnterior),
                String.valueOf(habilitado)
        );
        return AdminUsuarioResponse.desde(guardado);
    }
}
