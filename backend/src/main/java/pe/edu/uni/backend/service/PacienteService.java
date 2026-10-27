package pe.edu.uni.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.dto.RegistroPacienteRequest;
import pe.edu.uni.backend.dto.RegistroPacienteResponse;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.exception.ConflictoException;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.Locale;

@Service
public class PacienteService {
    private static final String ROL_PACIENTE = "ROLE_PACIENTE";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public PacienteService(UsuarioRepository usuarioRepository, RolRepository rolRepository,
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegistroPacienteResponse registrar(RegistroPacienteRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByUsername(username)) {
            throw new ConflictoException("Ya existe una cuenta con ese correo");
        }
        Rol rol = rolRepository.findByNombre(ROL_PACIENTE)
                .orElseThrow(() -> new IllegalStateException("No existe el rol " + ROL_PACIENTE));

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuario.setRol(rol);
        usuario.setHabilitado(true);
        Usuario guardado = usuarioRepository.save(usuario);
        return new RegistroPacienteResponse(guardado.getId(), guardado.getUsername(), ROL_PACIENTE);
    }
}
