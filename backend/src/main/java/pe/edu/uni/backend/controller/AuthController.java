package pe.edu.uni.backend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.RegistroMedicoRequest;
import pe.edu.uni.backend.dto.RegistroMedicoResponse;
import pe.edu.uni.backend.dto.RegistroPacienteRequest;
import pe.edu.uni.backend.dto.RegistroPacienteResponse;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.repository.UsuarioRepository;
import pe.edu.uni.backend.security.JwtUtils;
import pe.edu.uni.backend.service.MedicoService;
import pe.edu.uni.backend.service.PacienteService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MedicoService medicoService;

    @Autowired
    private PacienteService pacienteService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Value("${app.demo-admin-login.enabled:true}")
    private boolean demoAdminLoginEnabled;

    /** US-MED-01/03: crea usuario + perfil medico con colegiatura PENDIENTE_VERIFICACION. */
    @PostMapping("/register")
    public ResponseEntity<RegistroMedicoResponse> register(@Valid @RequestBody RegistroMedicoRequest request) {
        RegistroMedicoResponse creado = medicoService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /** Alta de paciente sin perfil clinico ni permisos de historial. */
    @PostMapping("/register/paciente")
    public ResponseEntity<RegistroPacienteResponse> registerPatient(
            @Valid @RequestBody RegistroPacienteRequest request) {
        RegistroPacienteResponse creado = pacienteService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (username != null && password != null) {
            String normUser = username.trim().toLowerCase();
            Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(normUser);
            
            // La cuenta sembrada en V1 nunca puede autenticarse en producción.
            if (usuarioOpt.isPresent() && (demoAdminLoginEnabled || !"admin@uni.edu.pe".equals(normUser))) {
                Usuario u = usuarioOpt.get();
                if (Boolean.TRUE.equals(u.getHabilitado()) && passwordEncoder.matches(password, u.getPassword())) {
                    String rol = u.getRol().getNombre();
                    String token = jwtUtils.generarToken(u.getUsername(), rol);
                    Map<String, String> response = new HashMap<>();
                    response.put("token", token);
                    return ResponseEntity.ok(response);
                }
            }

            // Compatibilidad con la cuenta administrativa de desarrollo sembrada en V1.
            // Solo funciona mientras esa cuenta exista, conserve ROLE_ADMIN y este habilitada.
            if (demoAdminLoginEnabled && "admin@uni.edu.pe".equals(normUser) && "admin123".equals(password)
                    && usuarioOpt.filter(u -> Boolean.TRUE.equals(u.getHabilitado())
                            && "ROLE_ADMIN".equals(u.getRol().getNombre())).isPresent()) {
                return ResponseEntity.ok(Map.of("token", jwtUtils.generarToken(normUser, "ROLE_ADMIN")));
            }
        }

        return ResponseEntity.status(401).body(Map.of("mensaje", "Credenciales invalidas"));
    }

    /** GET /auth/me: requerido por el frontend para validar sesion y rol activo */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("mensaje", "No autenticado"));
        }
        String username = auth.getName();
        String rol = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ROLE_MEDICO");
        return ResponseEntity.ok(Map.of("username", username, "rol", rol));
    }
}
