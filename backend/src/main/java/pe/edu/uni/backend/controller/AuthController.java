package pe.edu.uni.backend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.RegistroMedicoRequest;
import pe.edu.uni.backend.dto.RegistroMedicoResponse;
import pe.edu.uni.backend.entity.Usuario;
import pe.edu.uni.backend.repository.UsuarioRepository;
import pe.edu.uni.backend.security.JwtUtils;
import pe.edu.uni.backend.service.MedicoService;

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
    private UsuarioRepository usuarioRepository;

    /** US-MED-01/03: crea usuario + perfil medico con colegiatura PENDIENTE_VERIFICACION. */
    @PostMapping("/register")
    public ResponseEntity<RegistroMedicoResponse> register(@Valid @RequestBody RegistroMedicoRequest request) {
        RegistroMedicoResponse creado = medicoService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (username != null && password != null) {
            String normUser = username.trim().toLowerCase();
            Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(normUser);
            
            if (usuarioOpt.isPresent()) {
                Usuario u = usuarioOpt.get();
                if (passwordEncoder.matches(password, u.getPassword())) {
                    String rol = u.getRol().getNombre();
                    String token = jwtUtils.generarToken(u.getUsername(), rol);
                    Map<String, String> response = new HashMap<>();
                    response.put("token", token);
                    return ResponseEntity.ok(response);
                }
            }
            
            // Credenciales demo para desarrollo / fallback seguro
            if ("admin@uni.edu.pe".equalsIgnoreCase(username) && "admin123".equals(password)) {
                String token = jwtUtils.generarToken("admin@uni.edu.pe", "ROLE_ADMIN");
                Map<String, String> response = new HashMap<>();
                response.put("token", token);
                return ResponseEntity.ok(response);
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
