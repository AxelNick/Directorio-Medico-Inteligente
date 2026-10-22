package pe.edu.uni.backend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.dto.RegistroMedicoRequest;
import pe.edu.uni.backend.dto.RegistroMedicoResponse;
import pe.edu.uni.backend.security.JwtUtils;
import pe.edu.uni.backend.service.MedicoService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MedicoService medicoService;

    /** US-MED-01/03: crea usuario + perfil médico con colegiatura PENDIENTE_VERIFICACION. */
    @PostMapping("/register")
    public ResponseEntity<RegistroMedicoResponse> register(@Valid @RequestBody RegistroMedicoRequest request) {
        RegistroMedicoResponse creado = medicoService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        // Simulación: en el futuro validarás esto contra la base de datos
        if(username != null && password != null) {
            String token = jwtUtils.generarToken(username, "ROLE_MEDICO");
            
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(401).body("Credenciales inválidas");
    }
}