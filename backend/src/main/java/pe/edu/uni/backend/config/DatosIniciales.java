package pe.edu.uni.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.backend.entity.Especialidad;
import pe.edu.uni.backend.entity.Rol;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.repository.EspecialidadRepository;
import pe.edu.uni.backend.repository.RolRepository;
import pe.edu.uni.backend.repository.UsuarioRepository;

import java.util.List;

/**
 * Carga los datos base al arrancar: roles, cuenta administrativa de desarrollo y catalogo inicial.
 * Reemplaza los INSERT de las antiguas migraciones. Es idempotente: solo crea lo que falta, asi que
 * puede ejecutarse en cada arranque sobre una base vacia o una ya poblada.
 */
@Component
public class DatosIniciales implements ApplicationRunner {

    static final List<String> ROLES = List.of("ROLE_ADMIN", "ROLE_MEDICO", "ROLE_PACIENTE");
    static final String ADMIN_USERNAME = "admin@uni.edu.pe";
    static final List<String> ESPECIALIDADES =
            List.of("Medicina General", "Cardiología", "Pediatría", "Dermatología", "Ginecología");

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final EspecialidadRepository especialidadRepository;
    private final PasswordEncoder passwordEncoder;
    @Value("${app.demo-admin-login.enabled:true}")
    private boolean demoAdmin;
    @Value("${app.admin.bootstrap-username:}")
    private String adminUsuario;
    @Value("${app.admin.bootstrap-password:}")
    private String adminClave;

    public DatosIniciales(RolRepository rolRepository, UsuarioRepository usuarioRepository,
                          EspecialidadRepository especialidadRepository, PasswordEncoder passwordEncoder) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.especialidadRepository = especialidadRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String nombre : ROLES) {
            if (rolRepository.findByNombre(nombre).isEmpty()) {
                Rol rol = new Rol();
                rol.setNombre(nombre);
                rolRepository.save(rol);
            }
        }

        if (demoAdmin) {
            crearAdmin(ADMIN_USERNAME, "admin123");
        }
        if (!adminUsuario.isBlank() || !adminClave.isBlank()) {
            String usuario = adminUsuario.strip().toLowerCase(java.util.Locale.ROOT);
            if (usuario.isBlank() || usuario.length() > 100 || usuario.equals(ADMIN_USERNAME)
                    || adminClave.length() < 16 || adminClave.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
                throw new IllegalStateException("Configuración inválida del administrador inicial");
            }
            crearAdmin(usuario, adminClave);
        }

        // El catalogo solo se siembra si esta vacio, para no recrear entradas que un administrador renombro.
        if (especialidadRepository.count() == 0) {
            for (String nombre : ESPECIALIDADES) {
                Especialidad especialidad = new Especialidad();
                especialidad.setNombre(nombre);
                especialidad.setHabilitada(true);
                especialidadRepository.save(especialidad);
            }
        }
    }

    private void crearAdmin(String username, String password) {
        if (!usuarioRepository.existsByUsername(username)) {
            Usuario admin = new Usuario();
            admin.setUsername(username);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRol(rolRepository.findByNombre("ROLE_ADMIN").orElseThrow());
            admin.setHabilitado(true);
            usuarioRepository.save(admin);
        }

    }
}
