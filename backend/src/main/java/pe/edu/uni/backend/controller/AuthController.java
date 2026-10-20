package pe.edu.uni.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import pe.edu.uni.backend.security.JwtUtils;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        // Aquí en el futuro guardarás usando el UsuarioRepository
        String passwordHasheada = passwordEncoder.encode(password);
        
        Map<String, String> response = new HashMap<>();
        response.put("mensaje", "Médico registrado exitosamente con password: " + passwordHasheada);
        return ResponseEntity.ok(response);
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